let loaderPromise: Promise<typeof google.maps | null> | null = null;
let loadedKey: string | null = null;
let googleAuthFailed = false;
const authListeners = new Set<() => void>();

export function isGoogleMapsAuthFailed(): boolean {
  return googleAuthFailed;
}

export function onGoogleMapsAuthFailed(cb: () => void): () => void {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

export function loadGoogleMaps(apiKey?: string | null): Promise<typeof google.maps | null> {
  if (!apiKey || googleAuthFailed) return Promise.resolve(null);
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loaderPromise && loadedKey === apiKey) {
    return loaderPromise;
  }
  loadedKey = apiKey;

  if (typeof window !== 'undefined') {
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      googleAuthFailed = true;
      authListeners.forEach((fn) => fn());
    };
  }

  loaderPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (googleAuthFailed) resolve(null);
      else resolve(window.google?.maps ?? null);
    };
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return loaderPromise;
}

export interface GeocodedPlace {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  state: string;
  postalCode: string;
  label: string;
}

function parseGoogleAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): Pick<GeocodedPlace, 'locality' | 'city' | 'state' | 'postalCode'> {
  let locality = '';
  let city = '';
  let state = '';
  let postalCode = '';
  for (const c of components) {
    if (c.types.includes('sublocality_level_1') || c.types.includes('sublocality') || c.types.includes('neighborhood')) {
      if (!locality) locality = c.long_name;
    } else if (c.types.includes('locality')) {
      city = c.long_name;
    } else if (c.types.includes('administrative_area_level_1')) {
      state = c.long_name;
    } else if (c.types.includes('postal_code')) {
      postalCode = c.long_name;
    }
  }
  if (!locality && city) locality = city;
  return { locality, city, state, postalCode };
}

export async function forwardGeocode(
  query: string,
  apiKey?: string | null
): Promise<GeocodedPlace | null> {
  const maps = await loadGoogleMaps(apiKey);
  if (maps && !googleAuthFailed) {
    try {
      const geocoder = new maps.Geocoder();
      const res = await geocoder.geocode({
        address: query,
        componentRestrictions: { country: 'IN' },
      });
      const first = res.results?.[0];
      if (first) {
        const loc = first.geometry.location;
        const parsed = parseGoogleAddressComponents(first.address_components || []);
        return {
          lat: loc.lat(),
          lng: loc.lng(),
          ...parsed,
          label: [parsed.locality, parsed.city].filter(Boolean).join(', ') || first.formatted_address,
        };
      }
    } catch {
      // fall back to OSM
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`
    );
    if (res.ok) {
      const list = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (list[0]) {
        const parts = list[0].display_name.split(',').map((s) => s.trim());
        return {
          lat: parseFloat(list[0].lat),
          lng: parseFloat(list[0].lon),
          locality: parts[0] || '',
          city: parts[1] || '',
          state: parts[2] || '',
          postalCode: '',
          label: parts.slice(0, 2).join(', '),
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey?: string | null
): Promise<Omit<GeocodedPlace, 'lat' | 'lng'> | null> {
  const maps = await loadGoogleMaps(apiKey);
  if (maps && !googleAuthFailed) {
    try {
      const geocoder = new maps.Geocoder();
      const res = await geocoder.geocode({ location: { lat, lng } });
      const first = res.results?.[0];
      if (first) {
        const parsed = parseGoogleAddressComponents(first.address_components || []);
        return {
          ...parsed,
          label: [parsed.locality, parsed.city].filter(Boolean).join(', ') || first.formatted_address,
        };
      }
    } catch {
      // fall back to OSM
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );
    if (res.ok) {
      const data = (await res.json()) as {
        address?: {
          suburb?: string;
          neighbourhood?: string;
          city_district?: string;
          city?: string;
          town?: string;
          state?: string;
          postcode?: string;
        };
      };
      const a = data.address;
      if (a) {
        const locality = a.suburb || a.neighbourhood || a.city_district || '';
        const city = a.city || a.town || '';
        return {
          locality,
          city,
          state: a.state || '',
          postalCode: a.postcode || '',
          label: [locality, city].filter(Boolean).join(', ') || 'Selected location',
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}
