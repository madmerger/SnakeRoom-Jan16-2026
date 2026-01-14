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
      <div className="h-48 flex items-center justify-center bg-white border border-gray-200 rounded">
        <div className="text-gray-400">Loading chart...</div>
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
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: '#dc2626',
        fill: true,
        tension: 0.1,
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ddd',
        borderWidth: 1,
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            const value = context.parsed.y;
            return value !== null ? `${value.toFixed(1)}C` : '';
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          maxTicksLimit: 8,
          font: {
            size: 10,
          },
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 10,
          },
          callback: function(value) {
            return `${value}`;
          },
        },
      },
    },
  };

  return (
    <div className="h-48 bg-white border border-gray-200 rounded p-2">
      <Line data={data} options={options} />
    </div>
  );
}
