import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  MapPin,
  Heart,
  Sparkles,
  Plus,
  Briefcase,
  ArrowRight,
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
  const [geoReady, setGeoReady] = useState(false);
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
    if (!navigator.geolocation) {
      setGeoReady(true);
      return;
    }
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        setGeoReady(true);
      }
    };
    const fallbackTimer = setTimeout(finish, 2000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        userApi.updateLocation(lat, lng).catch(() => {});
        finish();
      },
      () => {
        clearTimeout(fallbackTimer);
        finish();
      },
      { timeout: 2000, maximumAge: 60000 }
    );

    return () => clearTimeout(fallbackTimer);
  }, []);

  const loadFeed = useCallback(async () => {
    if (!geoReady) return;
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
  }, [filters, coords, geoReady, showToast]);

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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
      {loading || !geoReady ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 196, borderRadius: 0 }} />
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {cards.map((card, idx) => {
            const isRoom = Boolean(card.listingId);

            if (!isRoom) {
              // Flatmate / Seeker Card (distinct from Room card)
              return (
                <article
                  key={`seeker-${card.hostUserId}-${idx}`}
                  className="card card-interactive"
                  style={{
                    padding: 18,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                  onClick={() => navigate(`/users/${card.hostUserId}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <img
                      src={card.avatarUrl || '/assets/img/avatar-priya.png'}
                      alt={card.hostName}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '2px solid var(--coral)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <h3
                          style={{
                            fontSize: 17,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {card.hostName}, {card.hostAge}
                        </h3>
                        {card.matchPercentage != null && (
                          <span className="chip gold" style={{ flexShrink: 0 }}>
                            {Math.round(card.matchPercentage)}%
                          </span>
                        )}
                      </div>
                      {card.occupationTitle && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          <Briefcase size={12} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {card.occupationTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span className="chip coral" style={{ fontSize: 11 }}>
                      {card.seekerGoal === 'MATE' ? 'Looking for a flatmate' : 'Looking for a room'}
                    </span>
                    {card.rentAmount != null && (
                      <strong style={{ fontSize: 14, color: 'var(--text)' }}>
                        Budget ₹{card.rentAmount.toLocaleString('en-IN')}/mo
                      </strong>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                    <MapPin size={13} />
                    <span>
                      {card.localityName}
                      {card.distanceKm != null ? ` · ${card.distanceKm.toFixed(1)} km` : ''}
                    </span>
                  </div>

                  {card.compatibilityHighlights.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {card.compatibilityHighlights.slice(0, 3).map((h) => (
                        <span key={h} className="chip" style={{ fontSize: 11 }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      paddingTop: 10,
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--coral)',
                    }}
                  >
                    <span>View flatmate profile</span>
                    <ArrowRight size={14} />
                  </div>
                </article>
              );
            }

            // Room Listing Card (fixed uniform 196px image box)
            const cover = card.photoUrls[0] || '/assets/img/room-balcony.jpg';
            return (
              <article
                key={card.listingId!}
                className="card card-interactive"
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() =>
                  navigate(`/discover/room/${card.listingId}`, {
                    state: { card },
                  })
                }
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: 196,
                    background: 'var(--surface-alt)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={cover}
                    alt={card.title || 'Room'}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
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
                      background: 'rgba(255,255,255,0.92)',
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
                </div>

                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                        `${card.roomType === 'PRIVATE' ? 'Private' : 'Shared'} room in ${card.localityName}`}
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

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
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
                      marginTop: 6,
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
