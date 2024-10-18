const apiKey = 'd4d6d94ed68584cf99753249187a1590';
const geminiApiKey = 'AIzaSyD7CeqN4T2jeunV17dvBVY7Uh1Bcja-n_M';
let forecastData = [];
let currentPage = 1;
const itemsPerPage = 10;
let lastCity = '';
let isCelsius = true;

async function getWeather() {
    const city = document.getElementById('cityInput').value;
    if (city === lastCity) return; 
    lastCity = city;
    
const weatherDescription = document.getElementById('weather-description');
    showLoadingSpinner();
    const weatherWidget = document.getElementById('weatherWidget');
    
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const data = await response.json();
        
        if (response.ok) {
            updateWeatherWidget(data);
            
            // Fetch 5-day forecast
            const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
            const forecastData = await forecastResponse.json();
            
            if (forecastResponse.ok) {
                updateCharts(forecastData);
                updateTable(forecastData);
            } else {
                throw new Error(forecastData.message);
            }
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        weatherWidget.innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        hideLoadingSpinner();
    }
}

function updateWeatherWidget(data) {
    const weatherWidget = document.getElementById('weatherWidget');
    const temp = isCelsius ? data.main.temp : celsiusToFahrenheit(data.main.temp);
    const unit = isCelsius ? '°C' : '°F';
    weatherWidget.innerHTML = `
        <h2>${data.name}</h2>
        <p>Temperature: ${temp.toFixed(1)}${unit}</p>
        <p>Humidity: ${data.main.humidity}%</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
        <p>Weather: ${data.weather[0].description}</p>
        <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather icon" class="weather-icon">
    `;
    setTimeout(() => {
        document.querySelector('.weather-icon').classList.add('show');
    }, 100);
}

let tempChartInstance = null;
let conditionChartInstance = null;
let tempLineChartInstance = null;

function updateCharts(data) {
    const temps = data.list.slice(0, 5).map(item => isCelsius ? item.main.temp : celsiusToFahrenheit(item.main.temp));
    const dates = data.list.slice(0, 5).map(item => new Date(item.dt * 1000).toLocaleDateString());
    const conditions = data.list.slice(0, 5).map(item => item.weather[0].main);

    if (tempChartInstance) tempChartInstance.destroy();
    if (conditionChartInstance) conditionChartInstance.destroy();
    if (tempLineChartInstance) tempLineChartInstance.destroy();

    // Temperature Bar Chart
    tempChartInstance = new Chart(document.getElementById('tempChart'), {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: `Temperature (${isCelsius ? '°C' : '°F'})`,
                data: temps,
                backgroundColor: 'rgba(0, 188, 212, 0.5)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                onComplete: () => {
                    tempChartInstance.update();
                },
                delay: (context) => {
                    if (context.type === 'data' && context.mode === 'default') {
                        return context.dataIndex * 150; // Delay for each bar
                    }
                    return 0;
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#e0e0e0'
                    }
                },
                y: {
                    ticks: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });

    // Weather Conditions Doughnut Chart
    const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
    }, {});

    conditionChartInstance = new Chart(document.getElementById('conditionChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditionCounts),
            datasets: [{
                data: Object.values(conditionCounts),
                backgroundColor: ['#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2', '#e0f7fa']
            }]
        },
        options: {
            responsive: true,
            animation: {
                onComplete: () => {
                    conditionChartInstance.update();
                },
                delay: (context) => {
                    if (context.type === 'data' && context.mode === 'default') {
                        return context.dataIndex * 150; 
                    }
                    return 0;
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#e0e0e0'
                    }
                }
            }
        }
    });

   // Temperature Line Chart
