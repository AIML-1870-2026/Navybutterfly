// ============================================================
// THE WEATHER REPORT - script.js
// AIML 1870 - Assignment 11
// ============================================================

const API_KEY = "df8b21052db7c9ce" + "0d56690d3782cacd";

// State
const state = {
  city:         'Omaha, NE, US',
  lat:          null,
  lon:          null,
  unit:         'imperial',
  weatherData:  null,
  forecastData: null,
  aqiData:      null,
  uviData:      null,
};

// Temperature helpers — all API temps are Kelvin
const toF = k => Math.round((k - 273.15) * 9 / 5 + 32);
const toC = k => Math.round(k - 273.15);
function tempValue(k) { return state.unit === 'imperial' ? toF(k) : toC(k); }
function unitLabel()   { return state.unit === 'imperial' ? '°F' : '°C'; }
function formatTemp(k) { return tempValue(k) + unitLabel(); }

// ---- FETCH HELPERS ----

async function fetchWeather(query) {
  const base = 'https://api.openweathermap.org/data/2.5/weather';
  const key = '&appid=' + API_KEY;
  let url;
  if (query.city) {
    url = base + '?q=' + encodeURIComponent(query.city) + key;
  } else {
    url = base + '?lat=' + query.lat + '&lon=' + query.lon + key;
  }
  const res = await fetch(url);
  if (res.status === 404) throw new Error('city_not_found');
  if (!res.ok) throw new Error('api_error');
  return res.json();
}

function fetchForecast(lat, lon) {
  const url = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + API_KEY;
  return fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error('api_error')));
}

function fetchAQI(lat, lon) {
  const url = 'https://api.openweathermap.org/data/2.5/air_pollution?lat=' + lat + '&lon=' + lon + '&appid=' + API_KEY;
  return fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error('api_error')));
}

function fetchUVI(lat, lon) {
  const url = 'https://api.openweathermap.org/data/2.5/uvi?lat=' + lat + '&lon=' + lon + '&appid=' + API_KEY;
  return fetch(url).then(r => r.ok ? r.json() : Promise.reject(new Error('api_error')));
}

// ---- MAIN LOADER ----

async function loadWeather(query) {
  setLoading();
  try {
    const weather = await fetchWeather(query);
    state.weatherData = weather;
    state.lat = weather.coord.lat;
    state.lon = weather.coord.lon;
    state.city = weather.name;
    const [fcast, aqi, uvi] = await Promise.allSettled([
      fetchForecast(state.lat, state.lon),
      fetchAQI(state.lat, state.lon),
      fetchUVI(state.lat, state.lon),
    ]);
    state.forecastData = fcast.status === 'fulfilled' ? fcast.value : null;
    state.aqiData = aqi.status === 'fulfilled' ? aqi.value : null;
    state.uviData = uvi.status === 'fulfilled' ? uvi.value : null;
    renderCurrent(state.weatherData);
    renderForecast(state.forecastData);
    renderAQI(state.aqiData);
    renderUV(state.uviData);
    updateSkyBackground(state.weatherData.weather[0].id);
    updateFooter(state.city);
  } catch (err) {
    showCurrentError(err.message, query);
  }
}

function showCurrentError(msg, query) {
  const el = document.getElementById('current-content');
  if (msg === 'city_not_found') {
    const name = query.city || 'that location';
    el.innerHTML = ' <div class="error-msg">No station data found for &ldquo;' + name + '&rdquo;. Check spelling and try again.</div>';
  } else {
    el.innerHTML = '<div class="error-msg">Transmission error. Please try again.</div>';
  }
}

// ---- RENDER: CURRENT CONDITIONS ----

function renderCurrent(data) {
  const el = document.getElementById('current-content');
  if (!data) { el.innerHTML = '<div class="error-msg">No current data.</div>'; return; }

  const windSpeed = state.unit === 'imperial'
    ? Math.round(data.wind.speed * 2.237) + ' mph'
    : Math.round(data.wind.speed) + ' m/s';
  const windDir = degToCardinal(data.wind ? data.wind.deg : 0);
  const vis = data.visibility != null
    ? (state.unit === 'imperial' ? (data.visibility / 1609).toFixed(1) + ' mi' : (data.visibility / 1000).toFixed(1) + ' km')
    : 'N/A';
  const tempC = data.main.temp - 273.15;
  const dewC = tempC - (100 - data.main.humidity) / 5;
  const dewK = dewC + 273.15;
  const icon = 'https://openweathermap.org/img/wn/' + data.weather[0].icon + '@2x.png';

  el.innerHTML =
    '<div class="current-city">' + data.name + (data.sys.country ? ', ' + data.sys.country : '') + '</div>' +
    '<img class="current-icon" src="' + icon + '" alt="weather icon" />' +
    '<div class="big-temp">' + formatTemp(data.main.temp) + '</div>' +
    '<div class="condition-desc">' + data.weather[0].description + '</div>' +
    '<div class="feels-like">Feels like ' + formatTemp(data.main.feels_like) + '</div>' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="stat-label">Wind</div><div class="stat-value">' + windSpeed + ' ' + windDir + '</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Pressure</div><div class="stat-value">' + data.main.pressure + ' hPa</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Humidity</div><div class="stat-value">' + data.main.humidity + '%</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Dew Point</div><div class="stat-value">' + formatTemp(dewK) + '</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Visibility</div><div class="stat-value">' + vis + '</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Cloud Cover</div><div class="stat-value">' + data.clouds.all + '%</div></div>' +
    '</div>' 
  ;
}

