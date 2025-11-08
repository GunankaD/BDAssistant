import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  onPress?: (e: GestureResponderEvent) => void;
  testID?: string;
};

export default function BoxCard({ title, subtitle, onPress, testID }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} testID={testID}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A434E',
    borderRadius: 14,
    padding: 20,
    marginVertical: 10,
    // subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 110,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#B0BEC5',
  },
});
