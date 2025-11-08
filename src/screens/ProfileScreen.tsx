import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.page}>

      <View style={styles.avatarWrap}>
        <Text style={styles.avatar}>👤</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>Gunanka D</Text>
        <Text style={styles.small}>gunanka.is22@bmsce.ac.in</Text>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Farm Manager</Text>
          </View>
          <View style={styles.badgeOutline}>
            <Text style={styles.badgeOutlineText}>Member since Jan 1, 2025</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account details</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Devices linked</Text>
            <Text style={styles.value}>2</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Last active</Text>
            <Text style={styles.value}>Nov 7, 2025</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Preferred location</Text>
            <Text style={styles.value}>Farm A — North Gate</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Plan</Text>
            <Text style={styles.value}>Gold</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => { /* TODO: edit profile */ }}>
          <Text style={styles.editText}>Edit profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#1A434E',
    alignItems: 'center',
  },

  header: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

  avatarWrap: {
    marginTop: 40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // soft elevated ring
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  avatar: { fontSize: 64 },

  info: {
    marginTop: 18,
    width: '92%',
    alignItems: 'center',
  },

  name: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  small: { color: '#B0BEC5', marginTop: 6, marginBottom: 12 },

  badgesRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10, // some RN versions ignore gap, spacing handled below
  },
  badge: {
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  badgeOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeOutlineText: { color: '#B0BEC5', fontSize: 13 },

  card: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  cardTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, marginBottom: 10 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.02)',
  },
  label: { color: '#B0BEC5', fontSize: 13 },
  value: { color: '#FFFFFF', fontWeight: '700', maxWidth: '60%', textAlign: 'right' },

  editBtn: {
    marginTop: 22,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  editText: { color: '#1A434E', fontWeight: '800', fontSize: 15 },
});