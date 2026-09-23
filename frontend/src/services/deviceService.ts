import { authService } from './authService';

export interface DeviceItem {
  id: string; // deviceId, e.g. "esp32-gateway-01"
  dbId: number;
  name: string;
  status: 'online' | 'offline';
  battery: number;
  lastSync: string | null;
  createdAt: string;
}

export const deviceService = {
  async fetchDevices(): Promise<DeviceItem[]> {
    const token = authService.getToken();
    if (!token) return [];

    const response = await fetch('/api/v1/devices', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch devices:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data;
  },

  async registerDevice(deviceId: string, name?: string): Promise<DeviceItem> {
    const token = authService.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/v1/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ deviceId, name })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to register device');
    }
    return data;
  },

  async removeDevice(deviceId: string): Promise<void> {
    const token = authService.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`/api/v1/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || 'Failed to remove device');
    }
  }
};
