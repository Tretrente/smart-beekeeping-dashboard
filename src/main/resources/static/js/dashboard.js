// Description: Fetches 2021 UrBAN data and renders interactive charts and KPI cards.

/* ------------------------
   Global chart variables
------------------------ */
let tempHumChart = null;
let precipChart = null;
let framesChart = null;
let colonyChart = null;
let queenStatusChart = null;
let broodAdultChart = null;
let honeyYieldChart = null;
let healthIndexChart = null;

/* ------------------------
   DOM element references
------------------------ */
const loadDataBtn     = document.getElementById('loadDataBtn');
const startDateInput  = document.getElementById('startDate');
const endDateInput    = document.getElementById('endDate');
const hiveSelect      = document.getElementById('hiveSelect');

/**
 * Convert a YYYY-MM-DD string to an ISO timestamp at midnight.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {string} ISO timestamp string "YYYY-MM-DDT00:00:00.000Z"
 */
function toMidnightISO(dateStr) {
    const dt = new Date(dateStr + 'T00:00:00');
    return dt.toISOString();
}

/* ------------------------
   Data fetching functions
------------------------ */

/**
 * Fetch simulated environmental data between two timestamps.
 * @returns {Promise<Array>} Array of EnvironmentalData objects.
 */
async function fetchWeatherData() {
    const url = `/api/environmental?start=${encodeURIComponent(toMidnightISO(startDateInput.value))}` +
        `&end=${encodeURIComponent(toMidnightISO(endDateInput.value))}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load environmental data');
    return response.json();
}

/**
 * Fetch simulated production data between two timestamps for selected hives.
 * @returns {Promise<Array>} Array of ProductionData objects.
 */
async function fetchSensorData() {
    const hiveIds = Array.from(hiveSelect.selectedOptions).map(opt => opt.value).join(',');
    const url = `/api/production?start=${encodeURIComponent(toMidnightISO(startDateInput.value))}` +
        `&end=${encodeURIComponent(toMidnightISO(endDateInput.value))}` +
        `&hives=${encodeURIComponent(hiveIds)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to load production data');
    return response.json();
}

/**
 * Fetch real inspection data for 2021 from UrBAN dataset.
 * @returns {Promise<Array>} Array of Inspection2021Record objects.
 */
async function fetchInspectionData() {
    const response = await fetch('/api/urban/inspections/2021');
    if (!response.ok) throw new Error('Failed to load inspection data');
    return response.json();
}

/**
 * Fetch real weather data for 2021 from UrBAN dataset.
 * @returns {Promise<Array>} Array of WeatherRecord objects.
 */
async function fetchUrbanWeather() {
    const response = await fetch('/api/urban/environmental');
    if (!response.ok) throw new Error('Failed to load urban weather data');
    return response.json();
}

/* ------------------------
   KPI panel functions
------------------------ */

/**
 * Populate KPI cards: total honey yield, average colony size,
 * average brood-to-adult ratio, and percentage of queen-right hives.
 * @param {Array} inspections - Array of inspection records.
 */
function populateKPIs(inspections) {
    // 1) Total Honey Yield (kg): assume 1 frame ≈ 1.5 kg
    const totalFrames = inspections.reduce((sum, r) => sum + r.framesOfHoney, 0);
    const honeyKg = (totalFrames * 1.5).toFixed(1);
    document.getElementById('kpi-honey-yield').textContent = honeyKg;

    // 2) Average Colony Size
    const avgColSize = (inspections.reduce((sum, r) => sum + r.colonySize, 0) / inspections.length).toFixed(1);
    document.getElementById('kpi-avg-colony-size').textContent = avgColSize;

    // 3) Average Brood-to-Adult Ratio (percentage)
    const ratios = inspections.map(r => {
        const adult = r.fob1st + r.fob2nd + r.fob3rd;
        return adult > 0 ? r.foBrood / adult : 0;
    });
    const avgRatioPct = Math.round((ratios.reduce((s, x) => s + x, 0) / ratios.length) * 100) + '%';
    document.getElementById('kpi-avg-brood-ratio').textContent = avgRatioPct;

    // 4) Queen-Right percentage
    const qrCount = inspections.filter(r => r.queenStatus === 'QR').length;
    const qrPercent = Math.round((qrCount / inspections.length) * 100) + '%';
    document.getElementById('kpi-qr-percent').textContent = qrPercent;
}

/* ------------------------
   Chart rendering functions
------------------------ */

/**
 * Render temperature and humidity as a dual-axis line chart.
 * @param {Array} weatherData - Array of WeatherRecord.
 */
function renderTempHumChart(weatherData) {
    weatherData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    const labels = weatherData.map(r => new Date(r.dateTime).toLocaleString());
    const temps  = weatherData.map(r => r.temperature);
    const hums   = weatherData.map(r => r.humidity);

    const ctx = document.getElementById('tempHumChart').getContext('2d');
    if (tempHumChart) tempHumChart.destroy();
    tempHumChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: 'rgba(255,99,132,1)',
                    yAxisID: 'yTemp',
                    tension: 0.2
                },
                {
                    label: 'Humidity (%)',
                    data: hums,
                    borderColor: 'rgba(54,162,235,1)',
                    yAxisID: 'yHum',
                    tension: 0.2
                }
            ]},
        options: {
            responsive: true,
            scales: {
                yTemp: { type: 'linear', position: 'left', title: { display: true, text: '°C' } },
                yHum:  { type: 'linear', position: 'right', title: { display: true, text: '%' },
                    grid: { drawOnChartArea: false } }
            }
        }
    });
}

