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
  /** square logo under /public, shown beside the row */
  logo?: string;
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
  /** css object-position for the crop, e.g. 'left center'; defaults to centered */
  imgPosition?: string;
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
    "i'm currently an ai solutions engineer at intercept group, where i build products for fortune 500 companies, and a software engineer at bgc canada. i also run a pickle business!",
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
    logo: '/logos/intercept.jpg',
    line: 'built watchtower, an ai research product, and automated security with scanners and an llm triage agent',
    bullets: [
      'built watchtower from the ground up: an ai research platform that turns x, reddit and bluesky posts from professional audiences into survey-grade research. it has brought in $500k across 10 clients',
      'built ai agents that write and quality-check all 7 research stages with schema-validated tool outputs, running in parallel on a postgres-backed job queue with atomic claims and retries. study turnaround went from 7 days to 2',
      'owned a python security pipeline 0-to-1 that runs 9 sast, sca and secret scanners on every production repo weekly through github actions, and wrote 40 custom semgrep rules, one of which caught a sitewide auth bypass',
      'built an llm triage agent on the anthropic api that checks each finding against the real code in parallel sandboxes and throws out 98% as noise, plus an exploitability ranking that cut false critical alerts in half',
      "led the technical rebuild of intercept's 65+ page website on cloudflare workers, with 270+ playwright end-to-end tests and ci gates so broken links and missing analytics never reach production",
    ],
  },
  {
    id: 'bgc',
    title: 'software engineer',
    org: 'bgc canada',
    when: 'sept 2026 – now',
    logo: '/logos/bgc.png',
    line: "building bgc canada's first mobile app from scratch, starting with the auth api and sign-in screens",
    bullets: [
      'building the fastify/typescript auth api for a brand new mobile app: sliding 7-day sessions, enumeration-safe login, and role-based signup that redeems invite codes in one atomic transaction',
      'added ip + username rate limiting against brute force and a cron job that purges expired sessions, and built the react native auth screens with token refresh on launch and an offline fallback',
    ],
  },
  {
    id: 'autumn',
    title: 'software engineer & data analyst',
    org: 'autumn',
    when: 'jan – aug 2026',
    logo: '/logos/autumn.png',
    line: 'shipped the provider sign-up flow on a grief support platform',
    bullets: [
      'built 12 analytics dashboards for a grief support platform serving 50,000+ families, and found that families needed lawyers and therapists but providers had no way to join',
      'pitched and built a join-as-provider page in next.js and typescript for lawyers, estate attorneys, therapists and other deathcare providers, and shipped the whole onboarding flow end to end. provider sign-ups went up 36% and cta clicks 6× in 4 months',
      'built multi-step auth0 onboarding that saves each step through graphql, so providers can pick up a half-finished sign-up where they left off',
    ],
  },
  {
    id: 'solen',
    title: 'private equity analyst',
    org: 'solen software group',
    when: 'may – aug 2026',
    logo: '/logos/solen.jpg',
    line: 'deal sourcing and diligence for a vertical saas acquirer',
    bullets: [
      'sourced targets for a vertical saas acquirer buying fintech and legaltech companies at $2–50m arr, through 75+ founder calls, and built diligence materials for 7 deals, 2 of which reached formal offers',
      'built excel models on arr growth, churn, retention, ebitda margins and revenue multiples to value targets',
    ],
  },
];

