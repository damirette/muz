'use strict';
const D = window.MUZ_DATA;
const $ = id => document.getElementById(id);
const locales = { ru: 'ru-RU', ky: 'ky-KG', en: 'en-GB' };
let language = 'ru';
try { const saved = localStorage.getItem('muzbank-language'); if (locales[saved]) language = saved; } catch (_) {}
const number = (value, digits = 0) => Number(value).toLocaleString(locales[language], { maximumFractionDigits: digits });
function t(source, params = {}) {
  const text = language === 'ru' ? source : (window.MUZ_TRANSLATIONS[source]?.[language] ?? source);
  return text.replace(/\{(\w+)\}/g, (match, key) => Object.hasOwn(params, key) ? String(params[key]) : match);
}
const siteName = site => t(site.id === 'custom' ? 'Выбранная точка' : site.name);
let staticText = [], staticAttributes = [];

function captureStaticText() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script, style')) continue;
    const source = node.textContent.trim();
    if (window.MUZ_TRANSLATIONS[source]) staticText.push({ node, source, original: node.textContent });
  }
  document.querySelectorAll('[aria-label], [placeholder]').forEach(node => {
    for (const attr of ['aria-label', 'placeholder']) {
      const source = node.getAttribute(attr);
      if (source && window.MUZ_TRANSLATIONS[source]) staticAttributes.push({ node, attr, source });
    }
  });
}

function renderSource() {
  const climate = { snapshot: 'Климат: встроенный снимок Open-Meteo', archive: 'Архив Open-Meteo загружен', missing: 'Климат не получен' };
  const elevation = { snapshot: 'высота: встроенный снимок', api: 'высота: Copernicus DEM, API', missing: 'высоту введите вручную' };
  $('data-source').textContent = `${t(climate[state.source.weather])} · ${t(elevation[state.source.elevation])}. ${t('Сезон 2024–2025.')}`;
  $('api-status').textContent = t(state.apiMessage || '');
}

function setApiMessage(source, error = false) {
  state.apiMessage = source;
  $('api-status').textContent = t(source);
  $('api-status').classList.toggle('error', error);
}

function renderLanguage() {
  document.documentElement.lang = language;
  for (const { node, source, original } of staticText) node.textContent = original.replace(source, t(source));
  for (const { node, attr, source } of staticAttributes) node.setAttribute(attr, t(source));
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const crop = $('crop').value || D.crops[0].id;
  const comparison = $('compare-site').value || 'naryn';
  $('crop').innerHTML = D.crops.map(c => `<option value="${c.id}">${t(c.name)}</option>`).join('');
  $('crop').value = crop;
  $('compare-site').innerHTML = D.sites.map(site => `<option value="${site.id}">${siteName(site)}</option>`).join('');
  $('compare-site').value = comparison;
  $('site-buttons').innerHTML = D.sites.map(site => `<button class="site-button${state.site?.id === site.id ? ' active' : ''}" data-site="${site.id}">${siteName(site)} ↗</button>`).join('');
  $('score-rules').innerHTML = D.rules.map(rule => `<div><b>${t(rule.name)} / ${rule.max} ${t('баллов')}</b><p>${t(rule.explanation)}</p></div>`).join('');
  $('season-label').textContent = t('Ноябрь 2024 — июль 2025 · сглаженный профиль');
  $('model-description').textContent = t('Рост: h = k × √FDD, k = {k} м/√(°C·день). FDD — накопленные отрицательные градусо-дни ноября–февраля. Приращение толщины добавляется к остатку льда. Таяние: Δh = {melt} × max(T, 0) м/день, не больше имеющегося льда. Объём = площадь × h. Плотность льда относительно воды = {density}. Все коэффициенты — допущения из data.js, требуют калибровки.', { k: number(D.model.k, 3), melt: number(D.model.meltFactor, 3), density: number(D.model.iceDensity, 1) });
  $('compare-toggle').textContent = t(state.comparing ? 'Убрать сравнение' : 'Сравнить два участка');
  if (!state.map && !window.L) $('map').innerHTML = `<p class="map-fallback">${t('Карта не загрузилась. Выберите подготовленную точку кнопками выше. Расчёты доступны.')}</p>`;
  (state.siteMarkers || []).forEach(({ layer, site }) => layer.setTooltipContent(siteName(site)));
  if (state.map?.zoomControl) {
    const container = state.map.zoomControl.getContainer();
    [['.leaflet-control-zoom-in', 'Увеличить масштаб'], ['.leaflet-control-zoom-out', 'Уменьшить масштаб']].forEach(([selector, label]) => {
      const button = container.querySelector(selector);
      if (button) { button.title = t(label); button.setAttribute('aria-label', t(label)); }
    });
  }
  if (state.site) {
    $('site-name').textContent = siteName(state.site);
    renderSource();
    updateAll();
  }
}

