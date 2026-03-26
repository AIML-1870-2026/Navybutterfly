// ============================================================
// 1. CONSTANTS
// ============================================================
const API_KEY = "df8b21052db7c9ce0d56690d3782cacd";

// ============================================================
// 2. STATE
// ============================================================
const state = {
  city:        'Omaha',
  lat:         null,
  lon:         null,
  unit:        'F',   // 'F' | 'C'
  weatherData: null,
  forecastData:null,
  aqiData:     null,
  uvValue:     null,
};

// Temperature conversion helpers (all API temps are Kelvin)
const toF = k => Math.round((k - 273.15) * 9 / 5 + 32);
const toC = k => Math.round(k - 273.15);
const disp = k => state.unit === 'F' ? `${toF(k)}°F` : `${toC(k)}°C`;

// ============================================================
// 2. FETCH HELPERS
// ============================================================
async function apiFetch(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(res.status === 404 ? 'not_found' : 'api_error');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function fetchCurrentByCity(city) {
  return apiFetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}`
  );
}

function fetchCurrentByCoords(lat, lon) {
  return apiFetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
}

function fetchForecast(lat, lon) {
  return apiFetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
}

function fetchAQI(lat, lon) {
  return apiFetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
}

function fetchUV(lat, lon) {
  return apiFetch(
    `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );
}

// ============================================================
// 3. MAIN DATA LOADER
// ============================================================
async function loadWeather(query) {
  showLoading();
  try {
    // Step 1: get current weather (city string or {lat, lon})
    const weather = typeof query === 'string'
      ? await fetchCurrentByCity(query)
      : await fetchCurrentByCoords(query.lat, query.lon);

    state.weatherData = weather;
    state.lat = weather.coord.lat;
    state.lon = weather.coord.lon;
    state.city = weather.name;

    // Step 2: parallel fetches for the rest
    const [forecast, aqi, uvResp] = await Promise.allSettled([
      fetchForecast(state.lat, state.lon),
      fetchAQI(state.lat, state.lon),
      fetchUV(state.lat, state.lon),
    ]);

    state.forecastData = forecast.status === 'fulfilled' ? forecast.value : null;
    state.aqiData      = aqi.status     === 'fulfilled' ? aqi.value      : null;
    state.uvValue      = uvResp.status  === 'fulfilled' ? uvResp.value.value : null;

    renderAll();
    updateTeletypeFooter();

  } catch (err) {
    if (err.message === 'not_found') {
      const q = typeof query === 'string' ? query : 'that location';
      showError(`No station data found for "${q}". Check spelling and try again.`);
    } else {
      showError('Transmission error. Please try again.');
    }
  }
}

// ============================================================
// 4. RENDER — orchestrator
// ============================================================
function renderAll() {
  renderCurrent(state.weatherData);
  renderForecast(state.forecastData);
  renderAQI(state.aqiData);
  renderUV(state.uvValue);
  updateSkyBackground(state.weatherData.weather[0].id);
}

// ============================================================
// 4a. RENDER — Current Conditions
// ============================================================
function renderCurrent(data) {
  const el = document.getElementById('currentContent');
  if (!data) { el.innerHTML = '<div class="error-msg">No current data.</div>'; return; }

  const windDir   = getWindDir(data.wind.deg);
  const windSpeed = data.wind ? (state.unit === 'F'
    ? `${Math.round(data.wind.speed * 2.237)} mph`
    : `${Math.round(data.wind.speed)} m/s`) : 'N/A';
  const vis = data.visibility != null
    ? (state.unit === 'F'
        ? `${(data.visibility / 1609).toFixed(1)} mi`
        : `${(data.visibility / 1000).toFixed(1)} km`)
    : 'N/A';
  const dewK     = calcDewPointK(data.main.temp, data.main.humidity);
  const sunrise  = fmtTime(data.sys.sunrise);
  const sunset   = fmtTime(data.sys.sunset);

  el.innerHTML = `
    <div class="current-city">${data.name}, ${data.sys.country}</div>
    <div class="big-temp">${disp(data.main.temp)}</div>
    <div class="condition-desc">${data.weather[0].description}</div>
    <div class="feels-like">Feels like ${disp(data.main.feels_like)}</div>
    <div class="stat-grid">
      <div class="stat-cell">
        <div class="stat-label">Wind</div>
        <div class="stat-value">${windSpeed} ${windDir}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Pressure</div>
        <div class="stat-value">${data.main.pressure} hPa</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Humidity</div>
        <div class="stat-value">${data.main.humidity}%</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Dew Point</div>
        <div class="stat-value">${disp(dewK)}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Visibility</div>
        <div class="stat-value">${vis}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Cloud Cover</div>
        <div class="stat-value">${data.clouds.all}%</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Sunrise</div>
        <div class="stat-value">${sunrise}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Sunset</div>
        <div class="stat-value">${sunset}</div>
      </div>
    </div>
  `;
}

