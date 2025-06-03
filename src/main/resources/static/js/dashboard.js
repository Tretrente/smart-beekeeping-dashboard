
// DOM elements
const loadDataBtn = document.getElementById('loadDataBtn');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const hiveIdsInput = document.getElementById('hiveIds');

let envChart, prodChart;

/**
 * Fetch environmental data from the backend API.
 *
 * @param {string} start ISO-8601 timestamp string, e.g. "2025-06-01T00:00:00"
 * @param {string} end   ISO-8601 timestamp string, e.g. "2025-06-02T00:00:00"
 * @returns {Promise<Array>} Resolves with an array of EnvironmentalData objects
 */
async function fetchEnvironmentalData(start, end) {
    const url = `/api/environmental?start=${start}&end=${end}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to load environmental data');
    }
    return await response.json();
}

/**
 * Fetch production data from the backend API.
 *
 * @param {string} start   ISO-8601 timestamp string
 * @param {string} end     ISO-8601 timestamp string
 * @param {string} hiveIds Comma-separated hive IDs (e.g. "hive1,hive2")
 * @returns {Promise<Array>} Resolves with an array of ProductionData objects
 */
async function fetchProductionData(start, end, hiveIds) {
    const url = `/api/production?start=${start}&end=${end}&hives=${hiveIds}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to load production data');
    }
    return await response.json();
}

/**
 * Render the environmental data chart (line chart with two y-axes).
 *
 * @param {Array} envData Array of objects { timestamp, temperature, humidity, ... }
 */
function renderEnvironmentalChart(envData) {
    const ctx = document.getElementById('envChart').getContext('2d');

    // Extract labels and datasets
    const labels = envData.map(item => new Date(item.timestamp).toLocaleString());
    const temperatures = envData.map(item => item.temperature);
    const humidities = envData.map(item => item.humidity);

    // Destroy existing chart if it exists
    if (envChart) {
        envChart.destroy();
    }

    envChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temperatures,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false,
                    yAxisID: 'yTemp'
                },
                {
                    label: 'Humidity (%)',
                    data: humidities,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    fill: false,
                    yAxisID: 'yHum'
                }
            ]
        },
        options: {
            scales: {
                yTemp: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Temperature (°C)' }
                },
                yHum: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Humidity (%)' }
                }
            }
        }
    });
}

/**
 * Render the production data chart (bar chart grouped by hive).
 *
 * @param {Array} prodData Array of objects { hiveId, timestamp, honeyQuantity }
 */
function renderProductionChart(prodData) {
    const ctx = document.getElementById('prodChart').getContext('2d');

    // Group data by hiveId and date
    const hiveMap = {};
    prodData.forEach(item => {
        const dateLabel = new Date(item.timestamp).toLocaleDateString();
        if (!hiveMap[item.hiveId]) {
            hiveMap[item.hiveId] = {};
        }
        hiveMap[item.hiveId][dateLabel] = item.honeyQuantity;
    });

    const labels = Array.from(
        new Set(prodData.map(item => new Date(item.timestamp).toLocaleDateString()))
    ).sort();

    const datasets = [];
    Object.keys(hiveMap).forEach((hiveId, index) => {
        const dataPoints = labels.map(label => hiveMap[hiveId][label] || 0);
        datasets.push({
            label: hiveId,
            data: dataPoints,
            borderColor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
            fill: false
        });
    });

    // Destroy existing chart if it exists
    if (prodChart) {
        prodChart.destroy();
    }

    prodChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                y: {
                    title: { display: true, text: 'Honey Quantity (kg)' }
                }
            }
        }
    });
}

// Main event listener: triggered when the user clicks "Load Data"
loadDataBtn.addEventListener('click', async () => {
    try {
        const start = startDateInput.value;
        const end = endDateInput.value;
        const hiveIds = hiveIdsInput.value.trim();

        if (!start || !end || !hiveIds) {
            alert('Please fill in all fields.');
            return;
        }

        // Convert to ISO-8601 format
        const startIso = new Date(start).toISOString();
        const endIso = new Date(end).toISOString();

        // Fetch data from backend
        const envData = await fetchEnvironmentalData(startIso, endIso);
        const prodData = await fetchProductionData(startIso, endIso, hiveIds);

        // Render the charts
        renderEnvironmentalChart(envData);
        renderProductionChart(prodData);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data. Check console for details.');
    }
});
