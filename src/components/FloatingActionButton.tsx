import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onPress?: () => void;
  label?: string;
};

export default function FloatingActionButton({ onPress, label = '💬' }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[
        styles.fab,
        { right: 30, bottom: 24 + (insets.bottom || 0) }, // not too corner
      ]}
    >
      <Text style={styles.icon}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#0ea5e9', // light blue
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  icon: { fontSize: 30, color: 'white' },
});
