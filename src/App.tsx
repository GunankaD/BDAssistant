import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { initFCM } from './firebase/messaging';
import { bootstrapApp } from './AppInit';
import useSyncOnResume from './hooks/useSyncOnResume';
import { printLocalDB } from './dev/printLocalDB';
import { LanguageProvider } from './context/LanguageContext';
// import Translator from './i18n/translator';

export default function App() {
  // Translator.setApiConfig({ provider: 'libre', url: 'https://libretranslate.de/translate' });

  // 1) local database
  useEffect(() => { bootstrapApp(); }, []);

  // 2) sets up listener to change in state of app
  // useSyncOnResume();

  // 3) notifications
  useEffect(() => { initFCM(); }, []);

  return (
    <LanguageProvider>
      <SafeAreaProvider>
          <NavigationContainer>
              <AppNavigator />
          </NavigationContainer>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}