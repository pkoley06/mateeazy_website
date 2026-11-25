export function LoadingScreen({ message = 'Loading MateEazy...' }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#2B1B3D',
        color: '#FFF8F0',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div>
        <img
          src="/assets/img/logo.svg"
          alt="MateEazy"
          width={88}
          height={88}
          style={{ margin: '0 auto 18px' }}
        />
        <p style={{ margin: 0, color: '#C1B0CC', fontSize: 15 }}>{message}</p>
      </div>
    </div>
  );
}
