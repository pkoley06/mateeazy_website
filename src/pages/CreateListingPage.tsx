import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { listingApi, uploadApi, userApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { useToast } from '../context/ToastContext';
import { forwardGeocode, reverseGeocode } from '../utils/googleMaps';
import { MapPreview } from '../components/MapPreview';

type WizardStep = 0 | 1 | 2 | 3;

const STEPS = [
  { label: 'Photos', title: 'Let your place say hello.' },
  { label: 'Location', title: 'Where is your room?' },
  { label: 'Details', title: 'Tell flatmates about it.' },
  { label: 'Review', title: 'Ready to publish?' },
] as const;

const HOUSE_RULE_OPTIONS = [
  'No smoking',
  'No loud music after 11 PM',
  'No pets',
  'Visitors allowed',
  'Keep common areas clean',
  'Veg kitchen only',
];

export function CreateListingPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { mapsApiKey } = useBranding();
  const { showToast } = useToast();

  const [step, setStep] = useState<WizardStep>(0);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [latitude, setLatitude] = useState<number>(22.5726);
  const [longitude, setLongitude] = useState<number>(88.3639);
  const [hasGps, setHasGps] = useState(false);
  const [locating, setLocating] = useState(false);
  const [localityName, setLocalityName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [title, setTitle] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [roomType, setRoomType] = useState<'PRIVATE' | 'SHARE'>('PRIVATE');
  const [furnishingStatus, setFurnishingStatus] = useState<
    'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED'
  >('SEMI_FURNISHED');
  const [kitchenType, setKitchenType] = useState<'SHARED' | 'PRIVATE'>('SHARED');
  const [washroomType, setWashroomType] = useState<'SHARED' | 'PRIVATE'>('SHARED');
  const [genderPreference, setGenderPreference] = useState('ALL');
  const [houseRules, setHouseRules] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [amenities, setAmenities] = useState<string[]>([]);

  const [findMate, setFindMate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    listingApi
      .getById(id)
      .then((l) => {
        setPhotoUrls(l.photoUrls || []);
        if (l.latitude != null && l.longitude != null) {
          setLatitude(l.latitude);
          setLongitude(l.longitude);
          setHasGps(true);
        }
        setLocalityName(l.localityName || '');
        setCity(l.city || '');
        setStateName(l.stateName || '');
        setPostalCode(l.postalCode || '');
        setTitle(l.title || '');
        setRentAmount(String(l.rentAmount));
        setDepositAmount(String(l.depositAmount));
        if (l.moveInDate) setMoveInDate(l.moveInDate.slice(0, 10));
        setRoomType(l.roomType);
        setFurnishingStatus(l.furnishingStatus);
        if (l.kitchenType) setKitchenType(l.kitchenType);
        if (l.washroomType) setWashroomType(l.washroomType);
        setGenderPreference(l.genderPreference || 'ALL');
        setHouseRules(l.houseRules || []);
        setDescription(l.description || '');
        setIsAvailable(l.isAvailable);
        setAmenities(l.amenities || []);
      })
      .catch(() => showToast('Failed to load listing', 'error'))
      .finally(() => setLoadingInitial(false));
  }, [id, showToast]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - photoUrls.length;
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const urls = await uploadApi.uploadListingPhotos(toUpload);
      if (urls.length) setPhotoUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Photo upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const makeCover = (idx: number) => {
    setPhotoUrls((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      return [chosen, ...next];
    });
  };

  const removePhoto = (idx: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyReverse = async (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setHasGps(true);
    const rev = await reverseGeocode(lat, lng, mapsApiKey);
    if (rev) {
      if (rev.locality) setLocalityName(rev.locality);
      if (rev.city) setCity(rev.city);
      if (rev.state) setStateName(rev.state);
      if (rev.postalCode) setPostalCode(rev.postalCode);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyReverse(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        showToast('Location detected!', 'success');
      },
      () => {
        setLocating(false);
        showToast('Location permission denied. Please enter area manually.', 'error');
      },
      { timeout: 8000 }
    );
  };

  const toggleRule = (rule: string) => {
    setHouseRules((prev) =>
      prev.includes(rule) ? prev.filter((r) => r !== rule) : [...prev, rule]
    );
  };

  const validateStep = (s: WizardStep): boolean => {
    if (s === 0 && photoUrls.length === 0) {
      showToast('Please add at least 1 photo of the room', 'error');
      return false;
    }
    if (s === 1 && (!localityName.trim() || !city.trim())) {
      showToast('Please enter both locality and city', 'error');
      return false;
    }
    if (s === 2) {
      if (!title.trim()) {
        showToast('Please add a headline for your room', 'error');
        return false;
      }
      if (!rentAmount || Number(rentAmount) <= 0) {
        showToast('Please enter a valid monthly rent', 'error');
        return false;
      }
      if (depositAmount === '' || Number(depositAmount) < 0) {
        showToast('Please enter the security deposit (0 if none)', 'error');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s));
  };

  const handlePublish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        listingType: 'HAVE_ROOM',
        title: title.trim(),
        rentAmount: Number(rentAmount) || 0,
        depositAmount: Number(depositAmount) || 0,
        roomType,
        furnishingStatus,
        latitude,
        longitude,
        localityName: localityName.trim(),
        city: city.trim(),
        ...(stateName.trim() ? { stateName: stateName.trim() } : {}),
        ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        photoUrls,
        ...(moveInDate ? { moveInDate } : {}),
        amenities,
        houseRules,
        genderPreference,
        kitchenType,
        washroomType,
        ...(isEdit ? { isAvailable } : {}),
      };

      const saved =
        isEdit && id
          ? await listingApi.update(id, payload)
          : await listingApi.create(payload);

      if (!isEdit && findMate) {
        userApi
          .updateRoomSeeker({ isRoomSeeker: true, roomFinderGoal: 'MATE' })
          .then(() => refreshProfile())
          .catch(() => {});
      }

      showToast(isEdit ? 'Room updated!' : 'Room published!', 'success');
      navigate(`/discover/room/${saved.id}`, { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 56 }} />
        <div className="skeleton" style={{ height: 340 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* App-style Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <button
          type="button"
          className="icon-circle-btn"
          onClick={() => (step > 0 ? setStep((s) => (s - 1) as WizardStep) : navigate(-1))}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          {isEdit ? 'Edit your room.' : STEPS[step].title}
        </h1>
      </div>

      {/* Pill-segmented Stepper (matching app's Photos | Location | Details | Review bar) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: 'var(--surface-alt)',
          border: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        {STEPS.map((s, idx) => {
          const active = idx === step;
          const reachable = idx <= step;
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                if (reachable) setStep(idx as WizardStep);
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '9px 6px',
                fontSize: 13,
                fontWeight: active ? 700 : 600,
                background: active ? 'var(--coral)' : 'transparent',
                color: active ? '#fff' : reachable ? 'var(--text)' : 'var(--muted)',
                cursor: reachable ? 'pointer' : 'default',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="card" style={{ padding: '24px 22px' }}>
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
              Real corners. Natural light. A sense of what it feels like to live here.
            </p>

            {photoUrls.length === 0 ? (
              <label
                style={{
                  borderRadius: 20,
                  border: '1.5px dashed var(--coral)',
                  background: 'var(--input-fill)',
                  padding: '44px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <Plus size={28} color="var(--coral)" />
                <strong style={{ fontSize: 16, color: 'var(--coral)' }}>
                  {uploading ? 'Uploading photos...' : 'Add photos'}
                </strong>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                  Choose from your device (up to 10)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  disabled={uploading}
                  onChange={handlePhotoUpload}
                />
              </label>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 12,
                }}
              >
                {photoUrls.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    style={{
                      position: 'relative',
                      aspectRatio: '1/1',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: idx === 0 ? '2.5px solid var(--coral)' : '1px solid var(--border)',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Room ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {idx === 0 && (
                      <span
                        className="chip active"
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          fontSize: 10,
                          padding: '3px 8px',
                        }}
                      >
                        Cover
                      </span>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 6,
                        right: 6,
                        display: 'flex',
                        gap: 4,
                      }}
                    >
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => makeCover(idx)}
                          title="Make cover"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(43,27,61,0.8)',
                            color: '#fff',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        title="Remove"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(185,28,28,0.88)',
                          color: '#fff',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {photoUrls.length < 10 && (
                  <label
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: 16,
                      border: '1.5px dashed var(--coral)',
                      background: 'var(--input-fill)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      color: 'var(--coral)',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <Plus size={24} />
                    <span>{uploading ? 'Uploading...' : 'Add more'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      disabled={uploading}
                      onChange={handlePhotoUpload}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Warm Tip Banner (from post.jpg) */}
            <div
              style={{
                background: 'var(--toast)',
                color: '#2B1B3D',
                padding: '13px 16px',
                borderRadius: 14,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              A small tip: show the bedroom, shared spaces and your favorite little corner. No filters needed.
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {photoUrls.length} of 10 photos · JPG or PNG.
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={detectLocation}
                disabled={locating}
              >
                <LocateFixed size={16} color="var(--coral)" />
                <span>
                  {locating
                    ? 'Detecting location...'
                    : hasGps
                    ? 'Update GPS location'
                    : 'Use my current GPS location'}
                </span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  const q = [localityName, city].filter(Boolean).join(', ');
                  if (!q.trim()) {
                    showToast('Enter locality or city first to pin on map', 'info');
                    return;
                  }
                  const hit = await forwardGeocode(q, mapsApiKey);
                  if (hit) {
                    setLatitude(hit.lat);
                    setLongitude(hit.lng);
                    setHasGps(true);
                    if (hit.state && !stateName) setStateName(hit.state);
                    if (hit.postalCode && !postalCode) setPostalCode(hit.postalCode);
                    showToast('Map pin updated!', 'success');
                  } else {
                    showToast('Could not locate area', 'error');
                  }
                }}
              >
                <MapPin size={16} color="var(--coral)" />
                <span>Pin area on map</span>
              </button>
            </div>

            <MapPreview
              lat={latitude}
              lng={longitude}
              label={
                [localityName, city].filter(Boolean).join(', ') ||
                'Click or drag pin to set room location'
              }
              height={190}
              onPickLocation={(lat, lng) => void applyReverse(lat, lng)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Locality / Area *
                </label>
                <input
                  className="input-well"
                  placeholder="e.g. Indiranagar"
                  value={localityName}
                  onChange={(e) => setLocalityName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  City *
                </label>
                <input
                  className="input-well"
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  State (optional)
                </label>
                <input
                  className="input-well"
                  placeholder="e.g. Karnataka"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  PIN code (optional)
                </label>
                <input
                  className="input-well"
                  placeholder="e.g. 560038"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Headline *
              </label>
              <input
                className="input-well"
                placeholder="e.g. Sunny room with balcony near Metro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Monthly rent (₹) *
                </label>
                <input
                  className="input-well"
                  type="number"
                  placeholder="14000"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  Security deposit (₹) *
                </label>
                <input
                  className="input-well"
                  type="number"
                  placeholder="28000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Available from (optional)
              </label>
              <input
                className="input-well"
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Room type
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([['PRIVATE', 'Private room'], ['SHARE', 'Shared room']] as const).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${roomType === v ? 'active' : ''}`}
                    onClick={() => setRoomType(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Furnishing
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    ['FURNISHED', 'Furnished'],
                    ['SEMI_FURNISHED', 'Semi-furnished'],
                    ['UNFURNISHED', 'Unfurnished'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${furnishingStatus === v ? 'active' : ''}`}
                    onClick={() => setFurnishingStatus(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Kitchen
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['SHARED', 'Shared'], ['PRIVATE', 'Private']] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      className={`chip ${kitchenType === v ? 'active' : ''}`}
                      onClick={() => setKitchenType(v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  Washroom
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['SHARED', 'Shared'], ['PRIVATE', 'Private']] as const).map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      className={`chip ${washroomType === v ? 'active' : ''}`}
                      onClick={() => setWashroomType(v)}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Who can apply
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    ['ALL', 'Open to all genders'],
                    ['MALE', 'Male only'],
                    ['FEMALE', 'Female only'],
                    ['NON_BINARY', 'Non-binary'],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${genderPreference === v ? 'active' : ''}`}
                    onClick={() => setGenderPreference(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                House rules
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {HOUSE_RULE_OPTIONS.map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    className={`chip ${houseRules.includes(rule) ? 'active' : ''}`}
                    onClick={() => toggleRule(rule)}
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Description (optional)
              </label>
              <textarea
                className="input-well"
                rows={3}
                placeholder="Tell flatmates about the apartment, flatmates, and nearby landmarks..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {isEdit && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span>Listing is currently available</span>
              </label>
            )}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {photoUrls[0] && (
                <img
                  src={photoUrls[0]}
                  alt={title}
                  style={{ width: '100%', height: 220, objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <h2 style={{ fontSize: 20 }}>{title}</h2>
                  <strong style={{ color: 'var(--coral)', fontSize: 18 }}>
                    ₹{Number(rentAmount || 0).toLocaleString('en-IN')}/mo
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  <MapPin size={14} />
                  <span>{localityName}, {city}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  <span className="chip">{roomType === 'PRIVATE' ? 'Private room' : 'Shared room'}</span>
                  <span className="chip">{furnishingStatus.replace('_', ' ')}</span>
                  <span className="chip">{kitchenType === 'PRIVATE' ? 'Private kitchen' : 'Shared kitchen'}</span>
                  <span className="chip">{washroomType === 'PRIVATE' ? 'Private washroom' : 'Shared washroom'}</span>
                  <span className="chip coral">
                    {genderPreference === 'ALL' ? 'All genders' : `${genderPreference} only`}
                  </span>
                </div>
              </div>
            </div>

            {!isEdit && (
              <label
                className="card"
                style={{
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--input-fill)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={findMate}
                  onChange={(e) => setFindMate(e.target.checked)}
                />
                <div>
                  <strong style={{ fontSize: 14 }}>Turn on Room Finder Mode</strong>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Also show your profile to seekers looking for a flatmate
                  </div>
                </div>
              </label>
            )}
          </div>
        )}

        {/* Full-width app-style CTA */}
        <div style={{ marginTop: 22 }}>
          {step < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={goNext}
              style={{ width: '100%', padding: '14px 20px' }}
            >
              <span>Next · {STEPS[step + 1].label}</span>
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handlePublish}
              disabled={submitting}
              style={{ width: '100%', padding: '14px 20px' }}
            >
              <Check size={17} />
              <span>
                {submitting
                  ? 'Publishing...'
                  : isEdit
                  ? 'Save changes'
                  : 'Publish room'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