function setLanguage(next) {
  if (!locales[next]) return;
  language = next;
  try { localStorage.setItem('muzbank-language', language); } catch (_) {}
  renderLanguage();
}

const state = { site: null, map: null, marker: null, request: 0, controller: null, comparing: false, series: [], pilot: false, source: '' };
const monthName = month => new Intl.DateTimeFormat(locales[language], { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2025, month, 1)));

function value(id) {
  const el = $(id);
  return el.value.trim() !== '' && el.checkValidity() ? Number(el.value) : null;
}

function winterMean(months) {
  return (months[11] * 31 + months[0] * 31 + months[1] * 28) / 90;
}

// 1. Карта и оценка участка.
function initMap() {
  if (!window.L) {
    $('map').innerHTML = `<p class="map-fallback">${t('Карта не загрузилась. Выберите подготовленную точку кнопками выше. Расчёты доступны.')}</p>`;
    return;
  }
  state.map = L.map('map', { scrollWheelZoom: false }).setView([41.4287, 75.9911], 9);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(state.map);
  state.siteMarkers = [];
  D.sites.forEach(site => {
    const layer = L.circleMarker([site.lat, site.lon], { radius: 7, color: '#fff', weight: 2, fillColor: '#21634d', fillOpacity: 1 })
      .addTo(state.map).bindTooltip(siteName(site)).on('click', event => {
        L.DomEvent.stopPropagation(event); selectSite(site.id);
      });
    state.siteMarkers.push({ layer, site });
  });
  state.map.on('click', event => {
    state.pilot = false;
    selectSite({ id: 'custom', name: 'Выбранная точка', lat: event.latlng.lat, lon: event.latlng.lng, elevation: null, months: null });
    fetchSiteData();
  });
}

function selectSite(selection, keepPilot = false) {
  state.request++;
  state.controller?.abort();
  if (!keepPilot) state.pilot = false;
  const site = typeof selection === 'string' ? D.sites.find(s => s.id === selection) : selection;
  state.site = { ...site, months: site.months?.slice() || null };
  state.source = { weather: site.months ? 'snapshot' : 'missing', elevation: site.elevation === null ? 'missing' : 'snapshot' };
  $('site-name').textContent = siteName(site);
  $('coordinates').textContent = `${site.lat.toFixed(4)}° N, ${site.lon.toFixed(4)}° E`;
  $('elevation').value = site.elevation ?? '';
  $('temperature').value = site.months ? winterMean(site.months).toFixed(1) : '';
  $('slope').value = '';
  $('distance').value = '';
  setApiMessage('');
  $('refresh').disabled = false;
  renderSource();
  document.querySelectorAll('.site-button').forEach(b => b.classList.toggle('active', b.dataset.site === site.id));
  if (state.map) {
    if (state.marker) state.marker.remove();
    state.marker = L.marker([site.lat, site.lon]).addTo(state.map);
    state.map.setView([site.lat, site.lon], 10);
  }
  updateAll();
}

