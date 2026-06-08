const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiUrl = 'https://api.open-meteo.com/v1/forecast';
    // Melbourne coordinates
    this.latitude = -37.8136;
    this.longitude = 144.9631;
  }

  /**
   * Get current weather and forecast for Melbourne
   * @returns {Promise<string>} Formatted weather forecast
   */
  async getMelbourneWeather() {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          latitude: this.latitude,
          longitude: this.longitude,
          current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
          timezone: 'Australia/Melbourne',
          forecast_days: 1
        },
        timeout: 5000
      });

      const current = response.data.current;
      const daily = response.data.daily;

      // Convert weather code to description
      const weatherDescription = this.getWeatherDescription(current.weather_code);
      const dailyDescription = this.getWeatherDescription(daily.weather_code[0]);

      // Format the response
      const forecast = `
Today's Melbourne Weather:

Current Conditions:
- Temperature: ${current.temperature_2m}°C
- Humidity: ${current.relative_humidity_2m}%
- Conditions: ${weatherDescription}
- Wind Speed: ${current.wind_speed_10m} km/h

Today's Forecast:
- High: ${daily.temperature_2m_max[0]}°C
- Low: ${daily.temperature_2m_min[0]}°C
- Conditions: ${dailyDescription}
- Precipitation: ${daily.precipitation_sum[0]}mm
- Wind: ${daily.wind_speed_10m_max[0]} km/h
      `.trim();

      return forecast;
    } catch (error) {
      console.error('Error fetching weather:', error.message);
      return `I couldn't fetch the current Melbourne weather. Please check weather.com or bom.gov.au for the latest forecast.`;
    }
  }

  /**
   * Convert WMO weather code to description
   * @param {number} code - WMO weather code
   * @returns {string} Weather description
   */
  getWeatherDescription(code) {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy with rime',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    return weatherCodes[code] || 'Unknown conditions';
  }
}

module.exports = WeatherService;
