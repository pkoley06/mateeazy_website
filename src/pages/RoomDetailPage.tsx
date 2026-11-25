import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { listingApi } from '../api/endpoints';
import type { CommentItem, DiscoveryCard, ListingDetail } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PhotoGallery } from '../components/PhotoGallery';
import { CommentSection } from '../components/CommentSection';

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

      {/* Main Details Card */}
      <div className="card" style={{ padding: 22, marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, marginBottom: 6 }}>
              {listing.title ||
                `${listing.roomType === 'PRIVATE' ? 'Private' : 'Shared'} room in ${listing.localityName}`}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 14 }}>
              <MapPin size={15} />
              <span>
                {listing.localityName}, {listing.city}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--coral)' }}>
              ₹{listing.rentAmount.toLocaleString('en-IN')}
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted)' }}>/mo</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Deposit: ₹{listing.depositAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
          <span className="chip">
            {listing.roomType === 'PRIVATE' ? 'Private room' : 'Shared room'}
          </span>
          <span className="chip">
            {listing.furnishingStatus.replace('_', ' ')}
          </span>
          {listing.kitchenType && (
            <span className="chip">
              {listing.kitchenType === 'PRIVATE' ? 'Private kitchen' : 'Shared kitchen'}
            </span>
          )}
          {listing.washroomType && (
            <span className="chip">
              {listing.washroomType === 'PRIVATE' ? 'Private washroom' : 'Shared washroom'}
            </span>
          )}
          <span className="chip coral">
            {listing.genderPreference === 'ALL'
              ? 'Open to all genders'
              : `${listing.genderPreference} only`}
          </span>
          {passedCard?.matchPercentage != null && (
            <span className="chip gold">
              {Math.round(passedCard.matchPercentage)}% lifestyle match
            </span>
          )}
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
