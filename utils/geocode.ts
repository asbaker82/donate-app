const cache = new Map<string, { lat: number; lng: number } | null>();

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'YoinkIt/1.0 (yoink-it)' },
    });
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) {
      cache.set(key, null);
      return null;
    }
    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}
