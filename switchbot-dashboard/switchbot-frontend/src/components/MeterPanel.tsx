import { MeterDevice, TimeScale } from '../types';
import Chart from './Chart';

interface MeterPanelProps {
  meter: MeterDevice;
  timeScale: TimeScale;
}

export default function MeterPanel({ meter, timeScale }: MeterPanelProps) {
  return (
    <div className="glass-card rounded-2xl mb-5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10">
      <div className="px-5 py-4 flex justify-between items-center border-b border-white/5">
        <h3 className="font-bold text-lg text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {meter.device_name}
        </h3>
        <span className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full">{meter.device_type}</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {meter.current_temperature !== null && (
            <div className="stat-card rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white">{meter.current_temperature}°</p>
              <p className="text-xs text-slate-400 mt-1">Temperature</p>
            </div>
          )}
          {meter.current_humidity !== null && (
            <div className="stat-card rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white">{meter.current_humidity}%</p>
              <p className="text-xs text-slate-400 mt-1">Humidity</p>
            </div>
          )}
          {meter.battery !== null && (
            <div className="stat-card rounded-xl p-4 text-center">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v4a2 2 0 01-2 2h-2v-8zM5 8h10a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-white">{meter.battery}%</p>
              <p className="text-xs text-slate-400 mt-1">Battery</p>
            </div>
          )}
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <Chart deviceId={meter.device_id} timeScale={timeScale} />
        </div>
        {meter.last_updated && (
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
