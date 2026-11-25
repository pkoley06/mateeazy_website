import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ENV } from '../config/env';

const TOUR_TABS = [
  { id: 'discover', label: 'Discover', caption: 'Browse rooms and flatmates nearby with your match % on every card.', video: '/assets/video/discover.mp4', poster: '/assets/video/discover.jpg' },
  { id: 'room', label: 'Room view', caption: 'Full photos, rent, deposit, amenities, house rules, and host match.', video: '/assets/video/room.mp4', poster: '/assets/video/room.jpg' },
  { id: 'chat', label: 'Chat', caption: 'Message hosts directly once you like what you see — zero brokers.', video: '/assets/video/chat.mp4', poster: '/assets/video/chat.jpg' },
  { id: 'post', label: 'Community', caption: 'Ask neighbours, share local tips, or find someone to team up with.', video: '/assets/video/post.mp4', poster: '/assets/video/post.jpg' },
  { id: 'lifestyle', label: 'Lifestyle', caption: '5 quick habits power your match score before you ever say hi.', video: '/assets/video/lifestyle.mp4', poster: '/assets/video/lifestyle.jpg' },
];

export function LandingPage() {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState(TOUR_TABS[0]);
  const [smokeMatch, setSmokeMatch] = useState(true);
  const [sleepMatch, setSleepMatch] = useState(true);
  const [cleanMatch, setCleanMatch] = useState(true);

  const score =
    40 +
    (smokeMatch ? 25 : 0) +
    (sleepMatch ? 20 : 0) +
    (cleanMatch ? 15 : 0);

  const isSignedIn = status === 'authenticated';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'rgba(246, 237, 227, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/assets/img/logo.svg" alt="MateEazy" width={36} height={36} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 21 }}>
              MateEazy
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="#tour" className="btn-ghost" style={{ display: 'inline-flex' }}>
              App tour
            </a>
            <Link to={isSignedIn ? '/home' : '/welcome'} className="btn-primary" style={{ padding: '10px 18px', fontSize: 14 }}>
              {isSignedIn ? 'Open App' : 'Sign in / Web App'}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '56px 20px 44px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 36,
          alignItems: 'center',
        }}
      >
        <div>
          <span className="chip coral" style={{ marginBottom: 14 }}>
            Zero brokerage · Lifestyle matched
          </span>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', lineHeight: 1.06, marginBottom: 16 }}>
            Find a room and a flatmate who fits your life.
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 17, margin: '0 0 26px', maxWidth: 520 }}>
            See how well your sleep, cleanliness, food, and guest habits match before you chat. Use MateEazy right here on the web or on Android.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Link to={isSignedIn ? '/home' : '/welcome'} className="btn-primary">
              {isSignedIn ? 'Go to Discover' : 'Launch MateEazy Web'}
              <ArrowRight size={18} />
            </Link>
            <a
              href={ENV.playStoreUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Get on Google Play
            </a>
          </div>
        </div>

        <div className="card" style={{ padding: 20, overflow: 'hidden' }}>
          <img
            src="/assets/img/room-balcony.jpg"
            alt="Sunlit room on MateEazy"
            style={{
              width: '100%',
              aspectRatio: '16/10',
              objectFit: 'cover',
              borderRadius: 'var(--radius-md)',
              marginBottom: 14,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <strong style={{ fontSize: 17 }}>Sunlit private room · HSR Layout</strong>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                ₹14,500/month · Semi-furnished · 2.1 km away
              </p>
            </div>
            <span className="chip gold" style={{ fontSize: 14, fontWeight: 700 }}>
              94% match
            </span>
          </div>
        </div>
      </section>

      {/* Value Pillars */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '12px 20px 44px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {[
            {
              icon: Sparkles,
              title: 'Match on daily habits',
              desc: 'Smoking, diet, sleep schedule, cleanliness, and guests — weighted transparently.',
            },
            {
              icon: ShieldCheck,
              title: 'Zero brokerage',
              desc: 'Talk directly to the flatmate or host. No middlemen, no hidden fees.',
            },
            {
              icon: MessageCircle,
              title: 'Same flow on web & app',
              desc: 'Open any shared room or community post link right in your browser or Android app.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'var(--chip)',
                    color: 'var(--coral)',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 6 }}>{item.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Tour */}
      <section id="tour" style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 20px 56px' }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>See how MateEazy works</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px' }}>
          Tap a screen to preview the app flow.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TOUR_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${activeTab.id === t.id ? 'active' : ''}`}
              style={{ padding: '9px 16px', fontSize: 13 }}
              onClick={() => setActiveTab(t)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div
          className="card"
          style={{
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div style={{ maxWidth: 280, margin: '0 auto' }}>
            <video
              key={activeTab.video}
              src={activeTab.video}
              poster={activeTab.poster}
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: '100%',
                borderRadius: 24,
                border: '6px solid var(--plum)',
                boxShadow: 'var(--shadow-lg)',
              }}
            />
          </div>
          <div>
            <span className="chip coral" style={{ marginBottom: 10 }}>
              {activeTab.label}
            </span>
            <h3 style={{ fontSize: 24, marginBottom: 10 }}>{activeTab.caption}</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
              Everything you see in the Android app is available right here on mateeazy.in.
            </p>
            <Link to={isSignedIn ? '/home' : '/welcome'} className="btn-primary">
              Try it now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Match Demo */}
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px 64px' }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 6 }}>Interactive match score</h2>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                Toggle shared habits to see how compatibility is calculated.
              </p>
            </div>
            <div
              style={{
                background: 'var(--plum)',
                color: 'var(--cream)',
                padding: '12px 22px',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 22,
              }}
            >
              {score}% Match
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <button
              type="button"
              className={`chip ${smokeMatch ? 'active' : ''}`}
              onClick={() => setSmokeMatch((v) => !v)}
            >
              <CheckCircle2 size={14} />
              Non-smoker match (+25%)
            </button>
            <button
              type="button"
              className={`chip ${sleepMatch ? 'active' : ''}`}
              onClick={() => setSleepMatch((v) => !v)}
            >
              <CheckCircle2 size={14} />
              Same sleep schedule (+20%)
            </button>
            <button
              type="button"
              className={`chip ${cleanMatch ? 'active' : ''}`}
              onClick={() => setCleanMatch((v) => !v)}
            >
              <CheckCircle2 size={14} />
              Cleanliness aligned (+15%)
            </button>
          </div>
        </div>
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '28px 20px',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: 13,
        }}
      >
        © {new Date().getFullYear()} MateEazy · Zero-brokerage rooms & flatmates
      </footer>
    </div>
  );
}
