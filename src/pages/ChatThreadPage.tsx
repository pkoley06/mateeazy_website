import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, ImagePlus } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import { chatApi, uploadApi } from '../api/endpoints';
import { getStoredToken } from '../api/client';
import { ENV } from '../config/env';
import type { ChatMessage, Conversation } from '../types/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ChatThreadPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) return;
    try {
      const [conv, msgsRes] = await Promise.all([
        chatApi.getConversation(conversationId),
        chatApi.getMessages(conversationId),
      ]);
      setConversation(conv);
      const list = Array.isArray(msgsRes) ? msgsRes : msgsRes.content || [];
      setMessages([...list].reverse());
      chatApi.markRead(conversationId).catch(() => {});
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to open chat', 'error');
    }
  }, [conversationId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Real-time STOMP listener
  useEffect(() => {
    if (!conversationId) return;
    const token = getStoredToken();
    if (!token) return;

    const wsUrl = ENV.apiBaseUrl.replace(/^http/, 'ws') + '/ws-comments/websocket';
    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/user/queue/messages', (frame) => {
          try {
            const incoming = JSON.parse(frame.body) as ChatMessage;
            if (incoming.conversationId === conversationId) {
              setMessages((prev) =>
                prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
              );
              chatApi.markRead(conversationId).catch(() => {});
            }
          } catch {
            // ignore malformed frame
          }
        });
      },
    });
    client.activate();
    return () => {
      void client.deactivate();
    };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversationId || !text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await chatApi.sendMessage(conversationId, text.trim(), 'TEXT');
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setText('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId) return;
    setSending(true);
    try {
      const urls = await uploadApi.uploadListingPhotos([file]);
      const msg = await chatApi.sendMessage(conversationId, '', 'IMAGE', urls);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Photo send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button type="button" className="btn-ghost" style={{ padding: 6 }} onClick={() => navigate('/chat')}>
          <ArrowLeft size={18} />
        </button>
        {conversation && (
          <Link
            to={`/users/${conversation.otherParticipant.id}?from=chat`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}
          >
            <img
              src={conversation.otherParticipant.avatarUrl || '/assets/img/avatar-priya.png'}
              alt={conversation.otherParticipant.fullName}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <strong style={{ fontSize: 15 }}>{conversation.otherParticipant.fullName}</strong>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {conversation.otherParticipant.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Pending request banner */}
      {conversation?.requestStatus === 'PENDING' && !conversation.initiatedByMe && (
        <div className="card" style={{ padding: 14, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13 }}>Accept chat request from {conversation.otherParticipant.fullName}?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={async () => {
                const updated = await chatApi.acceptConversation(conversation.id);
                setConversation(updated);
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={async () => {
                await chatApi.rejectConversation(conversation.id);
                navigate('/chat');
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="card"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.map((m) => {
          const mine = m.senderId === userId;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: mine ? 'var(--chat-mine)' : 'var(--surface-alt)',
                border: mine ? '1px solid var(--chat-mine-border)' : '1px solid var(--border)',
                padding: '9px 13px',
                borderRadius: 16,
              }}
            >
              {m.attachmentUrls && m.attachmentUrls.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: m.content ? 6 : 0 }}>
                  {m.attachmentUrls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt=""
                      style={{ maxWidth: 220, borderRadius: 10 }}
                    />
                  ))}
                </div>
              )}
              {m.content && <div style={{ fontSize: 14 }}>{m.content}</div>}
              <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'right', marginTop: 3 }}>
                {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <label className="btn-secondary" style={{ padding: '0 14px', cursor: 'pointer' }}>
          <ImagePlus size={18} />
          <input type="file" accept="image/*" hidden onChange={handlePhoto} />
        </label>
        <input
          className="input-well"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={!text.trim() || sending}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
