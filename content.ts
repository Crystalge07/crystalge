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
  subtitle: 'cs + ivey at western · ai solutions engineer at intercept',
  resume: '/crystal-ge-resume.pdf',
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
    line: 'built watchtower, an ai research product doing $500k in revenue across 10 clients',
    bullets: [
      'built watchtower from the ground up: an ai product that turns social media data into survey-grade research. it has brought in $500k across 10 clients',
      'built ai agents that write and quality-check each step of a 7-stage research workflow, running in parallel on a background job system. study turnaround went from 7 days to 2',
      'owned a python security scanner 0-to-1 that checks every production repo weekly for vulnerabilities and leaked secrets, and wrote 40 custom semgrep rules, one of which caught a sitewide auth bypass',
      'built an llm triage agent on the anthropic api that checks each finding against the real code in parallel sandboxes and throws out 98% as noise, plus an exploitability ranking that cut false critical alerts in half',
      "led the technical rebuild of intercept's 65+ page website, with automated tests and checks so broken links and missing analytics never reach production",
    ],
  },
  {
    id: 'autumn',
    title: 'software engineer & data analyst',
    org: 'autumn',
    when: 'jan – aug 2026',
    line: 'grew provider sign-ups 36% on a grief support platform serving 50,000+ families',
    bullets: [
      'built 12 analytics dashboards for a grief support platform serving 50,000+ families, and found that families needed lawyers and therapists but providers had no way to join',
      'pitched and built a join-as-provider page in next.js and typescript for lawyers, estate attorneys, therapists and other deathcare providers. provider sign-ups went up 36% and cta clicks 6× in 4 months',
      'built multi-step auth0 onboarding that saves each step through graphql, so providers can pick up a half-finished sign-up where they left off',
    ],
  },
  {
    id: 'solen',
    title: 'private equity analyst',
    org: 'solen software group',
    when: 'may – aug 2026',
    line: 'deal sourcing and diligence for a vertical saas acquirer',
    bullets: [
      'sourced targets for a vertical saas acquirer buying fintech and legaltech companies at $2–50m arr, through 75+ founder calls',
      'built diligence materials for 7 deals, 2 of which reached formal offers',
      'built excel models on arr growth, churn, retention, ebitda margins and revenue multiples to value targets',
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
    line: 'taught system design to beginners and led a team of 4 building a browser extension',
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
    id: 'agentwhy',
    title: 'agentwhy',
    tag: 'hacktrent finalist',
    line: 'git blame for ai coding agents',
    img: '',
    alt: 'agentwhy screenshot',
    bullets: [
      'git blame for ai coding agents: a python cli that replays an agent session and bisects its edits across parallel docker sandboxes to find the exact edit that broke a test, then opens a verified fix pr',
      "uses llms to write rules that stop the agent from making the same bug again, then a/b tests them on real agent reruns. test pass rate went from 0% to 88% (p < 0.001)",
      'hacktrent finalist',
      'python, docker, postgresql, gemini, claude code',
    ],
    links: [{ label: 'see it', href: '[AGENTWHY LINK]' }],
  },
  {
    id: 'f1',
    title: 'f1 race predictor',
    tag: 'xgboost, monte carlo',
    line: 'predicts who wins the race, re-predicting after every session',
    img: '',
    alt: 'f1 race predictor screenshot',
    bullets: [
      'xgboost models that predict f1 finishing order from 8 seasons of data, re-predicting after each session of a race weekend. beats baselines by up to 18% in brier score, with leak-free walk-forward evaluation',
      'turns predictions into win and podium odds with a vectorized numpy monte carlo simulator (10,000 races) and a bayesian-shrinkage dnf model, with shap explanations per driver',
      'python, xgboost, numpy, pandas, shap, sqlite',
    ],
    links: [{ label: 'github', href: '[F1 PREDICTOR LINK]' }],
  },
  {
    id: 'politalk',
    title: 'politalk',
    tag: 'shehacks+ finalist',
    line: 'chrome extension that flags political bias in tiktoks, reels and youtube videos',
    img: '/projects/politalk.jpg',
    alt: 'politalk screenshot',
    bullets: [
      'a chrome extension that flags political bias in tiktok, instagram and youtube videos: a bias score, a label, the key terms driving it, and related news',
      'streams audio over websockets for live transcription, with gemini scoring it in a react side panel',
      'shehacks+ finalist',
      'typescript, react, node.js, websockets, gemini, elevenlabs',
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
];

/** true if a string still contains a [placeholder] anywhere, e.g. "mailto:[YOUR EMAIL]" */
export const hasPlaceholder = (s: string) => /\[[^\]]*\]/.test(s);
