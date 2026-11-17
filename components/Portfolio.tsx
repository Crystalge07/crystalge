'use client';

import { useCallback, useState } from 'react';
import type { Project, WorkItem } from '@/content';
import DetailSheet, { type SheetData } from './DetailSheet';
import Shot from './Shot';

const projectSheet = (p: Project): SheetData => ({
  meta: p.tag,
  title: p.title,
  bullets: p.bullets,
  links: p.links,
  shot: { img: p.img, alt: p.alt },
});

/** A plain list: org and role on the left, dates on the right. Nothing to click into. */
function Rows({ items }: { items: WorkItem[] }) {
  return (
    <ul className="rows">
      {items.map((w) => (
        <li key={w.id} className="row">
          <span className="row-org">{w.org}</span>
          <span className="row-when">{w.when}</span>
          <span className="row-role">{w.title}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = { work: WorkItem[]; leadership: WorkItem[]; projects: Project[] };

/** Work + leadership lists and project panes; only projects open the detail sheet. */
export default function Portfolio({ work, leadership, projects }: Props) {
  const [open, setOpen] = useState<SheetData | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <section id="work" className="section">
        <h2>work</h2>
        <Rows items={work} />
      </section>

      {leadership.length > 0 && (
        <section id="leadership" className="section">
          <h2>leadership</h2>
          <Rows items={leadership} />
        </section>
      )}

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
