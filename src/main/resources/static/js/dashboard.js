// File: dashboard.js
// Description: Fetch 2021 UrBAN data from backend and render all charts.

// ------------------------
// DOM Elements
// ------------------------
const loadDataBtn = document.getElementById('loadDataBtn');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const hiveSelect = document.getElementById('hiveSelect');

let tempHumChart, precipChart, framesChart, colonyChart, queenStatusChart, broodAdultChart;

/**
 * Parse a YYYY-MM-DD string into LocalDateTime at midnight.
 * @param {string} dateStr
 * @returns {string} ISO string "2021-06-01T00:00:00"
 */
function toMidnightISO(dateStr) {
    // Create a Date object at midnight of that day
    const dt = new Date(dateStr + 'T00:00:00');
    return dt.toISOString();
}

/**
 * Fetch all weather records for 2021.
 * Endpoint returns List<WeatherRecord>.
 * @returns {Promise<Array>}
 */
async function fetchWeatherData() {
    const response = await fetch('/api/urban/environmental'); // assuming this endpoint returns WeatherRecord[]
    if (!response.ok) {
        throw new Error('Failed to load weather data');
    }
    return await response.json();
}

/**
 * Fetch all sensor records for 2021.
 * Endpoint returns List<SensorRecord>.
 * @returns {Promise<Array>}
 */
async function fetchSensorData() {
    const response = await fetch('/api/urban/sensors');
    if (!response.ok) {
        throw new Error('Failed to load sensor data');
    }
    return await response.json();
}

/**
 * Fetch all 2021 inspections for 2021.
 * Endpoint returns List<Inspection2021Record>.
 * @returns {Promise<Array>}
 */
async function fetchInspectionData() {
    const response = await fetch('/api/urban/inspections/2021');
    if (!response.ok) {
        throw new Error('Failed to load inspection data');
    }
    return await response.json();
}

/**
 * Render Temperature & Humidity Over Time (Line Chart).
 * Uses combined weather+sensor or just weather, depending on data ordering.
 * @param {Array} weatherData Array of WeatherRecord { dateTime, temperature, humidity, precipitation }
 */
function renderTempHumChart(weatherData) {
    // Sort by timestamp
    weatherData.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    const labels = weatherData.map(r => new Date(r.dateTime).toLocaleString());
    const temps = weatherData.map(r => r.temperature);
    const hums = weatherData.map(r => r.humidity);

    const ctx = document.getElementById('tempHumChart').getContext('2d');
    if (tempHumChart) {
        tempHumChart.destroy();
    }
    tempHumChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    yAxisID: 'yTemp',
                    tension: 0.2
                },
                {
                    label: 'Humidity (%)',
                    data: hums,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    yAxisID: 'yHum',
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                yTemp: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)' }
                },
                yHum: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Humidity (%)' },
                    grid: { drawOnChartArea: false }
                }
            },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: { enabled: true }
            }
        }
    });
}

/**
 * Render Precipitation Over Time (Bar Chart).
 * @param {Array} weatherData Array of WeatherRecord
 */
function renderPrecipChart(weatherData) {
    const labels = weatherData.map(r => new Date(r.dateTime).toLocaleDateString());
    const precs = weatherData.map(r => r.precipitation);

    const ctx = document.getElementById('precipChart').getContext('2d');
    if (precipChart) {
        precipChart.destroy();
    }
    precipChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Precipitation (mm)',
                data: precs,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Date' } },
                y: { title: { display: true, text: 'Precipitation (mm)' } }
            },
            plugins: {
                tooltip: { enabled: true }
            }
        }
    });
}

/**
 * Render Frames of Honey per Hive (Grouped Bar Chart).
 * @param {Array} inspections Array of Inspection2021Record
 * @param {Array} selectedHives Array of hive IDs (tagNumber) to include
 */
