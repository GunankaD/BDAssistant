export type BirdEvent = {
  id: string;
  species?: string;
  soundName?: string;
  timestamp: string; // ISO
  imageUrl?: string;
  location?: { lat: number; lng: number };
  device?: string;
};

export type Device = {
  id: string;                 // unique device id
  deviceName: string;        // human friendly name
  installedLocation?: string; // e.g. "Field A - North Gate"
  version?: string;          // firmware / software version
  lastSynced?: string;       // ISO timestamp of last sync
  status?: 'online' | 'offline' | 'unknown';
  extra?: Record<string, any>;
};