async function fetchSiteData() {
  const request = ++state.request;
  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;
  const timeout = setTimeout(() => controller.abort(), 15000);
  const { lat, lon } = state.site;
  const manualAtStart = { elevation: $('elevation').value, temperature: $('temperature').value };
  $('refresh').disabled = true;
  $('api-status').className = 'small';
  setApiMessage('Загружаем высоту и архив сезона…');
  const coords = `latitude=${lat}&longitude=${lon}`;
  const urls = [
    `https://api.open-meteo.com/v1/elevation?${coords}`,
    `https://archive-api.open-meteo.com/v1/archive?${coords}&start_date=${D.season.start}&end_date=${D.season.end}&daily=temperature_2m_mean&timezone=Asia%2FBishkek`
  ];
  try {
    const results = await Promise.allSettled(urls.map(async url => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.error) throw new Error(json.reason);
      return json;
    }));
    if (request !== state.request) return;
    let elevationOK = false, weatherOK = false;
    if (results[0].status === 'fulfilled') {
      const elevation = results[0].value.elevation?.[0];
      if (Number.isFinite(elevation)) {
        state.site.elevation = elevation;
        if ($('elevation').value === manualAtStart.elevation) $('elevation').value = elevation;
        elevationOK = true;
      }
    }
    if (results[1].status === 'fulfilled') {
      const archive = results[1].value;
      const times = archive.daily?.time, temperatures = archive.daily?.temperature_2m_mean;
      if (Array.isArray(times) && times.length === 273 && temperatures?.length === 273 && temperatures.every(Number.isFinite)) {
        const months = Array(12).fill(null);
        for (let m = 0; m < 12; m++) {
          const values = temperatures.filter((t, i) => Number(times[i].slice(5,7)) === m + 1);
          if (values.length) months[m] = values.reduce((sum, t) => sum + t, 0) / values.length;
        }
        state.site.months = months;
        if ($('temperature').value === manualAtStart.temperature) $('temperature').value = winterMean(months).toFixed(1);
        weatherOK = true;
      }
    }
    if (weatherOK) state.source.weather = 'archive';
    if (elevationOK) state.source.elevation = 'api';
    setApiMessage(elevationOK && weatherOK ? 'Данные обновлены. Реанализ — не измерения на участке.' : 'API ответил частично или недоступен. Сохранены доступные данные; проверьте источник выше.', !weatherOK || !elevationOK);
    renderSource();
    updateAll();
  } catch (error) {
    if (request === state.request) {
      setApiMessage('Не удалось загрузить API. Доступные данные сохранены; недостающие параметры требуют ввода.', true);
    }
  } finally {
    clearTimeout(timeout);
    if (request === state.request) $('refresh').disabled = false;
  }
}

function readSiteInputs() {
  return { elevation: value('elevation'), temperature: value('temperature'), slope: value('slope'), distance: value('distance') };
}

function calculateSuitability(inputs) {
  const rows = D.rules.map(rule => {
    const input = inputs[rule.key];
    const band = rule.bands.find(b => b.below !== undefined ? input <= b.below : input >= b.above);
    return { ...rule, value: input, score: input === null ? null : (band?.score ?? rule.fallback) };
  });
  return { rows, complete: rows.every(r => r.score !== null), score: rows.reduce((sum, r) => sum + (r.score || 0), 0) };
}

function renderSuitability(result) {
  const label = !result.complete ? 'Заполните все параметры' : result.score >= 75 ? 'Перспективно для обследования' : result.score >= 50 ? 'Есть ограничения' : 'Низкая предварительная оценка';
  $('suitability').innerHTML = `<div class="score-header"><div class="score-number">${result.complete ? result.score : '—'}<small> / 100</small></div><div><h3>${t(label)}</h3><p>${t('Эвристика · не вероятность успеха')}</p></div></div>` + result.rows.map(r => `<div class="score-row"><span>${t(r.name)}: ${r.value === null ? t('нет данных') : number(r.value, 1) + ' ' + t(r.unit)}</span><div class="bar"><span style="width:${(r.score || 0) / r.max * 100}%"></span></div><b>${r.score ?? '—'}/${r.max}</b></div>`).join('');
}

