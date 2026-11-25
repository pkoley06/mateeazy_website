import React, { useState } from 'react';
import { Heart, Trash2, CornerDownRight, Send } from 'lucide-react';
import type { CommentItem } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  comments: CommentItem[];
  onAdd: (content: string, parentCommentId?: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
}

export function CommentSection({
  comments,
  onAdd,
  onDelete,
  onToggleLike,
}: CommentSectionProps) {
  const { userId } = useAuth();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(trimmed, replyTo?.id);
      setText('');
      setReplyTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = (c: CommentItem, depth = 0) => (
    <div
      key={c.id}
      style={{
        marginLeft: depth > 0 ? 28 : 0,
        paddingTop: 12,
        borderTop: depth === 0 ? '1px solid var(--border)' : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Link to={`/users/${c.authorId}`}>
          <img
            src={c.authorAvatarUrl || '/assets/img/avatar-priya.png'}
            alt={c.authorName}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              objectFit: 'cover',
              background: 'var(--surface-alt)',
            }}
          />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link
              to={`/users/${c.authorId}`}
              style={{ fontWeight: 600, fontSize: 13 }}
            >
              {c.authorName}
            </Link>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p style={{ margin: '4px 0 6px', fontSize: 14 }}>{c.content}</p>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onToggleLike(c.id)}
              className="btn-ghost"
              style={{ padding: '2px 6px', fontSize: 12 }}
            >
              <Heart
                size={14}
                fill={c.isLikedByMe ? 'var(--coral)' : 'none'}
                color={c.isLikedByMe ? 'var(--coral)' : 'currentColor'}
              />
              <span>{c.likesCount}</span>
            </button>
            {depth === 0 && (
              <button
                type="button"
                onClick={() => setReplyTo(c)}
                className="btn-ghost"
                style={{ padding: '2px 6px', fontSize: 12 }}
              >
                <CornerDownRight size={14} />
                <span>Reply</span>
              </button>
            )}
            {c.authorId === userId && (
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                className="btn-ghost"
                style={{ padding: '2px 6px', fontSize: 12, color: '#DC2626' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      {c.replies?.map((r) => renderItem(r, depth + 1))}
    </div>
  );

  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 18, marginBottom: 12 }}>
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        {replyTo && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--muted)',
              marginBottom: 6,
            }}
          >
            <span>Replying to {replyTo.authorName}</span>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--coral)',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input-well"
            placeholder={
              replyTo ? `Reply to ${replyTo.authorName}...` : 'Ask a question or leave a comment...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!text.trim() || submitting}
            style={{ padding: '0 18px' }}
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {comments.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          No comments yet. Be the first to ask!
        </p>
      ) : (
        <div>{comments.map((c) => renderItem(c))}</div>
      )}
    </div>
  );
}