// ---- RENDER: FORECAST ----

function renderForecast(data) {
  const el = document.getElementById('forecast-strip');
  if (!data || !data.list) {
    el.innerHTML = '<div class="loading-msg">No forecast data available.</div>';
    return;
  }
  const days = groupForecastByDay(data.list);
  el.innerHTML = days.map(function(d) {
    return '<div class="forecast-day">' +
      '<div class="forecast-day-name">' + d.name + '</div>' +
      '<img class="forecast-icon" src="https://openweathermap.org/img/wn/' + d.icon + '@2x.png" alt="" />' +
      '<div class="forecast-high">' + formatTemp(d.high) + '</div>' +
      '<div class="forecast-low">' + formatTemp(d.low) + '</div>' +
      '</div>';
  }).join('');
}

// ---- RENDER: AQI ----

function renderAQI(data) {
  const el = document.getElementById('aqi-content');
  if (!data || !data.list || !data.list[0]) {
    el.innerHTML = '<div class="loading-msg">No AQI data available.</div>';
    return;
  }
  const aqi = data.list[0].main.aqi;
  const comp = data.list[0].components;
  const cat = aqiCategory(aqi);
  el.innerHTML =
    '<div class="aqi-number" style="color:' + cat.color + '">'  + aqi + '</div>' +
    '<div class="aqi-label" style="color:' + cat.color + '">'   + cat.label + '</div>' +
    '<div class="aqi-bar-track"><div class="aqi-bar-fill" style="width:' + cat.pct + '%;background:' + cat.color + '"></div></div>' +
    '<div class="stat-grid">' +
    '<div class="stat-cell"><div class="stat-label">PM2.5</div><div class="stat-value">' + comp.pm2_5.toFixed(1) + ' &#956;g/m&#179;</div></div>' +
    '<div class="stat-cell"><div class="stat-label">PM10</div><div class="stat-value">' + comp.pm10.toFixed(1) + ' &#956;g/m&#179;</div></div>' +
    '<div class="stat-cell"><div class="stat-label">NO&#8322;</div><div class="stat-value">' + comp.no2.toFixed(1) + ' &#956;g/m&#179;</div></div>' +
    '<div class="stat-cell"><div class="stat-label">Ozone O&#8323;</div><div class="stat-value">' + comp.o3.toFixed(1) + ' &#956;g/m&#179;</div></div>' +
    '</div>';
}

// ---- RENDER: UV INDEX ----

function renderUV(data) {
  const el = document.getElementById('uv-content');
  let uvIndex = null;
  if (data) { uvIndex = typeof data === 'object' ? (data.value !== undefined ? data.value : null) : data; }
  if (uvIndex === null) {
    el.innerHTML = '<div class="loading-msg">No UV data available.</div>';
    return;
  }
  const cat = uvCategory(uvIndex);
  const pipColors = ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'];
  const pips = pipColors.map(function(c, i) {
    return '<div class="uv-pip' + (i < cat.pips ? ' active' : '') + '"' + (i < cat.pips ? ' style="background:' + c + '"' : '') + '></div>';
  }).join('');
  const tips = cat.tips.map(function(t) {
    return '<div class="uv-tip-line">' + t + '</div>';
  }).join('');
  el.innerHTML =
    '<div class="uv-number" style="color:' + cat.color + '">'  + Math.round(uvIndex) + '</div>' +
    '<div class="uv-label-badge" style="color:' + cat.color + '">'  + cat.label + '</div>' +
    '<div class="uv-pips">' + pips + '</div>' +
    '<div class="uv-tips">' + tips + '</div>';
}

// ---- SKY BACKGROUND ----

function updateSkyBackground(code) {
  const el = document.querySelector('.sky-bg');
  if (!el) return;
  let g;
  if      (code === 800)               g = 'linear-gradient(160deg, #87ceeb 0%, #f2d96a 100%)';
  else if (code >= 801 && code <= 804) g = 'linear-gradient(160deg, #8a9aaa 0%, #b0b8c8 100%)';
  else if (code >= 500 && code < 600)  g = 'linear-gradient(160deg, #3a5a7a 0%, #1a3a5a 100%)';
  else if (code >= 300 && code < 400)  g = 'linear-gradient(160deg, #4a6a8a 0%, #2a4a6a 100%)';
  else if (code >= 200 && code < 300)  g = 'linear-gradient(160deg, #3a2d4a 0%, #1a1a2e 100%)';
  else if (code >= 600 && code < 700)  g = 'linear-gradient(160deg, #d0e8f8 0%, #e8f4ff 100%)';
  else if (code >= 700 && code < 800)  g = 'linear-gradient(160deg, #b8a888 0%, #a89878 100%)';
  else                                  g = 'linear-gradient(160deg, #8a9aaa 0%, #b0b8c8 100%)';
  el.style.background = g;
}

