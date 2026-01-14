import { MeterDevice, TimeScale } from '../types';
import Chart from './Chart';

interface MeterPanelProps {
  meter: MeterDevice;
  timeScale: TimeScale;
}

export default function MeterPanel({ meter, timeScale }: MeterPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-md mb-5 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {meter.device_name}
        </h3>
        <span className="text-xs text-gray-500">{meter.device_type}</span>
      </div>
      <div className="p-4">
        <div className="bg-gray-50 rounded p-3 mb-4 flex flex-wrap gap-5">
          {meter.current_temperature !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <strong>{meter.current_temperature}°C</strong>
            </span>
          )}
          {meter.current_humidity !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v-8zM5 8h10a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
              </svg>
              {meter.battery}%
            </span>
          )}
        </div>
        <Chart deviceId={meter.device_id} timeScale={timeScale} />
        {meter.last_updated && (
          <p className="text-xs text-gray-400 mt-3">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
