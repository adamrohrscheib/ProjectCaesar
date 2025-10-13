import { useQuery } from '@tanstack/react-query';
import { nearbySearchPlaces, type Place } from '@/lib/places';
import type { LatLng } from '@/lib/places';

export function useNearbyPlaces(params: {
  enabled: boolean;
  center: LatLng;
  radiusMeters: number;
  includedTypes?: string[];
  limit?: number;
}) {
  const { enabled, center, radiusMeters, includedTypes = ['restaurant'], limit = 10 } = params;

  return useQuery<Place[]>({
    queryKey: ['placesNearby', center.latitude, center.longitude, radiusMeters, includedTypes.join(','), limit],
    queryFn: () => nearbySearchPlaces(center, radiusMeters, includedTypes, limit),
    enabled,
    staleTime: 60_000,
  });
}