function renderFramesChart(inspections, selectedHives) {
    // Group by date, then by hive:
    const dateMap = {}; // date (string) -> { hive1: frames, hive2: frames, ... }
    inspections.forEach(r => {
        const dateKey = r.date; // "2021-06-15"
        if (!dateMap[dateKey]) {
            dateMap[dateKey] = {};
        }
        if (selectedHives.includes(r.tagNumber)) {
            dateMap[dateKey][r.tagNumber] = r.framesOfHoney;
        }
    });

    const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
    const datasets = [];

    selectedHives.forEach((hiveId, idx) => {
        const dataPoints = dates.map(dateKey => dateMap[dateKey][hiveId] || 0);
        datasets.push({
            label: hiveId,
            data: dataPoints,
            backgroundColor: `hsl(${(idx * 40) % 360}, 70%, 50%)`
        });
    });

    const ctx = document.getElementById('framesChart').getContext('2d');
    if (framesChart) {
        framesChart.destroy();
    }
    framesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true, title: { display: true, text: 'Inspection Date' } },
                y: { stacked: false, title: { display: true, text: 'Frames of Honey' } }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

/**
 * Render Colony Size (Brood Frames) per Hive (Line Chart).
 * @param {Array} inspections Array of Inspection2021Record
 * @param {Array} selectedHives Array of hive IDs to include
 */
function renderColonyChart(inspections, selectedHives) {
    // Group by date, then by hive:
    const dateMap = {}; // date -> { hive1: colonySize, hive2: colonySize, ... }
    inspections.forEach(r => {
        const dateKey = r.date; // "2021-06-15"
        if (!dateMap[dateKey]) {
            dateMap[dateKey] = {};
        }
        if (selectedHives.includes(r.tagNumber)) {
            dateMap[dateKey][r.tagNumber] = r.colonySize;
        }
    });

    const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
    const datasets = [];

    selectedHives.forEach((hiveId, idx) => {
        const dataPoints = dates.map(dateKey => dateMap[dateKey][hiveId] || 0);
        datasets.push({
            label: hiveId,
            data: dataPoints,
            borderColor: `hsl(${(idx * 40 + 180) % 360}, 70%, 40%)`,
            fill: false,
            tension: 0.2
        });
    });

    const ctx = document.getElementById('colonyChart').getContext('2d');
    if (colonyChart) {
        colonyChart.destroy();
    }
    colonyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Inspection Date' } },
                y: { title: { display: true, text: 'Colony Size (Brood Frames)' } }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

/**
 * Render Queen Status Distribution (Pie Chart).
 * @param {Array} inspections Array of Inspection2021Record
 */
function renderQueenStatusChart(inspections) {
    // Count statuses
    const counts = {};
    inspections.forEach(r => {
        const status = r.queenStatus || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const dataPoints = labels.map(l => counts[l]);
    const bgColors = labels.map((_, idx) => `hsl(${(idx * 60) % 360}, 70%, 50%)`);

    const ctx = document.getElementById('queenStatusChart').getContext('2d');
    if (queenStatusChart) {
        queenStatusChart.destroy();
    }
    queenStatusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dataPoints,
                backgroundColor: bgColors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: { enabled: true }
            }
        }
    });
}

/**
 * Render Brood vs. Adult Frames (Stacked Bar Chart).
 * - Adult Frames = Fob1st + Fob2nd + Fob3rd
 * - Brood Frames = FoBrood
 * @param {Array} inspections Array of Inspection2021Record
 * @param {Array} selectedHives Array of hive IDs to include
 */
