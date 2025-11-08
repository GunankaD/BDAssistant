import React, { useState, useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BirdEvent } from '../types';
import BirdCard from '../components/BirdCard';
import { dummyBirdData } from '../data/dummyBirdData';
import FloatingActionButton from '../components/FloatingActionButton';

const DUMMY: BirdEvent[] = dummyBirdData;

export default function HistoryScreen() {
  const [events, setEvents] = useState<BirdEvent[]>(DUMMY);

  useEffect(() => {
    // later: attach Firestore listener and update setEvents(...)
  }, []);

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