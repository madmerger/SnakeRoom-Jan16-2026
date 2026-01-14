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
      className={`rounded-xl p-4 mb-6 flex justify-between items-center ${
        isWarning
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'glass-card'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isWarning 
            ? 'bg-amber-500/20' 
            : 'bg-emerald-500/20'
        }`}>
          <svg className={`w-4 h-4 ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <span className={`font-medium ${isWarning ? 'text-amber-400' : 'text-slate-300'}`}>
          Monitoring {status.meters_count} meter{status.meters_count !== 1 ? 's' : ''}
        </span>
      </div>
      {lastRefresh && (
        <span className="text-sm text-slate-400">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
      )}
    </div>
  );
}
