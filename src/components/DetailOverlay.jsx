import { useEffect, useRef, useState } from 'react';
import { playClickSound } from '../audio/clickSound.js';

/** Must match the overlay transition duration in index.css. */
const EXIT_MS = 260;

function shouldShowDate(item, sectionName) {
  const normalizedDate = (item.dates || '').trim().toLowerCase();
  const normalizedSection = sectionName.trim().toLowerCase();
  return normalizedDate && normalizedDate !== normalizedSection && normalizedDate !== 'project';
}

const COLLAGE_POSES = [
  { rot: '-7.5deg', tapeRot: '-16deg', tapeLeft: '42%' },
  { rot: '5.5deg', tapeRot: '9deg', tapeLeft: '55%' },
  { rot: '-3deg', tapeRot: '-7deg', tapeLeft: '48%' },
  { rot: '6.5deg', tapeRot: '13deg', tapeLeft: '40%' },
  { rot: '-5deg', tapeRot: '-11deg', tapeLeft: '51%' },
  { rot: '3.5deg', tapeRot: '5deg', tapeLeft: '57%' },
  { rot: '-6deg', tapeRot: '-14deg', tapeLeft: '44%' },
  { rot: '7deg', tapeRot: '10deg', tapeLeft: '53%' },
  { rot: '-2.5deg', tapeRot: '-6deg', tapeLeft: '47%' }
];

function MediaFrame({ src, alt }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <div className="media-placeholder" aria-hidden="true" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function Polaroid({ src, alt, pose }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <figure
      className="polaroid"
      style={{
        '--polaroid-rot': pose.rot,
        '--tape-rot': pose.tapeRot,
        '--tape-left': pose.tapeLeft
      }}
    >
      <span className="polaroid-tape" aria-hidden="true" />
      {src && !failed ? (
        <img src={src} alt={alt} decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="polaroid-placeholder" aria-hidden="true" />
      )}
    </figure>
  );
}

export default function DetailOverlay({ card, onClose }) {
  // The last card stays mounted through the fade-out so the panel dissolves
  // instead of blanking out a frame before the backdrop follows it.
  const [rendered, setRendered] = useState(card);
  const panelRef = useRef(null);
  const isOpen = card !== null;

  useEffect(() => {
    if (card) {
      setRendered(card);
      return undefined;
    }
    const timer = window.setTimeout(() => setRendered(null), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [card]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    panel.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }, [isOpen, card]);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      playClickSound();
      onClose();
      return;
    }
    if (e.target.closest('a, button')) {
      playClickSound();
    }
  }

  if (!rendered) {
    return (
      <div id="detailOverlay" aria-hidden="true">
        <div id="detailPanel" />
      </div>
    );
  }

  const { con, item } = rendered;
  const showDate = shouldShowDate(item, con.name);
  const desc = (item.desc || '').trim();
  const isSplit = item.layout === 'split';
  const isCollage = item.layout === 'collage';
  const photos = Array.isArray(item.photos) ? item.photos.filter((photo) => photo?.src) : [];
  const stack = Array.isArray(item.stack) ? item.stack : [];
  const links = Array.isArray(item.links) ? item.links.filter((link) => link?.href) : [];
  const panelClass = [isSplit && 'is-split', isCollage && 'is-collage'].filter(Boolean).join(' ') || undefined;

  return (
    <div
      id="detailOverlay"
      className={isOpen ? 'show' : ''}
      aria-hidden={!isOpen}
      onClick={handleOverlayClick}
    >
      <div
        id="detailPanel"
        ref={panelRef}
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        tabIndex={-1}
      >
        <button type="button" className="panel-close" onClick={onClose} aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <div className="kicker">{con.name}</div>
        <div className="title">{item.title}</div>
        {showDate ? <div className="date">{item.dates}</div> : null}
        {isCollage ? (
          <div className="desc polaroid-desc">
            <div className="polaroid-collage">
              {photos.map((photo, i) => (
                <Polaroid
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt || ''}
                  pose={COLLAGE_POSES[i % COLLAGE_POSES.length]}
                />
              ))}
            </div>
          </div>
        ) : isSplit ? (
          <div className="desc">
            <div className="split-layout is-natural">
              <div className="media-side">
                <MediaFrame src={item.image} alt={item.title} />
              </div>
              {desc ? (
                <div className="copy-side" dangerouslySetInnerHTML={{ __html: desc }} />
              ) : null}
            </div>
          </div>
        ) : desc ? (
          <div className="desc" dangerouslySetInnerHTML={{ __html: desc }} />
        ) : (
          <div className="desc placeholder">Write-up coming soon.</div>
        )}
        {stack.length > 0 ? (
          <div className="tech-stack">{stack.join(' · ')}</div>
        ) : null}
        {links.length > 0 ? (
          <div className="project-links">
            {links.map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
