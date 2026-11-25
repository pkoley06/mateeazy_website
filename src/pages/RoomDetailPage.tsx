import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Share2,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { listingApi } from '../api/endpoints';
import type { CommentItem, DiscoveryCard, ListingDetail } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PhotoGallery } from '../components/PhotoGallery';
import { CommentSection } from '../components/CommentSection';
import { MapPreview } from '../components/MapPreview';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { showToast } = useToast();

  const passedCard = (location.state as { card?: DiscoveryCard } | null)?.card;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [liked, setLiked] = useState(passedCard?.likedByMe ?? false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, commentsRes] = await Promise.all([
        listingApi.getById(id),
        listingApi.getComments(id).catch(() => []),
      ]);
      setListing(detail);
      setComments(
        Array.isArray(commentsRes)
          ? commentsRes
          : commentsRes.content || []
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Room not found or unavailable',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleShare = async () => {
    if (!id || !listing) return;
    const url = `https://mateeazy.in/room/${id}`;
    const text = `Check out this room on MateEazy: ${listing.title || listing.localityName} · ₹${listing.rentAmount}/month`;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title || 'MateEazy Room', text, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    showToast('Room link copied to clipboard!', 'success');
  };

  const handleToggleLike = async () => {
    if (!id) return;
    const next = !liked;
    setLiked(next);
    try {
      await listingApi.toggleLike(id);
    } catch {
      setLiked(!next);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ width: '100%', aspectRatio: '16/10', borderRadius: 22 }} />
        <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 22 }} />
        <div className="skeleton" style={{ width: '100%', height: 88, borderRadius: 22 }} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <h2>This room is no longer available</h2>
        <p style={{ color: 'var(--muted)' }}>
          It may have been taken or removed by the host.
        </p>
        <Link to="/home" className="btn-primary" style={{ marginTop: 12 }}>
          Browse rooms
        </Link>
      </div>
    );
  }

  const isOwn = listing.hostUserId === userId;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <button type="button" className="btn-ghost" onClick={handleBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={handleToggleLike}
          >
            <Heart
              size={16}
              fill={liked ? '#FF6B5B' : 'none'}
              color={liked ? '#FF6B5B' : 'currentColor'}
            />
            <span>{liked ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '8px 14px' }}
            onClick={handleShare}
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Photos */}
      <PhotoGallery
        photos={listing.photoUrls}
        alt={listing.title || 'Room photo'}
      />

      {/* Main Details Card (matching room.jpg) */}
      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        {passedCard?.matchPercentage != null && (
          <div style={{ marginBottom: 12 }}>
            <span className="chip gold" style={{ fontSize: 13, fontWeight: 700, padding: '7px 14px' }}>
              ✨ {Math.round(passedCard.matchPercentage)}% match · feels like a fit
            </span>
          </div>
        )}

        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 800, marginBottom: 6 }}>
          {listing.title ||
            `${listing.roomType === 'PRIVATE' ? 'Private' : 'Shared'} room in ${listing.localityName}`}
        </h1>

        <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--muted)' }}>
          {listing.roomType === 'PRIVATE' ? 'Private room in a shared home' : 'Shared room'}
          {listing.kitchenType ? ` · ${listing.kitchenType === 'PRIVATE' ? 'Private' : 'Shared'} kitchen` : ''}
          {listing.washroomType ? ` · ${listing.washroomType === 'PRIVATE' ? 'Private' : 'Shared'} washroom` : ''}
          {` · ${listing.localityName}, ${listing.city}`}
        </p>

        {/* Side-by-side Rent & Availability Tiles (matching room.jpg) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              background: 'var(--input-fill)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              ₹{listing.rentAmount.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              per month · ₹{listing.depositAmount.toLocaleString('en-IN')} deposit
            </div>
          </div>

          <div
            style={{
              background: 'var(--toast)',
              color: '#2B1B3D',
              borderRadius: 18,
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {listing.moveInDate
                ? `Available ${new Date(listing.moveInDate).toLocaleDateString()}`
                : 'Available now'}
            </div>
            <div style={{ fontSize: 13, opacity: 0.78, marginTop: 2 }}>
              {listing.furnishingStatus.replace('_', ' ')} ·{' '}
              {listing.genderPreference === 'ALL'
                ? 'Open to all genders'
                : `${listing.genderPreference} only`}
            </div>
          </div>
        </div>

        {listing.description && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>About this space</h3>
            <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-line', color: 'var(--text)' }}>
              {listing.description}
            </p>
          </div>
        )}

        {listing.amenities.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>Amenities</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {listing.amenities.map((a) => (
                <span key={a} className="chip">
                  <Check size={13} color="var(--success)" />
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.houseRules.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: 16, marginBottom: 8 }}>House rules</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {listing.houseRules.map((r) => (
                <span key={r} className="chip">
                  <ShieldAlert size={13} color="var(--coral)" />
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {listing.latitude != null && listing.longitude != null && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 10 }}>Location</h3>
            <MapPreview
              lat={listing.latitude}
              lng={listing.longitude}
              label={`${listing.localityName}, ${listing.city}`}
              height={220}
            />
          </div>
        )}
      </div>

      {/* Host Card */}
      <div
        className="card"
        style={{
          padding: 18,
          marginTop: 16,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Link
          to={`/users/${listing.hostUserId}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <img
            src={listing.hostAvatarUrl || '/assets/img/avatar-priya.png'}
            alt={listing.hostName || 'Host'}
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <div>
            <strong style={{ fontSize: 16 }}>
              {listing.hostName || 'MateEazy Member'}
              {listing.hostAge ? `, ${listing.hostAge}` : ''}
            </strong>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {listing.hostOccupationTitle || 'View profile & lifestyle'}
            </div>
          </div>
        </Link>

        {isOwn ? (
          <Link to={`/listings/${listing.id}/edit`} className="btn-secondary">
            Edit listing
          </Link>
        ) : (
          <Link to={`/users/${listing.hostUserId}`} className="btn-secondary">
            View profile
          </Link>
        )}
      </div>

      {/* Comments */}
      <div className="card" style={{ padding: 20, marginTop: 16 }}>
        <CommentSection
          comments={comments}
          onAdd={async (content, parentId) => {
            if (!id) return;
            await listingApi.addComment(id, content, parentId);
            const res = await listingApi.getComments(id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
          onDelete={async (commentId) => {
            if (!id) return;
            await listingApi.deleteComment(commentId);
            const res = await listingApi.getComments(id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
          onToggleLike={async (commentId) => {
            if (!id) return;
            await listingApi.toggleCommentLike(commentId);
            const res = await listingApi.getComments(id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
        />
      </div>
    </div>
  );
}