// 2. Сезонная модель: Стефан + линейное degree-day таяние.
function temperatureAt(date, months) {
  const anchors = [];
  for (let m = 10; m <= 18; m++) {
    anchors.push({ time: Date.UTC(2024 + Math.floor(m / 12), m % 12, 15), temp: months[m % 12] });
  }
  const time = date.getTime();
  if (time <= anchors[0].time) return anchors[0].temp;
  if (time >= anchors.at(-1).time) return anchors.at(-1).temp;
  const right = anchors.findIndex(a => a.time > time);
  const a = anchors[right - 1], b = anchors[right];
  return a.temp + (b.temp - a.temp) * (time - a.time) / (b.time - a.time);
}

function simulateIce(site, area, offset = 0) {
  if (!site?.months || !Number.isFinite(area) || area <= 0) return [];
  const series = [];
  let freezing = 0, thickness = 0;
  const end = Date.parse(D.season.end + 'T00:00:00Z');
  for (let time = Date.parse(D.season.start + 'T00:00:00Z'); time <= end; time += 86400000) {
    const date = new Date(time), temperature = temperatureAt(date, site.months) + offset;
    const before = thickness;
    let melted = 0;
    if (D.model.formationMonths.includes(date.getUTCMonth()) && temperature < 0) {
      const oldPotential = D.model.k * Math.sqrt(freezing);
      freezing += -temperature;
      thickness += D.model.k * Math.sqrt(freezing) - oldPotential;
    }
    if (temperature > 0) {
      melted = Math.min(thickness, temperature * D.model.meltFactor);
      thickness -= melted;
    }
    thickness = Math.max(0, thickness);
    series.push({ date: date.toISOString().slice(0,10), temperature, thickness, volume: thickness * area, melted: melted * area, freezing, before });
  }
  return series;
}

function renderIceChart(series, other = []) {
  if (!series.length) {
    $('chart').innerHTML = `<p class="small">${t('Для симуляции нужны архив температур, зимняя температура и корректная площадь ледника.')}</p>`;
    $('chart-legend').textContent = '';
    return;
  }
  const width = 660, height = 260, left = 48, right = 15, top = 15, bottom = 30;
  const max = Math.max(1, ...series.map(d => d.volume), ...other.map(d => d.volume)) * 1.12;
  const x = i => left + i / (series.length - 1) * (width - left - right);
  const y = v => height - bottom - v / max * (height - top - bottom);
  const points = data => data.map((d,i) => `${x(i).toFixed(2)},${y(d.volume).toFixed(2)}`).join(' ');
  const day = Math.min(Number($('time').value), series.length - 1);
  let grid = '';
  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    grid += `<line x1="${left}" x2="${width - right}" y1="${y(v)}" y2="${y(v)}" stroke="#e5eade"/><text x="${left - 8}" y="${y(v) + 3}" text-anchor="end">${number(v)}</text>`;
  }
  series.forEach((d,i) => {
    if (d.date.endsWith('-01')) grid += `<text x="${x(i)}" y="${height - 8}" text-anchor="middle">${monthName(Number(d.date.slice(5,7)) - 1)}</text>`;
  });
  $('chart').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${t('Ежедневный расчёт объёма льда с ноября по июль')}"><title>${t('Объём льда')}: ${siteName(state.site)}${other.length ? ', ' + t('сравнение с') + ' ' + $('compare-site').selectedOptions[0].textContent : ''}</title><defs><linearGradient id="ice-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb7a4" stop-opacity=".35"/><stop offset="1" stop-color="#7fb7a4" stop-opacity=".02"/></linearGradient></defs>${grid}<polygon points="${left},${y(0)} ${points(series)} ${x(series.length-1)},${y(0)}" fill="url(#ice-gradient)"/><polyline points="${points(series)}" fill="none" stroke="#286c54" stroke-width="2.5"/>${other.length ? `<polyline points="${points(other)}" fill="none" stroke="#cc9b35" stroke-width="2.5" stroke-dasharray="6 4"/>` : ''}<line x1="${x(day)}" x2="${x(day)}" y1="${top}" y2="${height - bottom}" stroke="#7a9a8c" stroke-dasharray="3 4"/><circle cx="${x(day)}" cy="${y(series[day].volume)}" r="4" fill="#286c54" stroke="white" stroke-width="2"/></svg>`;
  $('chart-legend').innerHTML = `<span><i class="legend-dot" style="background:#286c54"></i>${siteName(state.site)}</span>${other.length ? `<span><i class="legend-dot" style="background:#cc9b35"></i>${$('compare-site').selectedOptions[0].textContent}</span>` : ''}`;
}

