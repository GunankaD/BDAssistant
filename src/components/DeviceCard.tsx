import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Device } from '../types';

type Props = {
  device: Device;
};

export default function DeviceCard({ device }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{device.deviceName}</Text>
        <Text style={[styles.status, device.status === 'online' ? styles.online : styles.offline]}>
          {device.status ?? 'unknown'}
        </Text>
      </View>

      <Text style={styles.line}>ID: {device.id}</Text>
      {device.installedLocation ? <Text style={styles.line}>Location: {device.installedLocation}</Text> : null}
      {device.version ? <Text style={styles.line}>Version: {device.version}</Text> : null}
      {device.lastSynced ? <Text style={styles.line}>Last synced: {new Date(device.lastSynced).toLocaleString()}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A434E',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  online: { color: '#4ADE80' },
  offline: { color: '#F87171' },
  line: { marginTop: 6, color: '#B0BEC5', fontSize: 13 },
});