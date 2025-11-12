export type BirdEvent = {
  id: string;
  species?: string;
  soundName?: string;
  timestamp: string; // ISO string from Firestore (e.g. "2025-11-11T12:34:56Z")
  imageUrl?: string;
  location?: { lat: number; lng: number } | null;
  device?: string;
};

export type Device = {
  id: string;
  deviceName: string;
  installedLocation?: string;
  version?: string;
  lastSynced?: string;
  status?: 'online' | 'offline' | 'unknown';
  extra?: Record<string, any>;
};

/**
 * Local DB row shape (bird_history table)
 * timestamp/createdAt/lastModified are stored as unix ms (number)
 */
export type BirdHistoryRecord = {
  id: number; // local autoinc
  firestoreId?: string | null;
  species?: string | null;
  soundName?: string | null;
  timestamp: number; // unix ms
  imageUrl?: string | null; // maps from BirdEvent.imageUrl
  imagePath?: string | null;
  imageCached?: number; // 0/1
  location?: string | null; // JSON stringified lat/lng or null
  device?: string | null;
  createdAt?: number;
  lastModified?: number;
};

export type LocalDBSchema = BirdHistoryRecord;