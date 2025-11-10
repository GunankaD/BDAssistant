import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { initFCM } from './firebase/messaging';

export default function App() {
  useEffect(() => {
    initFCM();
  }, []);

  return (
    <SafeAreaProvider>
        <NavigationContainer>
            <AppNavigator />
        </NavigationContainer>
    </SafeAreaProvider>
  );
}