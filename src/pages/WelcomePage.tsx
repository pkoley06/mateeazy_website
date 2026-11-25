import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowLeft, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { signInWithGoogleWeb } from '../config/firebase';
import { shareApi } from '../api/endpoints';
import type { SharePreview } from '../types/api';
import { ENV } from '../config/env';

export function WelcomePage() {
  const { signInWithFirebaseToken, pendingShared } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<SharePreview | null>(null);

  useEffect(() => {
    if (!pendingShared) {
      setPreview(null);
      return;
    }
    const fetchPreview =
      pendingShared.kind === 'room'
        ? shareApi.roomPreview(pendingShared.id)
        : shareApi.postPreview(pendingShared.id);

    fetchPreview.then(setPreview).catch(() => setPreview(null));
  }, [pendingShared]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogleWeb();
      await signInWithFirebaseToken(idToken, 'GOOGLE');
      showToast('Signed in successfully!', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isAndroid = /Android/i.test(navigator.userAgent);
  const androidIntentUrl = pendingShared
    ? `intent://mateeazy.in/${pendingShared.kind}/${pendingShared.id}#Intent;scheme=https;package=com.mateeazy.app;S.browser_fallback_url=${encodeURIComponent(ENV.playStoreUrl)};end`
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
        background: 'var(--bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link
          to="/"
          className="btn-ghost"
          style={{ marginBottom: 14, paddingLeft: 6 }}
        >
          <ArrowLeft size={16} />
          <span>Back to home</span>
        </Link>

        {preview && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img
                src={preview.imageUrl || '/assets/img/og-image.jpg'}
                alt={preview.title}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 14,
                  objectFit: 'cover',
                  flexShrink: 0,
                  background: 'var(--surface-alt)',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <span className="chip coral" style={{ marginBottom: 4, fontSize: 11 }}>
                  {preview.kind === 'ROOM' ? 'Shared room' : 'Community post'}
                </span>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {preview.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {preview.summary}
                </div>
              </div>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--muted)' }}>
              Sign in below to view full details, check your lifestyle match, and message directly.
            </p>
          </div>
        )}

        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <img
            src="/assets/img/logo.svg"
            alt="MateEazy"
            width={68}
            height={68}
            style={{ margin: '0 auto 14px' }}
          />
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Welcome to MateEazy</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 24px' }}>
            Find rooms and flatmates who match your daily lifestyle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%' }}
            >
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <Link
              to="/welcome/phone"
              className="btn-secondary"
              style={{ width: '100%' }}
            >
              <Phone size={16} />
              <span>Continue with Phone OTP</span>
            </Link>

            {isAndroid && androidIntentUrl && (
              <a
                href={androidIntentUrl}
                className="btn-ghost"
                style={{ width: '100%', fontSize: 13 }}
              >
                <Smartphone size={15} />
                <span>Open in MateEazy Android App</span>
              </a>
            )}
          </div>

          <p style={{ margin: '20px 0 0', fontSize: 12, color: 'var(--muted)' }}>
            By continuing, you agree to MateEazy&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
