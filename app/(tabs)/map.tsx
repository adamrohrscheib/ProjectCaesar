import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import MapView, { Camera, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopIconButton from '@/components/TopIconButton';
import { useUserLocation } from '@/hooks/useUserLocation';
import CheckInModal from '@/components/CheckInModal';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { permissionStatus, coords, isRequesting, error } = useUserLocation();
  const mapRef = useRef<MapView | null>(null);
  const hasCenteredRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sheetRef = useRef<BottomSheet | null>(null);
  const snapPoints = useMemo(() => ['18%', '50%'], []);

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
    setIsModalOpen(true);
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
        customMapStylei="314a85c7603856bb7deb6770"
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
          onPress={() => router.push('/search' as any)}
        />
      </View>

      {/* Persistent bottom sheet for feed and the Check in bar */}
      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: '#fff' }}
        handleIndicatorStyle={{ backgroundColor: '#CBD5E0' }}
        style={{ zIndex: 50 }}
      >
        <BottomSheetView style={styles.sheetContent}> 
          <Pressable onPress={onStartCaesaring} style={styles.checkInBar}>
            <Text style={styles.checkInText}>Check in</Text>
          </Pressable>
          <View style={styles.bottomSheetBody}>
            <Text style={styles.bottomSheetText}>Under construction</Text>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <CheckInModal
        visible={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        center={{ latitude: 40.7460, longitude: -74.0016 }}
        userId={'1'}
      />
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
  sheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  checkInBar: {
    height: 48,
    marginTop: 12,
    marginBottom: 8,
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