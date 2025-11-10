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
  id: string;               
  deviceName: string;        
  installedLocation?: string; 
  version?: string;          
  lastSynced?: string;       
  status?: 'online' | 'offline' | 'unknown';
  extra?: Record<string, any>;
};