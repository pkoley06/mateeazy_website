/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    interface MapMouseEvent {
      latLng?: LatLng | null;
    }
    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }
    interface GeocoderResult {
      formatted_address: string;
      address_components: GeocoderAddressComponent[];
      geometry: { location: LatLng };
    }
    class Geocoder {
      geocode(req: {
        address?: string;
        location?: { lat: number; lng: number };
        componentRestrictions?: { country: string };
      }): Promise<{ results: GeocoderResult[] }>;
    }
    class Map {
      constructor(el: HTMLElement, opts: Record<string, unknown>);
      setCenter(center: { lat: number; lng: number }): void;
      addListener(event: string, fn: (e: MapMouseEvent) => void): void;
    }
    class Marker {
      constructor(opts: Record<string, unknown>);
      setPosition(pos: { lat: number; lng: number }): void;
      getPosition(): LatLng | null | undefined;
      addListener(event: string, fn: () => void): void;
    }
    class Circle {
      constructor(opts: Record<string, unknown>);
      setCenter(center: { lat: number; lng: number }): void;
      setRadius(radiusMeters: number): void;
      setMap(map: Map | null): void;
    }
  }
}

interface Window {
  google?: { maps: typeof google.maps };
}