function setSimulationDay() {
  const index = Number($('time').value);
  const current = state.series[index];
  if (!current) {
    $('ice-volume').textContent = '—'; $('ice-thickness').textContent = '—';
    $('ice-block').style.height = '1px'; $('day-label').textContent = t('Нет данных');
    $('ice-phase').textContent = t('ТРЕБУЮТСЯ ДАННЫЕ');
    renderIceChart([]);
    return;
  }
  $('day-label').textContent = new Date(current.date + 'T00:00:00Z').toLocaleDateString(locales[language], { day: 'numeric', month: 'long', timeZone: 'UTC' });
  $('ice-volume').textContent = number(current.volume);
  $('ice-thickness').textContent = number(current.thickness, 2);
  const max = Math.max(...state.series.map(d => d.thickness), 0.01);
  $('ice-block').style.height = `${Math.max(1, current.thickness / max * 150)}px`;
  $('ice-phase').textContent = t(current.temperature <= 0 ? 'ХОЛОДНЫЙ ПЕРИОД' : current.thickness > 0 ? 'ЛЁД СТАНОВИТСЯ ВОДОЙ' : 'ЛЕДЯНОЙ ЗАПАС ИСЧЕРПАН');
  renderIceChart(state.series, state.otherSeries);
}

function compareSites() {
  state.comparing = !state.comparing;
  if (state.comparing && $('compare-site').value === state.site.id) {
    $('compare-site').value = D.sites.find(s => s.id !== state.site.id).id;
  }
  $('comparison-controls').hidden = !state.comparing;
  $('compare-toggle').setAttribute('aria-pressed', String(state.comparing));
  $('compare-toggle').textContent = t(state.comparing ? 'Убрать сравнение' : 'Сравнить два участка');
  updateAll();
}

// 3. Проектный водный баланс и весеннее высвобождение.
function readWaterInputs() {
  return { area: value('area'), thickness: value('thickness'), demand: value('demand'), lossMin: value('loss-min'), lossMax: value('loss-max') };
}

function calculateWaterRange(inputs, series) {
  const { area, thickness, demand, lossMin, lossMax } = inputs;
  if (Object.values(inputs).some(v => v === null) || lossMin > lossMax) return null;
  const ice = area * thickness;
  const water = ice * D.model.iceDensity;
  const min = water * (1 - lossMax / 100), max = water * (1 - lossMin / 100);
  const peak = series.length ? Math.max(...series.map(d => d.volume)) : 0;
  // Весной не может растаять больше, чем имеется к началу весны.
  const start = series.findIndex(d => d.date === D.model.springStart);
  const springIce = start > 0 ? series[start - 1].volume : 0;
  const springMelt = series.filter(d => d.date >= D.model.springStart && d.date <= D.model.springEnd).reduce((sum,d) => sum + d.melted, 0);
  const fraction = peak > 0 ? Math.min(1, springMelt / peak) : 0;
  // Проект ограничен термическим потенциалом; избыток толщины не даёт воды.
  const supportedIce = Math.min(ice, peak);
  const springWater = supportedIce * fraction * D.model.iceDensity;
  return { ice, water, min, max, hectaresMin: min / demand, hectaresMax: max / demand, peak, springIce, fraction,
    springMin: springWater * (1 - lossMax / 100), springMax: springWater * (1 - lossMin / 100), hasSimulation: series.length > 0 };
}

