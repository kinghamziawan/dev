const form = document.getElementById('city-form');
const cityInput = document.getElementById('city-input');
const locationBtn = document.getElementById('location-btn');
const statusEl = document.getElementById('status');
const currentWeatherSection = document.getElementById('current-weather');
const forecastSection = document.getElementById('forecast');
const forecastList = document.getElementById('forecast-list');

const mapEls = {
  locationName: document.getElementById('location-name'),
  temp: document.getElementById('temp'),
  feelsLike: document.getElementById('feels-like'),
  condition: document.getElementById('condition'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
};

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};

const setStatus = (text) => {
  statusEl.textContent = text;
};

const getCondition = (code) => weatherCodeMap[code] ?? `Code ${code}`;

const fetchWeatherByCoords = async (lat, lon, nameLabel) => {
  setStatus('Loading weather...');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Weather API request failed.');
  }

  const data = await response.json();
  renderWeather(data, nameLabel);
  setStatus(`Updated ${new Date().toLocaleTimeString()}`);
};

const renderWeather = (data, locationName) => {
  const current = data.current;

  mapEls.locationName.textContent = locationName;
  mapEls.temp.textContent = current.temperature_2m;
  mapEls.feelsLike.textContent = current.apparent_temperature;
  mapEls.condition.textContent = getCondition(current.weather_code);
  mapEls.humidity.textContent = current.relative_humidity_2m;
  mapEls.wind.textContent = current.wind_speed_10m;

  const daily = data.daily;
  forecastList.innerHTML = '';

  daily.time.forEach((date, i) => {
    const card = document.createElement('article');
    card.className = 'forecast-day';
    const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'short' });

    card.innerHTML = `
      <h3>${dayName}</h3>
      <p>${daily.temperature_2m_max[i]}° / ${daily.temperature_2m_min[i]}°</p>
      <p>${getCondition(daily.weather_code[i])}</p>
    `;

    forecastList.appendChild(card);
  });

  currentWeatherSection.classList.remove('hidden');
  forecastSection.classList.remove('hidden');
};

const geocodeCity = async (city) => {
  setStatus('Finding city...');
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(geoUrl);

  if (!response.ok) {
    throw new Error('City search failed.');
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('City not found.');
  }

  return data.results[0];
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;

  try {
    const place = await geocodeCity(city);
    await fetchWeatherByCoords(place.latitude, place.longitude, `${place.name}, ${place.country}`);
  } catch (error) {
    setStatus(error.message);
  }
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by your browser.');
    return;
  }

  setStatus('Requesting location...');
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        await fetchWeatherByCoords(latitude, longitude, 'Your Location');
      } catch (error) {
        setStatus(error.message);
      }
    },
    () => {
      setStatus('Could not get your location. Please allow location access or search by city.');
    }
  );
});
