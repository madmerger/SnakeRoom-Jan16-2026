import { TimeScale, ViewType } from '../types';
import { api } from '../api';

interface ControlsProps {
  viewType: ViewType;
  setViewType: (view: ViewType) => void;
  timeScale: TimeScale;
  setTimeScale: (scale: TimeScale) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Controls({
  viewType,
  setViewType,
  timeScale,
  setTimeScale,
  onRefresh,
  isRefreshing,
}: ControlsProps) {
  const handleBackup = () => {
    window.open(api.getBackupUrl(), '_blank');
  };

  return (
    <div className="bg-gray-100 border border-gray-200 rounded p-4 mb-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">View:</label>
          <div className="flex rounded overflow-hidden border border-gray-300">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewType === 'default'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setViewType('default')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Default
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                viewType === 'shelf'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setViewType('shelf')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Shelf
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="timeScale" className="text-sm font-medium">
            Time Range:
          </label>
          <select
            id="timeScale"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
            value={timeScale}
            onChange={(e) => setTimeScale(e.target.value as TimeScale)}
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm flex items-center gap-2 disabled:opacity-50"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh Data
        </button>

        <button
          type="button"
          className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-1.5 rounded text-sm flex items-center gap-2"
          onClick={handleBackup}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Backup
        </button>
      </div>
    </div>
  );
}
