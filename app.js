/* =========================================================
   Songkhla Rainfall Forecasting System — app.js
   ดึงข้อมูล Open-Meteo · คำนวณความเสี่ยง · วาดกราฟ · จัดการ UI
   ========================================================= */

// ---------- ข้อมูลอำเภอ + พิกัด ----------
const DISTRICTS = {
  'เมืองสงขลา':  { lat: 7.1988, lon: 100.5951 },
  'หาดใหญ่':     { lat: 7.0086, lon: 100.4349 },
  'สะเดา':       { lat: 6.7333, lon: 100.3956 },
  'ระโนด':       { lat: 7.0458, lon: 100.5419 },
  'เทพา':       { lat: 6.7256, lon: 100.5500 },
};

// ---------- เกณฑ์ระดับความเสี่ยง (mm ต่อช่วงเวลา) ----------
const RISK = {
  normal:  { label: 'ปกติ',        cls: 'normal',  max: 10 },
  watch:   { label: 'เฝ้าระวัง',    cls: 'watch',   max: 25 },
  warning: { label: 'เตือนภัย',     cls: 'warning', max: Infinity },
};

// ---------- state ปัจจุบัน ----------
const state = {
  district: 'เมืองสงขลา',
  days: 1,      // 1 = รายชั่วโมง(วันนี้), 3, 7
  chart: null,  // instance ของ Chart.js
};

// ---------- แปลง weather_code (WMO) เป็น icon + label ----------
const WMO = {
  0:  { icon: '☀️', label: 'แดดจัด' },
  1:  { icon: '🌤️', label: 'เมฆบาง' },
  2:  { icon: '⛅', label: 'เมฆบางส่วน' },
  3:  { icon: '☁️', label: 'เมฆมาก' },
  45: { icon: '🌫️', label: 'หมอก' },
  48: { icon: '🌫️', label: 'หมอกน้ำแข็ง' },
  51: { icon: '🌦️', label: 'ฝนจาง' },
  53: { icon: '🌦️', label: 'ฝนปานกลาง' },
  55: { icon: '🌧️', label: 'ฝนหนาแน่น' },
  61: { icon: '🌧️', label: 'ฝน' },
  63: { icon: '🌧️', label: 'ฝนปานกลาง' },
  65: { icon: '🌧️', label: 'ฝนหนัก' },
  80: { icon: '🌦️', label: 'ฝนปรอย' },
  81: { icon: '🌧️', label: 'ฝนปรอย' },
  82: { icon: '⛈️', label: 'ฝนโฉบ' },
  95: { icon: '⛈️', label: 'พายุฝน' },
  96: { icon: '⛈️', label: 'พายุฝน+ลูกเห็บ' },
  99: { icon: '⛈️', label: 'พายุฝน+ลูกเห็บ' },
};
const weatherInfo = (code) => WMO[code] || { icon: '🌡️', label: '—' };

// ---------- ดึงข้อมูลจาก Open-Meteo ----------
async function fetchWeather(lat, lon, days) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'precipitation,precipitation_probability,temperature_2m,' +
            'relative_humidity_2m,weather_code,wind_speed_10m',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
    forecast_days: days,
    timezone: 'Asia/Bangkok',
  });
  const url = 'https://api.open-meteo.com/v1/forecast?' + params.toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error('API HTTP ' + res.status);
  return await res.json();
}

// ---------- คำนวณระดับความเสี่ยงจากปริมาณน้ำฝน (mm) ----------
function getRiskLevel(mm) {
  if (mm < 0) mm = 0;
  if (mm > RISK.watch.max)   return RISK.warning;
  if (mm > RISK.normal.max)  return RISK.watch;
  return RISK.normal;
}

// ---------- ฟิลด์ DOM ----------
const $ = (id) => document.getElementById(id);

// ---------- จัดเวลา ISO → "dd/mm HH:MM" ----------
function fmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---------- แสดง banner (error/info) ----------
function showBanner(msg, type = 'error') {
  const b = $('banner');
  b.hidden = !msg;
  b.className = 'banner ' + (type === 'error' ? 'banner--error' : 'banner--info');
  b.textContent = msg || '';
}

// ---------- อัปเดต Summary Cards ----------
function renderSummary(data) {
  const cur = data.current || {};
  $('val-temp').textContent = cur.temperature_2m != null
    ? cur.temperature_2m.toFixed(1) + ' °C' : '--';
  $('foot-temp').textContent = 'ปัจจุบัน ' + weatherInfo(cur.weather_code).label;

  const rain = data.hourly.precipitation || [];
  const total = rain.reduce((s, v) => s + (v || 0), 0);
  $('val-rain').textContent = total.toFixed(1) + ' mm';
  $('foot-rain').textContent =
    state.days === 1 ? 'รวมวันนี้' : `รวม ${state.days} วัน`;

  const prob = (data.hourly.precipitation_probability || [])
    .filter((v) => v != null);
  const avg = prob.length
    ? (prob.reduce((s, v) => s + v, 0) / prob.length) : 0;
  $('val-prob').textContent = Math.round(avg) + ' %';

  // สถานะเตือนภัย = ระดับจากปริมาณฝนสูงสุดต่อช่วงเวลา
  const perPeriod = perPeriodMax(rain, data.hourly.time || [], state.days);
  const risk = getRiskLevel(perPeriod);
  const el = $('val-status');
  el.textContent = risk.label;
  el.className = 'card__value level-' + risk.cls;
  $('foot-status').textContent =
    `สูงสุด ${perPeriod.toFixed(1)} mm/ช่วง`;
}

