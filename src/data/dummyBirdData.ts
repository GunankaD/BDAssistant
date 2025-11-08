import type { BirdEvent } from '../types';

export const dummyBirdData: BirdEvent[] = [
  { id: '1', species: 'Purple Swamphen', soundName: 'scare_crow.wav', timestamp: new Date().toISOString(), imageUrl: '', location: { lat: 12.95, lng: 77.57 } },
  { id: '2', species: 'Purple Swamphen', soundName: 'scare_crow.wav', timestamp: new Date().toISOString(), imageUrl: '', location: { lat: 12.95, lng: 77.57 } },
  // add real data when connected to Firestore
];