import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { chatApi } from '../api/endpoints';
import type { Conversation } from '../types/api';
import { useToast } from '../context/ToastContext';

export function ConversationsPage() {
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await chatApi.getConversations();
      setConversations(list || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load chats', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginBottom: 14 }}>Messages</h1>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <MessageCircle size={36} color="var(--coral)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>No conversations yet</h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
            Message a host from any room listing to start chatting.
          </p>
          <Link to="/home" className="btn-primary">
            Explore rooms
          </Link>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {conversations.map((conv, i) => (
            <Link
              key={conv.id}
              to={`/chat/${conv.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={conv.otherParticipant.avatarUrl || '/assets/img/avatar-priya.png'}
                  alt={conv.otherParticipant.fullName}
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
                />
                {conv.otherParticipant.isOnline && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 1,
                      bottom: 1,
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: 'var(--success)',
                      border: '2px solid var(--card)',
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 15 }}>{conv.otherParticipant.fullName}</strong>
                  {conv.lastMessage && (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {new Date(conv.lastMessage.sentAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {conv.listing && (
                  <div style={{ fontSize: 11, color: 'var(--coral)', fontWeight: 600 }}>
                    {conv.listing.title} · ₹{conv.listing.rentAmount.toLocaleString('en-IN')}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conv.lastMessage
                    ? conv.lastMessage.messageType === 'IMAGE'
                      ? '📷 Photo'
                      : conv.lastMessage.messageType === 'GIF'
                      ? 'GIF'
                      : conv.lastMessage.content
                    : conv.requestStatus === 'PENDING'
                    ? 'Chat request pending'
                    : 'Say hello!'}
                </div>
              </div>

              {conv.unreadCount > 0 && (
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 999,
                    background: 'var(--coral)',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 6px',
                  }}
                >
                  {conv.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
