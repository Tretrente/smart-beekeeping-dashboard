function renderKpi(ctxId, textId, value, maxValue, color) {
    const ctx = document.getElementById(ctxId).getContext('2d');
    if (ctx.chart) { ctx.chart.destroy(); }
    ctx.chart = new Chart(ctx, {
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
    switch (ctxId) {
        case 'honeyYieldChart':  display = value; break;
        case 'broodRatioChart':  display = (value * 100).toFixed(0) + '%'; break;
        case 'qrPercentChart':   display = value + '%'; break;
        default:                  display = value;
    }
    document.getElementById(textId).textContent = display;
}

// ────────────────────────────────────────────────────────
// Chart instances
// ────────────────────────────────────────────────────────
let tempHumChart,
    precipChart,
    honeyChart,
    broodChart,
    queenChart,
    stackedChart;

// ────────────────────────────────────────────────────────
// DOM references
// ────────────────────────────────────────────────────────
const startInput = document.querySelector('.date-input.start');
const endInput   = document.querySelector('.date-input.end');
const hiveSelect = document.querySelector('.apiary-select');
const confirmBtn = document.querySelector('.confirm-btn');

// ────────────────────────────────────────────────────────
// Helper: fetch JSON, throw on HTTP errors
// ────────────────────────────────────────────────────────
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

// ────────────────────────────────────────────────────────
// Initialize hive <select> with distinct tagNumbers
// ────────────────────────────────────────────────────────
async function initHiveSelect() {
    const raw    = await fetchJson('/api/urban/inspections/2021');
    const unique = Array.from(new Set(raw.map(d => d.tagNumber)));
    hiveSelect.innerHTML = '';
    unique.forEach(id => {
        const opt = document.createElement('option');
        opt.value        = id;
        opt.textContent  = id;
        hiveSelect.appendChild(opt);
    });
}

// ────────────────────────────────────────────────────────
// Utility: build ISO timestamps from date‐pickers
// ────────────────────────────────────────────────────────
function startISO() { return `${startInput.value}T00:00:00`; }
function endISO()   { return `${endInput.value}T23:59:59`;  }

// ────────────────────────────────────────────────────────
// Load & render environmental data
// ────────────────────────────────────────────────────────
async function loadEnvironmental() {
    tempHumChart?.destroy();
    precipChart?.destroy();

    const raw = await fetchJson('/api/urban/environmental');
    const s = new Date(startISO()), e = new Date(endISO());

    const filtered = raw.filter(d => {
        const ts = new Date(d.dateTime);
        return ts >= s && ts <= e;
    });

    const labels = filtered.map(d => d.dateTime);
    const temps  = filtered.map(d => d.temperature);
    const hums   = filtered.map(d => d.humidity);
    const precs  = filtered.map(d => d.precipitation);

    // Temp & Hum
    {
        const ctx = document.getElementById('tempHumidityChart').getContext('2d');
        tempHumChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [
                    { data: temps, borderColor: '#F5B800', fill: false },
                    { data: hums,  borderColor: '#6CA27A', fill: false }
                ]},
            options:{ plugins:{legend:{display:false}}, scales:{x:{},y:{}} }
        });
    }

    // Precip
    {
        const ctx = document.getElementById('precipitationChart').getContext('2d');
        precipChart = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [
                    { data: precs, backgroundColor: '#A3D5FF' }
                ]},
            options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
        });
    }
}

// ────────────────────────────────────────────────────────
// Load & render production data
// ────────────────────────────────────────────────────────
async function loadProduction() {
    honeyChart?.destroy();
    broodChart?.destroy();

    const selected = Array.from(hiveSelect.selectedOptions).map(o=>o.value).join(',');
    const data     = await fetchJson(
        `/api/production?start=${startISO()}&end=${endISO()}&hives=${selected}`
    );

    const ids   = data.map(d => d.hiveId);
    const honey = data.map(d => d.honeyFrames);
    const brood = data.map(d => d.broodFrames);

    // Honey frames
    {
        const ctx = document.getElementById('honeyFramesChart').getContext('2d');
        honeyChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ids, datasets:[ { data: honey, backgroundColor:'#FFB300'} ] },
            options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
        });
    }

    // Brood frames
    {
        const ctx = document.getElementById('broodFramesChart').getContext('2d');
        broodChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: ids, datasets:[ { data: brood, backgroundColor:'#E08A00'} ] },
            options:{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
        });
    }
}

