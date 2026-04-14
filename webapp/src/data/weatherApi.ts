import type { WeatherDay } from '../core/models';

/**
 * Fetches weather for a specific latitude and longitude over a date range.
 * If you need data for just one day, set startDate and endDate to the same value.
 * Automatically switches to archive/historical if dates are out of forecast range (>16 days).
 * 
 * TODO: [ ] **Data Portability**: Enhance Google Sheets export with premium visual formatting, structured report styling, and professional itinerary layouts.
 * TODO: [ ] **AllTrails Scraper**: Automated parsing of hiking links to extract trail stats.
 */
export async function fetchWeather(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const today = new Date();
  const sixteenDaysFromNow = new Date();
  sixteenDaysFromNow.setDate(today.getDate() + 16);

  const start = new Date(startDate.includes('T') ? startDate : startDate.replace(/-/g, '/'));
  
  // Decide whether to use Forecast API or Archive API
  // If start date is > 16 days in the future, we must use Archive for multi-year averaging
  if (start > sixteenDaysFromNow) {
    return fetchHistoricalAverages(lat, lon, startDate, endDate);
  }

  // Use .split('T')[0] to ensure we only have the YYYY-MM-DD part for the API
  const s = startDate.split('T')[0];
  const e = endDate.split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${s}&end_date=${e}&temperature_unit=fahrenheit`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.daily) {
      return fetchHistoricalAverages(lat, lon, startDate, endDate);
    }
    
    const days: WeatherDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      condition: getWeatherCondition(data.daily.weathercode[i]),
      icon: getWeatherIcon(data.daily.weathercode[i]),
      isHistorical: new Date(date.replace(/-/g, '/')) < today,
      lat,
      lon
    }));
    
    return days;
  } catch (error) {
    console.error("Forecast fetch failed, attempting historical fallback:", error);
    return fetchHistoricalAverages(lat, lon, startDate, endDate);
  }
}

/**
 * Fetches data from the last 5 years for the same dates and averages them.
 */
async function fetchHistoricalAverages(lat: number, lon: number, startDate: string, endDate: string): Promise<WeatherDay[]> {
  const yearsToFetch = 5;
  const yearlyData: WeatherDay[][] = [];

  for (let i = 1; i <= yearsToFetch; i++) {
    const getLastYearStr = (dStr: string, yearsBack: number) => {
      const d = new Date(dStr.includes('T') ? dStr : dStr.replace(/-/g, '/'));
      d.setFullYear(d.getFullYear() - yearsBack);
      return d.toISOString().split('T')[0];
    };

    const s = getLastYearStr(startDate, i);
    const e = getLastYearStr(endDate, i);

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${s}&end_date=${e}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=auto&temperature_unit=fahrenheit`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.daily) {
        yearlyData.push(data.daily.time.map((archiveDate: string, idx: number) => {
          // We return the ORIGINAL requested date, but data from the past
          const requestedDate = new Date(archiveDate.replace(/-/g, '/'));
          requestedDate.setFullYear(requestedDate.getFullYear() + i);
          const dateStr = requestedDate.toISOString().split('T')[0];

          return {
            date: dateStr,
            tempHigh: data.daily.temperature_2m_max[idx],
            tempLow: data.daily.temperature_2m_min[idx],
            rainfall: data.daily.precipitation_sum[idx] * 0.0393701,
            snowfall: data.daily.snowfall_sum[idx] * 0.393701,
            condition: '',
            icon: '',
            isHistorical: true,
            lat,
            lon
          };
        }));
      }
    } catch (err) {
      console.error(`Historical fetch for year -${i} failed:`, err);
    }
  }

  if (yearlyData.length === 0) return [];

  // Average the data across years
  const numDays = yearlyData[0].length;
  const averagedDays: WeatherDay[] = [];

  for (let d = 0; d < numDays; d++) {
    let sumHigh = 0;
    let sumLow = 0;
    let sumRain = 0;
    let sumSnow = 0;
    let count = 0;
    
    yearlyData.forEach(year => {
      if (year[d]) {
        sumHigh += year[d].tempHigh;
        sumLow += year[d].tempLow;
        sumRain += year[d].rainfall || 0;
        sumSnow += year[d].snowfall || 0;
        count++;
      }
    });

    const mostRecentYear = yearlyData[0][d];
    averagedDays.push({
      date: mostRecentYear.date,
      tempHigh: Math.round(sumHigh / count),
      tempLow: Math.round(sumLow / count),
      rainfall: sumRain / count,
      snowfall: sumSnow / count,
      condition: `Hist Avg`,
      icon: '📊',
      isHistorical: true,
      lat: mostRecentYear.lat,
      lon: mostRecentYear.lon
    });
  }

  return averagedDays;
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