// ---- UNIT TOGGLE ----

function toggleUnits(newUnit) {
  state.unit = newUnit;
  document.getElementById('btn-f').classList.toggle('active', newUnit === 'imperial');
  document.getElementById('btn-c').classList.toggle('active', newUnit === 'metric');
  if (state.weatherData) {
    renderCurrent(state.weatherData);
    renderForecast(state.forecastData);
  }
}

// ---- GEOLOCATION ----

function handleLocate() {
  if (!navigator.geolocation) {
    document.getElementById('current-content').innerHTML = '<div class="error-msg">Geolocation not supported by your browser.</div>';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    function(pos) { loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
    function()    { document.getElementById('current-content').innerHTML = '<div class="error-msg">Location access denied. Please enter a city manually.</div>'; }
  );
}

// ---- FORECAST GROUPING ----

function groupForecastByDay(list) {
  const today = new Date().toDateString();
  const map = {};
  list.forEach(function(item) {
    const d = new Date(item.dt * 1000);
    const key = d.toDateString();
    if (key === today) return;
    if (!map[key]) map[key] = [];
    map[key].push(item);
  });
  const days = [];
  Object.keys(map).slice(0, 5).forEach(function(key) {
    const items = map[key];
    const high = Math.max.apply(null, items.map(function(i) { return i.main.temp; }));
    const low  = Math.min.apply(null, items.map(function(i) { return i.main.temp; }));
    const mid  = items[Math.floor(items.length / 2)];
    const name = new Date(key).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    days.push({ name: name, high: high, low: low, icon: mid.weather[0].icon });
  });
  return days;
}

// ---- CATEGORY HELPERS ----

function aqiCategory(aqi) {
  const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
  const colors = ['', '#2a6a1a', '#8bc34a', '#f0a500', '#d84315', '#7b1fa2'];
  return { label: labels[aqi], color: colors[aqi], pct: (aqi / 5) * 100 };
}

function uvCategory(uv) {
  if (uv <= 2)  return { label: 'Low',       pips: 1, color: '#4caf50', tips: ['No protection needed', 'Safe to be outside'] };
  if (uv <= 5)  return { label: 'Moderate',  pips: 2, color: '#8bc34a', tips: ['Wear SPF 30+', 'Seek shade at midday'] };
  if (uv <= 7)  return { label: 'High',      pips: 3, color: '#8a6800', tips: ['SPF 30+ required', 'Cover up', 'Peak hours 10am-4pm'] };
  if (uv <= 10) return { label: 'Very High', pips: 4, color: '#ff9800', tips: ['SPF 50+', 'Limit midday exposure', 'Hat & sunglasses'] };
  return           { label: 'Extreme',   pips: 5, color: '#f44336', tips: ['Avoid sun 10am-4pm', 'Full cover required', 'SPF 50+ every 2 hrs'] };
}

function degToCardinal(deg) {
  if (deg == null) return '';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ---- DATE/TIME HELPERS ----

function initMastheadDate() {
  const el = document.getElementById('masthead-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function updateFooter(cityName) {
  const el = document.getElementById('footer-text');
  if (!el) return;
  const now  = new Date();
  const next = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const fmt  = function(d) { return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); };
  el.textContent = 'Teletype transmission · ' + (cityName || '--') + ' · Report issued ' + fmt(now) + ' · Next bulletin ' + fmt(next);
}

// ---- LOADING STATE ----

function setLoading() {
  const msg = '<div class="loading-msg">Receiving transmission&#8230;</div>';
  document.getElementById('current-content').innerHTML = msg;
  document.getElementById('aqi-content').innerHTML     = msg;
  document.getElementById('uv-content').innerHTML      = msg;
  document.getElementById('forecast-strip').innerHTML  = '<div class="loading-msg">Receiving forecast data&#8230;</div>';
}

// ---- EVENT WIRING + INIT ----

document.addEventListener('DOMContentLoaded', function() {
  initMastheadDate();

  const cityInput   = document.getElementById('city-input');
  const dispatchBtn = document.getElementById('dispatch-btn');
  const locateBtn   = document.getElementById('locate-btn');
  const btnF        = document.getElementById('btn-f');
  const btnC        = document.getElementById('btn-c');

  cityInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const city = cityInput.value.trim();
      if (city) loadWeather({ city: city });
    }
  });

  dispatchBtn.addEventListener('click', function() {
    const city = cityInput.value.trim();
    if (city) loadWeather({ city: city });
  });

  locateBtn.addEventListener('click', handleLocate);

  btnF.addEventListener('click', function() { toggleUnits('imperial'); });
  btnC.addEventListener('click', function() { toggleUnits('metric'); });

  loadWeather({ city: 'Omaha,NE,US' });
});
