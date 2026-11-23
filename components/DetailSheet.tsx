'use client';

import { useEffect, useRef } from 'react';
import type { Link } from '@/content';
import SmartLink from './SmartLink';
import Shot from './Shot';

export type SheetData = {
  meta: string;
  title: string;
  bullets: string[];
  links?: Link[];
  /** only projects get a screenshot slot; '' shows the dotted placeholder */
  shot?: { img: string; alt: string; position?: string };
};

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal detail sheet: backdrop click / Esc closes, focus is trapped and restored. */
export default function DetailSheet({ data, onClose }: { data: SheetData; onClose: () => void }) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const first = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && (active === lastEl || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet">
      <button type="button" className="sheet-backdrop" aria-label="Close" tabIndex={-1} onClick={onClose} />
      <article
        ref={panelRef}
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <button ref={closeRef} type="button" className="sheet-close" onClick={onClose}>
          close ×
        </button>
        <span className="sheet-meta">{data.meta}</span>
        <h3 id="sheet-title">{data.title}</h3>
        {data.shot && <Shot img={data.shot.img} alt={data.shot.alt} position={data.shot.position} />}
        <ul>
          {data.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {data.links && data.links.length > 0 && (
          <div className="sheet-links">
            {data.links.map((l) => (
              <SmartLink key={l.label} href={l.href}>
                {l.label} ↗
              </SmartLink>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
