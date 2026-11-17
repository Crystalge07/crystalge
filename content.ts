// All of the site's words and links live here. Anything in [brackets] is a
// placeholder still to fill in; placeholder links render as plain text so
// they never ship as broken hrefs.

export type Link = { label: string; href: string };

export type WorkItem = {
  id: string;
  title: string;
  org: string;
  when: string;
  /** one-liner shown in the list row */
  line: string;
  bullets: string[];
  links?: Link[];
};

export type Project = {
  id: string;
  title: string;
  tag: string;
  /** one-liner shown under the pane */
  line: string;
  /** screenshot path under /public, or '' for the dotted placeholder */
  img: string;
  alt: string;
  bullets: string[];
  links?: Link[];
};

export const site = {
  name: 'crystal ge',
  subtitle: 'cs at western · ai solutions engineer at intercept',
  resume: '[RESUME PDF LINK]',
  email: '[YOUR EMAIL]',
  github: 'https://github.com/crystalge07',
  linkedin: '[LINKEDIN URL]',
  location: 'richmond hill, on',
  timeZone: 'America/Toronto',
  about:
    "cs at western, ivey aeo. i started in business, switched to software, and now build ai and developer tools. off the clock i run brinery co., a small-batch pickle company, and direct projects at western founder's network.",
  quote: { text: 'what is essential is invisible to the eye.', cite: 'le petit prince' },
  hero: {
    src: '/prince.gif',
    alt: 'The little prince and the fox sitting in the grass, looking out at a golden sky',
    width: 500,
    height: 290,
    caption: 'move across it to crystallize',
  },
};

export const work: WorkItem[] = [
  {
    id: 'intercept',
    title: 'ai solutions engineer',
    org: 'intercept group',
    when: 'sept 2026 – now',
    line: 'built an internal repo security & compliance scanner end to end',
    bullets: [
      'owns an internal repo security & compliance scanner, end to end',
      'building watchtower into interceptos',
      'led the intercept website redesign',
    ],
  },
  {
    id: 'autumn',
    title: 'software developer & data analyst',
    org: 'autumn',
    when: 'jan – aug 2026',
    line: 'provider onboarding for a grief support platform serving 50,000+ families',
    bullets: [
      'built the join-as-provider page for an end-of-life and grief support platform used by 50,000+ families, with next.js, typescript and strapi cms',
      'shipped the whole provider onboarding flow',
      'built 12 dashboards tracking where traffic comes from and where people drop off',
    ],
  },
  {
    id: 'solen',
    title: 'private equity analyst',
    org: 'solen software group',
    when: 'may – aug 2026',
    line: 'm&a deal sourcing and diligence for a vertical saas acquirer',
    bullets: ['m&a deal sourcing and diligence for a buy-and-hold vertical saas acquirer', '[your bullet]'],
  },
  {
    id: 'bgc',
    title: 'volunteer software developer',
    org: 'boys and girls club',
    when: 'now',
    line: '[one-line result]',
    bullets: ['[your bullet]'],
  },
];

export const projects: Project[] = [
  {
    id: 'whyagent',
    title: 'whyagent',
    tag: 'hacktrent',
    line: 'git blame + bisect for ai agents',
    img: '',
    alt: 'whyagent screenshot',
    bullets: ['finds the exact agent edit that broke your test, and proves it', '[how it works]', '[stack]'],
    links: [{ label: 'see it', href: '[WHYAGENT LINK]' }],
  },
  {
    id: 'politalk',
    title: 'politalk',
    tag: 'shehacks+ finalist',
    line: 'chrome extension. [one line]',
    img: '',
    alt: 'politalk screenshot',
    bullets: ['[what it does]', 'shehacks+ finalist'],
    links: [{ label: 'see it', href: '[POLITALK LINK]' }],
  },
  {
    id: 'safemap',
    title: 'safemap',
    tag: 'react, google maps api',
    line: 'walking navigation built on toronto police crime data',
    img: '',
    alt: 'safemap screenshot',
    bullets: ['walking routes built on toronto police service crime data', 'react, vite, google maps api'],
    links: [{ label: 'see it', href: '[SAFEMAP LINK]' }],
  },
  {
    id: 'tabs',
    title: 'vertical tabs',
    tag: 'chrome extension',
    line: 'turns your tab bar into a tidy vertical list',
    img: '',
    alt: 'vertical tabs screenshot',
    bullets: ['[what it does]', '[stack]'],
    links: [{ label: 'see it', href: '[TABS LINK]' }],
  },
];

export const isPlaceholder = (s: string) => /^\[.*\]$/.test(s.trim());
/** true if a string still contains a [placeholder] anywhere, e.g. "mailto:[YOUR EMAIL]" */
export const hasPlaceholder = (s: string) => /\[[^\]]*\]/.test(s);