// คำนวณค่าฝนสูงสุด "ต่อช่วงเวลา" (รายชั่วโมง หรือรายวัน)
function perPeriodMax(rain, times, days) {
  let max = 0;
  if (days === 1) {
    // รายชั่วโมง: ค่าสูงสุดชั่วโมงเดียว
    max = rain.reduce((m, v) => Math.max(m, v || 0), 0);
  } else {
    // รายวัน: group โดยวันที่, หาวันที่มีฝนสะสมสูงสุด
    const byDay = {};
    times.forEach((t, i) => {
      const day = String(t).slice(0, 10);
      byDay[day] = (byDay[day] || 0) + (rain[i] || 0);
    });
    max = Object.values(byDay).reduce((m, v) => Math.max(m, v), 0);
  }
  return max;
}

// ---------- วาดกราฟ Rainfall Trend ----------
function renderChart(data) {
  const times = data.hourly.time || [];
  const rain = data.hourly.precipitation || [];
  const labels = times.map(fmtTime);
  const values = rain.map((v) => (v == null ? 0 : v));
  const colors = rain.map((v) => riskColor(v || 0));

  // destroy chart เดิมก่อนวาดใหม่ (กันกราฟซ้อน)
  if (state.chart) { state.chart.destroy(); state.chart = null; }

  const ctx = $('rain-chart').getContext('2d');
  state.chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'ปริมาณน้ำฝน (mm)',
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => c.parsed.y.toFixed(1) + ' mm',
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#9db3c8', autoSkip: true, maxRotation: 45 },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#9db3c8' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          title: { display: true, text: 'mm', color: '#9db3c8' },
        },
      },
    },
  });
}

// สีแท่งตามระดับความเสี่ยง (rgba เพื่อความโปร่ง)
function riskColor(mm) {
  const risk = getRiskLevel(mm);
  const map = {
    normal:  'rgba(52, 211, 153, 0.85)',
    watch:   'rgba(251, 191, 36, 0.9)',
    warning: 'rgba(248, 113, 113, 0.95)',
  };
  return map[risk.cls];
}

// ---------- สร้างตารางข้อมูล ----------
function renderTable(data) {
  const times = data.hourly.time || [];
  const rain = data.hourly.precipitation || [];
  const prob = data.hourly.precipitation_probability || [];
  const temp = data.hourly.temperature_2m || [];
  const code = data.hourly.weather_code || [];
  const body = $('table-body');
  body.innerHTML = '';

  times.forEach((t, i) => {
    const r = rain[i] == null ? 0 : rain[i];
    const risk = getRiskLevel(r);
    const w = weatherInfo(code[i]);
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${fmtTime(t)}</td>` +
      `<td>${w.icon} ${w.label}</td>` +
      `<td>${temp[i] != null ? temp[i].toFixed(1) : '--'}</td>` +
      `<td>${r.toFixed(1)}</td>` +
      `<td>${prob[i] != null ? prob[i] : '--'}</td>` +
      `<td><span class="badge ${risk.cls}">${risk.label}</span></td>`;
    body.appendChild(tr);
  });
}

// ---------- Orchestrate: fetch + render ทุกส่วน ----------
async function loadData() {
  const d = DISTRICTS[state.district] || DISTRICTS['เมืองสงขลา'];
  const now = new Date();
  showBanner('กำลังโหลดข้อมูล…', 'info');

  try {
    const data = await fetchWeather(d.lat, d.lon, state.days);
    renderSummary(data);
    renderChart(data);
    renderTable(data);
    $('updated-time').textContent =
      'อัปเดต: ' + now.toLocaleString('th-TH');
    showBanner('');
  } catch (err) {
    console.error(err);
    showBanner('ไม่สามารถโหลดข้อมูลได้ — กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่', 'error');
    // กราฟ/ตารางแสดงสถานะว่าง
    $('table-body').innerHTML =
      '<tr><td colspan="6" class="loading">โหลดไม่สำเร็จ</td></tr>';
    if (state.chart) { state.chart.destroy(); state.chart = null; }
  }
}

// ---------- สร้าง options ใน dropdown อำเภอ ----------
function initDistricts() {
  const sel = $('district-select');
  sel.innerHTML = '';
  Object.keys(DISTRICTS).forEach((name) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === state.district) opt.selected = true;
    sel.appendChild(opt);
  });
}

// ---------- bind event + init ----------
function init() {
  initDistricts();

  $('district-select').addEventListener('change', (e) => {
    state.district = e.target.value;
    loadData();
  });
  $('range-select').addEventListener('change', (e) => {
    state.days = parseInt(e.target.value, 10);
    loadData();
  });

  loadData();
}

// เริ่มเมื่อ DOM พร้อม
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
