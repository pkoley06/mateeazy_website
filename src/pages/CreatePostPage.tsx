import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus } from 'lucide-react';
import { communityApi, uploadApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';

export function CreatePostPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [category, setCategory] = useState('DISCUSSION');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [city, setCity] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const urls = await uploadApi.uploadListingPhotos([file]);
      if (urls[0]) setImageUrls((prev) => [...prev, urls[0]]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const created = await communityApi.createPost({
        category,
        title: title.trim(),
        content: content.trim(),
        localityName: localityName.trim() || 'Nearby',
        city: city.trim() || 'Bengaluru',
        imageUrls,
      });
      showToast('Post published!', 'success');
      navigate(`/community/post/${created.id}`, { state: { post: created } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not publish post', 'error');
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
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Create community post</h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Category</label>
            <select className="input-well" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="DISCUSSION">Discussion</option>
              <option value="RECOMMENDATION">Recommendation</option>
              <option value="MARKETPLACE">Marketplace</option>
              <option value="LOCAL_ALERT">Local Alert</option>
              <option value="EVENT">Event</option>
              <option value="QUESTION">Question</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Title</label>
            <input
              className="input-well"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Details</label>
            <textarea
              className="input-well"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share details with your neighbourhood..."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input
              className="input-well"
              value={localityName}
              onChange={(e) => setLocalityName(e.target.value)}
              placeholder="Locality (e.g. HSR Layout)"
            />
            <input
              className="input-well"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City (e.g. Bengaluru)"
            />
          </div>

          <div>
            <label className="btn-secondary" style={{ cursor: 'pointer' }}>
              <ImagePlus size={16} />
              <span>{uploading ? 'Uploading...' : 'Add photo'}</span>
              <input type="file" accept="image/*" hidden onChange={handleImage} />
            </label>
            {imageUrls.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {imageUrls.map((u) => (
                  <img
                    key={u}
                    src={u}
                    alt=""
                    style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover' }}
                  />
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish post'}
          </button>
        </form>
      </div>
    </div>
  );
}
