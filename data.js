/* Снимок Open-Meteo: 17.10.2026, сезон 01.11.2024–31.07.2025.
 * Реанализ, не показания станции. Координаты — ориентиры населённых пунктов,
 * не обследованные площадки. null: месяц вне выбранного сезона.
 * Запрос архива: https://archive-api.open-meteo.com/v1/archive
 * ?latitude=LAT&longitude=LON&start_date=2024-11-01&end_date=2025-07-31
 * &daily=temperature_2m_mean&timezone=Asia%2FBishkek
 * Месячные средние рассчитаны по ежедневным значениям, округлены до 0.1°C.
 * Высоты: https://api.open-meteo.com/v1/elevation?latitude=LAT&longitude=LON
 */
window.MUZ_DATA = {
  season: { start: '2024-11-01', end: '2025-07-31', label: 'Ноябрь 2024 — июль 2025' },
  sites: [
    { id: 'naryn', name: 'Нарын', lat: 41.4287, lon: 75.9911, elevation: 2048, months: [-6.3,-3.9,0.9,8.1,13,15.1,19.9,null,null,null,0.1,-7.5] },
    { id: 'atbashy', name: 'Ат-Башы', lat: 41.1702, lon: 75.8106, elevation: 2058, months: [-8.8,-4.5,0.1,7.7,12.9,14.6,18.6,null,null,null,-1.3,-10.1] },
    { id: 'kochkor', name: 'Кочкор', lat: 42.2155, lon: 75.7566, elevation: 1809, months: [-5.8,-3.3,2,9.2,14.3,17,19.7,null,null,null,-0.3,-6.6] },
    { id: 'baetov', name: 'Баетов', lat: 41.2667, lon: 74.95, elevation: 1956, months: [-7.5,-3.4,0.3,8.3,15.1,16.9,21.8,null,null,null,0,-7.9] }
  ],
  // Эвристика прототипа: пороги требуют калибровки специалистом.
  rules: [
    { key: 'temperature', name: 'Зимний холод', unit: '°C', max: 40, bands: [{ below: -8, score: 40 }, { below: -4, score: 28 }, { below: 0, score: 12 }], fallback: 0, explanation: '≤ −8 °C: 40; ≤ −4: 28; ≤ 0: 12; выше 0: 0. Холод поддерживает намораживание.' },
    { key: 'elevation', name: 'Высота', unit: 'м', max: 20, bands: [{ above: 2200, score: 20 }, { above: 1800, score: 14 }, { above: 1500, score: 7 }], fallback: 0, explanation: '≥ 2200 м: 20; ≥ 1800: 14; ≥ 1500: 7; ниже: 0. Условный косвенный признак; частично дублирует температуру.' },
    { key: 'slope', name: 'Уклон площадки', unit: '°', max: 20, bands: [{ below: 5, score: 20 }, { below: 10, score: 12 }, { below: 15, score: 5 }], fallback: 0, explanation: '≤ 5°: 20; ≤ 10°: 12; ≤ 15°: 5; круче: 0. Пологая площадка упрощает удержание воды.' },
    { key: 'distance', name: 'Расстояние до воды', unit: 'м', max: 20, bands: [{ below: 100, score: 20 }, { below: 500, score: 12 }, { below: 1000, score: 5 }], fallback: 0, explanation: '≤ 100 м: 20; ≤ 500: 12; ≤ 1000: 5; дальше: 0. Расстояние — условный показатель сложности подачи.' }
  ],
  // Допущения; это не калиброванная инженерная модель.
  model: { k: 0.025, meltFactor: 0.005, iceDensity: 0.9, formationMonths: [10,11,0,1], springStart: '2025-03-01', springEnd: '2025-05-31' },
  // Ориентировочные сезонные нормы, м³/га: УТОЧНИТЬ ПО FAO и местной агрономии.
  crops: [{ id: 'potato', name: 'Картофель', demand: 4500 }, { id: 'barley', name: 'Ячмень', demand: 3500 }, { id: 'vegetables', name: 'Овощи', demand: 5500 }],
  pilot: { site: 'atbashy', slope: 4, distance: 80, area: 2000, thickness: 0.6, crop: 'potato', lossMin: 20, lossMax: 40 },
  sources: { archive: 'https://open-meteo.com/en/docs/historical-weather-api', elevation: 'https://open-meteo.com/en/docs/elevation-api' }
};
