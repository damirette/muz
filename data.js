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

// Переводы интерфейса. Формулы и исходные данные общие для всех языков.
window.MUZ_TRANSLATIONS = {
  "ВОДА НА ЗАВТРА": {
    "ky": "ЭРТЕҢКИ КҮН ҮЧҮН СУУ",
    "en": "WATER FOR TOMORROW"
  },
  "Основная навигация": {
    "ky": "Негизги навигация",
    "en": "Main navigation"
  },
  "Язык интерфейса": {
    "ky": "Интерфейстин тили",
    "en": "Interface language"
  },
  "Участок": {
    "ky": "Участок",
    "en": "Site"
  },
  "Лёд": {
    "ky": "Муз",
    "en": "Ice"
  },
  "Вода": {
    "ky": "Суу",
    "en": "Water"
  },
  "● Нарынская область": {
    "ky": "● Нарын облусу",
    "en": "● Naryn Region"
  },
  "SOLARPUNK / НАРЫН, КЫРГЫЗСТАН": {
    "ky": "SOLARPUNK / НАРЫН, КЫРГЫЗСТАН",
    "en": "SOLARPUNK / NARYN, KYRGYZSTAN"
  },
  "Сохраним зиму.": {
    "ky": "Кышты сактайлы.",
    "en": "Store winter."
  },
  "Вырастим завтра.": {
    "ky": "Эртеңди өстүрөлү.",
    "en": "Grow tomorrow."
  },
  "Зимний холод — ресурс. Оцените участок для искусственного ледника и узнайте, сколько воды он может дать полям весной.": {
    "ky": "Кышкы суук — ресурс. Жасалма мөңгү үчүн участокту баалап, ал жазында талааларга канча суу бере аларын билиңиз.",
    "en": "Winter cold is a resource. Assess a site for an artificial glacier and estimate how much irrigation water it could provide in spring."
  },
  "Пилотный участок": {
    "ky": "Пилоттук участок",
    "en": "Pilot site"
  },
  "Готовый сценарий для демонстрации": {
    "ky": "Көрсөтүүгө даяр сценарий",
    "en": "A ready-to-use demo scenario"
  },
  "Зимние горы, ледяной резерв и зелёные поля": {
    "ky": "Кышкы тоолор, муз запасы жана жашыл талаалар",
    "en": "Winter mountains, stored ice and green fields"
  },
  "ЗИМА → ЛЁД → ВОДА → ЖИЗНЬ": {
    "ky": "КЫШ → МУЗ → СУУ → ЖАШОО",
    "en": "WINTER → ICE → WATER → LIFE"
  },
  "❄ Сберегаем холод": {
    "ky": "❄ Суукту сактайбыз",
    "en": "❄ Saving winter cold"
  },
  "для тёплого сезона": {
    "ky": "жылуу мезгил үчүн",
    "en": "for the warmer season"
  },
  "Выберите участок": {
    "ky": "Участокту тандаңыз",
    "en": "Choose a site"
  },
  "Смоделируйте лёд": {
    "ky": "Музду моделдеңиз",
    "en": "Simulate the ice"
  },
  "Рассчитайте воду": {
    "ky": "Сууну эсептеңиз",
    "en": "Calculate the water"
  },
  "Предварительная оценка · не прогноз": {
    "ky": "Алдын ала баалоо · божомол эмес",
    "en": "Preliminary assessment · not a forecast"
  },
  "01 / МЕСТО ДЛЯ БУДУЩЕГО": {
    "ky": "01 / КЕЛЕЧЕК ҮЧҮН ЖЕР",
    "en": "01 / A PLACE FOR TOMORROW"
  },
  "Всё начинается с участка": {
    "ky": "Баары участоктон башталат",
    "en": "It starts with a site"
  },
  "Выберите ориентир или нажмите на карту. Проверьте условия на месте.": {
    "ky": "Даяр чекитти тандаңыз же картаны басыңыз. Шарттарды жеринен текшериңиз.",
    "en": "Choose a location or click the map. Verify conditions on site."
  },
  "Карта пригодности": {
    "ky": "Жарактуулук картасы",
    "en": "Site suitability"
  },
  "Подготовленные точки": {
    "ky": "Даяр чекиттер",
    "en": "Preset locations"
  },
  "Карта Нарынской области": {
    "ky": "Нарын облусунун картасы",
    "en": "Map of Naryn Region"
  },
  "Точки — ориентиры, не обследованные площадки": {
    "ky": "Чекиттер — багыттар гана, изилденген аянтчалар эмес",
    "en": "Locations are reference points, not surveyed sites"
  },
  "Выбран": {
    "ky": "Тандалды",
    "en": "Selected"
  },
  "Обновить из Open-Meteo ↻": {
    "ky": "Open-Meteo аркылуу жаңылоо ↻",
    "en": "Refresh from Open-Meteo ↻"
  },
  "Высота, м": {
    "ky": "Бийиктик, м",
    "en": "Elevation, m"
  },
  "Зима (дек–фев), °C": {
    "ky": "Кыш (дек–фев), °C",
    "en": "Winter (Dec–Feb), °C"
  },
  "Уклон, °": {
    "ky": "Жантайыш, °",
    "en": "Slope, °"
  },
  "До воды, м": {
    "ky": "Сууга чейин, м",
    "en": "Distance to water, m"
  },
  "Требуется ввод": {
    "ky": "Маани киргизиңиз",
    "en": "Enter a value"
  },
  "Уклон и расстояние: ручной ввод. Зимняя температура сдвигает весь температурный профиль на разницу с архивом.": {
    "ky": "Жантайыш жана аралык кол менен киргизилет. Кышкы температура архивден айырмага жараша бүт температуралык профилди жылдырат.",
    "en": "Enter slope and distance manually. Changing winter temperature shifts the entire temperature profile by its difference from the archive."
  },
  "Как складывается оценка?": {
    "ky": "Баалоо кантип эсептелет?",
    "en": "How is the score calculated?"
  },
  "Баллы — эвристика прототипа, не вероятность успеха. Не учитываются дебит, напор, права на воду, геология и доступность участка.": {
    "ky": "Упайлар — прототиптин жөнөкөйлөтүлгөн эрежелери, ийгилик ыктымалдыгы эмес. Суунун чыгымы, басымы, сууга болгон укуктар, геология жана участокко жетүү эске алынбайт.",
    "en": "Scores are prototype heuristics, not a probability of success. Flow rate, hydraulic head, water rights, geology and site access are not included."
  },
  "02 / ЗИМА В ДВИЖЕНИИ": {
    "ky": "02 / КЫШТЫН ӨЗГӨРҮШҮ",
    "en": "02 / WINTER IN MOTION"
  },
  "От первого мороза до первой воды": {
    "ky": "Алгачкы сууктан алгачкы сууга чейин",
    "en": "From the first frost to the first water"
  },
  "Пройдите сезон и посмотрите, как накапливается и тает лёд.": {
    "ky": "Мезгилди карап чыгып, муздун кантип топтолуп, эрий турганын көрүңүз.",
    "en": "Explore the season to see how ice builds up and melts."
  },
  "Объём льда": {
    "ky": "Муздун көлөмү",
    "en": "Ice volume"
  },
  "/ м³": {
    "ky": "/ м³",
    "en": "/ m³"
  },
  "Сравнить два участка": {
    "ky": "Эки участокту салыштыруу",
    "en": "Compare two sites"
  },
  "Убрать сравнение": {
    "ky": "Салыштырууну жабуу",
    "en": "Hide comparison"
  },
  "Второй участок": {
    "ky": "Экинчи участок",
    "en": "Second site"
  },
  "Одинаковые площадь и сдвиг температуры. Архив каждого участка отличается.": {
    "ky": "Аянт жана температуранын жылышы бирдей. Ар бир участоктун архиви өзүнчө.",
    "en": "The same area and temperature offset apply to both sites. Each site has its own archive."
  },
  "День сезона": {
    "ky": "Мезгилдин күнү",
    "en": "Day of the season"
  },
  "Ноябрь": {
    "ky": "Ноябрь",
    "en": "November"
  },
  "Зима": {
    "ky": "Кыш",
    "en": "Winter"
  },
  "Весна": {
    "ky": "Жаз",
    "en": "Spring"
  },
  "Июль": {
    "ky": "Июль",
    "en": "July"
  },
  "ЗИМНИЙ РЕЗЕРВ": {
    "ky": "КЫШКЫ ЗАПАС",
    "en": "WINTER RESERVE"
  },
  "ТЕРМИЧЕСКИЙ ПОТЕНЦИАЛ": {
    "ky": "ТЕРМИКАЛЫК ПОТЕНЦИАЛ",
    "en": "THERMAL POTENTIAL"
  },
  "м³ льда на выбранный день": {
    "ky": "тандалган күндөгү муз, м³",
    "en": "m³ of ice on the selected day"
  },
  "м расчётной толщины": {
    "ky": "эсептелген калыңдык, м",
    "en": "m of modelled thickness"
  },
  "Модель, коэффициенты и температурный профиль": {
    "ky": "Модель, коэффициенттер жана температуралык профиль",
    "en": "Model, coefficients and temperature profile"
  },
  "Между серединами месяцев — линейная интерполяция; на краях сезона значение ближайшего месяца. Это сглаженный сезон, а не восстановление погоды по дням. Рост только в ноябре–феврале; таяние в любой день с T > 0. Водоподача считается достаточной. Форма ледника, солнечная радиация, ветер и снежная изоляция не моделируются.": {
    "ky": "Айлардын ортосунда сызыктуу интерполяция колдонулат; мезгилдин четтеринде жакынкы айдын мааниси алынат. Бул — күнүмдүк аба ырайын калыбына келтирүү эмес, тегизделген мезгил. Муз ноябрь–февралда гана өсөт; T > 0 болгон күндөрдө эрийт. Суу жетиштүү берилет деп кабыл алынат. Мөңгүнүн формасы, күн радиациясы, шамал жана кардын жылуулук изоляциясы моделденбейт.",
    "en": "Linear interpolation between mid-month values, with the nearest month used at the season edges. This is a smoothed season, not reconstructed daily weather. Growth occurs only in November–February; melting occurs on any day with T > 0. Adequate water supply is assumed. Glacier shape, solar radiation, wind and snow insulation are not modelled."
  },
  "03 / ХОЛОД, КОТОРЫЙ КОРМИТ": {
    "ky": "03 / ТҮШҮМ БЕРГЕН СУУК",
    "en": "03 / COLD THAT FEEDS US"
  },
  "Сколько полей получат воду?": {
    "ky": "Канча талаа суу алат?",
    "en": "How much land could receive water?"
  },
  "Задайте проект и оцените диапазон с учётом неопределённости.": {
    "ky": "Долбоордун параметрлерин киргизип, белгисиздикти эске алган диапазонду баалаңыз.",
    "en": "Set the project parameters and estimate a range that accounts for uncertainty."
  },
  "Площадь ледника, м²": {
    "ky": "Мөңгүнүн аянты, м²",
    "en": "Ice area, m²"
  },
  "Проектная толщина, м": {
    "ky": "Долбоордук калыңдык, м",
    "en": "Design thickness, m"
  },
  "Культура": {
    "ky": "Өсүмдүк",
    "en": "Crop"
  },
  "Норма полива, м³/га": {
    "ky": "Сугаруу нормасы, м³/га",
    "en": "Irrigation demand, m³/ha"
  },
  "Мин. потери, %": {
    "ky": "Мин. жоготуу, %",
    "en": "Min. losses, %"
  },
  "Макс. потери, %": {
    "ky": "Макс. жоготуу, %",
    "en": "Max. losses, %"
  },
  "Нормы культур ориентировочные — уточнить по FAO. Потери 20–40% — редактируемое допущение, не измерение.": {
    "ky": "Өсүмдүктөрдүн нормалары болжолдуу — FAO боюнча тактоо керек. 20–40% жоготуу — өзгөртүлүүчү божомол, өлчөө эмес.",
    "en": "Crop demand is indicative — verify against FAO guidance. Losses of 20–40% are an editable assumption, not a measurement."
  },
  "Допущения и ограничения": {
    "ky": "Божомолдор жана чектөөлөр",
    "en": "Assumptions and limitations"
  },
  "Это предварительная оценка, а не прогноз и не инженерный проект. Реальный пилот требует обследования, замеров зимнего расхода и напора воды, проверки безопасности, разрешений и консультации гидролога. Калькулятор показывает водный эквивалент проектного льда; симулятор оценивает, какая его доля тает именно весной.": {
    "ky": "Бул — алдын ала баалоо, аба ырайынын божомолу же инженердик долбоор эмес. Чыныгы пилот үчүн жерди изилдөө, кышкы суунун чыгымын жана басымын өлчөө, коопсуздукту текшерүү, уруксаттар жана гидрологдун кеңеши керек. Калькулятор долбоордук муздун суу эквивалентин көрсөтөт; симулятор анын жазында канча бөлүгү эрий турганын баалайт.",
    "en": "This is a preliminary assessment, not a forecast or an engineering design. A real pilot requires a site survey, measurements of winter flow and hydraulic head, safety checks, permits and a hydrologist’s advice. The calculator shows the water equivalent of the proposed ice; the simulator estimates the share that melts in spring."
  },
  "Климат:": {
    "ky": "Климат:",
    "en": "Climate:"
  },
  "Open-Meteo, реанализ": {
    "ky": "Open-Meteo, реанализ",
    "en": "Open-Meteo reanalysis"
  },
  "· Высоты:": {
    "ky": "· Бийиктиктер:",
    "en": "· Elevations:"
  },
  ". Один исторический сезон не является климатической нормой. Параметры пилота, коэффициенты и правила баллов — допущения.": {
    "ky": ". Бир тарыхый мезгил климаттык норма эмес. Пилоттун параметрлери, коэффициенттер жана упай эрежелери — божомолдор.",
    "en": ". One historical season is not a climate normal. Pilot parameters, coefficients and scoring rules are assumptions."
  },
  "SolarPunk · Нарын · Прототип": {
    "ky": "SolarPunk · Нарын · Прототип",
    "en": "SolarPunk · Naryn · Prototype"
  },
  "Нарын": {
    "ky": "Нарын",
    "en": "Naryn"
  },
  "Ат-Башы": {
    "ky": "Ат-Башы",
    "en": "At-Bashy"
  },
  "Кочкор": {
    "ky": "Кочкор",
    "en": "Kochkor"
  },
  "Баетов": {
    "ky": "Баетов",
    "en": "Baetov"
  },
  "Выбранная точка": {
    "ky": "Тандалган чекит",
    "en": "Selected point"
  },
  "Картофель": {
    "ky": "Картошка",
    "en": "Potatoes"
  },
  "Ячмень": {
    "ky": "Арпа",
    "en": "Barley"
  },
  "Овощи": {
    "ky": "Жашылчалар",
    "en": "Vegetables"
  },
  "м": {
    "ky": "м",
    "en": "m"
  },
  "м²": {
    "ky": "м²",
    "en": "m²"
  },
  "м³": {
    "ky": "м³",
    "en": "m³"
  },
  "га": {
    "ky": "га",
    "en": "ha"
  },
  "м³/га": {
    "ky": "м³/га",
    "en": "m³/ha"
  },
  "баллов": {
    "ky": "упай",
    "en": "points"
  },
  "Зимний холод": {
    "ky": "Кышкы суук",
    "en": "Winter cold"
  },
  "Высота": {
    "ky": "Бийиктик",
    "en": "Elevation"
  },
  "Уклон площадки": {
    "ky": "Участоктун жантайышы",
    "en": "Site slope"
  },
  "Расстояние до воды": {
    "ky": "Сууга чейинки аралык",
    "en": "Distance to water"
  },
  "Карта не загрузилась. Выберите подготовленную точку кнопками выше. Расчёты доступны.": {
    "ky": "Карта жүктөлгөн жок. Жогорудагы баскычтардан даяр чекитти тандаңыз. Эсептөөлөр жеткиликтүү.",
    "en": "The map did not load. Choose a preset location using the buttons above. Calculations are available."
  },
  "Климат: встроенный снимок Open-Meteo": {
    "ky": "Климат: сакталган Open-Meteo маалыматтары",
    "en": "Climate: bundled Open-Meteo snapshot"
  },
  "Архив Open-Meteo загружен": {
    "ky": "Open-Meteo архиви жүктөлдү",
    "en": "Open-Meteo archive loaded"
  },
  "Климат не получен": {
    "ky": "Климат маалыматтары алынган жок",
    "en": "Climate data unavailable"
  },
  "высота: Copernicus DEM, API": {
    "ky": "бийиктик: Copernicus DEM, API",
    "en": "elevation: Copernicus DEM, API"
  },
  "высота: встроенный снимок": {
    "ky": "бийиктик: сакталган маалымат",
    "en": "elevation: bundled snapshot"
  },
  "высоту введите вручную": {
    "ky": "бийиктикти кол менен киргизиңиз",
    "en": "enter elevation manually"
  },
  "Сезон 2024–2025.": {
    "ky": "2024–2025 мезгили.",
    "en": "2024–2025 season."
  },
  "Загружаем высоту и архив сезона…": {
    "ky": "Бийиктик жана мезгилдин архиви жүктөлүүдө…",
    "en": "Loading elevation and season archive…"
  },
  "Данные обновлены. Реанализ — не измерения на участке.": {
    "ky": "Маалымат жаңыланды. Реанализ — участоктогу өлчөө эмес.",
    "en": "Data refreshed. Reanalysis is not an on-site measurement."
  },
  "API ответил частично или недоступен. Сохранены доступные данные; проверьте источник выше.": {
    "ky": "API жарым-жартылай жооп берди же жеткиликсиз. Жеткиликтүү маалымат сакталды; жогорудагы булагын текшериңиз.",
    "en": "The API returned partial data or is unavailable. Available data is retained; check the source above."
  },
  "Не удалось загрузить API. Доступные данные сохранены; недостающие параметры требуют ввода.": {
    "ky": "API маалыматтарын жүктөө мүмкүн болгон жок. Жеткиликтүү маалымат сакталды; жетишпеген параметрлерди киргизиңиз.",
    "en": "Could not load API data. Available data is retained; enter any missing parameters."
  },
  "Заполните все параметры": {
    "ky": "Бардык параметрлерди толтуруңуз",
    "en": "Complete all parameters"
  },
  "Перспективно для обследования": {
    "ky": "Изилдөө үчүн келечектүү",
    "en": "Promising for a site survey"
  },
  "Есть ограничения": {
    "ky": "Чектөөлөр бар",
    "en": "Some constraints"
  },
  "Низкая предварительная оценка": {
    "ky": "Алдын ала баа төмөн",
    "en": "Low preliminary suitability"
  },
  "Эвристика · не вероятность успеха": {
    "ky": "Жөнөкөйлөтүлгөн баалоо · ийгилик ыктымалдыгы эмес",
    "en": "Heuristic · not a success probability"
  },
  "нет данных": {
    "ky": "маалымат жок",
    "en": "no data"
  },
  "Нет данных": {
    "ky": "Маалымат жок",
    "en": "No data"
  },
  "Для симуляции нужны архив температур, зимняя температура и корректная площадь ледника.": {
    "ky": "Симуляция үчүн температура архиви, кышкы температура жана мөңгүнүн туура аянты керек.",
    "en": "Simulation requires a temperature archive, winter temperature and a valid ice area."
  },
  "Ежедневный расчёт объёма льда с ноября по июль": {
    "ky": "Ноябрдан июлга чейин муздун көлөмүнүн күнүмдүк эсеби",
    "en": "Daily modelled ice volume from November to July"
  },
  "сравнение с": {
    "ky": "салыштыруу:",
    "en": "compared with"
  },
  "ТРЕБУЮТСЯ ДАННЫЕ": {
    "ky": "МААЛЫМАТ КЕРЕК",
    "en": "DATA REQUIRED"
  },
  "ХОЛОДНЫЙ ПЕРИОД": {
    "ky": "СУУК МЕЗГИЛ",
    "en": "COLD PERIOD"
  },
  "ЛЁД СТАНОВИТСЯ ВОДОЙ": {
    "ky": "МУЗ СУУГА АЙЛАНУУДА",
    "en": "ICE IS BECOMING WATER"
  },
  "ЛЕДЯНОЙ ЗАПАС ИСЧЕРПАН": {
    "ky": "МУЗ ЗАПАСЫ ТҮГӨНДҮ",
    "en": "ICE RESERVE DEPLETED"
  },
  "Проверьте параметры": {
    "ky": "Параметрлерди текшериңиз",
    "en": "Check the parameters"
  },
  "Введите положительные площадь, толщину и норму полива. Потери должны быть от 0 до 100%, минимум не выше максимума.": {
    "ky": "Аянт, калыңдык жана сугаруу нормасы оң сан болсун. Жоготуу 0–100% болууга тийиш, минимум максимумдан ашпасын.",
    "en": "Enter positive area, thickness and irrigation demand. Losses must be between 0 and 100%, with the minimum no greater than the maximum."
  },
  "ВОДНЫЙ ЭКВИВАЛЕНТ ПРОЕКТА": {
    "ky": "ДОЛБООРДУН СУУ ЭКВИВАЛЕНТИ",
    "en": "PROJECT WATER EQUIVALENT"
  },
  "Доступная вода после потерь": {
    "ky": "Жоготуулардан кийинки суу",
    "en": "Available water after losses"
  },
  "Пессимистично: потери {max}%. Оптимистично: {min}%.": {
    "ky": "Пессимисттик: жоготуу {max}%. Оптимисттик: {min}%.",
    "en": "Pessimistic: {max}% losses. Optimistic: {min}%."
  },
  "на сезон полива": {
    "ky": "сугаруу мезгилине",
    "en": "for the irrigation season"
  },
  "{area} м² × {thickness} м = {ice} м³ льда<br>× {density} (плотность относительно воды) = {water} м³ воды<br>× (1 − потери) ÷ {demand} м³/га → площадь полива": {
    "ky": "{area} м² × {thickness} м = {ice} м³ муз<br>× {density} (сууга салыштырмалуу тыгыздык) = {water} м³ суу<br>× (1 − жоготуу) ÷ {demand} м³/га → сугаруу аянты",
    "en": "{area} m² × {thickness} m = {ice} m³ of ice<br>× {density} (density relative to water) = {water} m³ of water<br>× (1 − losses) ÷ {demand} m³/ha → irrigated area"
  },
  "<b>Именно весной, март–май:</b> {min}–{max} м³, или {haMin}–{haMax} га. В расчёте учтены термический предел и доля весеннего таяния {fraction}%. Накопление и доставка талой воды предполагаются доступными.": {
    "ky": "<b>Жазында, март–май:</b> {min}–{max} м³, же {haMin}–{haMax} га. Эсепте термикалык чек жана жазгы эрүү үлүшү {fraction}% эске алынган. Эриген сууну топтоо жана жеткирүү мүмкүн деп кабыл алынат.",
    "en": "<b>In spring, March–May:</b> {min}–{max} m³, or {haMin}–{haMax} ha. The calculation includes the thermal limit and the spring melt fraction of {fraction}%. Meltwater collection and delivery are assumed to be available."
  },
  "Срок получения воды неизвестен: нет температурного профиля для сезонной модели.": {
    "ky": "Сууну алуу мөөнөтү белгисиз: мезгилдик модель үчүн температуралык профиль жок.",
    "en": "Water availability timing is unknown: the seasonal model has no temperature profile."
  },
  "Термический предел: {peak} м; проект: {design} м.": {
    "ky": "Термикалык чек: {peak} м; долбоор: {design} м.",
    "en": "Thermal limit: {peak} m; design: {design} m."
  },
  "Проектная толщина превышает модельный предел. Для весеннего результата взят меньший объём.": {
    "ky": "Долбоордук калыңдык моделдин чегинен ашат. Жазгы натыйжа үчүн кичирээк көлөм алынды.",
    "en": "Design thickness exceeds the model limit. The smaller volume is used for the spring estimate."
  },
  "Проектная толщина укладывается в предел упрощённой модели.": {
    "ky": "Долбоордук калыңдык жөнөкөйлөтүлгөн моделдин чегине туура келет.",
    "en": "Design thickness is within the simplified model’s limit."
  },
  "Для проверки проектной толщины нужен архив температур.": {
    "ky": "Долбоордук калыңдыкты текшерүү үчүн температура архиви керек.",
    "en": "A temperature archive is needed to check the design thickness."
  },
  "Площадь: {area}. k = {k} м/√(°C·день); таяние = {melt} м/(°C·день). Сдвиг профиля: {offset}.": {
    "ky": "Аянт: {area}. k = {k} м/√(°C·күн); эрүү = {melt} м/(°C·күн). Профилдин жылышы: {offset}.",
    "en": "Area: {area}. k = {k} m/√(°C·day); melt factor = {melt} m/(°C·day). Profile offset: {offset}."
  },
  "Архив температур не получен.": {
    "ky": "Температура архиви алынган жок.",
    "en": "Temperature archive unavailable."
  },
  "Оценка {score}/100.": {
    "ky": "Баалоо {score}/100.",
    "en": "Score: {score}/100."
  },
  "Оценка требует заполнения параметров.": {
    "ky": "Баалоо үчүн параметрлерди толтуруңуз.",
    "en": "Complete the parameters to calculate a score."
  },
  "<strong>Пилотный участок · демонстрационный сценарий у Ат-Башы</strong><br>Реальный ориентир и реанализ Open-Meteo; площадка не обследована. Уклон {slope}° и расстояние {distance} м — учебные допущения.<br>{score} Зима: до {peak} м³ льда по модели. {result}": {
    "ky": "<strong>Пилоттук участок · Ат-Башыдагы көрсөтмө сценарий</strong><br>Чыныгы багыт жана Open-Meteo реанализи; аянтча изилденген эмес. {slope}° жантайыш жана {distance} м аралык — окуу үчүн божомолдор.<br>{score} Кыш: модель боюнча {peak} м³ чейин муз. {result}",
    "en": "<strong>Pilot site · demonstration scenario near At-Bashy</strong><br>A real reference location and Open-Meteo reanalysis; the site has not been surveyed. Slope of {slope}° and distance of {distance} m are illustrative assumptions.<br>{score} Winter: up to {peak} m³ of modelled ice. {result}"
  },
  "Проект: {ice} м³. Весна: {min}–{max} м³ воды после потерь → {haMin}–{haMax} га при норме {demand} м³/га.": {
    "ky": "Долбоор: {ice} м³. Жаз: жоготуулардан кийин {min}–{max} м³ суу → {demand} м³/га нормасында {haMin}–{haMax} га.",
    "en": "Design: {ice} m³. Spring: {min}–{max} m³ of water after losses → {haMin}–{haMax} ha at {demand} m³/ha."
  },
  "Проверьте входные данные.": {
    "ky": "Киргизилген маалыматтарды текшериңиз.",
    "en": "Check the inputs."
  },
  "Ноябрь 2024 — июль 2025 · сглаженный профиль": {
    "ky": "Ноябрь 2024 — июль 2025 · тегизделген профиль",
    "en": "November 2024 — July 2025 · smoothed profile"
  },
  "Рост: h = k × √FDD, k = {k} м/√(°C·день). FDD — накопленные отрицательные градусо-дни ноября–февраля. Приращение толщины добавляется к остатку льда. Таяние: Δh = {melt} × max(T, 0) м/день, не больше имеющегося льда. Объём = площадь × h. Плотность льда относительно воды = {density}. Все коэффициенты — допущения из data.js, требуют калибровки.": {
    "ky": "Өсүү: h = k × √FDD, k = {k} м/√(°C·күн). FDD — ноябрь–февралда топтолгон терс градус-күндөр. Калыңдыктын өсүшү калган музга кошулат. Эрүү: Δh = {melt} × max(T, 0) м/күн, болгон муздан ашпайт. Көлөм = аянт × h. Муздун сууга салыштырмалуу тыгыздыгы = {density}. Бардык коэффициенттер — data.js файлындагы божомолдор, калибрлөө керек.",
    "en": "Growth: h = k × √FDD, k = {k} m/√(°C·day). FDD is accumulated freezing degree-days in November–February. Thickness increments are added to the remaining ice. Melting: Δh = {melt} × max(T, 0) m/day, capped at the available ice. Volume = area × h. Ice density relative to water = {density}. All coefficients are assumptions in data.js and require calibration."
  },
  "Увеличить масштаб": {
    "ky": "Масштабды чоңойтуу",
    "en": "Zoom in"
  },
  "Уменьшить масштаб": {
    "ky": "Масштабды кичирейтүү",
    "en": "Zoom out"
  },
  "≤ −8 °C: 40; ≤ −4: 28; ≤ 0: 12; выше 0: 0. Холод поддерживает намораживание.": {
    "ky": "≤ −8 °C: 40; ≤ −4: 28; ≤ 0: 12; 0дөн жогору: 0. Суук муздун пайда болушуна жардам берет.",
    "en": "≤ −8 °C: 40; ≤ −4: 28; ≤ 0: 12; above 0: 0. Cold supports ice formation."
  },
  "≥ 2200 м: 20; ≥ 1800: 14; ≥ 1500: 7; ниже: 0. Условный косвенный признак; частично дублирует температуру.": {
    "ky": "≥ 2200 м: 20; ≥ 1800: 14; ≥ 1500: 7; төмөн: 0. Шарттуу кыйыр белги; температураны жарым-жартылай кайталайт.",
    "en": "≥ 2200 m: 20; ≥ 1800: 14; ≥ 1500: 7; lower: 0. An indirect heuristic that partly overlaps with temperature."
  },
  "≤ 5°: 20; ≤ 10°: 12; ≤ 15°: 5; круче: 0. Пологая площадка упрощает удержание воды.": {
    "ky": "≤ 5°: 20; ≤ 10°: 12; ≤ 15°: 5; тик болсо: 0. Тегизирээк аянт сууну кармоону жеңилдетет.",
    "en": "≤ 5°: 20; ≤ 10°: 12; ≤ 15°: 5; steeper: 0. Gentler terrain makes water retention easier."
  },
  "≤ 100 м: 20; ≤ 500: 12; ≤ 1000: 5; дальше: 0. Расстояние — условный показатель сложности подачи.": {
    "ky": "≤ 100 м: 20; ≤ 500: 12; ≤ 1000: 5; алыс болсо: 0. Аралык — суу жеткирүүнүн татаалдыгынын шарттуу көрсөткүчү.",
    "en": "≤ 100 m: 20; ≤ 500: 12; ≤ 1000: 5; farther: 0. Distance is a rough indicator of water supply complexity."
  },
  "Ice Simulator": {
    "ky": "Муз симулятору",
    "en": "Ice Simulator"
  },
  "Water Calculator": {
    "ky": "Суу калькулятору",
    "en": "Water Calculator"
  }
};
