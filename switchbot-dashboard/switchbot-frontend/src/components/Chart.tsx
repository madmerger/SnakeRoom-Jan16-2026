import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../api';
import { MeterReading, TimeScale } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

interface ChartProps {
  deviceId: string;
  timeScale: TimeScale;
}

function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  switch (timeScale) {
    case 'hour':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'day':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case 'week':
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    case 'month':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    case 'year':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleString();
  }
}

export default function Chart({ deviceId, timeScale }: ChartProps) {
  const [history, setHistory] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.fetchHistory(deviceId, timeScale);
        setHistory(data.history);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [deviceId, timeScale]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-slate-500 flex items-center gap-2">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Loading chart...
        </div>
      </div>
    );
  }

  const labels = history.map(reading => formatTimestamp(reading.timestamp, timeScale));
  const temperatures = history.map(reading => reading.temperature);

  const data = {
    labels,
    datasets: [
      {
        label: 'Temperature (C)',
        data: temperatures,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#f97316',
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#fb923c',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const value = context.parsed.y;
            return value !== null ? `${value.toFixed(1)}°C` : '';
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 10,
          },
          color: '#64748b',
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#64748b',
          callback: function(value) {
            return `${value}°`;
          },
        },
      },
    },
  };

  return (
    <div className="h-48">
      <Line data={data} options={options} />
    </div>
  );
}
