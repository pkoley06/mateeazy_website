import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, MapPin, Trash2 } from 'lucide-react';
import { communityApi } from '../api/endpoints';
import type { CommentItem, CommunityPost } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PhotoGallery } from '../components/PhotoGallery';
import { CommentSection } from '../components/CommentSection';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAuth();
  const { showToast } = useToast();

  const initialPost = (location.state as { post?: CommunityPost } | null)?.post ?? null;
  const [post, setPost] = useState<CommunityPost | null>(initialPost);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(!initialPost);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [p, c] = await Promise.all([
        communityApi.getPost(id),
        communityApi.getComments(id).catch(() => []),
      ]);
      setPost(p);
      setComments(Array.isArray(c) ? c : c.content || []);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Post not found or unavailable',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  const handleToggleLike = async () => {
    if (!post) return;
    const nextLiked = !post.isLikedByMe;
    setPost({
      ...post,
      isLikedByMe: nextLiked,
      likesCount: post.likesCount + (nextLiked ? 1 : -1),
    });
    try {
      await communityApi.toggleLike(post.id);
    } catch {
      setPost(post);
    }
  };

  const handleShare = async () => {
    if (!post) return;
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

  const handleDeletePost = async () => {
    if (!post) return;
    await communityApi.deletePost(post.id);
    showToast('Post deleted', 'success');
    navigate('/feed');
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <h2>This post is no longer available</h2>
        <Link to="/feed" className="btn-primary" style={{ marginTop: 12 }}>
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <button type="button" className="btn-ghost" onClick={handleBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-secondary" style={{ padding: '8px 14px' }} onClick={handleShare}>
            <Share2 size={16} />
            <span>Share</span>
          </button>
          {post.authorId === userId && (
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '8px 14px', color: '#DC2626' }}
              onClick={handleDeletePost}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <article className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link to={`/users/${post.authorId}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={post.authorAvatarUrl || '/assets/img/avatar-priya.png'}
              alt={post.authorName}
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <strong style={{ fontSize: 15 }}>{post.authorName}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} />
                <span>
                  {post.localityName}, {post.city} · {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
          <span className="chip coral">{post.category.replace('_', ' ')}</span>
        </div>

        <h1 style={{ fontSize: 24, marginBottom: 10 }}>{post.title}</h1>
        <p style={{ margin: '0 0 16px', fontSize: 15, whiteSpace: 'pre-line' }}>
          {post.content}
        </p>

        {post.imageUrls.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <PhotoGallery photos={post.imageUrls} alt={post.title} />
          </div>
        )}

        {post.taggedListingId && (
          <Link
            to={`/discover/room/${post.taggedListingId}`}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              marginBottom: 16,
              background: 'var(--surface-alt)',
            }}
          >
            {post.taggedListingCoverUrl && (
              <img
                src={post.taggedListingCoverUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }}
              />
            )}
            <div>
              <div style={{ fontSize: 12, color: 'var(--coral)', fontWeight: 600 }}>Tagged Room</div>
              <div style={{ fontWeight: 600 }}>{post.taggedListingTitle || 'View Room'}</div>
              {post.taggedListingRent != null && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  ₹{post.taggedListingRent.toLocaleString('en-IN')}/month
                </div>
              )}
            </div>
          </Link>
        )}

        <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn-secondary" style={{ padding: '7px 14px' }} onClick={handleToggleLike}>
            <Heart
              size={16}
              fill={post.isLikedByMe ? '#FF6B5B' : 'none'}
              color={post.isLikedByMe ? '#FF6B5B' : 'currentColor'}
            />
            <span>{post.likesCount} Likes</span>
          </button>
        </div>

        <CommentSection
          comments={comments}
          onAdd={async (content, parentId) => {
            await communityApi.addComment(post.id, content, parentId);
            const res = await communityApi.getComments(post.id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
          onDelete={async (commentId) => {
            await communityApi.deleteComment(commentId);
            const res = await communityApi.getComments(post.id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
          onToggleLike={async (commentId) => {
            await communityApi.toggleCommentLike(commentId);
            const res = await communityApi.getComments(post.id);
            setComments(Array.isArray(res) ? res : res.content || []);
          }}
        />
      </article>
    </div>
  );
}