/**
 * Render precipitation as a bar chart.
 * @param {Array} weatherData - Array of WeatherRecord.
 */
function renderPrecipChart(weatherData) {
    const labels = weatherData.map(r => new Date(r.dateTime).toLocaleDateString());
    const data   = weatherData.map(r => r.precipitation);

    const ctx = document.getElementById('precipChart').getContext('2d');
    if (precipChart) precipChart.destroy();
    precipChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Precipitation (mm)',
                data,
                backgroundColor: 'rgba(75,192,192,0.5)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'mm' } }
            }
        }
    });
}

/**
 * Render frames of honey per hive as a grouped bar chart.
 * @param {Array} inspections - Array of Inspection2021Record.
 * @param {Array} selectedHives - Array of hive IDs to include.
 */
function renderFramesChart(inspections, selectedHives) {
    // Aggregate frames by date and hive
    const dateMap = {};
    inspections.forEach(r => {
        if (!dateMap[r.date]) dateMap[r.date] = {};
        if (selectedHives.includes(r.tagNumber)) {
            dateMap[r.date][r.tagNumber] = r.framesOfHoney;
        }
    });
    const dates = Object.keys(dateMap).sort((a,b) => new Date(a) - new Date(b));
    const datasets = selectedHives.map((hiveId, idx) => ({
        label: hiveId,
        data: dates.map(d => dateMap[d][hiveId] || 0),
        backgroundColor: `hsl(${idx*40 % 360}, 70%, 50%)`
    }));

    const ctx = document.getElementById('framesChart').getContext('2d');
    if (framesChart) framesChart.destroy();
    framesChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: {
            responsive: true,
            scales: { x: { stacked: false }, y: { title: { text: 'Frames of Honey' } } }
        }
    });
}

/**
 * Render colony size (brood frames) per hive as a line chart.
 * @param {Array} inspections - Array of Inspection2021Record.
 * @param {Array} selectedHives - Array of hive IDs to include.
 */
function renderColonyChart(inspections, selectedHives) {
    // Aggregate brood frames by date and hive
    const dateMap = {};
    inspections.forEach(r => {
        if (!dateMap[r.date]) dateMap[r.date] = {};
        if (selectedHives.includes(r.tagNumber)) {
            dateMap[r.date][r.tagNumber] = r.foBrood;
        }
    });
    const dates = Object.keys(dateMap).sort((a,b) => new Date(a) - new Date(b));
    const datasets = selectedHives.map((hiveId, idx) => ({
        label: hiveId,
        data: dates.map(d => dateMap[d][hiveId] || 0),
        borderColor: `hsl(${(idx*40+180) % 360}, 70%, 40%)`,
        fill: false, tension: 0.2
    }));

    const ctx = document.getElementById('colonyChart').getContext('2d');
    if (colonyChart) colonyChart.destroy();
    colonyChart = new Chart(ctx, {
        type: 'line',
        data: { labels: dates, datasets },
        options: {
            responsive: true,
            scales: { y: { title: { text: 'Brood Frames' } } }
        }
    });
}

