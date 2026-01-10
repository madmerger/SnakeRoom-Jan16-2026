import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Thermometer, Droplets, Battery, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const REFRESH_INTERVAL = 30000

type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year'

interface MeterDevice {
  device_id: string
  device_name: string
  device_type: string
  hub_device_id: string | null
  current_temperature: number | null
  current_humidity: number | null
  battery: number | null
  last_updated: string | null
}

interface MeterReading {
  timestamp: string
  temperature: number
  humidity: number
  battery: number | null
}

interface MetersResponse {
  meters: MeterDevice[]
  last_updated: string | null
}

interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: MeterReading[]
  device: MeterDevice | null
}

interface StatusResponse {
  configured: boolean
  meters_count: number
  is_rate_limited: boolean
  backoff_remaining: number
  last_api_call: number
  collection_interval: number
}

function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  switch (timeScale) {
    case 'hour':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    case 'day':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    case 'week':
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' })
    case 'month':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    case 'year':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    default:
      return date.toLocaleString()
  }
}

function getTimeScaleLabel(timeScale: TimeScale): string {
  switch (timeScale) {
    case 'hour':
      return 'Last Hour'
    case 'day':
      return 'Last 24 Hours'
    case 'week':
      return 'Last 7 Days'
    case 'month':
      return 'Last 30 Days'
    case 'year':
      return 'Last Year'
    default:
      return timeScale
  }
}

function MeterCard({
  meter,
  timeScale,
}: {
  meter: MeterDevice
  timeScale: TimeScale
}) {
  const [history, setHistory] = useState<MeterReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/meters/${meter.device_id}/history?time_scale=${timeScale}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      const data: HistoryResponse = await response.json()
      setHistory(data.history)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [meter.device_id, timeScale])

  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchHistory])

  const chartData = history.map((reading) => ({
    time: formatTimestamp(reading.timestamp, timeScale),
    temperature: reading.temperature,
    humidity: reading.humidity,
    timestamp: reading.timestamp,
  }))

  const temperatures = chartData.map((d) => d.temperature)
  const tempMin = temperatures.length > 0 ? Math.min(...temperatures) : 15
  const tempMax = temperatures.length > 0 ? Math.max(...temperatures) : 35
  const yMin = Math.floor(tempMin * 0.95)
  const yMax = Math.ceil(tempMax * 1.05)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{meter.device_name}</CardTitle>
          <span className="text-xs text-muted-foreground">{meter.device_type}</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {meter.current_temperature !== null && (
            <div className="flex items-center gap-1">
              <Thermometer className="h-4 w-4 text-red-500" />
              <span className="font-medium">{meter.current_temperature}°C</span>
            </div>
          )}
          {meter.current_humidity !== null && (
            <div className="flex items-center gap-1">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span>{meter.current_humidity}%</span>
            </div>
          )}
          {meter.battery !== null && (
            <div className="flex items-center gap-1">
              <Battery className="h-4 w-4 text-green-500" />
              <span>{meter.battery}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No data available for this time period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[yMin, yMax]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}°`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="text-xs text-muted-foreground">
                          {new Date(data.timestamp).toLocaleString()}
                        </p>
                        <p className="font-medium">
                          <span className="text-red-500">{data.temperature}°C</span>
                          {' / '}
                          <span className="text-blue-500">{data.humidity}%</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <ReferenceLine y={25} stroke="#94a3b8" strokeDasharray="5 5" />
                            <Line
                              type="monotone"
                              dataKey="temperature"
                              stroke="#ef4444"
                              strokeWidth={2}
                              dot={{ r: 2, fill: '#ef4444', strokeWidth: 0 }}
                              activeDot={{ r: 4 }}
                            />
            </LineChart>
          </ResponsiveContainer>
        )}
        {meter.last_updated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('hour')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchMeters = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/meters`),
        fetch(`${API_URL}/api/status`),
      ])

      if (!metersRes.ok || !statusRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const metersData: MetersResponse = await metersRes.json()
      const statusData: StatusResponse = await statusRes.json()

      setMeters(metersData.meters)
      setStatus(statusData)
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' })
      await fetchMeters()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMeters()
    const interval = setInterval(fetchMeters, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMeters])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">SwitchBot Temperature Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {status?.configured
                  ? `Monitoring ${status.meters_count} meter${status.meters_count !== 1 ? 's' : ''}`
                  : 'API credentials not configured'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={timeScale}
                onValueChange={(value) => setTimeScale(value as TimeScale)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time scale" />
                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hour">Last Hour</SelectItem>
                                  <SelectItem value="day">Last 24 Hours</SelectItem>
                                  <SelectItem value="week">Last 7 Days</SelectItem>
                                  <SelectItem value="month">Last 30 Days</SelectItem>
                                  <SelectItem value="year">Last Year</SelectItem>
                                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={triggerRefresh}
                disabled={refreshing || !status?.configured}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : !status?.configured ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">API Credentials Required</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please configure your SwitchBot API credentials in the backend .env file.
                  You can get your token and secret from the SwitchBot app under
                  Profile &gt; Preferences &gt; Developer Options.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : meters.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Thermometer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Meters Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  No SwitchBot Meter devices were found in your account.
                  Make sure you have meter devices added to your SwitchBot app.
                </p>
                <Button onClick={triggerRefresh} className="mt-4" disabled={refreshing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing: {getTimeScaleLabel(timeScale)}
              </p>
              {lastRefresh && (
                <p className="text-sm text-muted-foreground">
                  Last refresh: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="grid gap-6">
              {meters.map((meter) => (
                <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
              ))}
            </div>
          </div>
        )}

        {status?.is_rate_limited && (
          <Card className="mt-6 border-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span>
                  Rate limited by SwitchBot API. Retry in {status.backoff_remaining} seconds.
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            Data is collected every {status?.collection_interval || 120} seconds.
            Temperature history is stored in memory and resets on backend restart.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
