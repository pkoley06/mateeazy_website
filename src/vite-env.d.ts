/// <reference types="vite/client" />

declare namespace google {
  namespace maps {
    interface LatLng {
      lat(): number;
      lng(): number;
    }
    interface LatLngBounds {}
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
      fitBounds(bounds: LatLngBounds, padding?: number): void;
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
      getBounds(): LatLngBounds | null;
      setMap(map: Map | null): void;
    }
    namespace places {
      interface AutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting?: {
          main_text: string;
          secondary_text?: string;
        };
      }
      class AutocompleteService {
        getPlacePredictions(
          req: { input: string; componentRestrictions?: { country: string } },
          cb: (results: AutocompletePrediction[] | null, status: string) => void
        ): void;
      }
      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map);
        getDetails(
          req: { placeId: string; fields: string[] },
          cb: (result: GeocoderResult | null, status: string) => void
        ): void;
      }
    }
  }
}

interface Window {
  google?: { maps: typeof google.maps };
}
