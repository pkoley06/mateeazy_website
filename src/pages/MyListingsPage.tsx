import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { listingApi } from '../api/endpoints';
import type { ListingDetail } from '../types/api';

export function MyListingsPage({ mode }: { mode: 'my' | 'liked' }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const req = mode === 'my' ? listingApi.getMy() : listingApi.getLiked();
    req
      .then((res) => setItems(res || []))
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 10 }}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 style={{ fontSize: 26, marginBottom: 16 }}>
        {mode === 'my' ? 'My rooms' : 'Liked rooms'}
      </h1>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>
            {mode === 'my' ? 'You have not posted any rooms yet.' : 'No liked rooms yet.'}
          </p>
          <Link to={mode === 'my' ? '/listings/new' : '/home'} className="btn-primary">
            {mode === 'my' ? 'Post a room' : 'Discover rooms'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {items.map((l) => (
            <Link key={l.id} to={`/discover/room/${l.id}`} className="card" style={{ overflow: 'hidden' }}>
              <img
                src={l.photoUrls[0] || '/assets/img/room-balcony.jpg'}
                alt={l.title || 'Room'}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }}
              />
              <div style={{ padding: 14 }}>
                <strong style={{ fontSize: 15 }}>{l.title || l.localityName}</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{l.localityName}</div>
                <div style={{ color: 'var(--coral)', fontWeight: 700, marginTop: 4 }}>
                  ₹{l.rentAmount.toLocaleString('en-IN')}/mo
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
