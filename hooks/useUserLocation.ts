import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type LocationPermissionStatus = 'unknown' | 'granted' | 'denied';

export type UserLocationState = {
  permissionStatus: LocationPermissionStatus;
  coords: { latitude: number; longitude: number } | null;
  error: string | null;
  isRequesting: boolean;
};

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({
    permissionStatus: 'unknown',
    coords: null,
    error: null,
    isRequesting: true,
  });

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function setup() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status !== Location.PermissionStatus.GRANTED) {
          setState((prev) => ({
            ...prev,
            permissionStatus: 'denied',
            isRequesting: false,
            error: 'Location permission denied',
          }));
          return;
        }

        setState((prev) => ({ ...prev, permissionStatus: 'granted' }));

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          },
          (loc) => {
            if (!isMounted) return;
            setState({
              permissionStatus: 'granted',
              coords: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
              error: null,
              isRequesting: false,
            });
          }
        );
      } catch (e: any) {
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          error: e?.message ?? 'Failed to get user location',
          isRequesting: false,
        }));
      }
    }

    setup();

    return () => {
      isMounted = false;
      subscriptionRef.current?.remove();
    };
  }, []);

  return state;
}


