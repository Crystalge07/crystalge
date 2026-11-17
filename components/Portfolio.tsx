'use client';

import { useCallback, useState } from 'react';
import type { Project, WorkItem } from '@/content';
import DetailSheet, { type SheetData } from './DetailSheet';
import Shot from './Shot';

const workSheet = (w: WorkItem): SheetData => ({
  meta: `${w.org} · ${w.when}`,
  title: w.title,
  bullets: w.bullets,
  links: w.links,
});

const projectSheet = (p: Project): SheetData => ({
  meta: p.tag,
  title: p.title,
  bullets: p.bullets,
  links: p.links,
  shot: { img: p.img, alt: p.alt },
});

/** Work rows + project panes; both open the same detail sheet. */
export default function Portfolio({ work, projects }: { work: WorkItem[]; projects: Project[] }) {
  const [open, setOpen] = useState<SheetData | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <section id="work" className="section first">
        <h2>work</h2>
        <div className="rows">
          {work.map((w) => (
            <button key={w.id} type="button" className="row" onClick={() => setOpen(workSheet(w))}>
              <span className="row-main">
                <span className="row-title">
                  {w.title}, {w.org}
                </span>
                <span className="row-line">{w.line}</span>
              </span>
              <span className="row-when">{w.when} →</span>
            </button>
          ))}
        </div>
      </section>

      <section id="projects" className="section">
        <h2>projects</h2>
        <div className="panes">
          {projects.map((p) => (
            <button key={p.id} type="button" className="pane" onClick={() => setOpen(projectSheet(p))}>
              <Shot img={p.img} alt={p.alt} />
              <span className="pane-text">
                <span className="row-title">
                  {p.title} <span className="pane-tag">· {p.tag}</span>
                </span>
                <span className="row-line">{p.line}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {open && <DetailSheet data={open} onClose={close} />}
    </>
  );
}
