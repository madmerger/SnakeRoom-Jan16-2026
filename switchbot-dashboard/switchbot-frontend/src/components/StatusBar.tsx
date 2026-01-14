import { Status } from '../types';

interface StatusBarProps {
  status: Status | null;
  lastRefresh: Date | null;
}

export default function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null;

  const isWarning = status.is_rate_limited;

  return (
    <div
      className={`rounded p-3 mb-5 flex justify-between items-center ${
        isWarning
          ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
          : 'bg-green-50 border border-green-200 text-green-800'
      }`}
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          Monitoring {status.meters_count} meter{status.meters_count !== 1 ? 's' : ''}
        </span>
      </div>
      {lastRefresh && (
        <span className="text-sm">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
      )}
    </div>
  );
}
