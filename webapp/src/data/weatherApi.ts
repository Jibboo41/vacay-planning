import type { WeatherDay } from '../core/models';

/**
 * Fetches weather for a specific latitude and longitude over a date range.
 * If you need data for just one day, set startDate and endDate to the same value.
 * Automatiaclly switches to archive/historical if dates are out of forecast range (>16 days).
 */
export async function fetchWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const today = new Date();
  const sixteenDaysFromNow = new Date();
  sixteenDaysFromNow.setDate(today.getDate() + 16);

  const start = new Date(startDate.includes('T') ? startDate : startDate.replace(/-/g, '/'));
  
  // Decide whether to use Forecast API or Archive API
  // If start date is > 16 days in the future, we must use Archive for "same date last year"
  if (start > sixteenDaysFromNow) {
    return fetchHistoricalAverages(lat, lon, startDate, endDate);
  }

  // Use .split('T')[0] to ensure we only have the YYYY-MM-DD part for the API
  const s = startDate.split('T')[0];
  const e = endDate.split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${s}&end_date=${e}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.daily) {
      // If forecast fails (e.g. range too wide), try historical anyway
      return fetchHistoricalAverages(lat, lon, startDate, endDate);
    }
    
    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempHigh: data.daily.temperature_2m_max[i],
      tempLow: data.daily.temperature_2m_min[i],
      condition: getWeatherCondition(data.daily.weathercode[i]),
      icon: getWeatherIcon(data.daily.weathercode[i]),
      isHistorical: new Date(date.replace(/-/g, '/')) < today
    }));
    
    return days;
  } catch (error) {
    console.error("Forecast fetch failed, attempting historical fallback:", error);
    return fetchHistoricalAverages(lat, lon, startDate, endDate);
  }
}

/**
 * Fetches data from exactly one year ago for the same dates.
 */
async function fetchHistoricalAverages(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  // Map requested date to "Requested Date - 1 Year"
  const getLastYearStr = (dStr: string) => {
    const d = new Date(dStr.includes('T') ? dStr : dStr.replace(/-/g, '/'));
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };

  const s = getLastYearStr(startDate);
  const e = getLastYearStr(endDate);

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.daily) return [];

    return data.daily.time.map((archiveDate: string, i: number) => {
      // We return the ORIGINAL requested date, but data from last year
      const requestedDate = new Date(archiveDate.replace(/-/g, '/'));
      requestedDate.setFullYear(requestedDate.getFullYear() + 1);
      const dateStr = requestedDate.toISOString().split('T')[0];

      return {
        date: dateStr,
        tempHigh: data.daily.temperature_2m_max[i],
        tempLow: data.daily.temperature_2m_min[i],
        condition: `${getWeatherCondition(data.daily.weather_code[i])} (Avg)`,
        icon: getWeatherIcon(data.daily.weather_code[i]),
        isHistorical: true
      };
    });
  } catch (err) {
    console.error("Historical fetch failed:", err);
    return [];
  }
}

function getWeatherCondition(code: number): string {
  if (code === 0) return 'Clear';
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
