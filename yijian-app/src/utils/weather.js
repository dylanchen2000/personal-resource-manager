// Open-Meteo 天气API（免费，无需Key）
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

import { getSetting } from './store'

// 预设城市列表
export const CITY_LIST = [
  { city: '南昌', lat: 28.68, lon: 115.89 },
  { city: '北京', lat: 39.90, lon: 116.40 },
  { city: '上海', lat: 31.23, lon: 121.47 },
  { city: '广州', lat: 23.13, lon: 113.26 },
  { city: '深圳', lat: 22.54, lon: 114.06 },
  { city: '杭州', lat: 30.27, lon: 120.15 },
  { city: '成都', lat: 30.57, lon: 104.07 },
  { city: '武汉', lat: 30.59, lon: 114.30 },
  { city: '南京', lat: 32.06, lon: 118.80 },
  { city: '西安', lat: 34.26, lon: 108.94 },
  { city: '重庆', lat: 29.56, lon: 106.55 },
  { city: '长沙', lat: 28.23, lon: 112.94 },
  { city: '厦门', lat: 24.48, lon: 118.09 },
  { city: '青岛', lat: 36.07, lon: 120.38 },
  { city: '大连', lat: 38.91, lon: 121.60 },
]

const DEFAULT_COORDS = { lat: 28.68, lon: 115.89, city: '南昌' }

export async function getWeather(coords) {
  if (!coords) {
    const saved = await getSetting('city')
    if (saved) coords = saved
  }
  const { lat, lon } = coords || DEFAULT_COORDS
  try {
    const resp = await fetch(
      `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=Asia%2FShanghai&forecast_days=3`
    )
    const data = await resp.json()
    const current = data.current
    const daily = data.daily

    return {
      temp: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      weatherDesc: getWeatherDesc(current.weather_code),
      todayMax: Math.round(daily.temperature_2m_max[0]),
      todayMin: Math.round(daily.temperature_2m_min[0]),
      rainChance: daily.precipitation_probability_max[0],
      forecast: [0, 1, 2].map(i => ({
        max: Math.round(daily.temperature_2m_max[i]),
        min: Math.round(daily.temperature_2m_min[i]),
        weatherCode: daily.weather_code[i],
        weatherDesc: getWeatherDesc(daily.weather_code[i]),
        rainChance: daily.precipitation_probability_max[i],
      })),
    }
  } catch (e) {
    console.warn('天气获取失败:', e)
    return null
  }
}

function getWeatherDesc(code) {
  const map = {
    0: '晴', 1: '大部晴', 2: '多云', 3: '阴',
    45: '雾', 48: '雾凇', 51: '小毛雨', 53: '毛雨', 55: '大毛雨',
    61: '小雨', 63: '中雨', 65: '大雨', 71: '小雪', 73: '中雪', 75: '大雪',
    80: '阵雨', 81: '中阵雨', 82: '强阵雨', 95: '雷阵雨',
  }
  return map[code] || '未知'
}

// 根据天气推荐穿衣温度区间
export function getTempAdvice(temp) {
  if (temp >= 30) return { level: '炎热', advice: '短袖短裤，注意防晒', layers: 1 }
  if (temp >= 25) return { level: '温暖', advice: '短袖/薄长袖', layers: 1 }
  if (temp >= 20) return { level: '舒适', advice: '长袖/薄外套', layers: 2 }
  if (temp >= 15) return { level: '微凉', advice: '外套+长袖', layers: 2 }
  if (temp >= 10) return { level: '凉', advice: '夹克/风衣+内搭', layers: 2 }
  if (temp >= 5) return { level: '冷', advice: '厚外套+毛衣', layers: 3 }
  return { level: '严寒', advice: '羽绒服/大衣+保暖内搭', layers: 3 }
}
