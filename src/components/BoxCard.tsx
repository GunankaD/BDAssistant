import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type Props = {
  title: string;
  subtitle?: string;
  onPress?: (e: GestureResponderEvent) => void;
  testID?: string;
  icon?: LucideIcon;
};

export default function BoxCard({ title, subtitle, onPress, testID, icon: Icon }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} testID={testID}>
      <View style={styles.card}>
        {Icon && (
          <View style={styles.iconWrap}>
            <Icon size={36} color="#FFFFFF" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#1A434E',
    borderRadius: 14,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 110,
    alignItems: 'center',
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { marginTop: 6, fontSize: 13, color: '#B0BEC5' },
});
