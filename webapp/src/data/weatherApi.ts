import type { WeatherDay } from '../core/models';

export async function fetchWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // Open-Meteo Forecast provides up to 16 days. 
  // If the trip is further than 14 days out, we might need the Historical API or just show averages.
  // For simplicity, we'll try the Forecast API first.
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${startDate.split('T')[0]}&end_date=${endDate.split('T')[0]}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.daily) {
      // If daily is missing, maybe dates are too far out. 
      // Fallback to a simpler "climate" fetch or just return empty for now.
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
