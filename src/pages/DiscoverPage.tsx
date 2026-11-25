import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  MapPin,
  Heart,
  Sparkles,
  Search,
  LocateFixed,
  Briefcase,
  ArrowRight,
  X,
} from 'lucide-react';
import { discoveryApi, listingApi, userApi, type DiscoveryParams } from '../api/endpoints';
import type { DiscoveryCard } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FilterModal } from '../components/FilterModal';
import { RoomFinderModal } from '../components/RoomFinderModal';

const SAVED_LOC_KEY = 'mateeazy_last_location';

function getInitialLocation(): { lat: number; lng: number; label: string; hasSaved: boolean } {
  try {
    const raw = localStorage.getItem(SAVED_LOC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { lat?: number; lng?: number; label?: string };
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return {
          lat: parsed.lat,
          lng: parsed.lng,
          label: parsed.label || 'Current location',
          hasSaved: true,
        };
      }
    }
  } catch {
    // ignore
  }
  return { lat: 22.5726, lng: 88.3639, label: 'Search city or area...', hasSaved: false };
}

export function DiscoverPage() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const initialLoc = getInitialLocation();
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoReady, setGeoReady] = useState(initialLoc.hasSaved);
  const [showFilters, setShowFilters] = useState(false);
  const [showRoomFinder, setShowRoomFinder] = useState(false);
  const [tab, setTab] = useState<'ALL' | 'ROOMS' | 'FLATMATES'>('ALL');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLoc.lat,
    lng: initialLoc.lng,
  });
  const [areaLabel, setAreaLabel] = useState(
    initialLoc.hasSaved ? initialLoc.label : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingLoc, setSearchingLoc] = useState(false);

  const [filters, setFilters] = useState<DiscoveryParams>({
    radiusKm: 30,
    sortBy: 'DISTANCE',
  });

  const saveLocation = (lat: number, lng: number, label: string) => {
    setCoords({ lat, lng });
    setAreaLabel(label);
    try {
      localStorage.setItem(SAVED_LOC_KEY, JSON.stringify({ lat, lng, label }));
    } catch {
      // ignore
    }
  };

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
        saveLocation(lat, lng, areaLabel || 'Near you');
        userApi.updateLocation(lat, lng).catch(() => {});
        finish();
      },
      () => {
        clearTimeout(fallbackTimer);
        finish();
      },
      { timeout: 2500, maximumAge: 60000 }
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
        size: 40,
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

  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || searchingLoc) return;
    setSearchingLoc(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const list = (await res.json()) as Array<{
          lat: string;
          lon: string;
          display_name: string;
        }>;
        if (list.length > 0) {
          const hit = list[0];
          const shortName = hit.display_name.split(',').slice(0, 2).join(', ');
          saveLocation(parseFloat(hit.lat), parseFloat(hit.lon), shortName);
          setSearchQuery('');
          showToast(`Showing matches near ${shortName}`, 'success');
        } else {
          showToast('Location not found. Try a broader city or area.', 'error');
        }
      }
    } catch {
      showToast('Could not search location', 'error');
    } finally {
      setSearchingLoc(false);
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

  const visibleCards = cards.filter((c) => {
    if (tab === 'ROOMS') return Boolean(c.listingId);
    if (tab === 'FLATMATES') return !c.listingId;
    return true;
  });

  return (
    <div>
      {/* App Hero Header (matching discover.jpg) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 14,
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.08 }}>
            Your people. Your place.
          </h1>
        </div>

        <button
          type="button"
          className={`chip ${profile?.isRoomSeeker ? 'active' : ''}`}
          style={{ padding: '9px 14px', fontSize: 13 }}
          onClick={() => setShowRoomFinder(true)}
        >
          <Sparkles size={14} />
          <span>
            {profile?.isRoomSeeker
              ? profile.roomFinderGoal === 'MATE'
                ? 'Looking for mate'
                : 'Looking for room'
              : 'Room Finder'}
          </span>
        </button>
      </div>

      {/* Location Search Pill + Filter Icon Button */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <form
          onSubmit={handleLocationSearch}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 999,
            padding: '8px 14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <MapPin size={18} color="var(--coral)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={areaLabel ? `${areaLabel} · type city or area to switch` : 'Search city or area (e.g. Indiranagar, Bengaluru)'}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          {searchQuery ? (
            <>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-ghost"
                style={{ padding: 4 }}
                aria-label="Clear"
              >
                <X size={16} />
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={searchingLoc}
              >
                <Search size={14} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                navigator.geolocation?.getCurrentPosition((pos) => {
                  saveLocation(pos.coords.latitude, pos.coords.longitude, 'Near you');
                  showToast('Location updated', 'success');
                });
              }}
              className="btn-ghost"
              style={{ padding: 4 }}
              title="Use current GPS"
            >
              <LocateFixed size={16} color="var(--muted)" />
            </button>
          )}
        </form>

        <button
          type="button"
          className="icon-circle-btn"
          style={{ width: 46, height: 46 }}
          onClick={() => setShowFilters(true)}
          aria-label="Filters"
          title="Filters"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Category Pill Tabs (All | Rooms | Flatmates) + Nearby Count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(
            [
              ['ALL', 'All'],
              ['ROOMS', 'Rooms'],
              ['FLATMATES', 'Flatmates'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`chip ${tab === k ? 'active' : ''}`}
              style={{ padding: '8px 18px', fontSize: 13 }}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
          {loading || !geoReady
            ? 'Finding matches...'
            : `${visibleCards.length} nearby · ${filters.radiusKm ?? 30} km`}
        </span>
      </div>

      {/* Feed Grid */}
      {loading || !geoReady ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
            gap: 18,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 205, borderRadius: 0 }} />
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="skeleton" style={{ height: 20, width: '75%' }} />
                <div className="skeleton" style={{ height: 14, width: '50%' }} />
                <div className="skeleton" style={{ height: 24, width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : visibleCards.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <h3 style={{ fontSize: 22, marginBottom: 8 }}>No matches nearby yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Try searching another area above, increasing your search radius, or adjusting filters.
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))',
            gap: 18,
            alignItems: 'start',
          }}
        >
          {visibleCards.map((card, idx) => {
            const isRoom = Boolean(card.listingId);

            if (!isRoom) {
              // Flatmate / Seeker Card (profile-first, distinct from room cards)
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
                            {Math.round(card.matchPercentage)}% match
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
                      {card.seekerGoal === 'MATE' ? 'Needs a mate' : 'Needs a room'}
                    </span>
                    {card.rentAmount != null && (
                      <strong style={{ fontSize: 14 }}>
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

            // Room Listing Card (matching discover.jpg)
            const cover = card.photoUrls[0] || '/assets/img/room-balcony.jpg';
            return (
              <article
                key={card.listingId!}
                className="card card-interactive"
                style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', padding: 12, gap: 10 }}
                onClick={() =>
                  navigate(`/discover/room/${card.listingId}`, {
                    state: { card },
                  })
                }
              >
                {/* Rounded Photo Frame with Overlapping Host Avatar */}
                <div style={{ position: 'relative', width: '100%', height: 205 }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: 'var(--surface-alt)',
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
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
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(255,255,255,0.94)',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      <Heart
                        size={17}
                        fill={card.likedByMe ? '#FF6B5B' : 'none'}
                        color={card.likedByMe ? '#FF6B5B' : '#2B1B3D'}
                      />
                    </button>
                  </div>

                  {/* Overlapping Host Avatar (bottom-right of photo, matching discover.jpg) */}
                  <img
                    src={card.avatarUrl || '/assets/img/avatar-priya.png'}
                    alt={card.hostName}
                    title={`${card.hostName}, ${card.hostAge}`}
                    style={{
                      position: 'absolute',
                      bottom: -14,
                      right: 12,
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--card)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  />
                </div>

                {/* Card Copy */}
                <div style={{ paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {card.title ||
                      `${card.roomType === 'PRIVATE' ? 'Private' : 'Shared'} room in ${card.localityName}`}
                  </h3>

                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {card.localityName}
                    {card.distanceKm != null ? ` · ${card.distanceKm.toFixed(1)} km` : ''}
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--coral)' }}>
                    {card.roomType === 'PRIVATE' ? 'Private room' : 'Shared room'}
                    {card.furnishingStatus ? ` · ${card.furnishingStatus.replace('_', ' ')}` : ''}
                  </div>

                  {card.rentAmount != null && (
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                      ₹{card.rentAmount.toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--muted)' }}>
                        / month
                      </span>
                    </div>
                  )}

                  {card.compatibilityHighlights.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {card.compatibilityHighlights.slice(0, 2).map((h) => (
                        <span key={h} className="chip" style={{ fontSize: 11 }}>
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
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

      {showRoomFinder && (
        <RoomFinderModal
          onClose={() => setShowRoomFinder(false)}
          onSaved={() => void loadFeed()}
        />
      )}
    </div>
  );
}
