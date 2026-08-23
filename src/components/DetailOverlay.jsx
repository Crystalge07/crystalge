import { useEffect, useRef, useState } from 'react';

/** Must match the overlay transition duration in index.css. */
const EXIT_MS = 260;

function shouldShowDate(item, sectionName) {
  const normalizedDate = (item.dates || '').trim().toLowerCase();
  const normalizedSection = sectionName.trim().toLowerCase();
  return normalizedDate && normalizedDate !== normalizedSection && normalizedDate !== 'project';
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
    if (e.target === e.currentTarget) onClose();
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
        {desc ? (
          <div className="desc" dangerouslySetInnerHTML={{ __html: desc }} />
        ) : (
          <div className="desc placeholder">Write-up coming soon.</div>
        )}
      </div>
    </div>
  );
}
