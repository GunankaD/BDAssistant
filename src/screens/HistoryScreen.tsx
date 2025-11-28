import React, { useState, useEffect, useRef } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { BirdEvent } from '../types';
import BirdCard from '../components/BirdCard';
import FloatingActionButton from '../components/FloatingActionButton';
import firestore from '@react-native-firebase/firestore';
import { dummyBirdData } from '../data/dummyBirdData';
import { getRecent } from '../models/event.model';
import { syncFromFirestore, syncDeletesFromTombstones } from '../services/syncService';

export default function HistoryScreen() {
  const [events, setEvents] = useState<BirdEvent[]>([]);
  const isFocused = useIsFocused();
  const syncingRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!isFocused) return;
    cancelledRef.current = false;

    (async () => {
      try {
        // Sync LocalDB with Firestore
        if (!syncingRef.current) {
          syncingRef.current = true;
          await syncDeletesFromTombstones().catch(err => console.warn('delete-sync failed:', err));
          if (cancelledRef.current) return; 
          await syncFromFirestore({ forceFull: false, pageSize: 1000 }).catch(err => console.warn('syncFromFirestore failed:', err));
          if (cancelledRef.current) return; 
        }
        
        // Local DummyData Fetch
        // const items: BirdEvent[] = dummyBirdData;

        // Firestore Fetch
        /*
        const snap = await firestore()
          .collection('birds')
          .orderBy('timestamp', 'desc')
          .get(); 
        
        const items: BirdEvent[] = snap.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: doc.id,
            species: d.species,
            soundName: d.soundName,
            timestamp: d.timestamp,
            imageUrl: d.imageUrl,
            location: d.location,
            device: d.device,
          } as BirdEvent;
        });
        */

        // LocalDB Fetch
        const rows = await getRecent(0, 100);
        if (cancelledRef.current) return;

        const items: BirdEvent[] = rows.map((r: any) => ({
          id: r.firestoreId ?? String(r.id),
          species: r.species ?? undefined,
          soundName: r.soundName ?? undefined,
          timestamp: new Date(r.timestamp).toISOString(),
          imageUrl: r.imageUrl ?? undefined,
          location: r.location ? JSON.parse(r.location) : undefined,
          device: r.device ?? undefined,
        }));
        
        if (cancelledRef.current) return; 
        else setEvents(items);

      } catch (err) {
        console.warn('Failed to fetch birds:', err);
      } finally {
        syncingRef.current = false;
      }
    })();

    return () => {
       cancelledRef.current = true;
    };
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <BirdCard event={item} />}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      <FloatingActionButton onPress={() => { /* TODO: customer service */ }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
});