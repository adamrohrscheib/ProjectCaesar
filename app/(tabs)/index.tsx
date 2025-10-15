import { Image, StyleSheet, Platform } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Stack } from 'expo-router';
import MapScreen from '..';


export default function HomeScreen() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <MapScreen/>
    </Stack>
  );
}