function renderBroodAdultChart(inspections, selectedHives) {
    // Group by date, then per hive compute adult vs brood
    const dateMap = {}; // date -> { hive1: {brood, adult}, hive2: {...}, ... }
    inspections.forEach(r => {
        const dateKey = r.date; // "2021-06-15"
        if (!dateMap[dateKey]) {
            dateMap[dateKey] = {};
        }
        if (selectedHives.includes(r.tagNumber)) {
            const adultFrames = r.fob1st + r.fob2nd + r.fob3rd;
            const broodFrames = r.foBrood;
            dateMap[dateKey][r.tagNumber] = { adult: adultFrames, brood: broodFrames };
        }
    });

    const dates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
    // We will make one dataset for “Adult Frames” (stack: 'frames') and one for “Brood Frames” (stack: 'frames'),
    // but Chart.js requires separate dataset entries per hive per “stack type”. Instead, we’ll create two dataset groups per hive:
    //   - Hive1 Adult (stacked), Hive1 Brood (stacked)
    //   - Hive2 Adult, Hive2 Brood, etc.

    const datasets = [];
    selectedHives.forEach((hiveId, idx) => {
        const adultData = dates.map(dateKey => {
            const entry = dateMap[dateKey][hiveId];
            return entry ? entry.adult : 0;
        });
        const broodData = dates.map(dateKey => {
            const entry = dateMap[dateKey][hiveId];
            return entry ? entry.brood : 0;
        });
        // Adult frames dataset
        datasets.push({
            label: `${hiveId} - Adult`,
            data: adultData,
            backgroundColor: `rgba(${(idx * 40) % 255}, ${(idx * 80) % 255}, ${(idx * 120) % 255}, 0.6)`,
            stack: 'frames'
        });
        // Brood frames dataset (slightly lighter)
        datasets.push({
            label: `${hiveId} - Brood`,
            data: broodData,
            backgroundColor: `rgba(${(idx * 40) % 255}, ${(idx * 80) % 255}, ${(idx * 120) % 255}, 0.3)`,
            stack: 'frames'
        });
    });

    const ctx = document.getElementById('broodAdultChart').getContext('2d');
    if (broodAdultChart) {
        broodAdultChart.destroy();
    }
    broodAdultChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true, title: { display: true, text: 'Inspection Date' } },
                y: { stacked: true, title: { display: true, text: 'Frames Count' } }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}

/**
 * Populate the raw inspection data table.
 * @param {Array} inspections Array of Inspection2021Record
 * @param {Array} selectedHives Array of hive IDs to include
 */
function populateInspectionTable(inspections, selectedHives) {
    const tbody = document.querySelector('#inspectionTable tbody');
    tbody.innerHTML = ''; // clear existing rows

    // Filter and sort by date ascending
    const filtered = inspections
        .filter(r => selectedHives.includes(r.tagNumber))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    filtered.forEach(r => {
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

/**
 * Main event listener for "Load 2021 Data" button.
 * Fetches weather, sensor (optional), and inspection data, then renders charts.
 */
loadDataBtn.addEventListener('click', async () => {
    try {
        // Get date range and selected hives
        const startDate = startDateInput.value; // "2021-06-01"
        const endDate = endDateInput.value;     // "2021-06-30"
        if (!startDate || !endDate) {
            alert('Please select both start and end dates.');
            return;
        }
        const selectedOptions = Array.from(hiveSelect.selectedOptions).map(opt => opt.value);
        if (selectedOptions.length === 0) {
            alert('Please select at least one hive.');
            return;
        }

        // Convert to ISO strings for possible filtering (not strictly needed if endpoints return only 2021)
        const startIso = toMidnightISO(startDate);
        const endIso   = toMidnightISO(endDate);

        // Fetch all data in parallel
        const [weatherData, inspectionData] = await Promise.all([
            fetchWeatherData(),
            fetchInspectionData()
        ]);

        // Filter weatherData by date range
        const filteredWeather = weatherData.filter(r => {
            const dt = new Date(r.dateTime);
            return dt >= new Date(startIso) && dt <= new Date(endIso);
        });

        // Filter inspectionData by date range
        const filteredInspections = inspectionData.filter(r => {
            const inspectionDt = new Date(r.date + 'T00:00:00');
            return inspectionDt >= new Date(startIso) && inspectionDt <= new Date(endIso);
        });

        // Render all charts with filtered data
        renderTempHumChart(filteredWeather);
        renderPrecipChart(filteredWeather);
        renderFramesChart(filteredInspections, selectedOptions);
        renderColonyChart(filteredInspections, selectedOptions);
        renderQueenStatusChart(filteredInspections);
        renderBroodAdultChart(filteredInspections, selectedOptions);
        populateInspectionTable(filteredInspections, selectedOptions);

    } catch (error) {
        console.error('Error loading 2021 data:', error);
        alert('Failed to load data. Check console for details.');
    }
});
