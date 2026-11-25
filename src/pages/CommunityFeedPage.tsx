import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Plus, MapPin } from 'lucide-react';
import { communityApi } from '../api/endpoints';
import type { CommunityPost, CommunityPostCategory } from '../types/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES: { value: CommunityPostCategory; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DISCUSSION', label: 'Discussion' },
  { value: 'RECOMMENDATION', label: 'Recommendations' },
  { value: 'MARKETPLACE', label: 'Marketplace' },
  { value: 'LOCAL_ALERT', label: 'Local Alerts' },
  { value: 'EVENT', label: 'Events' },
  { value: 'QUESTION', label: 'Questions' },
];

export function CommunityFeedPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [category, setCategory] = useState<CommunityPostCategory>('ALL');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityApi.getPosts({
        category,
        lat: 12.9716,
        lng: 77.5946,
        radiusKm: 25,
        size: 30,
      });
      setPosts(res.content || []);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to load community feed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [category, showToast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const toggleLike = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    const nextLiked = !post.isLikedByMe;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              isLikedByMe: nextLiked,
              likesCount: p.likesCount + (nextLiked ? 1 : -1),
            }
          : p
      )
    );
    try {
      await communityApi.toggleLike(post.id);
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  };

  const sharePost = async (e: React.MouseEvent, post: CommunityPost) => {
    e.stopPropagation();
    const url = `https://mateeazy.in/post/${post.id}`;
    const text = `Saw this on MateEazy Community: ${post.title}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text, url });
        return;
      } catch {
        // fallback
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`);
    showToast('Post link copied!', 'success');
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26 }}>Community</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            Ask neighbours, share tips &amp; local finds
          </p>
        </div>
        <Link to="/community/new" className="btn-primary" style={{ padding: '9px 16px' }}>
          <Plus size={16} />
          <span>New post</span>
        </Link>
      </div>

      {/* Category Chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 14 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip ${category === c.value ? 'active' : ''}`}
            style={{ flexShrink: 0, padding: '8px 14px' }}
            onClick={() => setCategory(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 180, opacity: 0.6 }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>No posts in this category yet</h3>
          <Link to="/community/new" className="btn-primary">
            Start a discussion
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {posts.map((post) => (
            <article
              key={post.id}
              className="card"
              style={{ padding: 18, cursor: 'pointer' }}
              onClick={() =>
                navigate(`/community/post/${post.id}`, { state: { post } })
              }
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Link
                  to={`/users/${post.authorId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <img
                    src={post.authorAvatarUrl || '/assets/img/avatar-priya.png'}
                    alt={post.authorName}
                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{post.authorName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} />
                      <span>
                        {post.localityName} · {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
                <span className="chip coral" style={{ fontSize: 11 }}>
                  {post.category.replace('_', ' ')}
                </span>
              </div>

              {post.title && <h3 style={{ fontSize: 18, marginBottom: 6 }}>{post.title}</h3>}
              <p style={{ margin: '0 0 12px', fontSize: 14, whiteSpace: 'pre-line' }}>
                {post.content.length > 260
                  ? `${post.content.slice(0, 260)}...`
                  : post.content}
              </p>

              {post.imageUrls.length > 0 && (
                <img
                  src={post.imageUrls[0]}
                  alt={post.title}
                  style={{
                    width: '100%',
                    maxHeight: 280,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 12,
                  }}
                />
              )}

              <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 13 }}
                  onClick={(e) => toggleLike(e, post)}
                >
                  <Heart
                    size={16}
                    fill={post.isLikedByMe ? '#FF6B5B' : 'none'}
                    color={post.isLikedByMe ? '#FF6B5B' : 'currentColor'}
                  />
                  <span>{post.likesCount}</span>
                </button>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
                  <MessageSquare size={16} />
                  <span>{post.commentsCount}</span>
                </span>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: '4px 8px', fontSize: 13, marginLeft: 'auto' }}
                  onClick={(e) => sharePost(e, post)}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
