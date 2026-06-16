const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const forecastContainer = document.getElementById('five-day-forecast');
const todayContent = document.getElementById('today-content');
const aqiCo = document.getElementById('aqi-co');
const aqiSo2 = document.getElementById('aqi-so2');
const aqiO3 = document.getElementById('aqi-o3');
const aqiNo2 = document.getElementById('aqi-no2');

if (!cityInput || !searchBtn || !forecastContainer || !todayContent || !aqiCo || !aqiSo2 || !aqiO3 || !aqiNo2) {
    console.error('Required DOM elements not found: ensure the weather dashboard ids exist.');
} else {
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) fetchWeatherData(city);
        }
    });
}

// Primary asynchronous connection call
async function fetchWeatherData(city) {
    const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; 
    
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;
        const response = await fetch(weatherUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'City not found.');
        }

        updateUI(data);
        const { lat, lon } = data.coord;

        await Promise.all([
            fetchForecast(lat, lon, API_KEY),
            fetchAirQuality(lat, lon, API_KEY)
        ]);
    } catch (error) {
        alert(error.message);
    }
}

async function fetchForecast(lat, lon, apiKey) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const response = await fetch(forecastUrl);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Forecast not available.');
    }

    renderForecast(data.list);
    createWeatherChart(data.list);

}

async function fetchAirQuality(lat, lon, apiKey) {
    const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const response = await fetch(airUrl);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Air quality data not available.');
    }

    const components = data.list[0]?.components;
    if (components) {
        aqiCo.innerText = `${components.co.toFixed(1)} µg/m³`;
        aqiSo2.innerText = `${components.so2.toFixed(1)} µg/m³`;
        aqiO3.innerText = `${components.o3.toFixed(1)} µg/m³`;
        aqiNo2.innerText = `${components.no2.toFixed(1)} µg/m³`;
    }
}

function renderForecast(list) {
    forecastContainer.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const dailyMap = {};

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateString = date.toISOString().split('T')[0];
        if (dateString === today) return;

        const existing = dailyMap[dateString];
        const currentDiff = Math.abs(date.getHours() - 12);
        const existingDiff = existing ? Math.abs(new Date(existing.dt * 1000).getHours() - 12) : Infinity;

        if (!existing || currentDiff < existingDiff) {
            dailyMap[dateString] = item;
        }
    });

    const forecastDays = Object.keys(dailyMap).slice(0, 5);
    if (forecastDays.length === 0) {
        forecastContainer.innerText = 'Forecast data is unavailable.';
        return;
    }

    forecastDays.forEach(dayKey => {
        const item = dailyMap[dayKey];
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const icon = item.weather[0].icon;
        const description = item.weather[0].description;
        const temp = Math.round(item.main.temp);
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <p>${dayName}</p>
            <img src="${iconUrl}" alt="${description}">
            <p>${description}</p>
            <p>${temp}°C</p>
        `;

        forecastContainer.appendChild(forecastItem);
    });
}

function updateUI(data) {
    // Dynamic binding to mapped dashboard elements matching the screenshot template
    document.getElementById('city-name').innerText = data.name;
    document.getElementById('temperature').innerText = Math.round(data.main.temp);
    document.getElementById('sky-desc').innerText = data.weather[0].description;
    
    document.getElementById('humidity').innerText = `${data.main.humidity}%`;
    document.getElementById('pressure').innerText = `${data.main.pressure} hPa`;
    document.getElementById('feels-like').innerText = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('visibility').innerText = `${(data.visibility / 1000).toFixed(1)} km`;

    // Process system times
    const dateOpts = { weekday: 'long', day: 'numeric', month: 'short' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', dateOpts);
    document.getElementById('current-time').innerText = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Process Sunrise/Sunset values
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunrise-time').innerText = sunrise;
    document.getElementById('sunset-time').innerText = sunset;
}
let chart;

function createWeatherChart(hourlyData) {

    const labels = hourlyData.slice(0, 8).map(item =>
        new Date(item.dt * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    );

    const temps = hourlyData.slice(0, 8).map(item =>
        Math.round(item.main.temp)
    );

    const humidity = hourlyData.slice(0, 8).map(item =>
        item.main.humidity
    );

    const pressure = hourlyData.slice(0, 8).map(item =>
        item.main.pressure
    );

    const ctx = document.getElementById('tempChart');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: temps,
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255,152,0,0.25)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Humidity (%)',
                    data: humidity,
                    borderColor: '#03a9f4',
                    backgroundColor: 'rgba(3,169,244,0.20)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Pressure (hPa)',
                    data: pressure,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76,175,80,0.20)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 14
                        }
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                }
            }
        }
    });
}
