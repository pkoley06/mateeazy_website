import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LifestyleSetupPage() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [smokingHabit, setSmokingHabit] = useState(profile?.smokingHabit || 'NON_SMOKER');
  const [dietaryPreference, setDietaryPreference] = useState(profile?.dietaryPreference || 'VEG');
  const [sleepSchedule, setSleepSchedule] = useState(profile?.sleepSchedule || 'FLEXIBLE');
  const [cleanlinessLevel, setCleanlinessLevel] = useState(profile?.cleanlinessLevel || 'MODERATE');
  const [guestTolerance, setGuestTolerance] = useState(profile?.guestTolerance || 'OCCASIONAL');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateLifestyle({
        smokingHabit,
        dietaryPreference,
        sleepSchedule,
        cleanlinessLevel,
        guestTolerance,
      });
      await refreshProfile();
      showToast('Lifestyle habits saved!', 'success');
      navigate('/profile');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
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
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Lifestyle habits</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 20px' }}>
          Used to calculate your match % with potential flatmates.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Smoking</label>
            <select className="input-well" value={smokingHabit} onChange={(e) => setSmokingHabit(e.target.value as never)}>
              <option value="NON_SMOKER">Non-smoker</option>
              <option value="OCCASIONAL">Occasional</option>
              <option value="REGULAR">Regular</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Diet</label>
            <select className="input-well" value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value as never)}>
              <option value="VEG">Vegetarian</option>
              <option value="EGGETARIAN">Eggetarian</option>
              <option value="NON_VEG">Non-vegetarian</option>
              <option value="VEGAN">Vegan</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Sleep schedule</label>
            <select className="input-well" value={sleepSchedule} onChange={(e) => setSleepSchedule(e.target.value as never)}>
              <option value="EARLY_BIRD">Early bird</option>
              <option value="FLEXIBLE">Flexible</option>
              <option value="NIGHT_OWL">Night owl</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Cleanliness</label>
            <select className="input-well" value={cleanlinessLevel} onChange={(e) => setCleanlinessLevel(e.target.value as never)}>
              <option value="NEAT_FREAK">Very tidy</option>
              <option value="MODERATE">Moderately tidy</option>
              <option value="RELAXED">Relaxed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Guests</label>
            <select className="input-well" value={guestTolerance} onChange={(e) => setGuestTolerance(e.target.value as never)}>
              <option value="NO_GUESTS">No guests</option>
              <option value="OCCASIONAL">Occasional guests</option>
              <option value="ANYTIME">Anytime</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save lifestyle'}
          </button>
        </form>
      </div>
    </div>
  );
}
