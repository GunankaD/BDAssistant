import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BirdEvent } from '../types';
import { dummyBirdData } from '../data/dummyBirdData'

const DUMMY: BirdEvent[] = dummyBirdData;

export default function HistoryScreen() {
  const [events, setEvents] = useState<BirdEvent[]>(DUMMY);

  useEffect(() => {
    // placeholder: later we'll attach Firestore listener and call setEvents(...)
  }, []);

  const renderItem = ({ item }: { item: BirdEvent }) => (
    <View style={styles.item}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}><Text style={styles.thumbText}>IMG</Text></View>
      )}
      <View style={styles.meta}>
        <Text style={styles.species}>{item.species}</Text>
        <Text style={styles.line}>{item.soundName} • {new Date(item.timestamp).toLocaleString()}</Text>
        <Text style={styles.line}>Lat: {item.location?.lat ?? '-'}, Lng: {item.location?.lng ?? '-'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  item: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center',
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: '#eee' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbText: { color: '#666', fontWeight: '700' },
  meta: { marginLeft: 12, flex: 1 },
  species: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  line: { fontSize: 13, color: '#475569', marginTop: 4 },
});
