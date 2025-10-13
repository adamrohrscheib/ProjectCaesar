import Constants from 'expo-constants';
import { withApiLogging } from '@/lib/apiLogger';

export type LatLng = { latitude: number; longitude: number };

export type Place = {
  id: string;
  displayName: string;
  location?: LatLng | null;
  address?: string | null;
};

function getPlacesApiKey(): string | undefined {
  const extra = (Constants.expoConfig as any)?.extra ?? {};
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  const fromExtra = extra.googlePlacesApiKey || extra.google?.placesApiKey;
  return fromEnv || fromExtra;
}

export async function nearbySearchPlaces(
  center: LatLng,
  radiusMeters: number,
  includedTypes: string[] = ['restaurant'],
  limit: number = 10
): Promise<Place[]> {
  const apiKey = getPlacesApiKey();
  if (!apiKey) {
    throw new Error('Missing Google Places API key (EXPO_PUBLIC_GOOGLE_PLACES_API_KEY)');
  }

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes,
    maxResultCount: Math.max(1, Math.min(limit, 20)),
    locationRestriction: {
      circle: {
        center: { latitude: center.latitude, longitude: center.longitude },
        radius: radiusMeters,
      },
    },
  } as const;

  const fieldMask = [
    'places.displayName',
    'places.location',
    'places.formattedAddress',
    'places.shortFormattedAddress',
  ].join(',');
  const res = await withApiLogging('places.searchNearby', { center, radiusMeters, includedTypes, limit }, () =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    })
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Places search failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as any;
  const places = (json.places ?? []) as any[];
  return places.slice(0, limit).map((p) => ({
    id: String(p.id ?? p.name ?? Math.random().toString(36).slice(2)),
    displayName: p.displayName?.text ?? 'Unknown',
    location: p.location
      ? { latitude: Number(p.location.latitude), longitude: Number(p.location.longitude) }
      : null,
    address: p.shortFormattedAddress ?? p.formattedAddress ?? null,
  }));
}


