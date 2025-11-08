import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';
import type { Device } from '../types';

type Props = {
  device: Device;
};

export default function DeviceCard({ device }: Props) {
  return (
    <View style={styles.item}>
      {/* Icon block on the left */}
      <View style={styles.iconBox}>
        <Camera size={36} color="#B0BEC5" />
      </View>

      {/* Text info on the right */}
      <View style={styles.meta}>
        <View style={styles.row}>
          <Text style={styles.name}>{device.deviceName}</Text>
          <Text style={[styles.status, device.status === 'online' ? styles.online : styles.offline]}>
            {device.status ?? 'unknown'}
          </Text>
        </View>

        <Text style={styles.line}>ID: {device.id}</Text>
        {device.installedLocation && (
          <Text style={styles.line}>Location: {device.installedLocation}</Text>
        )}
        {device.version && <Text style={styles.line}>Version: {device.version}</Text>}
        {device.lastSynced && (
          <Text style={styles.line}>
            Last synced: {new Date(device.lastSynced).toLocaleString()}
          </Text>
        )}
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
    marginBottom: 4,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: '#234955',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { marginLeft: 12, flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  online: { color: '#4ADE80' },
  offline: { color: '#F87171' },
  line: { fontSize: 13, color: '#B0BEC5', marginTop: 4 },
});
