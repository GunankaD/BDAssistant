import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { initFCM } from './firebase/messaging';
import { bootstrapApp } from './AppInit';
import useSyncOnResume from './hooks/useSyncOnResume';
import { printLocalDB } from './dev/printLocalDB';

export default function App() {
  // 1) local database
  useEffect(() => { bootstrapApp(); }, []);

  // 2) sets up listener to change in state of app
  // useSyncOnResume();

  // 3) notifications
  useEffect(() => { initFCM(); }, []);

  return (
    <SafeAreaProvider>
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    </SafeAreaProvider>
  );
}