// ============================================================
// 4b. RENDER — 5-Day Forecast
// ============================================================
function renderForecast(data) {
  const el = document.getElementById('forecastGrid');
  if (!data || !data.list) {
    el.innerHTML = '<div class="loading-msg" style="grid-column:1/-1">No forecast data.</div>';
    return;
  }

  // Group 3-hour slots by calendar date
  const byDay = {};
  data.list.forEach(item => {
    const key = new Date(item.dt * 1000).toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(item);
  });

  const days = Object.keys(byDay).slice(0, 5);
  el.innerHTML = days.map(key => {
    const items  = byDay[key];
    const high   = Math.max(...items.map(i => i.main.temp_max));
    const low    = Math.min(...items.map(i => i.main.temp_min));
    // pick midday reading for icon
    const mid    = items[Math.floor(items.length / 2)];
    const icon   = weatherEmoji(mid.weather[0].id);
    const label  = new Date(key).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    return `
      <div class="forecast-day">
        <div class="forecast-day-name">${label}</div>
        <div class="forecast-icon">${icon}</div>
        <div class="forecast-high">${disp(high)}</div>
        <div class="forecast-low">${disp(low)}</div>
      </div>
    `;
  }).join('');
}

// ============================================================
// 4c. RENDER — Air Quality Index
// ============================================================
function renderAQI(data) {
  const el = document.getElementById('aqiContent');
  if (!data || !data.list || !data.list[0]) {
    el.innerHTML = '<div class="loading-msg">No AQI data available.</div>';
    return;
  }
  const aqi  = data.list[0].main.aqi;
  const comp = data.list[0].components;
  const cat  = aqiCategory(aqi);

  el.innerHTML = `
    <div class="aqi-number" style="color:${cat.color}">${aqi}</div>
    <div class="aqi-label"  style="color:${cat.color}">${cat.label}</div>
    <div class="aqi-bar-track">
      <div class="aqi-bar-fill" style="width:${cat.pct}%;background:${cat.color}"></div>
    </div>
    <div class="stat-grid">
      <div class="stat-cell">
        <div class="stat-label">PM2.5</div>
        <div class="stat-value">${comp.pm2_5.toFixed(1)} μg/m³</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">PM10</div>
        <div class="stat-value">${comp.pm10.toFixed(1)} μg/m³</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">Ozone O₃</div>
        <div class="stat-value">${comp.o3.toFixed(1)} μg/m³</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">NO₂</div>
        <div class="stat-value">${comp.no2.toFixed(1)} μg/m³</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">SO₂</div>
        <div class="stat-value">${comp.so2.toFixed(1)} μg/m³</div>
      </div>
      <div class="stat-cell">
        <div class="stat-label">CO</div>
        <div class="stat-value">${(comp.co / 1000).toFixed(2)} mg/m³</div>
      </div>
    </div>
  `;
}

// ============================================================
// 4d. RENDER — UV Index
// ============================================================
function renderUV(uvIndex) {
  const el = document.getElementById('uvContent');
  if (uvIndex == null) {
    el.innerHTML = '<div class="loading-msg">No UV data available.</div>';
    return;
  }
  const cat       = uvCategory(uvIndex);
  const pipColors = ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'];

  const pips = pipColors.map((c, i) =>
    `<div class="uv-pip${i < cat.pips ? ' active' : ''}"` +
    `${i < cat.pips ? ` style="background:${c}"` : ''}></div>`
  ).join('');

  const tips = cat.tips.map(t =>
    `<div class="uv-tip-line">${t}</div>`
  ).join('');

  el.innerHTML = `
    <div class="uv-number" style="color:${cat.color}">${Math.round(uvIndex)}</div>
    <div class="uv-label-badge" style="color:${cat.color}">${cat.label}</div>
    <div class="uv-pips">${pips}</div>
    <div class="uv-tips">${tips}</div>
  `;
}

// ============================================================
// 5. SKY BACKGROUND
// ============================================================
function updateSkyBackground(code) {
  const el = document.getElementById('skyBg');
  let gradient;
  if      (code >= 200 && code < 300) gradient = 'linear-gradient(160deg,#2d2540 0%,#4a3d6b 100%)'; // thunderstorm
  else if (code >= 300 && code < 600) gradient = 'linear-gradient(160deg,#1c3a5e 0%,#3a5c7e 100%)'; // rain/drizzle
  else if (code >= 600 && code < 700) gradient = 'linear-gradient(160deg,#a8c4d8 0%,#dce8f0 100%)'; // snow
  else if (code >= 700 && code < 800) gradient = 'linear-gradient(160deg,#8a7e6e 0%,#b0a898 100%)'; // mist/fog
  else if (code === 800)              gradient = 'linear-gradient(160deg,#e8a020 0%,#4a90d0 100%)'; // clear/sunny
  else                                gradient = 'linear-gradient(160deg,#6a7e8a 0%,#9ab0be 100%)'; // cloudy
  el.style.background = gradient;
}

