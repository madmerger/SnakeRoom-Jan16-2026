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
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-600 text-white fixed top-0 left-0 right-0 z-50 shadow">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <a href="#" className="flex items-center gap-2 text-lg font-semibold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              SnakeRoom Temperature Monitor
            </a>
          </div>
        </nav>
        <div className="pt-20 max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">API Credentials Required</h3>
            <p className="text-gray-500 mb-2">Please configure your SwitchBot API credentials in the backend .env file.</p>
            <p className="text-gray-400 text-sm">
              You can get your token and secret from the SwitchBot app under Profile &gt; Preferences &gt; Developer Options.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white fixed top-0 left-0 right-0 z-50 shadow">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 text-lg font-semibold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            SnakeRoom Temperature Monitor
          </a>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span className="text-sm">Connected</span>
          </div>
        </div>
      </nav>

      <div className="pt-20 max-w-7xl mx-auto px-4 pb-10">
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
            <svg className="w-12 h-12 mx-auto text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="mt-4 text-gray-500">Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-5 text-red-700">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {!loading && !error && meters.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Meters Found</h3>
            <p className="text-gray-500 mb-4">No SwitchBot Meter devices were found in your account.</p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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

      <footer className="bg-gray-100 border-t border-gray-200 py-5 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <p>Data is collected every {status?.collection_interval || 120} seconds. Temperature history is persisted in a database.</p>
          <p>Backend: {api.getApiUrl()}</p>
          <p className="text-gray-400 text-xs mt-2">SnakeRoom Dashboard v2.0 - Built with React + TypeScript + Vite</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
