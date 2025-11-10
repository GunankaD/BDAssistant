import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BoxCard from '../components/BoxCard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import FloatingActionButton from '../components/FloatingActionButton';
import { Server, History } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      <View style={styles.grid}>
        <BoxCard
          title="Devices"
          subtitle="View all farm devices (online/offline, last seen)"
          icon={Server}
          onPress={() => navigation.navigate('Devices')}
          testID="devices-card"
        />

        <BoxCard
          title="History"
          subtitle="View all bird events (images, sound, time & location)"
          icon={History}
          onPress={() => navigation.navigate('History')}
          testID="history-card"
        />
      </View>

      <FloatingActionButton onPress={() => { /* TODO: customer service */ }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#C8D9D5' },
  header: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#0f172a' },
  grid: { flex: 1, justifyContent: 'flex-start' },
});
// #F8FAFC
