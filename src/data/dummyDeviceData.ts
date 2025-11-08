import type { Device } from '../types/index'

export const dummyDeviceData: Device[] = [
  { id: 'dev-001', deviceName: 'Field-Cam-1', installedLocation: 'Field A - North', version: 'v1.2.0', lastSynced: new Date().toISOString(), status: 'online' },
  { id: 'dev-002', deviceName: 'Field-Cam-2', installedLocation: 'Field B - East', version: 'v1.1.3', lastSynced: new Date(Date.now()-3600_000).toISOString(), status: 'offline' },
];