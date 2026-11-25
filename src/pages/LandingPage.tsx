import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../config/analytics';
import '../../styles.css';

const TOUR_TABS = [
  { key: 'discover', title: 'Find rooms and flatmates', sub: 'Your feed, sorted by match', video: '/assets/video/discover.mp4', poster: '/assets/video/discover.jpg' },
  { key: 'room', title: 'Look inside a room', sub: 'Photos, rent, map and host', video: '/assets/video/room.mp4', poster: '/assets/video/room.jpg' },
  { key: 'likes', title: 'Like and comment', sub: 'Save rooms, ask the host', video: '/assets/video/likes.mp4', poster: '/assets/video/likes.jpg' },
  { key: 'chat', title: 'Chat in the app', sub: 'No phone numbers needed', video: '/assets/video/chat.mp4', poster: '/assets/video/chat.jpg' },
  { key: 'finder', title: 'Room Finder Mode', sub: 'Team up with other seekers', video: '/assets/video/finder.mp4', poster: '/assets/video/finder.jpg' },
  { key: 'lifestyle', title: 'Set your everyday rhythm', sub: 'The answers behind your match %', video: '/assets/video/lifestyle.mp4', poster: '/assets/video/lifestyle.jpg' },
  { key: 'post', title: 'Post your room', sub: 'Find someone for your spare room', video: '/assets/video/post.mp4', poster: '/assets/video/post.jpg' },
  { key: 'settings', title: 'Notifications and privacy', sub: 'You decide what reaches you', video: '/assets/video/settings.mp4', poster: '/assets/video/settings.jpg' },
] as const;

type TourKey = (typeof TOUR_TABS)[number]['key'];

const TOUR_STEPS: Record<TourKey, { heading: string; steps: string[] }> = {
  discover: {
    heading: 'Find rooms and flatmates',
    steps: [
      'Open Discover to see rooms and seekers near you, each with your match %.',
      'Tap the filter icon to set your budget, room type, furnishing, or distance.',
      'Tap any card to open full photos, lifestyle highlights, and host details.',
    ],
  },
  room: {
    heading: 'Look inside a room',
    steps: [
      'Swipe through room photos and check rent, deposit, move-in date, and furnishing.',
      'See kitchen and washroom sharing, house rules, and gender preferences upfront.',
      'Check where it is on the map.',
    ],
  },
  likes: {
    heading: 'Like and comment',
    steps: [
      'Open a room and scroll down to the likes and comments.',
      'Tap the heart to like it, or ask the host a question in the comments.',
      'The host gets a notification and can reply.',
    ],
  },
  chat: {
    heading: 'Chat in the app',
    steps: [
      'Open Chats to see every conversation. Search, or show only unread ones.',
      "Each chat shows the room you're talking about at the top.",
      'Send messages and photos without giving out your phone number.',
    ],
  },
  finder: {
    heading: 'Room Finder Mode',
    steps: [
      "Turn on Room Finder Mode and set the area and budget you're looking for.",
      'Open the Flatmates tab in Discover to see others searching near you.',
      'Open a profile, compare your everyday rhythm and tap Message to team up.',
    ],
  },
  lifestyle: {
    heading: 'Set your everyday rhythm',
    steps: [
      'Go to Profile and tap a habit under Your everyday rhythm.',
      'Pick the answer that sounds most like you and tap Save & next.',
      'Your match % with every room and flatmate updates to match.',
    ],
  },
  post: {
    heading: 'Post your room',
    steps: [
      'Go to Profile and tap List your room.',
      'Add photos, rent, deposit, move-in date, furnishing and house rules, and choose who can apply.',
      'Publish it. People nearby see it in Discover with their match %.',
    ],
  },
  settings: {
    heading: 'Notifications and privacy',
    steps: [
      'Go to Profile and open settings.',
      'Choose which notifications reach your phone: likes, messages, new seekers and new rooms.',
      'Manage blocked users, or disable or delete your account any time.',
    ],
  },
};

