// All of the site's words and links live here. Anything in [brackets] is a
// placeholder still to fill in; links with a [placeholder] in them render as
// plain muted text so they never ship as broken hrefs.

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
  email: 'cge49@uwo.ca',
  github: 'https://github.com/Crystalge07',
  linkedin: 'https://www.linkedin.com/in/crystal-ge-796334269/',
  location: 'richmond hill, on',
  timeZone: 'America/Toronto',
  about: [
    "hey, i'm crystal :) i'm pursuing a dual degree in computer science and business at western and ivey. i thought i wanted to go into finance until i did an internship at a software m&a firm and realized the software side was infinitely more interesting than the business side, so here i am.",
    "i'm currently an ai solutions engineer at intercept group, where i build products for fortune 500 companies. i'm also trying to use my skill set for the greater good, which is why i'm volunteering to lead the launch of an app for boys and girls club canada. i also run a pickle business!",
  ],
  hero: {
    src: '/snoopy-body.png',
    alt: 'Snoopy in a bowler hat, carrying a briefcase',
    width: 332,
    height: 520,
    caption: 'hover over me :)',
    overlay: { src: '/snoopy-bubble.png', alt: 'thought bubble: "losing is not an option!"' },
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
      'built the join-as-provider page for an end-of-life and grief support platform used by 50,000+ families, with next.js, typescript, strapi cms, and a hero that greets you with your own city',
      'shipped the whole provider onboarding flow',
      'built 12 dashboards tracking where traffic comes from and where people drop off, directing strategy',
    ],
  },
  {
    id: 'solen',
    title: 'private equity analyst',
    org: 'solen software group',
    when: 'may – aug 2026',
    line: 'm&a deal sourcing and diligence for a vertical saas acquirer',
    bullets: [
      'm&a deal sourcing and diligence for a buy-and-hold vertical saas acquirer',
      'built financial models and underwrote acquisition targets: fintech and legaltech software companies doing $2–50m arr',
      'ran 50+ calls with owners and founders to source and qualify deals',
    ],
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

export const leadership: WorkItem[] = [
  {
    id: 'wea',
    title: 'director of finance',
    org: 'western entrepreneurship association',
    when: 'sept 2025 – apr 2026',
    line: 'ran a $15k budget and 15+ events for a 600-person club',
    bullets: [
      'ran a $15k budget for a 600-person club: reimbursements, vendors, venues, 15+ events for 1,000+ people',
      'put on a university-wide vc pitch competition for 100+ students, from logistics to recruiting judges',
    ],
  },
  {
    id: 'wfn',
    title: 'director of projects',
    org: "western founder's network",
    when: 'sept 2025 – apr 2026',
    line: 'taught system design to beginners and led a team of 4 building a browser',
    bullets: [
      'ran workshops teaching the fundamentals of system design and software to beginners',
      'worked in a team of 4 to build an optimized browser, owning technical scope, timelines, and deployment from design to launch',
    ],
  },
  {
    id: 'wtsa',
    title: 'finance executive',
    org: 'western taiwanese students association',
    when: 'sept 2025 – apr 2026',
    line: 'secured 10+ corporate sponsorships and managed an $11k budget',
    bullets: [
      'secured 10+ corporate sponsorships (kung fu tea, liquid iv, chung chun) to grow chapter funding',
      'managed an $11k budget across 10+ events',
    ],
  },
  {
    id: 'fbla',
    title: 'president & founder',
    org: 'king fbla',
    when: 'jan 2024 – june 2025',
    line: 'grew the chapter to 100+ members and 18 national-level event wins',
    bullets: [
      'grew the chapter to 100+ members while leading a team of 20+ execs',
      'won 3 national-level chapter awards and coached members to 18 national-level event wins',
    ],
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
    line: 'chrome extension that scores tiktoks and reels for political bias',
    img: '/projects/politalk.jpg',
    alt: 'politalk screenshot',
    bullets: [
      'scores tiktoks and reels for political bias in near real time: a bias score, a label, the key terms driving it, and related news',
      'shehacks+ finalist',
      'react, typescript, vite, manifest v3, node.js, express, elevenlabs, gemini',
    ],
    links: [
      { label: 'github', href: 'https://github.com/Crystalge07/PoliTalk' },
      { label: 'devpost', href: 'https://devpost.com/software/politalk-6digfl' },
    ],
  },
  {
    id: 'little-things',
    title: 'the little things',
    tag: 'next.js, supabase, mapbox',
    line: 'a daily prompt that sends you hunting for what usually goes unnoticed',
    img: '/projects/the-little-things.jpg',
    alt: 'the little things screenshot',
    bullets: [
      'an app about noticing what usually goes unnoticed. a daily prompt sends you hunting for something to photograph (e.g. hidden beauty)',
      "replay your path to see the photos you took through the day, and your friends' too",
      'a daily mosaic shows what you, your friends, and your city noticed that day',
      'next.js, react, typescript, supabase, mapbox, recharts, tailwind',
    ],
    links: [
      { label: 'github', href: 'https://github.com/Crystalge07/TheLittleThings' },
      { label: 'devpost', href: 'https://devpost.com/software/the-little-things-vox98u' },
    ],
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
    id: 'optimized-browser',
    title: 'optimized browser',
    tag: 'chrome extension',
    line: "fixes everything you've ever been annoyed at chrome or safari for",
    img: '/projects/optimized-browser.png',
    alt: 'optimized browser screenshot',
    bullets: [
      'rebuilt tab management, spaces, drag-and-drop, stale tab cleanup, and more',
      "built with a team of 4 at western founder's network",
      'react, typescript, vite, crxjs, tailwind',
    ],
    links: [{ label: 'github', href: 'https://github.com/Crystalge07/Optimized_Browser' }],
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
  {
    id: 'likeoff',
    title: 'likeoff',
    tag: 'game, 60+ players',
    line: 'guess which silly linkedin post went more viral',
    img: '/projects/likeoff.jpg',
    alt: 'likeoff screenshot',
    bullets: [
      "a game poking fun at linkedin warriors, and at the fact that we all need to stop doomscrolling linkedin and none of us can",
      'guess which silly post went more viral',
      '60+ users (i got banned off many subreddits trying to promote this lol)',
      'javascript, supabase, postgresql, html/css',
    ],
    links: [{ label: 'github', href: 'https://github.com/Crystalge07/LikeOff' }],
  },
  {
    id: 'game-of-life',
    title: "conway's game of life",
    tag: 'python',
    line: 'written without ai to remind myself that i still have hands',
    img: '/projects/game-of-life.png',
    alt: "conway's game of life screenshot",
    bullets: ["a simple version of conway's game of life, written without ai to remind myself that i still have hands", 'python'],
    links: [{ label: 'github', href: 'https://github.com/Crystalge07/Conways_Game_of_Life' }],
  },
];

/** true if a string still contains a [placeholder] anywhere, e.g. "mailto:[YOUR EMAIL]" */
export const hasPlaceholder = (s: string) => /\[[^\]]*\]/.test(s);
