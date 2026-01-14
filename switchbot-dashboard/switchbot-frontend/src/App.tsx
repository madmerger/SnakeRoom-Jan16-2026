import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import { MeterDevice, Status, TimeScale, ViewType, ShelfViewConfig } from './types';
import Controls from './components/Controls';
import StatusBar from './components/StatusBar';
import RateLimitWarning from './components/RateLimitWarning';
import MeterPanel from './components/MeterPanel';

const REFRESH_INTERVAL = 30000;

const SHELF_VIEW_CONFIG: ShelfViewConfig = {
  topRow: ['外', 'Study'],
  leftColumn: ['バロン', 'おていさん', 'アワコ', 'ネズミ'],
  middleColumn: ['蛇棚', 'ジャガ百万石', '中華棚'],
  rightColumn: ['ゴンタ', '夢男'],
  excluded: ['Bedroom Meter', 'Living Meter'],
};

function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [viewType, setViewType] = useState<ViewType>('shelf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metersData, statusData] = await Promise.all([
        api.fetchMeters(),
        api.fetchStatus(),
      ]);
      setMeters(metersData.meters);
      setStatus(statusData);
      setLastRefresh(new Date());
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch data');
      setLoading(false);
      console.error('Error fetching data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.triggerRefresh();
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const findMeterByName = (name: string): MeterDevice | undefined => {
    return meters.find((m) => m.device_name === name);
  };

  const renderDefaultView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {meters.map((meter) => (
        <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
      ))}
    </div>
  );

  const renderShelfView = () => {
    const topRowMeters = SHELF_VIEW_CONFIG.topRow
      .map(findMeterByName)
      .filter((m): m is MeterDevice => m !== undefined);

    const leftColumnMeters = SHELF_VIEW_CONFIG.leftColumn
      .map(findMeterByName)
      .filter((m): m is MeterDevice => m !== undefined);

    const middleColumnMeters = SHELF_VIEW_CONFIG.middleColumn
      .map(findMeterByName)
      .filter((m): m is MeterDevice => m !== undefined);

    const rightColumnMeters = SHELF_VIEW_CONFIG.rightColumn
      .map(findMeterByName)
      .filter((m): m is MeterDevice => m !== undefined);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {topRowMeters.map((meter) => (
            <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            {leftColumnMeters.map((meter) => (
              <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
          <div>
            {middleColumnMeters.map((meter) => (
              <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
          <div>
            {rightColumnMeters.map((meter) => (
              <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!status?.configured && !loading) {
    return (
      <div className="min-h-screen">
        <nav className="glass-card fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <a href="#" className="flex items-center gap-3 text-xl font-bold">
              <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="gradient-text">SnakeRoom</span>
            </a>
          </div>
        </nav>
        <div className="pt-24 max-w-7xl mx-auto px-6">
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl glass-card flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">API Credentials Required</h3>
            <p className="text-slate-400 mb-2">Please configure your SwitchBot API credentials in the backend .env file.</p>
            <p className="text-slate-500 text-sm">
              You can get your token and secret from the SwitchBot app under Profile &gt; Preferences &gt; Developer Options.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="glass-card fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#" className="flex items-center gap-3 text-xl font-bold">
            <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="gradient-text">SnakeRoom</span>
          </a>
          <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full pulse-dot"></span>
            <span className="text-sm text-slate-300 font-medium">Connected</span>
          </div>
        </div>
      </nav>

      <div className="pt-24 max-w-7xl mx-auto px-6 pb-10">
        <Controls
          viewType={viewType}
          setViewType={setViewType}
          timeScale={timeScale}
          setTimeScale={setTimeScale}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {status?.is_rate_limited && (
          <RateLimitWarning backoffRemaining={status.backoff_remaining} />
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl btn-primary flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg">Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-xl p-5 mb-6 border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-3 text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && meters.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl glass-card flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No Meters Found</h3>
            <p className="text-slate-400 mb-6">No SwitchBot Meter devices were found in your account.</p>
            <button
              className="btn-primary text-white px-6 py-3 rounded-xl font-medium"
              onClick={handleRefresh}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && meters.length > 0 && (
          viewType === 'default' ? renderDefaultView() : renderShelfView()
        )}
      </div>

      <footer className="glass-card py-6 text-center mt-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-slate-400 text-sm">Data is collected every {status?.collection_interval || 120} seconds. Temperature history is persisted in a database.</p>
          <p className="text-slate-500 text-xs mt-2">Backend: {api.getApiUrl()}</p>
          <p className="text-slate-600 text-xs mt-2">SnakeRoom Dashboard v2.0 - Built with React + TypeScript + Vite</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
