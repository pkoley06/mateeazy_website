import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  MapPin,
  Heart,
  Sparkles,
  Plus,
} from 'lucide-react';
import { discoveryApi, listingApi, userApi, type DiscoveryParams } from '../api/endpoints';
import type { DiscoveryCard } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FilterModal } from '../components/FilterModal';

export function DiscoverPage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.9716,
    lng: 77.5946,
  });
  const [filters, setFilters] = useState<DiscoveryParams>({
    radiusKm: 15,
    sortBy: 'DISTANCE',
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        userApi.updateLocation(lat, lng).catch(() => {});
      },
      () => {
        // Keep default coordinates if permission denied
      },
      { timeout: 5000 }
    );
  }, []);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await discoveryApi.getFeed({
        ...filters,
        lat: coords.lat,
        lng: coords.lng,
        size: 30,
      });
      setCards(res.content || []);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not load discovery feed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [filters, coords, showToast]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const toggleRoomSeeker = async () => {
    if (!profile) return;
    try {
      await userApi.updateRoomSeeker({ isRoomSeeker: !profile.isRoomSeeker });
      await refreshProfile();
      showToast(
        !profile.isRoomSeeker
          ? 'Room Finder Mode turned on'
          : 'Room Finder Mode turned off',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  };

  const toggleLike = async (e: React.MouseEvent, card: DiscoveryCard) => {
    e.stopPropagation();
    if (!card.listingId) return;
    setCards((prev) =>
      prev.map((c) =>
        c.listingId === card.listingId ? { ...c, likedByMe: !c.likedByMe } : c
      )
    );
    try {
      await listingApi.toggleLike(card.listingId);
    } catch {
      setCards((prev) =>
        prev.map((c) =>
          c.listingId === card.listingId ? { ...c, likedByMe: card.likedByMe } : c
        )
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26 }}>Discover</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Rooms &amp; flatmates within {filters.radiusKm ?? 15} km
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className={`chip ${profile?.isRoomSeeker ? 'active' : ''}`}
            style={{ padding: '9px 14px' }}
            onClick={toggleRoomSeeker}
          >
            <Sparkles size={14} />
            <span>Room Finder {profile?.isRoomSeeker ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
          </button>

          <Link
            to="/listings/new"
            className="btn-primary"
            style={{ padding: '8px 14px' }}
          >
            <Plus size={16} />
            <span>Post</span>
          </Link>
        </div>
      </div>

      {/* Feed Grid */}
      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '4/3', borderRadius: 0 }} />
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 18, width: '75%' }} />
                <div className="skeleton" style={{ height: 13, width: '50%' }} />
                <div className="skeleton" style={{ height: 24, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No matches nearby yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>
            Try increasing your search radius or resetting filters.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowFilters(true)}
          >
            Adjust filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {cards.map((card, idx) => {
            const isRoom = Boolean(card.listingId);
            const cover =
              card.photoUrls[0] ||
              card.avatarUrl ||
              '/assets/img/room-balcony.jpg';
            return (
              <article
                key={card.listingId || `${card.hostUserId}-${idx}`}
                className="card card-interactive"
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => {
                  if (isRoom) {
                    navigate(`/discover/room/${card.listingId}`, {
                      state: { card },
                    });
                  } else {
                    navigate(`/users/${card.hostUserId}`);
                  }
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--surface-alt)' }}>
                  <img
                    src={cover}
                    alt={card.title || card.hostName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {card.matchPercentage != null && (
                    <span
                      className="chip gold"
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        fontWeight: 700,
                      }}
                    >
                      {Math.round(card.matchPercentage)}% match
                    </span>
                  )}
                  {isRoom && (
                    <button
                      type="button"
                      onClick={(e) => toggleLike(e, card)}
                      aria-label="Save room"
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Heart
                        size={17}
                        fill={card.likedByMe ? '#FF6B5B' : 'none'}
                        color={card.likedByMe ? '#FF6B5B' : '#2B1B3D'}
                      />
                    </button>
                  )}
                </div>

                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {card.title ||
                        (isRoom
                          ? `${card.roomType === 'PRIVATE' ? 'Private' : 'Shared'} room`
                          : `${card.hostName}, ${card.hostAge}`)}
                    </h3>
                    {card.rentAmount != null && (
                      <strong style={{ color: 'var(--coral)', fontSize: 15, flexShrink: 0 }}>
                        ₹{card.rentAmount.toLocaleString('en-IN')}
                      </strong>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)' }}>
                    <MapPin size={13} />
                    <span>
                      {card.localityName}
                      {card.distanceKm != null ? ` · ${card.distanceKm.toFixed(1)} km` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {card.roomType && (
                      <span className="chip" style={{ fontSize: 11 }}>
                        {card.roomType === 'PRIVATE' ? 'Private room' : 'Shared room'}
                      </span>
                    )}
                    {card.compatibilityHighlights.slice(0, 2).map((h) => (
                      <span key={h} className="chip coral" style={{ fontSize: 11 }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 10,
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <img
                      src={card.avatarUrl || '/assets/img/avatar-priya.png'}
                      alt={card.hostName}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {card.hostName}, {card.hostAge}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showFilters && (
        <FilterModal
          initial={filters}
          onApply={(next) => setFilters(next)}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
