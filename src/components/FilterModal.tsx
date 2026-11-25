import { useState } from 'react';
import { X } from 'lucide-react';
import type { DiscoveryParams } from '../api/endpoints';

interface FilterModalProps {
  initial: DiscoveryParams;
  onApply: (next: DiscoveryParams) => void;
  onClose: () => void;
}

export function FilterModal({ initial, onApply, onClose }: FilterModalProps) {
  const [filters, setFilters] = useState<DiscoveryParams>(initial);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h2 style={{ fontSize: 20 }}>Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: 6 }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Looking for
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: '', label: 'All' },
                { value: 'HAVE_ROOM', label: 'Rooms available' },
                { value: 'NEED_ROOM', label: 'Flatmates seeking' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${(filters.listingType || '') === opt.value ? 'active' : ''}`}
                  onClick={() =>
                    setFilters((f) => ({ ...f, listingType: opt.value || undefined }))
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Search radius: {filters.radiusKm ?? 15} km
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={filters.radiusKm ?? 15}
              onChange={(e) =>
                setFilters((f) => ({ ...f, radiusKm: Number(e.target.value) }))
              }
              style={{ width: '100%', accentColor: 'var(--coral)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Max monthly rent: ₹{(filters.maxRent ?? 50000).toLocaleString('en-IN')}
              {(filters.maxRent ?? 50000) >= 50000 ? '+' : ''}
            </label>
            <input
              type="range"
              min={0}
              max={50000}
              step={1000}
              value={filters.maxRent ?? 50000}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFilters((f) => ({ ...f, maxRent: v >= 50000 ? undefined : v }));
              }}
              style={{ width: '100%', accentColor: 'var(--coral)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Room type
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: '', label: 'Any' },
                { value: 'PRIVATE', label: 'Private' },
                { value: 'SHARE', label: 'Shared' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${(filters.roomType || '') === opt.value ? 'active' : ''}`}
                  onClick={() =>
                    setFilters((f) => ({ ...f, roomType: opt.value || undefined }))
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Sort by
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { value: 'DISTANCE', label: 'Nearest' },
                { value: 'COMPATIBILITY', label: 'Best match' },
                { value: 'RENT_ASC', label: 'Lowest rent' },
                { value: 'NEWEST', label: 'Newest' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${(filters.sortBy || 'DISTANCE') === opt.value ? 'active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, sortBy: opt.value }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1 }}
              onClick={() => {
                onApply({ radiusKm: 15, sortBy: 'DISTANCE' });
                onClose();
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ flex: 2 }}
              onClick={() => {
                onApply(filters);
                onClose();
              }}
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
