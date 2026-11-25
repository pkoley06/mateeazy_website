import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { listingApi, uploadApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

export function CreateListingPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState('HAVE_ROOM');
  const [roomType, setRoomType] = useState('PRIVATE');
  const [furnishingStatus, setFurnishingStatus] = useState('SEMI_FURNISHED');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [description, setDescription] = useState('');
  const [genderPreference, setGenderPreference] = useState('ALL');
  const [kitchenType, setKitchenType] = useState('SHARED');
  const [washroomType, setWashroomType] = useState('PRIVATE');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    listingApi
      .getById(id)
      .then((l) => {
        setTitle(l.title || '');
        setListingType(l.listingType);
        setRoomType(l.roomType);
        setFurnishingStatus(l.furnishingStatus);
        setRentAmount(String(l.rentAmount));
        setDepositAmount(String(l.depositAmount));
        setLocalityName(l.localityName);
        setCity(l.city);
        setDescription(l.description || '');
        setGenderPreference(l.genderPreference);
        if (l.kitchenType) setKitchenType(l.kitchenType);
        if (l.washroomType) setWashroomType(l.washroomType);
        setPhotoUrls(l.photoUrls || []);
      })
      .catch(() => showToast('Failed to load listing', 'error'));
  }, [id, showToast]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadApi.uploadImage(file, 'listings');
      if (url) setPhotoUrls((p) => [...p, url]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        listingType,
        roomType,
        furnishingStatus,
        rentAmount: Number(rentAmount) || 0,
        depositAmount: Number(depositAmount) || 0,
        localityName: localityName.trim(),
        city: city.trim(),
        description: description.trim(),
        genderPreference,
        kitchenType,
        washroomType,
        photoUrls,
        amenities: [],
        houseRules: [],
      };
      const saved = isEdit && id
        ? await listingApi.update(id, payload)
        : await listingApi.create(payload);
      showToast(isEdit ? 'Listing updated!' : 'Room published!', 'success');
      navigate(`/discover/room/${saved.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button type="button" className="btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div className="card" style={{ padding: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>
          {isEdit ? 'Edit listing' : 'Post a room'}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            className="input-well"
            placeholder="Headline (e.g. Sunlit private room near Metro)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="input-well"
              type="number"
              placeholder="Monthly rent (₹)"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
              required
            />
            <input
              className="input-well"
              type="number"
              placeholder="Security deposit (₹)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="input-well"
              placeholder="Locality (e.g. Indiranagar)"
              value={localityName}
              onChange={(e) => setLocalityName(e.target.value)}
              required
            />
            <input
              className="input-well"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="input-well" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option value="PRIVATE">Private room</option>
              <option value="SHARE">Shared room</option>
            </select>
            <select className="input-well" value={furnishingStatus} onChange={(e) => setFurnishingStatus(e.target.value)}>
              <option value="FURNISHED">Furnished</option>
              <option value="SEMI_FURNISHED">Semi-furnished</option>
              <option value="UNFURNISHED">Unfurnished</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select className="input-well" value={kitchenType} onChange={(e) => setKitchenType(e.target.value)}>
              <option value="SHARED">Shared kitchen</option>
              <option value="PRIVATE">Private kitchen</option>
            </select>
            <select className="input-well" value={washroomType} onChange={(e) => setWashroomType(e.target.value)}>
              <option value="PRIVATE">Private washroom</option>
              <option value="SHARED">Shared washroom</option>
            </select>
          </div>

          <select className="input-well" value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)}>
            <option value="ALL">Open to all genders</option>
            <option value="MALE">Male only</option>
            <option value="FEMALE">Female only</option>
            <option value="NON_BINARY">Non-binary only</option>
          </select>

          <textarea
            className="input-well"
            rows={4}
            placeholder="Describe the room, flatmates, and nearby landmarks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              <ImagePlus size={16} />
              <span>{uploading ? 'Uploading...' : 'Add room photo'}</span>
              <input type="file" accept="image/*" hidden onChange={handlePhoto} />
            </label>
            {photoUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {photoUrls.map((u) => (
                  <img
                    key={u}
                    src={u}
                    alt=""
                    style={{ width: 76, height: 76, borderRadius: 10, objectFit: 'cover' }}
                  />
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Publish room'}
          </button>
        </form>
      </div>
    </div>
  );
}