// ────────────────────────────────────────────────────────
// Load & render queen status
// ────────────────────────────────────────────────────────
async function loadQueen() {
    queenChart?.destroy();

    const raw = await fetchJson('/api/urban/inspections/2021');
    const s = new Date(startISO()), e = new Date(endISO());

    const filtered = raw.filter(d => {
        const dt = new Date(`${d.date}T00:00:00`);
        return dt >= s && dt <= e;
    });

    const counts = filtered.reduce((acc,d) => {
        acc[d.queenStatus] = (acc[d.queenStatus]||0) + 1;
        return acc;
    }, {});

    const labels = ['Active','Replaced','Missing'];
    const vals   = labels.map(l => counts[l]||0);

    const ctx = document.getElementById('queenStatusChart').getContext('2d');
    queenChart = new Chart(ctx, {
        type:'pie',
        data:{ labels, datasets:[{ data:vals, backgroundColor:['#6CA27A','#F5B800','#E08A00'] }]},
        options:{ plugins:{legend:{display:false}} }
    });
}

// ────────────────────────────────────────────────────────
// Load & render stacked brood vs adult
// ────────────────────────────────────────────────────────
async function loadStacked() {
    stackedChart?.destroy();

    const raw = await fetchJson('/api/urban/inspections/2021');
    const s   = new Date(startISO()), e = new Date(endISO());

    const byDate = {};
    raw.forEach(d => {
        const dt = new Date(`${d.date}T00:00:00`);
        if (dt < s || dt > e) return;
        byDate[d.date] ??= { brood:0, adult:0 };
        byDate[d.date].brood += d.foBrood;
        byDate[d.date].adult += d.fob1st + d.fob2nd + d.fob3rd;
    });

    const dates = Object.keys(byDate).sort();
    const brood = dates.map(d=>byDate[d].brood);
    const adult = dates.map(d=>byDate[d].adult);

    const ctx = document.getElementById('stackedFramesChart').getContext('2d');
    stackedChart = new Chart(ctx,{
        type:'bar',
        data:{ labels:dates, datasets:[
                { label:'Brood', data:brood, backgroundColor:'#A3D5FF'},
                { label:'Adult', data:adult, backgroundColor:'#333333'}
            ]},
        options:{ plugins:{legend:{display:false}}, scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}} }
    });
}

// ────────────────────────────────────────────────────────
// Calculate & render KPIs
// ────────────────────────────────────────────────────────
async function updateKPIs() {
    const raw = await fetchJson('/api/urban/inspections/2021');
    const s   = new Date(startISO()), e = new Date(endISO());
    const selected = Array.from(hiveSelect.selectedOptions).map(o=>o.value);

    const filt = raw.filter(d => {
        const dt = new Date(`${d.date}T00:00:00`);
        return dt>=s && dt<=e && selected.includes(d.tagNumber);
    });
    if (!filt.length) return;

    const totalFrames = filt.reduce((sum,r)=>sum+r.framesOfHoney,0);
    const honeyKg     = parseFloat((totalFrames*1.5).toFixed(1));
    const avgCol      = parseFloat((filt.reduce((s,r)=>s+r.colonySize,0)/filt.length).toFixed(1));
    const ratios      = filt.map(r => {
        const a = r.fob1st+r.fob2nd+r.fob3rd;
        return a>0? r.foBrood/a : 0;
    });
    const avgRatio    = ratios.reduce((a,b)=>a+b,0)/ratios.length;
    const qrPercent   = Math.round(filt.filter(r=>r.queenStatus==='QR').length/filt.length*100);

    renderKpi('colonySizeChart', 'colonySizeText', avgCol,    100, '#6CA27A');
    renderKpi('honeyYieldChart', 'honeyYieldText', honeyKg,   200, '#F5B800');
    renderKpi('broodRatioChart', 'broodRatioText', avgRatio,  1,   '#A3D5FF');
    renderKpi('qrPercentChart',  'qrPercentText',  qrPercent, 100, '#E08A00');
}

// ────────────────────────────────────────────────────────
// Refresh all
// ────────────────────────────────────────────────────────
async function reloadAll() {
    await Promise.all([
        loadEnvironmental(),
        loadProduction(),
        loadQueen(),
        loadStacked()
    ]);
    updateKPIs();
}

// ────────────────────────────────────────────────────────
// Wire up Confirm + initial load
// ────────────────────────────────────────────────────────
confirmBtn.addEventListener('click', () => {
    console.log('Confirm clicked —', startInput.value, endInput.value);
    reloadAll();
});

document.addEventListener('DOMContentLoaded', async () => {
    await initHiveSelect();
    Array.from(hiveSelect.options).forEach(o=>o.selected=true);
    reloadAll();
});