// ============================================================
// 5. UNIT TOGGLE
// ============================================================
function toggleUnits(unit) {
  state.unit = unit;
  document.getElementById('btnF').classList.toggle('active', unit === 'F');
  document.getElementById('btnC').classList.toggle('active', unit === 'C');
  if (state.weatherData) {
    renderCurrent(state.weatherData);
    renderForecast(state.forecastData);
    // UV and AQI have no temps — no re-render needed
  }
}

// ============================================================
// 6. GEOLOCATION
// ============================================================
function handleLocate() {
  if (!navigator.geolocation) {
    showError('Geolocation is not supported by your browser.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => loadWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
    ()  => showError('Location access denied. Please enter a city manually.')
  );
}

// ============================================================
// 7. CATEGORY LOGIC HELPERS
// ============================================================
function aqiCategory(aqi) {
  const labels = ['', 'Good',    'Fair',    'Moderate', 'Poor',    'Very Poor'];
  const colors = ['', '#2a6a1a', '#8bc34a', '#f0a500',  '#d84315', '#7b1fa2'];
  return { label: labels[aqi], color: colors[aqi], pct: (aqi / 5) * 100 };
}

function uvCategory(uv) {
  const tips = {
    low:      ['No protection needed', 'Safe to be outside'],
    mod:      ['Wear SPF 30+', 'Seek shade at midday'],
    high:     ['SPF 30+ required', 'Cover up', 'Peak hours 10am–4pm'],
    vhigh:    ['SPF 50+', 'Limit midday exposure', 'Hat & sunglasses'],
    extreme:  ['Avoid sun 10am–4pm', 'Full cover', 'SPF 50+ every 2 hrs'],
  };
  if (uv <= 2)  return { label: 'Low',       pips: 1, color: '#4caf50', tips: tips.low     };
  if (uv <= 5)  return { label: 'Moderate',  pips: 2, color: '#8bc34a', tips: tips.mod     };
  if (uv <= 7)  return { label: 'High',      pips: 3, color: '#8a6800', tips: tips.high    };
  if (uv <= 10) return { label: 'Very High', pips: 4, color: '#ff9800', tips: tips.vhigh   };
  return              { label: 'Extreme',   pips: 5, color: '#f44336', tips: tips.extreme };
}

function weatherEmoji(code) {
  if (code >= 200 && code < 300) return '⛈';
  if (code >= 300 && code < 400) return '🌦';
  if (code >= 500 && code < 600) return '🌧';
  if (code >= 600 && code < 700) return '❄️';
  if (code >= 700 && code < 800) return '🌫';
  if (code === 800)               return '☀️';
  if (code === 801)               return '🌤';
  if (code === 802)               return '⛅';
  return '☁️';
}

// Magnus formula: returns dew point as Kelvin
function calcDewPointK(tempK, humidity) {
  const tc    = tempK - 273.15;
  const a     = 17.27, b = 237.7;
  const alpha = (a * tc) / (b + tc) + Math.log(humidity / 100);
  const dpC   = (b * alpha) / (a - alpha);
  return dpC + 273.15;
}

function getWindDir(deg) {
  if (deg == null) return '';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function fmtTime(unix) {
  return new Date(unix * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// 8. UI HELPERS
// ============================================================
function showLoading() {
  const msg = '<div class="loading-msg">Receiving transmission&hellip;</div>';
  document.getElementById('currentContent').innerHTML = msg;
  document.getElementById('aqiContent').innerHTML     = msg;
  document.getElementById('uvContent').innerHTML      = msg;
  document.getElementById('forecastGrid').innerHTML   =
    '<div class="loading-msg" style="grid-column:1/-1">Receiving forecast data&hellip;</div>';
}

function showError(msg) {
  document.getElementById('currentContent').innerHTML =
    `<div class="error-msg">${msg}</div>`;
}

function updateTeletypeFooter() {
  if (!state.city) return;
  const now    = new Date();
  const next   = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const fmt    = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('teletypeFooter').textContent =
    `Teletype transmission · ${state.city} · Report issued ${fmt(now)} · Next bulletin ${fmt(next)}`;
}

function setMastheadDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById('mastheadDate').textContent = formatted;
}

// ============================================================
// 7. EVENT LISTENERS
// ============================================================
document.getElementById('cityInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const city = e.target.value.trim();
    if (city) loadWeather(city);
  }
});

document.getElementById('dispatchBtn').addEventListener('click', () => {
  const city = document.getElementById('cityInput').value.trim();
  if (city) loadWeather(city);
});

document.getElementById('locateBtn').addEventListener('click', handleLocate);

document.getElementById('btnF').addEventListener('click', () => toggleUnits('F'));
document.getElementById('btnC').addEventListener('click', () => toggleUnits('C'));

// ============================================================
// 8. INIT
// ============================================================
setMastheadDate();
loadWeather('Omaha');
