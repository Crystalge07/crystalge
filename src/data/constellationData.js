export function createSceneData() {
  const bgStars = Array.from({ length: 320 }, () => {
    const r = Math.random() < 0.05 ? Math.random() * 2.1 + 1.12 : Math.random() * 1.28 + 0.52;
    const depth = Math.pow(Math.random(), 1.8) * 0.9 + 0.05;
    return {
      x: Math.random(), y: Math.random() * 0.82,
      r,
      a: Math.random() * 0.42 + 0.44,
      phase: Math.random() * Math.PI * 2,
      speed: 0.58 + Math.random() * 1.02,
      depth
    };
  });

  const CONSTELLATIONS = [
    {
      name: 'About Me',
      stars: [
        { x: 292, y: 292 }, { x: 358, y: 246 }, { x: 438, y: 276 },
        { x: 420, y: 348 }, { x: 336, y: 330 }, { x: 254, y: 364 }
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 0]],
      items: [
        {
          star: 0,
          label: 'Who Am I',
          title: 'Who Am I',
          dates: 'About Me',
          desc: '<div class="split-layout"><div class="media-side headshot"><img src="/Headshot.jpg" alt="Crystal Ge" decoding="async"></div><div class="copy-side">Hey, I\'m Crystal! I\'m a CS + Business student @ Western and exploring that intersection right now! I\'ve worked roles spanning marketing, data, software, and private equity, and now I\'m looking for SWE and PM roles to keep building and learning! Thanks for checking my site out <span class="smile">:D</span></div></div>'
        },
        {
          star: 2,
          label: 'My Interests',
          title: 'My Interests',
          dates: 'About Me',
          desc: '<ul class="role-list"><li>Volleyball</li><li>F1 (im <span class="keep-case">BEEN</span> an oscar fan since day 1)</li><li>Drawing</li><li>Handmaking pickles</li><li>Mid-century modern architecture, furniture, and antiques</li><li>Coin collecting</li><li>Travelling</li><li>Supercell games (I promise, literally all of them)</li></ul>'
        },
        {
          star: 3,
          label: 'Connect with Me',
          title: 'Connect with Me',
          dates: 'About Me',
          desc: 'LinkedIn: <a href="https://www.linkedin.com/in/crystal-ge-796334269/" target="_blank" rel="noopener noreferrer">Crystal Ge</a><br>GitHub: <a href="https://github.com/Crystalge07" target="_blank" rel="noopener noreferrer">Crystalge07</a><br>Email: <a href="mailto:cge49@uwo.ca">cge49@uwo.ca</a>'
        },
        {
          star: 5,
          label: 'A Day in My Life',
          title: 'A Day in My Life',
          dates: 'About Me',
          layout: 'collage',
          photos: [
            { src: '/life/photobooth.jpg', alt: 'Photo booth strips with friends' },
            { src: '/life/lakeside.jpg', alt: 'Showing off the lake' },
            { src: '/life/friends.jpg', alt: 'Friends by the waterfall' },
            { src: '/life/canoe.jpg', alt: 'Canoeing on the lake' },
            { src: '/life/bereal.jpg', alt: 'Patio afternoon with a friend' },
            { src: '/life/climbing.jpg', alt: 'Indoor rock climbing' },
            { src: '/life/dinner.jpg', alt: 'Dinner with a friend' },
            { src: '/life/kayak.jpg', alt: 'Kayak pulled up on the riverbank' },
            { src: '/life/dock.jpg', alt: 'Paddleboarding from the dock' }
          ]
        }
      ]
    },
    {
      name: 'Experiences',
      stars: [
        { x: 596, y: 252 }, { x: 676, y: 245 }, { x: 726, y: 286 },
        { x: 706, y: 372 }, { x: 792, y: 332 }, { x: 642, y: 350 }
      ],
      edges: [[0, 5], [5, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 4]],
      items: [
        {
          star: 1,
          label: 'Data Analyst',
          title: 'Data Analyst',
          dates: 'Autumn · Jan–Apr 2026',
          desc: '<ul class="role-list"><li>built 12 dashboards tracking traffic by page type, acquisition channels, and conversion funnels</li><li>tracked time-to-value to flag underperforming pages and shape strategy</li></ul>'
        },
        {
          star: 2,
          label: 'Software Engineer',
          title: 'Software Engineer',
          dates: 'Autumn · May–Aug 2026',
          desc: '<ul class="role-list"><li>built the multi-step "join as provider" onboarding flow for an end-of-life and grief support platform serving 50,000+ families</li><li>ran competitive analysis and reworked the onboarding ux and components to get more providers through sign-up</li></ul>'
        },
        {
          star: 0,
          label: 'Private Equity Analyst',
          title: 'Private Equity Analyst',
          dates: 'Solen Software Group · May–Aug 2026',
          desc: '<ul class="role-list"><li>built financial models and underwrote acquisition targets: fintech software companies doing $2–50m arr</li><li>ran 75+ calls with owners and founders to source and qualify deals</li></ul>'
        },
        {
          star: 4,
          label: 'Solutions Engineer',
          title: 'Solutions Engineer',
          dates: 'Intercept Group · Sept 2026–Apr 2027',
          desc: '<ul class="role-list"><li>spearheading an internal security and compliance scanner that runs across repos</li></ul><p class="more-soon">more soon</p>'
        }
      ]
    },
    {
      name: 'Projects',
      stars: [
        { x: 926, y: 284 }, { x: 1008, y: 265 }, { x: 1092, y: 296 },
        { x: 1050, y: 364 }, { x: 1134, y: 338 }, { x: 952, y: 376 }
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [0, 5]],
      items: [
        {
          star: 0,
          label: 'Optimized Browser',
          title: 'Optimized Browser',
          dates: '',
          layout: 'split',
          image: '/projects/optimized-browser.png',
          desc: "a chrome extension that fixes everything you've ever been annoyed at chrome or safari for. rebuilt tab management, spaces, drag-and-drop, stale tab cleanup, and more to make life easier.",
          stack: ['react', 'typescript', 'vite', 'crxjs', 'tailwind'],
          links: [
            { label: 'GitHub', href: 'https://github.com/Crystalge07/Optimized_Browser' }
          ]
        },
        {
          star: 2,
          label: 'PoliTalk',
          title: 'PoliTalk',
          dates: 'SheHacks+ Finalist',
          layout: 'split',
          image: '/projects/politalk.jpg',
          desc: 'a chrome extension that scores tiktoks and reels for political bias in near real-time with bias score, label, the key terms driving it, and related news.',
          stack: ['react', 'typescript', 'vite', 'manifest v3', 'node.js', 'express', 'elevenlabs', 'gemini'],
          links: [
            { label: 'GitHub', href: 'https://github.com/Crystalge07/PoliTalk' },
            { label: 'Devpost', href: 'https://devpost.com/software/politalk-6digfl' }
          ]
        },
        {
          star: 1,
          label: 'The Little Things',
          title: 'The Little Things',
          dates: '',
          layout: 'split',
          image: '/projects/the-little-things.jpg',
          desc: "an app about noticing what usually goes unnoticed. a daily prompt sends you looking for one photo, then you replay your day's path, see where your friends went, and watch the map fill in around you.",
          stack: ['next.js', 'react', 'typescript', 'supabase', 'mapbox', 'recharts', 'tailwind'],
          links: [
            { label: 'GitHub', href: 'https://github.com/Crystalge07/TheLittleThings' },
            { label: 'Devpost', href: 'https://devpost.com/software/the-little-things-vox98u' }
          ]
        },
        {
          star: 4,
          label: "Conway's Game of Life",
          title: "Conway's Game of Life",
          dates: '',
          layout: 'split',
          image: '/projects/game-of-life.png',
          desc: 'a simple version of conway\'s game of life, written without ai to remind myself that i still have hands.',
          stack: ['python'],
          links: [
            { label: 'GitHub', href: 'https://github.com/Crystalge07/Conways_Game_of_Life' }
          ]
        },
        {
          star: 3,
          label: 'LikeOff',
          title: 'LikeOff',
          dates: '',
          layout: 'split',
          image: '/projects/likeoff.jpg',
          desc: 'we all need to stop doomscrolling linkedin and none of us can. a browser game that pokes fun at linkedin warriors, as users guess which silly post went more viral. 60+ users (i got banned off many, many subreddits trying to promote this lol).',
          stack: ['javascript', 'supabase', 'postgresql', 'html/css'],
          links: [
            { label: 'GitHub', href: 'https://github.com/Crystalge07/LikeOff' }
          ]
        }
      ]
    }
  ];

  CONSTELLATIONS.forEach((con, ci) => {
    const baseCx = con.stars.reduce((s, p) => s + p.x, 0) / con.stars.length;
    const baseCy = con.stars.reduce((s, p) => s + p.y, 0) / con.stars.length;
    const sizeScale = 1.5;
    con.stars = con.stars.map((s) => ({
      x: baseCx + (s.x - baseCx) * sizeScale,
      y: baseCy + (s.y - baseCy) * sizeScale
    }));
    con.cx = con.stars.reduce((s, p) => s + p.x, 0) / con.stars.length;
    con.cy = con.stars.reduce((s, p) => s + p.y, 0) / con.stars.length;
    con.hitRadius = 132 * sizeScale;
    con.edgesMeta = con.edges.map(() => ({
      alpha: 0.34 + Math.random() * 0.18,
      glow: 0.16 + Math.random() * 0.14,
      flowCenter: 0.18 + Math.random() * 0.64,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.45 + Math.random() * 0.8,
      wobbleAmp: 4 + Math.random() * 5
    }));
    const ranked = con.stars
      .map((s, i) => ({ i, score: (Math.sin((s.x + s.y) * 0.013 + ci) + 1) * 0.5 }))
      .sort((a, b) => b.score - a.score);
    con.anchorStars = ranked.slice(0, 2).map((v) => v.i);
    con.labeledStars = con.items
      .filter((item) => typeof item.label === 'string' && item.label.trim().length > 0)
      .map((item) => item.star);
    con.designStars = con.stars.map((s) => ({ x: s.x, y: s.y }));
  });

  return { bgStars, CONSTELLATIONS };
}
