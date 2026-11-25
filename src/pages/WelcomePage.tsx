import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ArrowLeft, Smartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { signInWithGoogleWeb } from '../config/firebase';
import { shareApi } from '../api/endpoints';
import type { SharePreview } from '../types/api';
import { ENV } from '../config/env';

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z" />
      <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z" />
    </svg>
  );
}

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
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link
          to="/"
          className="btn-ghost"
          style={{ marginBottom: 14, paddingLeft: 8 }}
        >
          <ArrowLeft size={16} />
          <span>Back to mateeazy.in</span>
        </Link>

        {preview && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <img
                src={preview.imageUrl || '/assets/img/og-image.jpg'}
                alt={preview.title}
                style={{
                  width: 76,
                  height: 76,
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
              Sign in below to view full details and check your lifestyle match.
            </p>
          </div>
        )}

        <div className="card" style={{ padding: '34px 28px', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: '#2B1B3D',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 10px 24px rgba(43, 27, 61, 0.22)',
            }}
          >
            <img src="/assets/img/logo.svg" alt="MateEazy" width={46} height={46} />
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Welcome to MateEazy
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 auto 26px', maxWidth: 320 }}>
            Find rooms and flatmates matched on your everyday habits. Zero brokerage.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="google-btn"
            >
              <GoogleLogo />
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>or</span>
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <Link
              to="/welcome/phone"
              className="btn-primary"
              style={{ width: '100%', padding: '13px 20px' }}
            >
              <Phone size={17} />
              <span>Continue with Phone OTP</span>
            </Link>

            {isAndroid && androidIntentUrl && (
              <a
                href={androidIntentUrl}
                className="btn-ghost"
                style={{ width: '100%', fontSize: 13, marginTop: 4 }}
              >
                <Smartphone size={15} />
                <span>Open in MateEazy Android App</span>
              </a>
            )}
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <ShieldCheck size={14} color="var(--success)" />
            <span>Your phone number stays private</span>
          </div>

          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--muted)' }}>
            By continuing, you agree to our{' '}
            <a href="https://pkoley06.github.io/mateeazy-legal/terms-of-service.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
              Terms
            </a>{' '}
            and{' '}
            <a href="https://pkoley06.github.io/mateeazy-legal/privacy-policy.html" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
