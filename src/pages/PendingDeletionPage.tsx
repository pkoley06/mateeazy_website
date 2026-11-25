import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/endpoints';

export function PendingDeletionPage() {
  const { scheduledPurgeAt, refreshProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await userApi.cancelDeletion();
      await refreshProfile();
      showToast('Account restored!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to restore', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Account scheduled for deletion</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
          {scheduledPurgeAt
            ? `Your account will be permanently deleted on ${new Date(scheduledPurgeAt).toLocaleDateString()}.`
            : 'Your account is currently scheduled for deletion.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button type="button" className="btn-primary" onClick={handleRestore} disabled={loading}>
            {loading ? 'Restoring...' : 'Keep my account'}
          </button>
          <button type="button" className="btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