function renderWaterResults(result, inputs) {
  if (!result) {
    $('water-results').innerHTML = `<h3>${t('Проверьте параметры')}</h3><p>${t('Введите положительные площадь, толщину и норму полива. Потери должны быть от 0 до 100%, минимум не выше максимума.')}</p>`;
    $('thickness-check').textContent = '';
    return;
  }
  const r = result;
  const formula = t('{area} м² × {thickness} м = {ice} м³ льда<br>× {density} (плотность относительно воды) = {water} м³ воды<br>× (1 − потери) ÷ {demand} м³/га → площадь полива', {
    area: number(inputs.area), thickness: number(inputs.thickness, 2), ice: number(r.ice), density: number(D.model.iceDensity, 1), water: number(r.water), demand: number(inputs.demand)
  });
  const spring = r.hasSimulation ? t('<b>Именно весной, март–май:</b> {min}–{max} м³, или {haMin}–{haMax} га. В расчёте учтены термический предел и доля весеннего таяния {fraction}%. Накопление и доставка талой воды предполагаются доступными.', {
    min: number(r.springMin), max: number(r.springMax), haMin: number(r.springMin / inputs.demand, 2), haMax: number(r.springMax / inputs.demand, 2), fraction: number(r.fraction * 100)
  }) : t('Срок получения воды неизвестен: нет температурного профиля для сезонной модели.');
  $('water-results').innerHTML = `<span class="eyebrow">${t('ВОДНЫЙ ЭКВИВАЛЕНТ ПРОЕКТА')}</span><h3>${t('Доступная вода после потерь')}</h3><div class="water-number">${number(r.min)}–${number(r.max)} <small>${t('м³')}</small></div><p class="small">${t('Пессимистично: потери {max}%. Оптимистично: {min}%.', { max: number(inputs.lossMax), min: number(inputs.lossMin) })}</p><div class="hectares">${number(r.hectaresMin, 2)}–${number(r.hectaresMax, 2)} ${t('га')} <span class="small">${t('на сезон полива')}</span></div><div class="water-formula">${formula}</div><p class="small">${spring}</p>`;
  const peakThickness = r.peak / inputs.area;
  $('thickness-check').className = 'small' + (r.hasSimulation && inputs.thickness > peakThickness ? ' error' : '');
  $('thickness-check').textContent = r.hasSimulation ? t('Термический предел: {peak} м; проект: {design} м.', { peak: number(peakThickness, 2), design: number(inputs.thickness, 2) }) + ' ' + t(inputs.thickness > peakThickness ? 'Проектная толщина превышает модельный предел. Для весеннего результата взят меньший объём.' : 'Проектная толщина укладывается в предел упрощённой модели.') : t('Для проверки проектной толщины нужен архив температур.');
}

