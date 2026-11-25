import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export function PhotoGallery({
  photos,
  alt = 'Photo',
  aspect = '16/10',
}: {
  photos: string[];
  alt?: string;
  aspect?: string;
}) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!photos.length) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-alt)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
          fontSize: 14,
        }}
      >
        No photos uploaded
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: aspect,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--surface-alt)',
        }}
      >
        <img
          src={photos[index]}
          alt={alt}
          onClick={() => setLightbox(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'zoom-in',
          }}
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(43,27,61,0.65)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(43,27,61,0.65)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ChevronRight size={20} />
            </button>
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 12,
                background: 'rgba(43,27,61,0.7)',
                color: '#fff',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {index + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {lightbox && (
        <div
          className="modal-backdrop"
          style={{ alignItems: 'center', zIndex: 90 }}
          onClick={() => setLightbox(false)}
        >
          <div
            style={{ position: 'relative', maxWidth: '92vw', maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[index]}
              alt={alt}
              style={{
                maxWidth: '92vw',
                maxHeight: '85vh',
                borderRadius: 16,
                objectFit: 'contain',
              }}
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
