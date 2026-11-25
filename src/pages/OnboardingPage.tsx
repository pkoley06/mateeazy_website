import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userApi } from '../api/endpoints';
import type { Gender, OccupationCategory } from '../types/api';

export function OnboardingPage() {
  const { prefilled, markOnboardingComplete, signOut } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(prefilled?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState('1998-01-01');
  const [gender, setGender] = useState<Gender>('MALE');
  const [occupationCategory, setOccupationCategory] =
    useState<OccupationCategory>('WORKING_PROFESSIONAL');
  const [occupationTitle, setOccupationTitle] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    setLoading(true);
    try {
      await userApi.updateDemographics({
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        occupationCategory,
        occupationTitle: occupationTitle.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: prefilled?.avatarUrl,
      });
      await markOnboardingComplete();
      showToast('Profile created!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to save profile',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Tell us about yourself</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
          This helps flatmates get to know you.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Full name
            </label>
            <input
              className="input-well"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ananya Sharma"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Date of birth
            </label>
            <input
              className="input-well"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Gender
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(
                [
                  { value: 'MALE', label: 'Male' },
                  { value: 'FEMALE', label: 'Female' },
                  { value: 'NON_BINARY', label: 'Non-binary' },
                ] as const
              ).map((g) => (
                <button
                  key={g.value}
                  type="button"
                  className={`chip ${gender === g.value ? 'active' : ''}`}
                  onClick={() => setGender(g.value)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Occupation
            </label>
            <select
              className="input-well"
              value={occupationCategory}
              onChange={(e) =>
                setOccupationCategory(e.target.value as OccupationCategory)
              }
            >
              <option value="WORKING_PROFESSIONAL">Working Professional</option>
              <option value="STUDENT">Student</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="SELF_EMPLOYED">Self-employed</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Role / College (optional)
            </label>
            <input
              className="input-well"
              value={occupationTitle}
              onChange={(e) => setOccupationTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Short bio (optional)
            </label>
            <textarea
              className="input-well"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A quick intro about your routine and what you're looking for..."
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Saving...' : 'Complete setup'}
          </button>

          <button type="button" className="btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