function loadPilotScenario() {
  const p = D.pilot;
  selectSite(p.site, true);
  state.pilot = true;
  for (const [id, v] of Object.entries({ slope: p.slope, distance: p.distance, area: p.area, thickness: p.thickness, crop: p.crop, 'loss-min': p.lossMin, 'loss-max': p.lossMax })) $(id).value = v;
  $('demand').value = D.crops.find(c => c.id === p.crop).demand;
  $('time').value = 150;
  updateAll();
  $('site').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateAll() {
  if (!state.site) return;
  const siteInputs = readSiteInputs(), waterInputs = readWaterInputs();
  const suitability = calculateSuitability(siteInputs);
  renderSuitability(suitability);
  const offset = state.site.months && siteInputs.temperature !== null ? siteInputs.temperature - winterMean(state.site.months) : null;
  state.series = offset !== null ? simulateIce(state.site, waterInputs.area, offset) : [];
  const otherSite = D.sites.find(s => s.id === $('compare-site').value);
  state.otherSeries = state.comparing && offset !== null ? simulateIce(otherSite, waterInputs.area, offset) : [];
  setSimulationDay();
  $('sim-inputs').textContent = t('Площадь: {area}. k = {k} м/√(°C·день); таяние = {melt} м/(°C·день). Сдвиг профиля: {offset}.', {
    area: waterInputs.area === null ? t('нет данных') : number(waterInputs.area) + ' ' + t('м²'), k: number(D.model.k, 3), melt: number(D.model.meltFactor, 3), offset: offset === null ? t('нет данных') : number(offset, 2) + ' °C'
  });
  $('monthly-data').innerHTML = state.site.months ? Array.from({ length: 9 }, (_, i) => (i + 10) % 12).map(m => `<span class="month-chip">${monthName(m)} <b>${number(state.site.months[m], 1)} °C</b></span>`).join('') : `<p>${t('Архив температур не получен.')}</p>`;
  const result = calculateWaterRange(waterInputs, state.series);
  renderWaterResults(result, waterInputs);
  $('pilot-story').hidden = !state.pilot;
  if (state.pilot) {
    const pilotResult = result ? t('Проект: {ice} м³. Весна: {min}–{max} м³ воды после потерь → {haMin}–{haMax} га при норме {demand} м³/га.', {
      ice: number(result.ice), min: number(result.springMin), max: number(result.springMax), haMin: number(result.springMin / waterInputs.demand, 2), haMax: number(result.springMax / waterInputs.demand, 2), demand: number(waterInputs.demand)
    }) : t('Проверьте входные данные.');
    $('pilot-story').innerHTML = t('<strong>Пилотный участок · демонстрационный сценарий у Ат-Башы</strong><br>Реальный ориентир и реанализ Open-Meteo; площадка не обследована. Уклон {slope}° и расстояние {distance} м — учебные допущения.<br>{score} Зима: до {peak} м³ льда по модели. {result}', {
      slope: siteInputs.slope === null ? t('нет данных') : number(siteInputs.slope, 1), distance: siteInputs.distance === null ? t('нет данных') : number(siteInputs.distance), score: suitability.complete ? t('Оценка {score}/100.', { score: suitability.score }) : t('Оценка требует заполнения параметров.'), peak: number(result?.peak || 0), result: pilotResult
    });
  }
}

function init() {
  captureStaticText();
  renderLanguage();
  $('site-buttons').addEventListener('click', e => { const button = e.target.closest('[data-site]'); if (button) selectSite(button.dataset.site); });
  document.querySelector('.language-switch').addEventListener('click', e => { const button = e.target.closest('[data-language]'); if (button) setLanguage(button.dataset.language); });
  $('demand').value = D.crops[0].demand;
  $('refresh').addEventListener('click', fetchSiteData);
  $('pilot').addEventListener('click', loadPilotScenario);
  $('compare-toggle').addEventListener('click', compareSites);
  $('compare-site').addEventListener('change', updateAll);
  $('time').addEventListener('input', setSimulationDay);
  $('crop').addEventListener('change', () => { $('demand').value = D.crops.find(c => c.id === $('crop').value).demand; updateAll(); });
  ['elevation','temperature','slope','distance','area','thickness','demand','loss-min','loss-max'].forEach(id => $(id).addEventListener('input', updateAll));
  initMap();
  selectSite('naryn');
  renderLanguage();
}
init();
