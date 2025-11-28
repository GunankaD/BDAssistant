import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, View, StyleSheet, Text } from 'react-native';
import DeviceCard from '../components/DeviceCard';
import type { Device } from '../types';
import { dummyDeviceData } from '../data/dummyDeviceData'
import FloatingActionButton from '../components/FloatingActionButton'
import TranslatedText from '../components/TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import * as Translator from '../i18n/translator';

const DUMMY: Device[] = dummyDeviceData;

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>(DUMMY);
   const { lang, prefetch } = useLanguage();

  useEffect(() => {
    // placeholder: later attach Firestore listener e.g.
    // firestore().collection('devices').onSnapshot(...)
    // (async () => {
    //   try {
    //     const res = await fetch('https://libretranslate.com/translate', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({ q: 'No devices found', source: 'en', target: 'kn', format: 'text' }),
    //     });
    //     console.log('raw status', res.status);
    //     const json = await res.json();
    //     console.log('raw translate body', json);
    //   } catch (e) {
    //     console.error('raw fetch error', e);
    //   }
    // })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DeviceCard device={item} />}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>
            <TranslatedText text="No devices found" />
          </Text>
        )}
      />
      <FloatingActionButton onPress={() => { /* TODO: customer service */ }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#C8D9D5' },
  empty: { padding: 16, textAlign: 'center', color: '#64748b' },
});