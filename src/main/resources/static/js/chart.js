// chart.js

// ─── Color Palette ───────────────────────────────────────────────
const COLORS = {
  honeyYellow: '#FFB300',
  amberBrown:  '#8D6E63',
  forestGreen: '#4CAF50',
  skyBlue:     '#03A9F4',
  charcoal:    '#333333',
  bgLight:     '#F5F5F5'
};
// ───────────────────────────────────────────────────────────────────

// ─── KPI Chart Instances ──────────────────────────────────────────
const kpiCharts = {}; // will hold Chart instances by canvas ID

/**
 * Render or update a KPI doughnut into canvas#ctxId,
 * with center text in #textId.
 */
function renderKpi(ctxId, textId, value, maxValue, color) {
  if (kpiCharts[ctxId]) {
    kpiCharts[ctxId].destroy();
  }
  const ctx = document.getElementById(ctxId).getContext('2d');
  kpiCharts[ctxId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value, maxValue - value],
        backgroundColor: [color, '#E5E5E5'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '75%',
      plugins: {
        legend:  { display: false },
        tooltip: { enabled: false }
      }
    }
  });

  let display;
  if (ctxId === 'broodRatioChart') {
    display = (value * 100).toFixed(0) + '%';
  } else if (ctxId === 'qrPercentChart') {
    display = value + '%';
  } else {
    display = value;
  }
  document.getElementById(textId).textContent = display;
}

// ─── Shared Chart Instances ───────────────────────────────────────
let tempHumChart, precipChart, honeyChart, broodChart, queenChart, stackedChart;

// ─── DOM References ───────────────────────────────────────────────
const startInput = document.querySelector('.date-input.start');
const endInput   = document.querySelector('.date-input.end');
const hiveSelect = document.querySelector('.apiary-select');
const confirmBtn = document.querySelector('.confirm-btn');

// ─── Simple JSON fetcher ──────────────────────────────────────────
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Populate the hive <select> once ──────────────────────────────
async function initHiveSelect() {
  const raw = await fetchJson('/api/urban/inspections/2021');
  const unique = Array.from(new Set(raw.map(d => d.tagNumber)));
  hiveSelect.innerHTML = '';
  unique.forEach(id => {
    const opt = document.createElement('option');
    opt.value       = id;
    opt.textContent = id;
    hiveSelect.appendChild(opt);
  });
}

// ─── Helpers to build ISO timestamps ──────────────────────────────
function startISO() { return `${startInput.value}T00:00:00`; }
function endISO()   { return `${endInput.value}T23:59:59`; }

// ─── Environmental Data ──────────────────────────────────────────
async function loadEnvironmental() {
  tempHumChart?.destroy();
  precipChart?.destroy();

  const raw = await fetchJson('/api/urban/environmental');
  const s   = new Date(startISO()), e = new Date(endISO());

  const filtered = raw.filter(d => {
    const ts = new Date(d.dateTime);
    return ts >= s && ts <= e;
  });

  const labels = filtered.map(d => d.dateTime);
  const temps  = filtered.map(d => d.temperature);
  const hums   = filtered.map(d => d.humidity);
  const precs  = filtered.map(d => d.precipitation);

  // Temperature & Humidity
  {
    const ctx = document.getElementById('tempHumidityChart').getContext('2d');
    tempHumChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { data: temps, borderColor: COLORS.honeyYellow,  fill: false },
          { data: hums,  borderColor: COLORS.forestGreen, fill: false }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: {}, y: {} }
      }
    });
  }

  // Precipitation
  {
    const ctx = document.getElementById('precipitationChart').getContext('2d');
    precipChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { data: precs, backgroundColor: COLORS.skyBlue }
        ]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

// ─── Production & Population ─────────────────────────────────────
async function loadProduction() {
  honeyChart?.destroy();
  broodChart?.destroy();

  const raw = await fetchJson('/api/urban/inspections/2021');
  const s   = new Date(startISO()), e = new Date(endISO());
  const selected = Array.from(hiveSelect.selectedOptions).map(o => o.value);

  const filtered = raw.filter(r => {
    const dt = new Date(`${r.date}T00:00:00`);
    return dt >= s && dt <= e && selected.includes(r.tagNumber);
  });

  // aggregate per hive
  const byHive = {};
  filtered.forEach(r => {
    if (!byHive[r.tagNumber]) {
      byHive[r.tagNumber] = { honey: 0, brood: 0 };
    }
    byHive[r.tagNumber].honey += r.framesOfHoney;
    byHive[r.tagNumber].brood += r.foBrood;
  });

  const labels    = Object.keys(byHive);
  const honeyData = labels.map(h => byHive[h].honey);
  const broodData = labels.map(h => byHive[h].brood);

  // Honey Frames chart
  {
    const ctx = document.getElementById('honeyFramesChart').getContext('2d');
    honeyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: honeyData, backgroundColor: COLORS.honeyYellow }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Frames' } } }
      }
    });
  }

  // Brood Frames chart
  {
    const ctx = document.getElementById('broodFramesChart').getContext('2d');
    broodChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: broodData, backgroundColor: COLORS.amberBrown }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Frames' } } }
      }
    });
  }
}