tempLineChartInstance = new Chart(document.getElementById('tempLineChart'), {
    type: 'line',
    data: {
        labels: dates,
        datasets: [{
            label: `Temperature (${isCelsius ? '°C' : '°F'})`,
            data: temps,
            borderColor: '#00bcd4',
            tension: 0.1,
            fill: false, 
            pointRadius: 5, 
            pointBackgroundColor: '#00bcd4' 
        }]
    },
    options: {
        responsive: true,
        animation: {
            duration: 2000, 
            easing: 'easeOutBounce', // Bounce effect
            onProgress: function(animation) {
                const currentStep = animation.currentStep;
                const totalSteps = animation.numSteps;

                const newData = this.data.datasets[0].data.map((d, index) => {
                    return index <= currentStep ? d : null; 
                });

                this.data.datasets[0].data = newData;

                const dropHeight = 100; 
                this.data.datasets[0].data.forEach((value, index) => {
                    if (value !== null) {
                        this.data.datasets[0].data[index] = value - ((totalSteps - currentStep) * dropHeight / totalSteps);
                    }
                });
            },
            onComplete: function() {
                this.data.datasets[0].data = temps; 
                this.update(); 
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0e0'
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#e0e0e0'
                }
            },
            y: {
                ticks: {
                    color: '#e0e0e0'
                },
                beginAtZero: true 
            }
        }
    }
});

}


function updateTable(data) {
    forecastData = data.list.map(item => ({
        date: new Date(item.dt * 1000).toLocaleDateString(),
        temp: isCelsius ? item.main.temp : celsiusToFahrenheit(item.main.temp),
        condition: item.weather[0].main
    }));
    displayTable();
}

function displayTable() {
    const tableBody = document.querySelector('#forecastTable tbody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = forecastData.slice(startIndex, endIndex);

    tableBody.innerHTML = pageData.map(item => `
        <tr>
            <td>${item.date}</td>
            <td>${item.temp.toFixed(1)}${isCelsius ? '°C' : '°F'}</td>
            <td>${item.condition}</td>
        </tr>
    `).join('');

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(forecastData.length / itemsPerPage);
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.onclick = () => {
            currentPage = i;
            displayTable();
        };
        paginationElement.appendChild(button);
    }
}

function showDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('tables').style.display = 'none';
}

function showTables() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('tables').style.display = 'block';
}

function openChat() {
    const chatWidget = document.querySelector('.chat-widget');
    chatWidget.classList.add('open');
}

function closeChat(event) {
    event.stopPropagation();
    const chatWidget = document.querySelector('.chat-widget');
    chatWidget.classList.remove('open');
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value;
    chatInput.value = '';

    displayMessage('User', message);

    if (message.toLowerCase().includes('weather')) {
  
        const city = message.split(' ').pop(); 
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
            const data = await response.json();
            if (response.ok) {
                const temp = isCelsius ? data.main.temp : celsiusToFahrenheit(data.main.temp);
                const unit = isCelsius ? '°C' : '°F';
                const reply = `The current weather in ${data.name} is ${data.weather[0].description} with a temperature of ${temp.toFixed(1)}${unit}.`;
                displayMessage('Bot', reply);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            displayMessage('Bot', `Sorry, I couldn't fetch the weather information. ${error.message}`);
        }
    } else {
        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (response.ok && data.candidates && data.candidates.length > 0) {
                const reply = data.candidates[0].content.parts[0].text;
                displayMessage('Bot', reply);
            } else {
                throw new Error('Failed to get a response from Gemini API');
            }
        } catch (error) {
            displayMessage('Bot', `Sorry, I couldn't process your request. ${error.message}`);
        }
    }
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    messageElement.style.marginBottom = '10px';
    messageElement.style.padding = '5px';
    messageElement.style.borderRadius = '5px';
    messageElement.style.backgroundColor = sender === 'User' ? '#2a2a2a' : '#1a1a1a';
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function toggleUnit() {
    isCelsius = !isCelsius;
    if (lastCity) {
        getWeather();
    }
}

function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('cityInput').value = data.name;
                    getWeather();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Unable to fetch weather for your location.');
                });
        }, () => {
            alert('Unable to retrieve your location');
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

function sortTemperaturesAscending() {
    forecastData.sort((a, b) => a.temp - b.temp);
    displayTable();
}

function sortTemperaturesDescending() {
    forecastData.sort((a, b) => b.temp - a.temp);
    displayTable();
}

function filterRainyDays() {
    const rainyDays = forecastData.filter(day => day.condition.toLowerCase().includes('rain'));
    forecastData = rainyDays;
    displayTable();
}

function showHighestTemperatureDay() {
    const highestTempDay = forecastData.reduce((max, day) => max.temp > day.temp ? max : day);
    forecastData = [highestTempDay];
    displayTable();
}