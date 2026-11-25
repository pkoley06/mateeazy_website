import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import {
  forwardGeocode,
  loadGoogleMaps,
  type GeocodedPlace,
} from '../utils/googleMaps';

interface PlaceAutocompleteInputProps {
  placeholder: string;
  onSelect: (place: GeocodedPlace) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  main: string;
  secondary: string;
  full: string;
  place?: GeocodedPlace;
}

export function PlaceAutocompleteInput({
  placeholder,
  onSelect,
  className = 'input-well',
}: PlaceAutocompleteInputProps) {
  const { googleMapsApiKey } = useBranding();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesHostRef = useRef<HTMLDivElement | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    loadGoogleMaps(googleMapsApiKey).then((maps) => {
      if (!maps?.places) return;
      if (!serviceRef.current) {
        serviceRef.current = new maps.places.AutocompleteService();
      }
      if (!placesServiceRef.current && placesHostRef.current) {
        placesServiceRef.current = new maps.places.PlacesService(
          placesHostRef.current
        );
      }
    });
  }, [googleMapsApiKey]);

  const fetchOsmSuggestions = async (trimmed: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) return;
      const list = (await res.json()) as Array<{
        place_id: number;
        lat: string;
        lon: string;
        display_name: string;
        address?: {
          suburb?: string;
          neighbourhood?: string;
          city?: string;
          town?: string;
          state?: string;
          postcode?: string;
        };
      }>;
      if (list.length > 0) {
        setSuggestions(
          list.map((item) => {
            const parts = item.display_name.split(',').map((s) => s.trim());
            const locality =
              item.address?.suburb ||
              item.address?.neighbourhood ||
              parts[0] ||
              '';
            const city = item.address?.city || item.address?.town || parts[1] || '';
            return {
              id: String(item.place_id),
              main: parts[0] || item.display_name,
              secondary: parts.slice(1, 4).join(', '),
              full: item.display_name,
              place: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                locality,
                city,
                state: item.address?.state || '',
                postalCode: item.address?.postcode || '',
                label: [locality, city].filter(Boolean).join(', ') || parts[0],
              },
            };
          })
        );
        setOpen(true);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      if (serviceRef.current) {
        serviceRef.current.getPlacePredictions(
          { input: trimmed, componentRestrictions: { country: 'in' } },
          (preds, status) => {
            if (status === 'OK' && preds && preds.length > 0) {
              setSuggestions(
                preds.slice(0, 5).map((p) => ({
                  id: p.place_id,
                  main: p.structured_formatting?.main_text || p.description,
                  secondary: p.structured_formatting?.secondary_text || '',
                  full: p.description,
                }))
              );
              setOpen(true);
            } else {
              void fetchOsmSuggestions(trimmed);
            }
          }
        );
      } else {
        void fetchOsmSuggestions(trimmed);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query]);

  const pickSuggestion = async (s: Suggestion) => {
    setOpen(false);
    setQuery('');
    if (s.place) {
      onSelect(s.place);
      return;
    }
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: s.id,
          fields: ['geometry', 'address_components', 'formatted_address'],
        },
        async (res, status) => {
          if (status === 'OK' && res?.geometry?.location) {
            const loc = res.geometry.location;
            let locality = '';
            let city = '';
            let state = '';
            let postalCode = '';
            for (const c of res.address_components || []) {
              if (
                c.types.includes('sublocality_level_1') ||
                c.types.includes('sublocality') ||
                c.types.includes('neighborhood')
              ) {
                if (!locality) locality = c.long_name;
              } else if (c.types.includes('locality')) {
                city = c.long_name;
              } else if (c.types.includes('administrative_area_level_1')) {
                state = c.long_name;
              } else if (c.types.includes('postal_code')) {
                postalCode = c.long_name;
              }
            }
            if (!locality) locality = s.main;
            onSelect({
              lat: loc.lat(),
              lng: loc.lng(),
              locality,
              city,
              state,
              postalCode,
              label: [locality, city].filter(Boolean).join(', ') || s.main,
            });
            return;
          }
          const fallback = await forwardGeocode(s.full, googleMapsApiKey);
          if (fallback) onSelect(fallback);
        }
      );
      return;
    }

    const fallback = await forwardGeocode(s.full, googleMapsApiKey);
    if (fallback) onSelect(fallback);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (suggestions[0]) {
      void pickSuggestion(suggestions[0]);
      return;
    }
    const q = query.trim();
    if (!q) return;
    const hit = await forwardGeocode(q, googleMapsApiKey);
    if (hit) {
      setOpen(false);
      setQuery('');
      onSelect(hit);
    }
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div ref={placesHostRef} style={{ display: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          className={className}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setOpen(false);
            }}
            style={{
              position: 'absolute',
              right: 8,
              border: 'none',
              background: 'transparent',
              color: 'var(--muted)',
              padding: 4,
            }}
            aria-label="Clear"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 80,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => void pickSuggestion(s)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <MapPin size={15} color="var(--coral)" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.main}</div>
                {s.secondary && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.secondary}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
