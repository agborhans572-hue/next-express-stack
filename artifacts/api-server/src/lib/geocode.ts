interface GeoResult {
  lat: number;
  lng: number;
}

const cache = new Map<string, GeoResult | null>();

async function geocodeViaNominatim(
  location: string,
): Promise<GeoResult | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({ q: location, format: "json", limit: "1" }).toString();

  const res = await fetch(url, {
    headers: { "User-Agent": "Shiprion-Logistics/1.0 (shipping-saas)" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data.length) return null;

  return { lat: parseFloat(data[0]!.lat), lng: parseFloat(data[0]!.lon) };
}

async function geocodeViaGoogle(
  location: string,
  apiKey: string,
): Promise<GeoResult | null> {
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?" +
    new URLSearchParams({ address: location, key: apiKey }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status: string;
    results: { geometry: { location: { lat: number; lng: number } } }[];
  };

  if (data.status !== "OK" || !data.results.length) return null;
  const { lat, lng } = data.results[0]!.geometry.location;
  return { lat, lng };
}

export async function geocodeLocation(
  location: string,
): Promise<GeoResult | null> {
  const key = location.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  let result: GeoResult | null = null;

  try {
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      result = await geocodeViaGoogle(location, googleKey);
    }
    if (!result) {
      result = await geocodeViaNominatim(location);
    }
  } catch {
    result = null;
  }

  cache.set(key, result);
  return result;
}
