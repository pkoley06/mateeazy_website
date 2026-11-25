import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { uploadApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Gender, OccupationCategory } from '../types/api';

export function EditProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '1998-01-01'
  );
  const [gender, setGender] = useState<Gender>(profile?.gender || 'MALE');
  const [occupationCategory, setOccupationCategory] = useState<OccupationCategory>(
    profile?.occupationCategory || 'WORKING_PROFESSIONAL'
  );
  const [occupationTitle, setOccupationTitle] = useState(profile?.occupationTitle || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadApi.uploadProfilePhoto(file);
      if (url) setAvatarUrl(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await userApi.updateDemographics({
        fullName: fullName.trim(),
        dateOfBirth,
        gender,
        occupationCategory,
        occupationTitle: occupationTitle.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      });
      await refreshProfile();
      showToast('Profile updated!', 'success');
      navigate('/profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 10 }}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Edit profile</h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img
              src={avatarUrl || '/assets/img/avatar-priya.png'}
              alt={fullName}
              style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover' }}
            />
            <label className="btn-secondary" style={{ cursor: 'pointer', padding: '8px 14px' }}>
              <span>{uploading ? 'Uploading...' : 'Change photo'}</span>
              <input type="file" accept="image/*" hidden onChange={handleAvatar} />
            </label>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Full name</label>
            <input
              className="input-well"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Date of birth</label>
            <input
              className="input-well"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Gender</label>
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
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Occupation</label>
            <select
              className="input-well"
              value={occupationCategory}
              onChange={(e) => setOccupationCategory(e.target.value as OccupationCategory)}
            >
              <option value="WORKING_PROFESSIONAL">Working Professional</option>
              <option value="STUDENT">Student</option>
              <option value="FREELANCER">Freelancer</option>
              <option value="SELF_EMPLOYED">Self-employed</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Role / College</label>
            <input
              className="input-well"
              value={occupationTitle}
              onChange={(e) => setOccupationTitle(e.target.value)}
              placeholder="e.g. Product Designer"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Bio</label>
            <textarea
              className="input-well"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
