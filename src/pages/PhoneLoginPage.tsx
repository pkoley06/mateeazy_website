import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Phone } from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { createPhoneRecaptcha, sendPhoneOtpWeb } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function PhoneLoginPage() {
  const { signInWithFirebaseToken } = useAuth();
  const { showToast } = useToast();
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    recaptchaRef.current = createPhoneRecaptcha('recaptcha-container');
    return () => {
      recaptchaRef.current?.clear();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 8) {
      showToast('Enter a valid phone number', 'error');
      return;
    }
    if (!recaptchaRef.current) return;
    setLoading(true);
    try {
      const fullPhone = `${countryCode}${cleaned}`;
      const res = await sendPhoneOtpWeb(fullPhone, recaptchaRef.current);
      setConfirmation(res);
      showToast('OTP sent to ' + fullPhone, 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to send OTP',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation || otp.trim().length < 6) return;
    setLoading(true);
    try {
      const cred = await confirmation.confirm(otp.trim());
      const idToken = await cred.user.getIdToken();
      await signInWithFirebaseToken(idToken, 'PHONE');
      showToast('Phone verified!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Invalid OTP',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Link to="/welcome" className="btn-ghost" style={{ marginBottom: 14, paddingLeft: 8 }}>
          <ArrowLeft size={16} />
          <span>Back to sign in</span>
        </Link>

        <div className="card" style={{ padding: '32px 28px', boxShadow: 'var(--shadow-lg)' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'var(--chip)',
              color: 'var(--coral)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 16,
            }}
          >
            <Phone size={24} />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            {confirmation ? 'Enter verification code' : 'Sign in with phone'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 22px' }}>
            {confirmation
              ? `We sent a 6-digit SMS code to ${countryCode} ${phone}`
              : "We'll send you a one-time SMS verification code."}
          </p>

          {!confirmation ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input-well"
                  style={{ width: 82, textAlign: 'center', fontWeight: 600 }}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country code"
                />
                <input
                  className="input-well"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '13px 20px' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                className="input-well"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                style={{ fontSize: 20, letterSpacing: 6, textAlign: 'center', fontWeight: 700 }}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '13px 20px' }}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setConfirmation(null);
                  setOtp('');
                }}
              >
                Change phone number
              </button>
            </form>
          )}
          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
}
