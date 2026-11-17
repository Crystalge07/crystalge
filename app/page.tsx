import { leadership, projects, site, work } from '@/content';
import FloatingName from '@/components/FloatingName';
import HeroArt from '@/components/HeroArt';
import Portfolio from '@/components/Portfolio';
import SmartLink from '@/components/SmartLink';

export default function Home() {
  return (
    <div className="split">
      {/* the art stays pinned on the right (on top on phones) while everything else scrolls */}
      <aside className="side">
        <HeroArt {...site.hero} />
      </aside>

      <div className="content">
        <header className="topbar">
          <span className="topbar-name">{site.name}</span>
          <nav aria-label="Sections">
            <a href="#about">about</a>
            <a href="#work">work</a>
            <a href="#projects">projects</a>
            <SmartLink href={site.resume}>resume ↗</SmartLink>
          </nav>
        </header>

        <main>
          <section className="hero">
            <FloatingName text={site.name} />
            <p>
              <SmartLink href={`mailto:${site.email}`}>email</SmartLink> · <SmartLink href={site.github}>github</SmartLink>{' '}
              · <SmartLink href={site.linkedin}>linkedin</SmartLink>
            </p>
          </section>

          <section id="about" className="section about first">
            <h2>about</h2>
            {site.about.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          <Portfolio work={work} leadership={leadership} projects={projects} />
        </main>
      </div>
    </div>
  );
}
