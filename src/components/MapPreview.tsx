import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';
import { loadGoogleMaps } from '../utils/googleMaps';

interface MapPreviewProps {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
  radiusKm?: number;
  onPickLocation?: (lat: number, lng: number) => void;
}

export function MapPreview({
  lat,
  lng,
  label,
  height = 210,
  radiusKm,
  onPickLocation,
}: MapPreviewProps) {
  const { mapsApiKey } = useBranding();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [useFallbackEmbed, setUseFallbackEmbed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(mapsApiKey).then((maps) => {
      if (cancelled) return;
      if (!maps || !containerRef.current) {
        setUseFallbackEmbed(true);
        return;
      }
      setUseFallbackEmbed(false);

      const center = { lat, lng };
      if (!mapRef.current) {
        const map = new maps.Map(containerRef.current, {
          center,
          zoom: radiusKm ? Math.max(10, 14 - Math.floor(radiusKm / 6)) : 15,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        const marker = new maps.Marker({
          position: center,
          map,
          draggable: Boolean(onPickLocation),
        });

        if (onPickLocation) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return;
            onPickLocation(e.latLng.lat(), e.latLng.lng());
          });
          marker.addListener('dragend', () => {
            const p = marker.getPosition();
            if (p) onPickLocation(p.lat(), p.lng());
          });
        }

        mapRef.current = map;
        markerRef.current = marker;
      } else {
        mapRef.current.setCenter(center);
        markerRef.current?.setPosition(center);
      }

      if (radiusKm && mapRef.current) {
        if (!circleRef.current) {
          circleRef.current = new maps.Circle({
            map: mapRef.current,
            center,
            radius: radiusKm * 1000,
            fillColor: '#FF6B5B',
            fillOpacity: 0.16,
            strokeColor: '#FF6B5B',
            strokeOpacity: 0.7,
            strokeWeight: 2,
          });
        } else {
          circleRef.current.setCenter(center);
          circleRef.current.setRadius(radiusKm * 1000);
        }
      } else if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm, mapsApiKey, onPickLocation]);

  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const gmapsEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface-alt)',
      }}
    >
      {useFallbackEmbed ? (
        <iframe
          title={label || 'Google Map'}
          src={gmapsEmbedUrl}
          style={{ width: '100%', height, border: 'none', display: 'block' }}
          loading="lazy"
        />
      ) : (
        <div ref={containerRef} style={{ width: '100%', height }} />
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--card)',
          borderTop: '1px solid var(--border)',
          fontSize: 12,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)' }}>
          <MapPin size={13} color="var(--coral)" />
          <span>{label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span>
        </span>
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--coral)',
            fontWeight: 600,
          }}
        >
          <span>Open in Google Maps</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
