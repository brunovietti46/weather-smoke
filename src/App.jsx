import React, { useState } from 'react'
import {
  Search,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

// Map WMO weather interpretation codes to human-readable info
function interpretWeatherCode(code) {
  if (code === 0) return { label: 'Sunny', Icon: Sun, color: 'text-yellow-400', bg: 'from-sky-400 to-blue-500' }
  if (code <= 2) return { label: 'Mostly Sunny', Icon: Sun, color: 'text-yellow-300', bg: 'from-sky-400 to-blue-500' }
  if (code === 3) return { label: 'Cloudy', Icon: Cloud, color: 'text-gray-300', bg: 'from-slate-400 to-slate-600' }
  if (code <= 48) return { label: 'Foggy', Icon: Cloud, color: 'text-gray-400', bg: 'from-gray-400 to-gray-600' }
  if (code <= 55) return { label: 'Drizzle', Icon: CloudDrizzle, color: 'text-blue-300', bg: 'from-slate-500 to-blue-600' }
  if (code <= 65) return { label: 'Rainy', Icon: CloudRain, color: 'text-blue-400', bg: 'from-slate-600 to-blue-700' }
  if (code <= 77) return { label: 'Snowy', Icon: CloudSnow, color: 'text-sky-200', bg: 'from-sky-300 to-indigo-400' }
  if (code <= 82) return { label: 'Rainy', Icon: CloudRain, color: 'text-blue-400', bg: 'from-slate-600 to-blue-700' }
  if (code <= 86) return { label: 'Snow Showers', Icon: CloudSnow, color: 'text-sky-200', bg: 'from-sky-300 to-indigo-400' }
  return { label: 'Thunderstorm', Icon: CloudLightning, color: 'text-purple-300', bg: 'from-gray-700 to-slate-900' }
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding service unavailable.')
  const data = await res.json()
  if (!data.results || data.results.length === 0) throw new Error(`No results found for "${city}". Try a different spelling.`)
  return data.results[0]
}

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=auto`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather service unavailable.')
  const data = await res.json()
  return data.current
}

function StatCard({ Icon, label, value, unit, iconClass }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl p-5 flex-1 min-w-[120px]">
      <Icon className={`w-7 h-7 ${iconClass}`} />
      <span className="text-white/60 text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white text-2xl font-bold">
        {value}
        <span className="text-base font-normal text-white/70 ml-1">{unit}</span>
      </span>
    </div>
  )
}

export default function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const trimmed = city.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setWeather(null)
    setLocation(null)

    try {
      const place = await geocodeCity(trimmed)
      const current = await fetchWeather(place.latitude, place.longitude)
      setLocation({
        name: place.name,
        country: place.country,
        admin1: place.admin1,
      })
      setWeather(current)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const condition = weather ? interpretWeatherCode(weather.weather_code) : null
  const gradientBg = condition ? condition.bg : 'from-sky-500 to-indigo-600'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientBg} transition-all duration-700 flex flex-col items-center justify-start px-4 py-16`}>
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow">Weather Now</h1>
        <p className="text-white/70 mt-2 text-sm">Real-time weather powered by Open-Meteo</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="w-full max-w-md flex gap-2 mb-10">
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city name..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder-white/45 text-base focus:outline-none focus:ring-2 focus:ring-white/40 transition"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !city.trim()}
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white text-sky-700 font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          {loading ? 'Searching' : 'Search'}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 text-white/80 mt-4">
          <Loader2 className="w-10 h-10 animate-spin" />
          <span className="text-sm">Fetching weather data…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="w-full max-w-md bg-red-500/20 border border-red-300/30 backdrop-blur-sm rounded-2xl p-5 flex items-start gap-3 text-white">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-300" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {/* Weather Card */}
      {weather && condition && location && !loading && (
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          {/* City & Condition Header */}
          <div className="px-7 pt-8 pb-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 text-white/70 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              <span>
                {location.name}
                {location.admin1 ? `, ${location.admin1}` : ''}
                {location.country ? ` — ${location.country}` : ''}
              </span>
            </div>

            <condition.Icon className={`w-20 h-20 my-4 drop-shadow-lg ${condition.color}`} />
            <span className="text-white/80 text-lg font-semibold tracking-wide">{condition.label}</span>
            <span className="text-white text-7xl font-extrabold mt-1 leading-none drop-shadow-lg">
              {Math.round(weather.temperature_2m)}
              <span className="text-4xl font-normal text-white/70">°C</span>
            </span>
          </div>

          {/* Divider */}
          <div className="mx-7 border-t border-white/15" />

          {/* Stats Row */}
          <div className="flex gap-3 p-6 flex-wrap">
            <StatCard
              Icon={Thermometer}
              label="Feels like"
              value={Math.round(weather.temperature_2m)}
              unit="°C"
              iconClass="text-orange-300"
            />
            <StatCard
              Icon={Droplets}
              label="Humidity"
              value={weather.relative_humidity_2m}
              unit="%"
              iconClass="text-blue-300"
            />
            <StatCard
              Icon={Wind}
              label="Wind"
              value={Math.round(weather.wind_speed_10m)}
              unit="km/h"
              iconClass="text-teal-300"
            />
          </div>

          {/* Footer */}
          <div className="pb-5 text-center text-white/40 text-xs">
            Data from Open-Meteo · Updates every search
          </div>
        </div>
      )}

      {/* Empty state hint */}
      {!weather && !loading && !error && (
        <div className="mt-6 text-center text-white/40 text-sm max-w-xs">
          <Sun className="w-12 h-12 mx-auto mb-3 text-white/20" />
          Type any city name above and press Search to see live weather.
        </div>
      )}
    </div>
  )
}
