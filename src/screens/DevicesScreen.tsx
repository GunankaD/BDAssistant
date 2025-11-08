import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, View, StyleSheet, Text } from 'react-native';
import DeviceCard from '../components/DeviceCard';
import type { Device } from '../types';
import { dummyDeviceData } from '../data/dummyDeviceData'

const DUMMY: Device[] = dummyDeviceData;

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>(DUMMY);

  useEffect(() => {
    // placeholder: later attach Firestore listener e.g.
    // firestore().collection('devices').onSnapshot(...)
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DeviceCard device={item} />}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => <Text style={styles.empty}>No devices found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  empty: { padding: 16, textAlign: 'center', color: '#64748b' },
});