import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DevicesScreen from '../screens/DevicesScreen';
import ProfileScreen from '../screens/ProfileScreen';

import HeaderProfileButton from '../components/HeaderProfileButton';

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
  Devices: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#1A434E' },
        headerTintColor: '#FFFFFF',                  // text + back icon color
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
            title: 'Bird Deterrent Assistant',
            headerRight: () => <HeaderProfileButton />,
        }}
        />
      <Stack.Screen name="Devices" component={DevicesScreen} options={{ title: 'Devices' }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}