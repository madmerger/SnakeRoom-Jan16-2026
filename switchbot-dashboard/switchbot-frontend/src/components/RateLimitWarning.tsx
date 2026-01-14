interface RateLimitWarningProps {
  backoffRemaining: number;
}

export default function RateLimitWarning({ backoffRemaining }: RateLimitWarningProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-5 flex items-center gap-2 text-yellow-800">
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span>
        <strong>Warning!</strong> Rate limited by SwitchBot API. Retry in {backoffRemaining} seconds.
      </span>
    </div>
  );
}
