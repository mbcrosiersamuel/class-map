export interface GeocodeSuggestion {
  place_name: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
}

interface MapboxContext {
  id: string;
  text: string;
}

interface MapboxFeature {
  place_name: string;
  text: string;
  center: [number, number];
  context?: MapboxContext[];
}

interface MapboxGeocodingResponse {
  features?: MapboxFeature[];
}

export async function geocodeSearch(query: string): Promise<GeocodeSuggestion[]> {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place,locality&limit=5`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = (await res.json()) as MapboxGeocodingResponse;
  return (data.features ?? []).map((f) => {
    const context = f.context ?? [];
    const region = context.find((c) => c.id.startsWith('region'));
    const country = context.find((c) => c.id.startsWith('country'));

    return {
      place_name: f.place_name,
      city: f.text,
      state: region?.text ?? null,
      country: country?.text ?? f.place_name.split(', ').pop() ?? '',
      latitude: f.center[1],
      longitude: f.center[0],
    };
  });
}
