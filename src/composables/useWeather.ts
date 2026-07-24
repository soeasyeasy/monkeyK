import { ref, onMounted } from 'vue'

interface WeatherData {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  description: string
  icon: string
  city: string
  forecast?: ForecastDay[]
}

interface ForecastDay {
  date: string
  weatherCode: number
  description: string
  icon: string
  tempMax: number
  tempMin: number
}

const weatherDescriptions: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴天',
  45: '雾',
  48: '雾凇',
  51: '小毛毛雨',
  53: '中毛毛雨',
  55: '大毛毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '中阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴大冰雹',
}

function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return '☀️'
  if (code === 2 || code === 3) return '⛅'
  if (code >= 45 && code <= 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code >= 80 && code <= 82) return '🌦️'
  if (code >= 85 && code <= 86) return '🌨️'
  if (code >= 95) return '⛈️'
  return '🌡️'
}

export function useWeather() {
  const weather = ref<WeatherData | null>(null)
  const loading = ref(true)
  const error = ref(false)

  async function fetchWeather(lat: number, lon: number, cityName: string) {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai&forecast_days=7`
      )
      const data = await res.json()
      const code = data.current.weather_code
      
      // 解析7天预报
      const forecast: ForecastDay[] = []
      if (data.daily) {
        for (let i = 0; i < data.daily.time.length; i++) {
          const dayCode = data.daily.weather_code[i]
          forecast.push({
            date: data.daily.time[i],
            weatherCode: dayCode,
            description: weatherDescriptions[dayCode] ?? '未知',
            icon: getWeatherIcon(dayCode),
            tempMax: Math.round(data.daily.temperature_2m_max[i]),
            tempMin: Math.round(data.daily.temperature_2m_min[i]),
          })
        }
      }
      
      weather.value = {
        temperature: Math.round(data.current.temperature_2m),
        apparentTemperature: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: code,
        description: weatherDescriptions[code] ?? '未知',
        icon: getWeatherIcon(code),
        city: cityName,
        forecast,
      }
    } catch {
      error.value = true
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    try {
      // 尝试通过 IP 获取定位
      const posRes = await fetch('https://ipapi.co/json/')
      if (posRes.ok) {
        const posData = await posRes.json()
        const lat = posData.latitude
        const lon = posData.longitude
        const city = posData.city || '未知城市'
        await fetchWeather(lat, lon, city)
      } else {
        throw new Error('定位失败')
      }
    } catch {
      // 定位失败时使用北京默认坐标
      await fetchWeather(39.9042, 116.4074, '北京')
    }
  })

  return { weather, loading, error }
}