export const leadership: WorkItem[] = [
  {
    id: 'tsi',
    title: 'software developer',
    org: 'tech for social impact',
    when: 'sept 2026 – now',
    line: 'developing software for nonprofits',
    bullets: [],
  },
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
    id: 'obedient-clanker',
    title: 'obedient clanker (hack western top 5, qnx winner, vultr winner)',
    tag: 'python, c',
    line: 'a voice-controlled drone that talks back and refuses unsafe orders',
    img: '/projects/obedient-clanker.jpg',
    alt: 'the obedient clanker drone, a quadcopter with a webcam mounted underneath',
    bullets: [
      'a drone for people whose hands are busy, like firefighters and search and rescue crews: say "rise, go two metres left and take a photo" and it plans the flight, talks back, and refuses anything unsafe out loud',
      'a pi 5 running the qnx real-time os flies it over mavlink to ardupilot, with on-board person detection that blocks flight toward people and automatic landing when a sensor or the link drops',
      'speech streams through whisper into an llm with tool calling that compiles a spoken sentence into flight primitives, speech to motion in under two seconds',
      'tensorflow lite person detection and opencv optical flow gate every move, fused with the rangefinder and gps; everything that keeps people safe runs on the drone and keeps working without the cloud',
      'python, c, qnx 8, ardupilot, mavlink, tensorflow lite, opencv, whisper, vultr',
    ],
    links: [
      { label: 'github', href: 'https://github.com/Antkuz17/Obedient-Clanker' },
      { label: 'devpost', href: 'https://devpost.com/software/useful-obedient-clanker' },
    ],
  },
  {
    id: 'agentwhy',
    title: 'agentwhy (hacktrent entire winner)',
    tag: 'python, docker',
    line: 'git blame for ai coding agents',
    img: '/projects/agentwhy.jpg',
    imgPosition: 'left center',
    alt: 'agentwhy pipeline: searching the edits, proving the bad one, writing a lesson, and testing it in four sandboxes',
    bullets: [
      'git blame for ai coding agents: a python cli that replays an agent session and bisects its edits across parallel docker sandboxes to find the exact edit that broke a test, then opens a verified fix pr',
      "uses llms to write rules that stop the agent from making the same bug again, then a/b tests them on real agent reruns. test pass rate went from 0% to 88% (p < 0.001)",
      'python, docker, postgresql, gemini, claude code',
    ],
    links: [
      { label: 'github', href: 'https://github.com/Crystalge07/AgentWhy' },
      { label: 'devpost', href: 'https://devpost.com/software/agent-why' },
    ],
  },
  {
    id: 'f1',
    title: 'f1 race predictor',
    tag: 'xgboost, monte carlo',
    line: 'predicts who wins the race, re-predicting after every session',
    img: '/projects/f1.jpg',
    alt: "f1 predictor results page: each driver's predicted finish at every stage of the weekend, and the model's scores against the baselines",
    bullets: [
      'xgboost models that predict f1 finishing order from 8 seasons of data, re-predicting after each session of a race weekend. beats baselines by up to 18% in brier score, with leak-free walk-forward evaluation',
      'turns predictions into win and podium odds with a vectorized numpy monte carlo simulator (10,000 races) and a bayesian-shrinkage dnf model, with shap explanations per driver',
      'python, xgboost, numpy, pandas, shap, sqlite',
    ],
    links: [
      { label: 'live site', href: 'https://crystalge07.github.io/F1_Predictor/#/' },
      { label: 'github', href: 'https://github.com/Crystalge07/F1_Predictor' },
    ],
  },
  {
    id: 'politalk',
    title: 'politalk (shehacks+ top 5, best beginner hack)',
    tag: 'react, websockets, gemini',
    line: 'chrome extension that flags political bias in tiktoks, reels and youtube videos',
    img: '/projects/politalk.jpg',
    alt: 'politalk side panel rating a tiktok center-right, with related news and key terms',
    bullets: [
      'a chrome extension that flags political bias in tiktok, instagram and youtube videos: a bias score, a label, the key terms driving it, and related news',
      'streams audio over websockets for live transcription, with gemini scoring it in a react side panel',
      'typescript, react, node.js, websockets, gemini, elevenlabs',
    ],
    links: [
      { label: 'github', href: 'https://github.com/Crystalge07/PoliTalk' },
      { label: 'devpost', href: 'https://devpost.com/software/politalk-6digfl' },
    ],
  },
];

/** true if a string still contains a [placeholder] anywhere, e.g. "mailto:[YOUR EMAIL]" */
export const hasPlaceholder = (s: string) => /\[[^\]]*\]/.test(s);
