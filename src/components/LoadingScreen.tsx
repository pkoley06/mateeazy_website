export function LoadingScreen({ message }: { message?: string }) {
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            background: '#3A294C',
            border: '1.5px solid #554266',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
          }}
        >
          <img src="/assets/img/logo.svg" alt="MateEazy" width={52} height={52} />
        </div>
        <div className="spinner" />
        {message && (
          <p style={{ margin: 0, color: '#C1B0CC', fontSize: 14, fontWeight: 500 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
