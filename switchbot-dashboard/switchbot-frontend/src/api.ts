import axios from 'axios';
import { MeterDevice, MeterReading, Status, TimeScale } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'https://snakeroom.fly.dev';

export const api = {
  async fetchMeters(): Promise<{ meters: MeterDevice[] }> {
    const response = await axios.get(`${API_URL}/api/meters`);
    return response.data;
  },

  async fetchStatus(): Promise<Status> {
    const response = await axios.get(`${API_URL}/api/status`);
    return response.data;
  },

  async fetchHistory(deviceId: string, timeScale: TimeScale): Promise<{ history: MeterReading[] }> {
    const response = await axios.get(`${API_URL}/api/meters/${deviceId}/history?time_scale=${timeScale}`);
    return response.data;
  },

  async triggerRefresh(): Promise<void> {
    await axios.post(`${API_URL}/api/meters/refresh`);
  },

  getBackupUrl(): string {
    return `${API_URL}/api/backup`;
  },

  getApiUrl(): string {
    return API_URL;
  }
};
