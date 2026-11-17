import { leadership, projects, site, work } from '@/content';
import Clock from '@/components/Clock';
import Crystallize from '@/components/Crystallize';
import FloatingName from '@/components/FloatingName';
import Portfolio from '@/components/Portfolio';
import SmartLink from '@/components/SmartLink';

export default function Home() {
  return (
    <div className="split">
      {/* the art stays pinned on the right (on top on phones) while everything else scrolls */}
      <aside className="side">
        <Crystallize {...site.hero} />
      </aside>

      <div className="content">
        <header className="topbar">
          <span style={{ fontStyle: 'italic' }}>{site.name}</span>
          <nav aria-label="Sections">
            <a href="#work">work</a>
            <a href="#projects">projects</a>
            <a href="#about">about</a>
            <SmartLink href={site.resume}>resume ↗</SmartLink>
          </nav>
        </header>

        <main>
          <section className="hero">
            <FloatingName text={site.name} />
            <p>{site.subtitle}</p>
          </section>

          <Portfolio work={work} leadership={leadership} projects={projects} />

          <section id="about" className="section about">
            <h2>about</h2>
            {site.about.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <p>
              <SmartLink href={`mailto:${site.email}`}>email</SmartLink> · <SmartLink href={site.github}>github</SmartLink>{' '}
              · <SmartLink href={site.linkedin}>linkedin</SmartLink>
            </p>
          </section>
        </main>

        <footer>
          {site.location} · <Clock timeZone={site.timeZone} />
        </footer>
      </div>
    </div>
  );
}
