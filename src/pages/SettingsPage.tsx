import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, LogOut, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/endpoints';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile, refreshProfile, signOut } = useAuth();
  const { showToast } = useToast();

  const handleGenderPref = async (roomFinderGender: string) => {
    try {
      await userApi.updateRoomSeeker({ roomFinderGender });
      await refreshProfile();
      showToast('Preference updated', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Schedule your account for deletion? You can cancel during the grace period.')) {
      return;
    }
    try {
      await userApi.deleteAccount();
      await signOut();
      showToast('Account scheduled for deletion', 'info');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)} style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 style={{ fontSize: 26 }}>Settings</h1>

      <div className="card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Appearance</strong>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Currently {theme === 'dark' ? 'Dark' : 'Light'} theme
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <strong style={{ display: 'block', marginBottom: 8 }}>Room Finder gender preference</strong>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['ALL', 'MALE', 'FEMALE', 'NON_BINARY'] as const).map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${profile?.roomFinderGender === g ? 'active' : ''}`}
              onClick={() => handleGenderPref(g)}
            >
              {g === 'ALL' ? 'All genders' : g.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn-secondary" onClick={signOut}>
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
          onClick={handleDelete}
        >
          <Trash2 size={16} />
          <span>Delete account</span>
        </button>
      </div>
    </div>
  );
}
