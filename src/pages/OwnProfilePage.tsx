import { Link } from 'react-router-dom';
import {
  Settings,
  Home,
  Heart,
  Sparkles,
  PlusCircle,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function OwnProfilePage() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header Card */}
      <div className="card" style={{ padding: 22, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <img
          src={profile.avatarUrl || '/assets/img/avatar-priya.png'}
          alt={profile.fullName}
          style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--coral)',
          }}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ fontSize: 24 }}>
            {profile.fullName}, {profile.age}
          </h1>
          <p style={{ margin: '2px 0 8px', fontSize: 13, color: 'var(--muted)' }}>
            {profile.occupationTitle || profile.occupationCategory?.replace('_', ' ')}
          </p>
          <span className="chip gold">Profile strength: {profile.profileStrength}%</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/profile/edit" className="btn-secondary" style={{ padding: '9px 14px' }}>
            Edit profile
          </Link>
          <Link to="/settings" className="btn-secondary" style={{ padding: '9px 14px' }}>
            <Settings size={16} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Lifestyle Card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18 }}>Lifestyle habits</h2>
          <Link to="/profile/strength" className="chip coral">
            <Sparkles size={13} />
            <span>Update habits</span>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {profile.smokingHabit && <span className="chip">{profile.smokingHabit.replace('_', ' ')}</span>}
          {profile.dietaryPreference && <span className="chip">{profile.dietaryPreference.replace('_', ' ')}</span>}
          {profile.sleepSchedule && <span className="chip">{profile.sleepSchedule.replace('_', ' ')}</span>}
          {profile.cleanlinessLevel && <span className="chip">{profile.cleanlinessLevel.replace('_', ' ')}</span>}
          {profile.guestTolerance && <span className="chip">{profile.guestTolerance.replace('_', ' ')}</span>}
          {profile.missingLifestyleFields.length > 0 && (
            <span className="chip coral">
              {profile.missingLifestyleFields.length} habits not set
            </span>
          )}
        </div>
      </div>

      {/* Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
        <Link to="/listings/my" className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Home size={20} color="var(--coral)" />
          <strong>My rooms</strong>
        </Link>
        <Link to="/listings/liked" className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Heart size={20} color="var(--coral)" />
          <strong>Liked rooms</strong>
        </Link>
        <Link to="/listings/new" className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PlusCircle size={20} color="var(--coral)" />
          <strong>Post a room</strong>
        </Link>
        <Link to="/notifications" className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={20} color="var(--coral)" />
          <strong>Notifications</strong>
        </Link>
      </div>

      <button type="button" className="btn-secondary" onClick={signOut} style={{ alignSelf: 'flex-start' }}>
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </div>
  );
}
