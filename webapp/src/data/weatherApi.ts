import type { WeatherDay } from '../core/models';

/**
 * Fetches weather for a specific latitude and longitude over a date range.
 * If you need data for just one day, set startDate and endDate to the same value.
 */
export async function fetchWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const today = new Date();
  
  // Use .split('T')[0] to ensure we only have the YYYY-MM-DD part for the API
  const s = startDate.split('T')[0];
  const e = endDate.split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${s}&end_date=${e}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.daily) {
      return [];
    }
    
    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempHigh: data.daily.temperature_2m_max[i],
      tempLow: data.daily.temperature_2m_min[i],
      condition: getWeatherCondition(data.daily.weathercode[i]),
      icon: getWeatherIcon(data.daily.weathercode[i]),
      isHistorical: new Date(date) < today
    }));
    
    return days;
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return [];
  }
}

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

function getWeatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '☁️';
}
