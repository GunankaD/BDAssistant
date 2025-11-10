import React, { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { BirdEvent } from '../types';
import BirdCard from '../components/BirdCard';
import FloatingActionButton from '../components/FloatingActionButton';
import firestore from '@react-native-firebase/firestore';
import { dummyBirdData } from '../data/dummyBirdData';

export default function HistoryScreen() {
  const [events, setEvents] = useState<BirdEvent[]>([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    let cancelled = false;

    (async () => {
      try {
        const snap = await firestore()
          .collection('birds')
          .orderBy('timestamp', 'desc')
          .get();

        if (cancelled) return;

        let items: BirdEvent[] = snap.docs.map(doc => {
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

        // items = dummyBirdData;

        setEvents(items);
      } catch (err) {
        console.warn('Failed to fetch birds:', err);
      }
    })();

    return () => {
      cancelled = true;
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