import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationsApi } from '../api/endpoints';
import type { AppNotification } from '../types/api';

export function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await notificationsApi.list();
      setItems(Array.isArray(res) ? res : res.content || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markAll = async () => {
    await notificationsApi.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1 style={{ fontSize: 26 }}>Notifications</h1>
        {items.some((n) => !n.isRead) && (
          <button type="button" className="btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }} onClick={markAll}>
            <CheckCheck size={15} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <Bell size={32} color="var(--coral)" style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--muted)', margin: 0 }}>You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {items.map((n, i) => (
            <div
              key={n.id}
              onClick={async () => {
                if (!n.isRead) {
                  await notificationsApi.markRead(n.id);
                  setItems((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
                  );
                }
              }}
              style={{
                padding: '14px 18px',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: n.isRead ? 'transparent' : 'var(--chip)',
                cursor: 'pointer',
              }}
            >
              <strong style={{ fontSize: 14 }}>{n.title}</strong>
              <p style={{ margin: '3px 0 4px', fontSize: 13, color: 'var(--muted)' }}>{n.body}</p>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