/**
 * Render queen status distribution as a pie chart.
 * @param {Array} inspections - Array of Inspection2021Record.
 */
function renderQueenStatusChart(inspections) {
    const counts = {};
    inspections.forEach(r => {
        const status = r.queenStatus || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
    });
    const labels = Object.keys(counts);
    const data   = labels.map(l => counts[l]);

    const ctx = document.getElementById('queenStatusChart').getContext('2d');
    if (queenStatusChart) queenStatusChart.destroy();
    queenStatusChart = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: labels.map((_,i)=>`hsl(${i*60},70%,50%)`) }] },
    });
}

/**
 * Render brood vs adult frames as a stacked bar chart.
 * @param {Array} inspections - Array of Inspection2021Record.
 * @param {Array} selectedHives - Array of hive IDs to include.
 */
function renderBroodAdultChart(inspections, selectedHives) {
    const dateMap = {};
    inspections.forEach(r => {
        if (!dateMap[r.date]) dateMap[r.date] = {};
        if (selectedHives.includes(r.tagNumber)) {
            const adult = r.fob1st + r.fob2nd + r.fob3rd;
            dateMap[r.date][r.tagNumber] = { adult, brood: r.foBrood };
        }
    });
    const dates = Object.keys(dateMap).sort((a,b)=>new Date(a)-new Date(b));
    const datasets = [];
    selectedHives.forEach((hiveId, idx) => {
        datasets.push({
            label: `${hiveId} - Adult`,
            data: dates.map(d=> dateMap[d][hiveId]?.adult||0),
            backgroundColor:`rgba(${idx*40},${idx*80},${idx*120},0.6)`, stack:'frames'
        });
        datasets.push({
            label: `${hiveId} - Brood`,
            data: dates.map(d=> dateMap[d][hiveId]?.brood||0),
            backgroundColor:`rgba(${idx*40},${idx*80},${idx*120},0.3)`, stack:'frames'
        });
    });

    const ctx = document.getElementById('broodAdultChart').getContext('2d');
    if (broodAdultChart) broodAdultChart.destroy();
    broodAdultChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: dates, datasets },
        options: { responsive:true, scales:{ x:{stacked:true}, y:{stacked:true} } }
    });
}

/**
 * Populate the raw inspection data table.
 * @param {Array} inspections - Array of Inspection2021Record.
 * @param {Array} selectedHives - Array of hive IDs to include.
 */
function populateInspectionTable(inspections, selectedHives) {
    const tbody = document.querySelector('#inspectionTable tbody');
    tbody.innerHTML = '';
    inspections
        .filter(r => selectedHives.includes(r.tagNumber))
        .sort((a,b)=> new Date(a.date) - new Date(b.date))
        .forEach(r => {
            const adultFrames = r.fob1st + r.fob2nd + r.fob3rd;
            const row = document.createElement('tr');
            row.innerHTML = `
          <td>${r.date}</td>
          <td>${r.tagNumber}</td>
          <td>${r.colonySize}</td>
          <td>${r.framesOfHoney}</td>
          <td>${r.foBrood}</td>
          <td>${adultFrames}</td>
          <td>${r.queenStatus}</td>
        `;
            tbody.appendChild(row);
        });
}

/* ------------------------
   KPI and overview charts
------------------------ */

/**
 * Render monthly honey yield as a bar chart.
 * @param {Array} inspections - Array of Inspection2021Record.
 */
function renderHoneyYieldChart(inspections) {
    const byMonth = {};
    inspections.forEach(r => {
        const month = r.date.slice(0,7);
        byMonth[month] = (byMonth[month] || 0) + r.framesOfHoney;
    });
    const labels = Object.keys(byMonth).sort();
    const dataKg = labels.map(m => (byMonth[m] * 1.5).toFixed(1));

    const ctx = document.getElementById('honeyYieldChart').getContext('2d');
    if (honeyYieldChart) honeyYieldChart.destroy();
    honeyYieldChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets:[{
                label:'Honey Yield (kg)', data: dataKg,
                backgroundColor:'rgba(255,206,86,0.6)'
            }]},
        options:{ scales:{ y:{ beginAtZero:true, title:{ text:'kg' } }, x:{ title:{ text:'Month' } } } }
    });
}

