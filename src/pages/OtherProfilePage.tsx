import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { userApi } from '../api/endpoints';
import type { OtherUserProfile } from '../types/api';
import { useToast } from '../context/ToastContext';

export function OtherProfilePage() {
  const { userId: targetId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState<OtherUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) return;
    userApi
      .getOtherUser(targetId)
      .then(setUser)
      .catch((err) =>
        showToast(err instanceof Error ? err.message : 'User not found', 'error')
      )
      .finally(() => setLoading(false));
  }, [targetId, showToast]);

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ width: '100%', height: 180, borderRadius: 22 }} />
        <div className="skeleton" style={{ width: '100%', height: 220, borderRadius: 22 }} />
      </div>
    );
  }
  if (!user) {
    return <div className="card" style={{ padding: 28, textAlign: 'center' }}>User not found</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <img
            src={user.avatarUrl || '/assets/img/avatar-priya.png'}
            alt={user.fullName}
            style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 24 }}>
              {user.fullName}, {user.age}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {user.occupationTitle || user.occupationCategory?.replace('_', ' ')}
            </div>
            {user.locality && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                <MapPin size={12} />
                <span>{user.locality}</span>
              </div>
            )}
          </div>
        </div>

        {user.bio && <p style={{ marginTop: 16, fontSize: 14 }}>{user.bio}</p>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {user.smokingHabit && <span className="chip">{user.smokingHabit.replace('_', ' ')}</span>}
          {user.dietaryPreference && <span className="chip">{user.dietaryPreference.replace('_', ' ')}</span>}
          {user.sleepSchedule && <span className="chip">{user.sleepSchedule.replace('_', ' ')}</span>}
          {user.cleanlinessLevel && <span className="chip">{user.cleanlinessLevel.replace('_', ' ')}</span>}
          {user.guestTolerance && <span className="chip">{user.guestTolerance.replace('_', ' ')}</span>}
        </div>
      </div>

      {user.activeListings.length > 0 && (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Active listings</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {user.activeListings.map((l) => (
              <Link key={l.id} to={`/discover/room/${l.id}`} className="card card-interactive" style={{ overflow: 'hidden' }}>
                <img
                  src={l.photoUrls[0] || '/assets/img/room-balcony.jpg'}
                  alt={l.title || 'Room'}
                  style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }}
                />
                <div style={{ padding: 14 }}>
                  <strong style={{ fontSize: 15 }}>{l.title || l.localityName}</strong>
                  <div style={{ color: 'var(--coral)', fontWeight: 700, marginTop: 4 }}>
                    ₹{l.rentAmount.toLocaleString('en-IN')}/mo
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
