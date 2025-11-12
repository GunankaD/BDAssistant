import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { syncFromFirestore } from '../services/syncService';

export default function useSyncOnResume(): void {
  const lastState = useRef(AppState.currentState);

  useEffect(() => {
    console.log('[SyncOnResume] App is active again (or) App regained network');

    const sub = AppState.addEventListener('change', (next) => {
      if (lastState.current.match(/inactive|background/) && next === 'active') {
        syncFromFirestore().catch(err => console.warn('sync on resume failed:', err));
      }
      lastState.current = next;
    });

    const netSub = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected) {
        syncFromFirestore().catch(err => console.warn('sync on network restore failed:', err));
      }
    });

    console.log('[SyncOnResume] Sync complete');
    return () => {
      sub.remove();
      netSub(); 
    };
  }, []);
}