const W = { clean: 2.0, sleep: 1.5, guest: 1.2, diet: 1.0 } as const;
const MAX = W.clean + W.sleep + W.guest + W.diet;
const SCORE = {
  clean: { VERY_CLEAN: 1, MODERATE: 0.5, RELAXED: 0 },
  sleep: { EARLY_BIRD: 1, FLEXIBLE: 0.5, NIGHT_OWL: 0 },
  guest: { FREQUENT: 1, OCCASIONAL: 0.5, NEVER: 0 },
  diet: { VEGAN: 1, VEGETARIAN: 0.8, EGGETARIAN: 0.6, NO_PREFERENCE: 0.4, NON_VEGETARIAN: 0 },
} as const;
const PRIYA = {
  sleep: 'EARLY_BIRD',
  clean: 'VERY_CLEAN',
  guest: 'OCCASIONAL',
  diet: 'VEGETARIAN',
  smoke: 'NON_SMOKER',
} as const;
const SAME = {
  sleep: { EARLY_BIRD: 'Both early birds', FLEXIBLE: 'Similar sleep rhythm', NIGHT_OWL: 'Both night owls' },
  clean: { VERY_CLEAN: 'Both very tidy', MODERATE: 'Similarly tidy', RELAXED: 'Both easygoing about mess' },
  guest: { NEVER: 'Both like a quiet home', OCCASIONAL: 'Similar guest habits', FREQUENT: 'Both love hosting' },
  diet: { VEGAN: 'Both vegan', VEGETARIAN: 'Both vegetarian', EGGETARIAN: 'Both eggetarian', NON_VEGETARIAN: 'Both non-veg', NO_PREFERENCE: 'Easygoing about food' },
} as const;

