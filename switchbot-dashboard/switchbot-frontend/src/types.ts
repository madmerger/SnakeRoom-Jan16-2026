export interface MeterDevice {
  device_id: string;
  device_name: string;
  device_type: string;
  current_temperature: number | null;
  current_humidity: number | null;
  battery: number | null;
  last_updated: string | null;
}

export interface MeterReading {
  timestamp: string;
  temperature: number;
  humidity: number;
  battery: number | null;
}

export interface Status {
  configured: boolean;
  meters_count: number;
  collection_interval: number;
  is_rate_limited: boolean;
  backoff_remaining: number;
}

export type TimeScale = 'hour' | 'day' | 'week' | 'month' | 'year';

export type ViewType = 'default' | 'shelf';

export interface ShelfViewConfig {
  topRow: string[];
  leftColumn: string[];
  middleColumn: string[];
  rightColumn: string[];
  excluded: string[];
}