// ─── Queen Status Distribution ───────────────────────────────────
async function loadQueen() {
  queenChart?.destroy();
    const raw = await fetchJson('/api/urban/inspections/2021');
    const s = new Date(startISO()), e = new Date(endISO());
    const selectedHives = Array.from(hiveSelect.selectedOptions).map(o => o.value);

    const filtered = raw.filter(d => {
      const dt = new Date(`${d.date}T00:00:00`);
      return dt >= s && dt <= e && selectedHives.includes(d.tagNumber);
    });

    const counts = filtered.reduce((acc, d) => {
      acc[d.queenStatus] = (acc[d.queenStatus] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(counts);
    const vals   = labels.map(l => counts[l]);

    const ctx = document.getElementById('queenStatusChart').getContext('2d');
    queenChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: vals,
          backgroundColor: [
            COLORS.forestGreen,
            COLORS.honeyYellow,
            COLORS.amberBrown
          ]
        }]
      },
      options: { plugins: { legend: { display: true } } }
    });
  }

// ─── Brood vs Adult Stacked ──────────────────────────────────────
async function loadStacked() {
  stackedChart?.destroy();

  const raw = await fetchJson('/api/urban/inspections/2021');
  const s   = new Date(startISO()), e = new Date(endISO());

  const byDate = {};
  raw.forEach(d => {
    const dt = new Date(`${d.date}T00:00:00`);
    if (dt < s || dt > e) return;
    byDate[d.date] ??= { brood: 0, adult: 0 };
    byDate[d.date].brood += d.foBrood;
    byDate[d.date].adult += d.fob1st + d.fob2nd + d.fob3rd;
  });

  const dates = Object.keys(byDate).sort();
  const brood = dates.map(d => byDate[d].brood);
  const adult = dates.map(d => byDate[d].adult);

  const ctx = document.getElementById('stackedFramesChart').getContext('2d');
  stackedChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [
        { label: 'Brood', data: brood, backgroundColor: COLORS.skyBlue },
        { label: 'Adult', data: adult, backgroundColor: COLORS.charcoal }
      ]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
    }
  });
}

// ─── KPIs Calculation & Rendering ────────────────────────────────
async function updateKPIs() {
  const raw = await fetchJson('/api/urban/inspections/2021');
  const s   = new Date(startISO()), e = new Date(endISO());
  const selected = Array.from(hiveSelect.selectedOptions).map(o => o.value);

  const filt = raw.filter(d => {
    const dt = new Date(`${d.date}T00:00:00`);
    return dt >= s && dt <= e && selected.includes(d.tagNumber);
  });
  if (!filt.length) return;

  const totalFrames  = filt.reduce((sum,r) => sum + r.framesOfHoney, 0);
  const honeyKg      = parseFloat((totalFrames * 1.5).toFixed(1));
  const avgColony    = parseFloat((filt.reduce((s,r) => s + r.colonySize, 0) / filt.length).toFixed(1));
  const ratios       = filt.map(r => {
    const adult = r.fob1st + r.fob2nd + r.fob3rd;
    return adult > 0 ? r.foBrood / adult : 0;
  });
  const avgRatio     = ratios.reduce((a,b) => a + b, 0) / ratios.length;
  const qrPercent    = Math.round(filt.filter(r => r.queenStatus === 'QR').length / filt.length * 100);

  renderKpi('colonySizeChart', 'colonySizeText', avgColony,  100, COLORS.forestGreen);
  renderKpi('honeyYieldChart', 'honeyYieldText', honeyKg,    200, COLORS.honeyYellow);
  renderKpi('broodRatioChart', 'broodRatioText', avgRatio,   1,   COLORS.skyBlue);
  renderKpi('qrPercentChart',  'qrPercentText',  qrPercent, 100, COLORS.amberBrown);
}

// ─── Reload everything ───────────────────────────────────────────
async function reloadAll() {
  await Promise.all([
    loadEnvironmental(),
    loadProduction(),
    loadQueen(),
    loadStacked()
  ]);
  await updateKPIs();
}

// ─── Wire up Confirm + Initial Load ─────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initHiveSelect();
  Array.from(hiveSelect.options).forEach(o => o.selected = true);
  reloadAll();
});

confirmBtn.addEventListener('click', reloadAll);