export function LandingPage() {
  const { status } = useAuth();
  const isSignedIn = status === 'authenticated';

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [quiz, setQuiz] = useState<{
    sleep: keyof typeof SCORE.sleep;
    clean: keyof typeof SCORE.clean;
    guest: keyof typeof SCORE.guest;
    diet: keyof typeof SCORE.diet;
    smoke: 'NON_SMOKER' | 'OCCASIONAL_SMOKER' | 'REGULAR_SMOKER';
  }>({
    sleep: 'EARLY_BIRD',
    clean: 'MODERATE',
    guest: 'OCCASIONAL',
    diet: 'VEGETARIAN',
    smoke: 'NON_SMOKER',
  });

  const activeTab = TOUR_TABS[activeIndex];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setProgress(0);
    if (!paused) {
      v.play().catch(() => setPaused(true));
    }
  }, [activeIndex, paused]);

  useEffect(() => {
    const stage = stageRef.current;
    const v = videoRef.current;
    if (!stage || !v) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !paused) {
          v.play().catch(() => {});
        } else if (!entry.isIntersecting && !v.paused) {
          v.pause();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(stage);
    return () => obs.disconnect();
  }, [paused]);

  const matchResult = useMemo(() => {
    const dealbreaker = quiz.smoke === 'REGULAR_SMOKER';
    if (dealbreaker) {
      return {
        pct: 0,
        dealbreaker: true,
        verdict: 'Not a match: smoking is a dealbreaker',
        highlights: ["She doesn't smoke, you smoke regularly"],
      };
    }
    const d =
      W.clean * Math.abs(SCORE.clean[quiz.clean] - SCORE.clean[PRIYA.clean]) +
      W.sleep * Math.abs(SCORE.sleep[quiz.sleep] - SCORE.sleep[PRIYA.sleep]) +
      W.guest * Math.abs(SCORE.guest[quiz.guest] - SCORE.guest[PRIYA.guest]) +
      W.diet * Math.abs(SCORE.diet[quiz.diet] - SCORE.diet[PRIYA.diet]);
    const pct = Math.max(0, Math.round(100 - (d / MAX) * 100));
    const highlights: string[] = [];
    if (quiz.smoke === 'NON_SMOKER') highlights.push('Both non-smokers');
    if (quiz.sleep === PRIYA.sleep) highlights.push(SAME.sleep[quiz.sleep]);
    if (quiz.clean === PRIYA.clean) highlights.push(SAME.clean[quiz.clean]);
    if (quiz.guest === PRIYA.guest) highlights.push(SAME.guest[quiz.guest]);
    if (quiz.diet === PRIYA.diet) highlights.push(SAME.diet[quiz.diet]);

    const verdict =
      pct >= 80
        ? 'You two would get along well'
        : pct >= 60
        ? 'A good match, worth a chat'
        : pct >= 40
        ? 'Some differences to talk about'
        : 'Very different routines';

    return { pct, dealbreaker: false, verdict, highlights };
  }, [quiz]);

  const jumpTo = (key: TourKey) => {
    const idx = TOUR_TABS.findIndex((t) => t.key === key);
    if (idx >= 0) {
      setAutoAdvance(false);
      setActiveIndex(idx);
    }
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      {/* Header */}
      <header className="site-header" id="top">
        <div className="wrap nav">
          <a className="brand" href="#top" aria-label="MateEazy home">
            <img src="/assets/img/logo.svg" alt="" width={40} height={40} />
            <span>MateEazy</span>
          </a>
          <button
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
          <nav
            id="nav-links"
            className={`nav-links ${menuOpen ? 'open' : ''}`}
            aria-label="Main"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#how">App tour</a>
            <a href="#match">Match score</a>
            <a href="#features">Features</a>
            <a href="#safety">Safety</a>
            <a href="#faq">FAQ</a>
            <a href="#download">Get the app</a>
            <Link className="btn btn-small" to={isSignedIn ? '/home' : '/welcome'}>
              {isSignedIn ? 'Open Web App' : 'Sign in / Sign up'}
            </Link>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1 className="display"><span>Find your space.</span> <span>Find your people.</span></h1>
              <p className="lead">
                MateEazy helps you find a room, and someone you&apos;ll actually enjoy living with. Every room and flatmate shows how well your daily habits match before you send a single message.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, marginBottom: 14 }}>
                <Link
                  className="btn"
                  to={isSignedIn ? '/home' : '/welcome'}
                  onClick={() => trackEvent('web_app_cta_click', { source: 'hero' })}
                >
                  {isSignedIn ? 'Open MateEazy Web' : 'Sign in / Use Web App'}
                </Link>
              </div>

              <div className="get-app">
                <a
                  className="play-badge"
                  href="https://play.google.com/store/apps/details?id=com.mateeazy.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('play_store_click', { source: 'hero' })}
                >
                  <img src="/assets/img/google-play-badge.png" alt="Get it on Google Play" width={646} height={250} />
                </a>
                <div className="qr-tile">
                  <img src="/assets/img/qr-play.svg" alt="QR code to install MateEazy from Google Play" width={96} height={96} />
                  <span>Scan with your phone camera to install</span>
                </div>
              </div>
              <p className="fine">Free on Web &amp; Android. No broker fees.</p>
            </div>

            <div className="hero-art" aria-hidden="true">
              <div className="house">
                <img src="/assets/img/room-balcony.jpg" alt="" width={928} height={1152} />
              </div>
              <div className="float float-match">
                <strong>92%</strong>
                <span>match with Priya<small>Both early birds, both vegetarian</small></span>
              </div>
              <div className="float float-room">
                <span className="price">₹9,500 / month</span>
                <span>Private room with balcony</span>
                <small>1.2 km from you</small>
              </div>
            </div>
          </div>
        </section>

        {/* App tour */}
        <section className="section tour" id="how">
          <div className="wrap">
            <h2 className="h2">See how MateEazy works</h2>
            <p className="section-lead">Real screens from the app. Pick a feature to watch how it&apos;s done.</p>

            <div className="quick-paths" aria-label="Start with what you need">
              <button type="button" onClick={() => jumpTo('post')}>I have a room to share</button>
              <button type="button" onClick={() => jumpTo('discover')}>I need a room</button>
              <button type="button" onClick={() => jumpTo('finder')}>I want a flatmate to rent with</button>
            </div>

            <div className="tour-grid">
              <div className="tour-list" role="tablist" aria-label="App features" aria-orientation="vertical">
                {TOUR_TABS.map((t, i) => {
                  const selected = i === activeIndex;
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      id={`t-${t.key}`}
                      aria-controls="tour-stage"
                      aria-selected={selected}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => {
                        setAutoAdvance(false);
                        setActiveIndex(i);
                      }}
                    >
                      <b>{t.title}</b>
                      <span>{t.sub}</span>
                      <i
                        className="prog"
                        style={{ '--p': selected ? progress : 0 } as React.CSSProperties}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="tour-stage" id="tour-stage" ref={stageRef} role="tabpanel" aria-labelledby={`t-${activeTab.key}`}>
                <div className="device">
                  <div className="device-screen">
                    <div className="statusbar" aria-hidden="true">
                      <span>9:41</span>
                      <span className="sb-icons"><i /><i /><i className="batt" /></span>
                    </div>
                    <video
                      ref={videoRef}
                      id="tour-video"
                      muted
                      playsInline
                      preload="metadata"
                      poster={activeTab.poster}
                      src={activeTab.video}
                      onTimeUpdate={() => {
                        const v = videoRef.current;
                        if (v && v.duration) setProgress(v.currentTime / v.duration);
                      }}
                      onEnded={() => {
                        if (autoAdvance) {
                          setActiveIndex((i) => (i + 1) % TOUR_TABS.length);
                        } else if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play().catch(() => {});
                        }
                      }}
                    />
                    <button
                      className={`play-toggle ${paused ? 'paused' : ''}`}
                      id="play-toggle"
                      type="button"
                      aria-label={paused ? 'Play video' : 'Pause video'}
                      onClick={() => {
                        const v = videoRef.current;
                        if (!v) return;
                        if (v.paused) {
                          setPaused(false);
                          v.play().catch(() => {});
                        } else {
                          setPaused(true);
                          v.pause();
                        }
                      }}
                    >
                      <svg className="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></svg>
                      <svg className="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
                    </button>
                  </div>
                </div>

                <div className="tour-steps">
                  <div className="steps-set">
                    <h3>{TOUR_STEPS[activeTab.key].heading}</h3>
                    <ol className="steps">
                      {TOUR_STEPS[activeTab.key].steps.map((s) => (
                        <li key={s}><p>{s}</p></li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Match score */}
        <section className="section match" id="match">
          <div className="wrap">
            <h2 className="h2">See your match before you say hello</h2>
            <p className="section-lead">Answer the same five questions the app asks and see how well you&apos;d live with Priya. The score below uses the same formula as the app.</p>

            <div className="match-grid">
              <form className="quiz" id="quiz" aria-describedby="match-result">
                <fieldset>
                  <legend>When do you usually sleep?</legend>
                  <div className="seg">
                    {([['EARLY_BIRD', 'Early bird'], ['FLEXIBLE', 'Flexible'], ['NIGHT_OWL', 'Night owl']] as const).map(([val, lbl]) => (
                      <label key={val}>
                        <input type="radio" name="sleep" value={val} checked={quiz.sleep === val} onChange={() => setQuiz((q) => ({ ...q, sleep: val }))} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>How tidy do you keep shared spaces?</legend>
                  <div className="seg">
                    {([['VERY_CLEAN', 'Very clean'], ['MODERATE', 'Moderate'], ['RELAXED', 'Relaxed']] as const).map(([val, lbl]) => (
                      <label key={val}>
                        <input type="radio" name="clean" value={val} checked={quiz.clean === val} onChange={() => setQuiz((q) => ({ ...q, clean: val }))} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>How often do you have guests over?</legend>
                  <div className="seg">
                    {([['NEVER', 'Never'], ['OCCASIONAL', 'Sometimes'], ['FREQUENT', 'Often']] as const).map(([val, lbl]) => (
                      <label key={val}>
                        <input type="radio" name="guest" value={val} checked={quiz.guest === val} onChange={() => setQuiz((q) => ({ ...q, guest: val }))} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>What do you eat?</legend>
                  <div className="seg seg-wrap">
                    {([['VEGAN', 'Vegan'], ['VEGETARIAN', 'Vegetarian'], ['EGGETARIAN', 'Eggetarian'], ['NO_PREFERENCE', 'Anything'], ['NON_VEGETARIAN', 'Non-veg']] as const).map(([val, lbl]) => (
                      <label key={val}>
                        <input type="radio" name="diet" value={val} checked={quiz.diet === val} onChange={() => setQuiz((q) => ({ ...q, diet: val }))} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Do you smoke?</legend>
                  <div className="seg">
                    {([['NON_SMOKER', 'No'], ['OCCASIONAL_SMOKER', 'Sometimes'], ['REGULAR_SMOKER', 'Regularly']] as const).map(([val, lbl]) => (
                      <label key={val}>
                        <input type="radio" name="smoke" value={val} checked={quiz.smoke === val} onChange={() => setQuiz((q) => ({ ...q, smoke: val }))} />
                        <span>{lbl}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </form>

              <div className="result" id="match-result" aria-live="polite">
                <div className="person">
                  <img src="/assets/img/avatar-priya.png" alt="" width={64} height={64} />
                  <div>
                    <b>Priya, 25</b>
                    <span>UX designer with a spare room</span>
                  </div>
                </div>
                <div
                  className={`dial ${matchResult.pct >= 80 ? 'great' : matchResult.pct >= 60 ? 'good' : ''}`}
                  id="dial"
                  style={{ '--p': matchResult.pct } as React.CSSProperties}
                >
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="track" cx="60" cy="60" r="52" />
                    <circle className="bar" cx="60" cy="60" r="52" pathLength={100} />
                  </svg>
                  <div className="dial-num"><span id="pct">{matchResult.pct}</span><small>%</small></div>
                </div>
                <p className="verdict" id="verdict">{matchResult.verdict}</p>
                <ul className="highlights" id="highlights">
                  {matchResult.highlights.map((h) => (
                    <li key={h} className={matchResult.dealbreaker ? 'bad' : ''}>{h}</li>
                  ))}
                </ul>
                <p className="her">Priya is an early bird, keeps things very clean, has guests sometimes, is vegetarian and doesn&apos;t smoke.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="section features" id="features">
          <div className="wrap">
            <h2 className="h2">Made for how flat-hunting actually works</h2>
            <div className="bento">
              <article className="tile tile-map">
                <div className="map" aria-hidden="true">
                  <span className="ring" /><span className="pin you">You</span>
                  <span className="pin p1" /><span className="pin p2" /><span className="pin p3" /><span className="pin p4 out" />
                </div>
                <div className="tile-copy">
                  <h3>Search by distance, not by locality names</h3>
                  <p>Drop a pin on your college or office and see rooms and flatmates within 2 to 30 km. Rooms outside your radius stay out of your way.</p>
                </div>
              </article>

              <article className="tile tile-broker">
                <h3>Zero brokerage</h3>
                <p>You talk to the owner or flatmate directly. There&apos;s no middleman, no commission and nothing to pay.</p>
                <span className="big-zero" aria-hidden="true">₹0</span>
              </article>

              <article className="tile tile-filters">
                <h3>Filters that matter</h3>
                <p>Narrow down to rooms that fit your budget and the way you want to live.</p>
                <ul className="filter-chips">
                  <li>Private room</li><li>Shared room</li><li>Furnished</li><li>Semi-furnished</li><li>Unfurnished</li><li>Rent range</li><li>Best match first</li>
                </ul>
              </article>

              <article className="tile tile-alerts">
                <h3>Alerts for new matches</h3>
                <p>Get a notification when a room or flatmate that fits you shows up nearby, so you hear about it first.</p>
                <div className="notif" aria-hidden="true">
                  <img src="/assets/img/logo.svg" alt="" />
                  <div><b>New room near you</b><span>86% match, 2.4 km away, ₹10,000 / month</span></div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section className="section safety" id="safety">
          <div className="wrap safety-grid">
            <div>
              <h2 className="h2">Living with someone new should feel safe</h2>
              <p className="section-lead">MateEazy is built around the worries people actually have when moving in with a stranger.</p>
            </div>
            <ul className="safety-list">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><circle cx="16.5" cy="9.5" r="2.6" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M14.5 14.3c.6-.2 1.3-.3 2-.3 2.3 0 4 1.5 4.5 4.2" /></svg>
                <div><h3>Gender preferences, both ways</h3><p>If a host wants women-only or men-only flatmates, only those people can see and contact the listing. Your preferences are respected in both directions.</p></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5h14v10H9.5L5 19.5z" /><path d="M9 10.5h6" /></svg>
                <div><h3>Your number stays private</h3><p>Everything happens in the in-app chat. Share your contact details only when you&apos;re ready.</p></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 20V4.5M6 5h10.5l-2 3.5 2 3.5H6" /></svg>
                <div><h3>Report and block</h3><p>Report a listing or a person in two taps, and block anyone you don&apos;t want to hear from. Our team reviews every report.</p></div>
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7" /></svg>
                <div><h3>Leave whenever you want</h3><p>Delete your account from Settings at any time. <a href="https://pkoley06.github.io/mateeazy-legal/delete-account.html">Here&apos;s how account deletion works.</a></p></div>
              </li>
            </ul>
          </div>
        </section>

        {/* Download */}
        <section className="download" id="download">
          <div className="wrap download-grid">
            <div className="download-copy">
              <h2 className="display-2">Your next home could be <span className="on-desk">one scan away.</span><span className="on-mob">one tap away.</span></h2>
              <p>MateEazy is free on Google Play. We&apos;ve just launched, so the first rooms and profiles get seen the most. Post your room or turn on Room Finder Mode today.</p>
              <a className="play-badge" href="https://play.google.com/store/apps/details?id=com.mateeazy.app" target="_blank" rel="noopener noreferrer">
                <img src="/assets/img/google-play-badge.png" alt="Get it on Google Play" width={646} height={250} loading="lazy" />
              </a>
            </div>
            <figure className="qr-big">
              <img src="/assets/img/qr-play.svg" alt="QR code to install MateEazy from Google Play" width={240} height={240} loading="lazy" />
              <figcaption>Point your phone camera here</figcaption>
            </figure>
          </div>
        </section>

        {/* FAQ */}
        <section className="section faq" id="faq">
          <div className="wrap faq-wrap">
            <h2 className="h2">Questions people ask</h2>
            <div className="faq-list">
              <details>
                <summary>Is MateEazy free?</summary>
                <p>Yes. Downloading the app, posting a room, searching and chatting are all free, and there are no broker fees.</p>
              </details>
              <details>
                <summary>Which cities does it work in?</summary>
                <p>MateEazy works anywhere in India. Search is based on where you are and the radius you choose, not a fixed list of cities.</p>
              </details>
              <details>
                <summary>How is the match score calculated?</summary>
                <p>We compare your answers on cleanliness, sleep timing, guests and food. Cleanliness counts the most, then sleep, guests and food. If one of you doesn&apos;t smoke and the other smokes regularly, it&apos;s treated as a dealbreaker and the score is 0%.</p>
              </details>
              <details>
                <summary>Can I use it without having a room?</summary>
                <p>Yes. Browse rooms near you, or turn on Room Finder Mode so hosts and other seekers can find you and team up to rent a place together.</p>
              </details>
              <details>
                <summary>Who can see my phone number?</summary>
                <p>Nobody, unless you share it. All conversations happen in the in-app chat.</p>
              </details>
              <details>
                <summary>How do I delete my account?</summary>
                <p>Open Settings in the app and choose Delete account. You can also read <a href="https://pkoley06.github.io/mateeazy-legal/delete-account.html">how account deletion works</a>.</p>
              </details>
              <details>
                <summary>How do I contact you?</summary>
                <p>Email <a href="mailto:support@mateeazy.in">support@mateeazy.in</a> and we&apos;ll get back to you.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top" aria-label="MateEazy home">
              <img src="/assets/img/logo.svg" alt="" width={40} height={40} />
              <span>MateEazy</span>
            </a>
            <p>Less searching. More belonging.</p>
          </div>
          <nav className="footer-links" aria-label="Footer">
            <a href="https://pkoley06.github.io/mateeazy-legal/privacy-policy.html">Privacy policy</a>
            <a href="https://pkoley06.github.io/mateeazy-legal/terms-of-service.html">Terms of service</a>
            <a href="https://pkoley06.github.io/mateeazy-legal/delete-account.html">Delete your account</a>
            <a href="mailto:support@mateeazy.in">support@mateeazy.in</a>
          </nav>
          <p className="copy">© {new Date().getFullYear()} MateEazy. Made in India.</p>
        </div>
      </footer>
    </>
  );
}
