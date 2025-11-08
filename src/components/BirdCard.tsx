import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { BirdEvent } from '../types';

type Props = {
  event: BirdEvent;
};

export default function BirdCard({ event }: Props) {
  // Prefetch image once when this card mounts
  useEffect(() => {
    if (event.imageUrl) {
      Image.prefetch(event.imageUrl);
    }
  }, [event.imageUrl]);

  return (
    <View style={styles.item}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl, cache: 'force-cache' }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbText}>IMG</Text>
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.species}>{event.species ?? 'Unknown'}</Text>
        <Text style={styles.line}>{event.soundName ?? '—'}</Text>
        <Text style={styles.line}>
          {event.timestamp ? new Date(event.timestamp).toLocaleString() : '-'}
        </Text>
        <Text style={styles.line}>
          Lat: {event.location?.lat ?? '-'}, Lng: {event.location?.lng ?? '-'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    backgroundColor: '#1A434E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: '#234955' },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  thumbText: { color: '#B0BEC5', fontWeight: '700' },
  meta: { marginLeft: 12, flex: 1 },
  species: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  line: { fontSize: 13, color: '#B0BEC5', marginTop: 4 },
});