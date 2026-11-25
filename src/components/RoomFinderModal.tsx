import { useEffect, useState } from 'react';
import { LocateFixed, Sparkles, X } from 'lucide-react';
import { userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useToast } from '../context/ToastContext';
import { reverseGeocode } from '../utils/googleMaps';
import type { GenderPreference, RoomFinderGoal } from '../types/api';
import { MapPreview } from './MapPreview';
import { PlaceAutocompleteInput } from './PlaceAutocompleteInput';

interface RoomFinderModalProps {
  onClose: () => void;
  onSaved?: () => void;
}

export function RoomFinderModal({ onClose, onSaved }: RoomFinderModalProps) {
  const { profile, refreshProfile } = useAuth();
  const { mapsApiKey } = useBranding();
  const { showToast } = useToast();

  const [isRoomSeeker, setIsRoomSeeker] = useState(profile?.isRoomSeeker ?? false);
  const [goal, setGoal] = useState<RoomFinderGoal>(profile?.roomFinderGoal ?? 'ROOM');
  const [genderPref, setGenderPref] = useState<GenderPreference>(
    profile?.roomFinderGender ?? 'ALL'
  );
  const [radiusKm, setRadiusKm] = useState(10);
  const [lat, setLat] = useState(22.5726);
  const [lng, setLng] = useState(88.3639);
  const [locality, setLocality] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .getSearchPreferences()
      .then((prefs) => {
        setLat(prefs.latitude);
        setLng(prefs.longitude);
        setLocality(prefs.locality || '');
        setRadiusKm(Math.min(30, Math.max(2, prefs.searchRadiusKm || 10)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const useGps = () => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        const rev = await reverseGeocode(nextLat, nextLng, mapsApiKey);
        if (rev?.label) setLocality(rev.label);
      },
      () => showToast('Location permission denied', 'error')
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updateRoomSeeker({
        isRoomSeeker,
        roomFinderGoal: goal,
        roomFinderGender: genderPref,
      });
      if (locality.trim()) {
        await userApi.updateSearchPreferences({
          latitude: lat,
          longitude: lng,
          locality: locality.trim(),
          searchRadiusKm: radiusKm,
        });
      }
      await refreshProfile();
      showToast(
        isRoomSeeker ? 'Room Finder Mode updated!' : 'Room Finder Mode paused',
        'success'
      );
      onSaved?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'var(--chip)',
                color: 'var(--coral)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 20 }}>Room Finder Mode</h2>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                Let nearby hosts &amp; flatmates find you
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 260 }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active Toggle */}
            <label
              className="card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                background: isRoomSeeker ? 'var(--chip)' : 'var(--input-fill)',
                cursor: 'pointer',
              }}
            >
              <div>
                <strong style={{ fontSize: 15 }}>
                  {isRoomSeeker ? 'Room Finder is Active' : 'Room Finder is Paused'}
                </strong>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {isRoomSeeker
                    ? 'Your profile appears in nearby seekers'
                    : 'Turn on to be visible to hosts & seekers'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={isRoomSeeker}
                onChange={(e) => setIsRoomSeeker(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--coral)' }}
              />
            </label>

            {/* Goal: A room vs A mate */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                I am looking for
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(
                  [
                    ['ROOM', 'A room'],
                    ['MATE', 'A flatmate'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${goal === v ? 'active' : ''}`}
                    style={{ padding: '8px 16px' }}
                    onClick={() => setGoal(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender preference */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Show me rooms / mates for
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    ['ALL', 'Open to all genders'],
                    ['MALE', 'Male'],
                    ['FEMALE', 'Female'],
                    ['NON_BINARY', 'Non-binary'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${genderPref === v ? 'active' : ''}`}
                    onClick={() => setGenderPref(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Area + Map */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Target area &amp; alert radius ({Math.round(radiusKm)} km)
              </label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <PlaceAutocompleteInput
                  placeholder={locality || 'Search locality (e.g. Koramangala)'}
                  onSelect={(place) => {
                    setLat(place.lat);
                    setLng(place.lng);
                    setLocality(place.label);
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0 14px' }}
                  onClick={useGps}
                  title="Use GPS"
                >
                  <LocateFixed size={16} color="var(--coral)" />
                </button>
              </div>

              <MapPreview
                lat={lat}
                lng={lng}
                label={locality || 'Target area'}
                height={150}
                radiusKm={radiusKm}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--coral)' }}
                />
                {[5, 10, 20].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${Math.round(radiusKm) === p ? 'active' : ''}`}
                    style={{ fontSize: 11 }}
                    onClick={() => setRadiusKm(p)}
                  >
                    {p} km
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '13px 20px' }}
            >
              {saving ? 'Saving...' : 'Save Room Finder settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
