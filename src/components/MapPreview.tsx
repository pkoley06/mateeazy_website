import { ExternalLink, MapPin } from 'lucide-react';

interface MapPreviewProps {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
  radiusKm?: number;
}

export function MapPreview({
  lat,
  lng,
  label,
  height = 210,
  radiusKm,
}: MapPreviewProps) {
  const delta = radiusKm ? Math.max(0.015, radiusKm * 0.009) : 0.015;
  const bbox = [
    (lng - delta).toFixed(5),
    (lat - delta).toFixed(5),
    (lng + delta).toFixed(5),
    (lat + delta).toFixed(5),
  ].join('%2C');

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;
  const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface-alt)',
      }}
    >
      <iframe
        title={label || 'Location map'}
        src={osmUrl}
        style={{
          width: '100%',
          height,
          border: 'none',
          display: 'block',
        }}
        loading="lazy"
      />
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
          <span>Open in Maps</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
