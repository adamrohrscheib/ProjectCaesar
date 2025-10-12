import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Camera, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopIconButton from '@/components/TopIconButton';
import FloatingOvalButton from '@/components/FloatingOvalButton';
import { useUserLocation } from '@/hooks/useUserLocation';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { permissionStatus, coords, isRequesting, error } = useUserLocation();
  const mapRef = useRef<MapView | null>(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (coords && mapRef.current && !hasCenteredRef.current) {
      const camera: Partial<Camera> = {
        center: { latitude: coords.latitude, longitude: coords.longitude },
        pitch: 0,
        heading: 0,
        altitude: 1000,
        zoom: 14,
      };
      try {
        mapRef.current.animateCamera(camera as Camera, { duration: 500 });
        hasCenteredRef.current = true;
      } catch {}
    }
  }, [coords]);

  const onStartCaesaring = () => {
    Alert.alert('Caesaring started!', 'We will add check-ins next.');
  };

  const topOffset = insets.top + 12;
  const bottomOffset = insets.bottom + 24;

  const initialRegion: Region = {
    latitude: 40.74601,
    longitude: 74.00160,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={(r) => (mapRef.current = r)}
        style={styles.map}
        showsUserLocation
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
      />

      <View style={[styles.topBar, { top: topOffset }]}>
        <TopIconButton
          iconName="person-circle-outline"
          accessibilityLabel="Open Profile"
          onPress={() => router.push('/profile')}
        />
        <TopIconButton
          iconName="newspaper-outline"
          accessibilityLabel="Open Feed"
          onPress={() => router.push('/feed')}
        />
      </View>

      {permissionStatus === 'denied' ? (
        <View style={[styles.banner, { top: topOffset + 56 }]}> 
          <Text style={styles.bannerText}>Location permission needed to show your position.</Text>
        </View>
      ) : null}

      {permissionStatus === 'granted' && !coords && !isRequesting ? (
        <View style={[styles.banner, { top: topOffset + 56 }]}> 
          <Text style={styles.bannerText}>Waiting for GPS…</Text>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.banner, { top: topOffset + 56 }]}> 
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.bottomCtaContainer, { bottom: bottomOffset }]}> 
        <FloatingOvalButton label="Start Caesaring" onPress={onStartCaesaring} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomCtaContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    alignItems: 'center',
  },
  bannerText: {
    color: '#2d3748',
    textAlign: 'center',
  },
});