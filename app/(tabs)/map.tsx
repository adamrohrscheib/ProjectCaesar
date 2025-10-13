import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import MapView, { Camera, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopIconButton from '@/components/TopIconButton';
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
    Alert.alert('Check in', 'This will open a check-in flow.');
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

      {/* Top actions */}

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

      {/* Floating buttons for Account and Search */}
      <View style={[styles.topBar, { top: topOffset }]}> 
        <TopIconButton
          iconName="person-circle-outline"
          accessibilityLabel="Open Profile"
          onPress={() => router.push('/profile')}
        />
        <TopIconButton
          iconName="search-outline"
          accessibilityLabel="Open Search"
          // onPress={() => router.push({ pathname: '/search' })}
          onPress={() => {}}
        />
      </View>

      {/* Bottom sheet stub */}
      <View style={[styles.bottomSheet, { bottom: 0 }]}> 
        <Pressable onPress={onStartCaesaring} style={styles.checkInBar}>
          <Text style={styles.checkInText}>Check in</Text>
        </Pressable>
        <View style={styles.bottomSheetBody}>
          <Text style={styles.bottomSheetText}>Under construction</Text>
        </View>
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
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  checkInBar: {
    height: 48,
    margin: 12,
    borderRadius: 12,
    backgroundColor: '#5A67D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetBody: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 6,
  },
  bottomSheetText: {
    textAlign: 'center',
    color: '#4a5568',
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