/**
 * Render health index per hive as a percentage bar chart.
 * HealthIndex = average of normalized colony size, brood ratio, and queen-right flag.
 * @param {Array} inspections - Array of Inspection2021Record.
 */
function renderHealthIndexChart(inspections) {
    const hiveData = {};
    inspections.forEach(r => {
        const hive = r.tagNumber;
        if (!hiveData[hive]) hiveData[hive] = { sizes:[], ratios:[], qrFlags:[] };
        hiveData[hive].sizes.push(r.colonySize);
        const adult = r.fob1st + r.fob2nd + r.fob3rd;
        hiveData[hive].ratios.push(adult>0 ? r.foBrood/adult : 0);
        hiveData[hive].qrFlags.push(r.queenStatus==='QR' ? 1 : 0);
    });

    const labels = Object.keys(hiveData);
    const avgSizes  = labels.map(h=> hiveData[h].sizes.reduce((a,b)=>a+b,0)/hiveData[h].sizes.length);
    const avgRatios = labels.map(h=> hiveData[h].ratios.reduce((a,b)=>a+b,0)/hiveData[h].ratios.length);
    const avgFlags  = labels.map(h=> hiveData[h].qrFlags.reduce((a,b)=>a+b,0)/hiveData[h].qrFlags.length);

    const minSize = Math.min(...avgSizes), maxSize = Math.max(...avgSizes);
    const healthValues = labels.map((_,i) => {
        const normSize = (avgSizes[i]-minSize)/(maxSize-minSize||1);
        const normRatio = avgRatios[i];
        const qrFlag    = avgFlags[i];
        return Math.round(((normSize+normRatio+qrFlag)/3)*100);
    });

    const ctx = document.getElementById('healthIndexChart').getContext('2d');
    if (healthIndexChart) healthIndexChart.destroy();
    healthIndexChart = new Chart(ctx, {
        type: 'bar',
        data:{ labels, datasets:[{
                label:'Health Index (%)', data: healthValues,
                backgroundColor:'rgba(75,192,192,0.6)'
            }]},
        options:{ scales:{ y:{ beginAtZero:true, max:100, title:{ text:'%' } }, x:{ title:{ text:'Hive ID' } } } }
    });
}

/* ------------------------
   Main event listener
------------------------ */
loadDataBtn.addEventListener('click', async () => {
    try {
        if (!startDateInput.value || !endDateInput.value) {
            alert('Please select both start and end dates.');
            return;
        }
        const selectedHives = Array.from(hiveSelect.selectedOptions).map(opt => opt.value);
        if (selectedHives.length === 0) {
            alert('Please select at least one hive.');
            return;
        }

        // Fetch all data concurrently
        const [urbanWeather, inspectionData] = await Promise.all([
            fetchUrbanWeather(),
            fetchInspectionData()
        ]);

        // Filter by date range
        const startIso = toMidnightISO(startDateInput.value);
        const endIso   = toMidnightISO(endDateInput.value);
        const filteredWeather = urbanWeather.filter(w => {
            const dt = new Date(w.dateTime);
            return dt >= new Date(startIso) && dt <= new Date(endIso);
        });

        let filteredInspections = inspectionData.filter(r => {
            const dt = new Date(r.date + 'T00:00:00');
            return dt >= new Date(startIso) && dt <= new Date(endIso);
        });

        filteredInspections = filteredInspections.filter(r =>
            selectedHives.includes(r.tagNumber)
        );

        populateKPIs(filteredInspections);


        // Populate KPIs and overview charts
        populateKPIs(filteredInspections);
        renderHoneyYieldChart(filteredInspections);
        renderHealthIndexChart(filteredInspections);

        // Render existing charts
        renderTempHumChart(filteredWeather);
        renderPrecipChart(filteredWeather);
        renderFramesChart(filteredInspections, selectedHives);
        renderColonyChart(filteredInspections, selectedHives);
        renderQueenStatusChart(filteredInspections);
        renderBroodAdultChart(filteredInspections, selectedHives);
        populateInspectionTable(filteredInspections, selectedHives);

    } catch(error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Check console for details.');
    }
});
