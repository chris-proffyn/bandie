import { BANDIE_BRAND_MARK, BANDIE_BRAND_NAME } from '../lib/brand';

export type CtaLink = {
  label: string;
  href: string;
  intent: 'band' | 'organiser' | 'player' | 'general';
  variant: 'primary' | 'secondary' | 'pink';
};

export type UseCaseStep = {
  title: string;
  description: string;
};

export type WorkflowPreview = {
  label: string;
  title: string;
  description: string;
};

export type UseCaseAudience = {
  id: string;
  kicker: string;
  heading: string;
  text: string;
  tags: string[];
  howTitle: string;
  howText: string;
  rolePill: string;
  steps: UseCaseStep[];
  previews: WorkflowPreview[];
  cta: CtaLink;
};

export const homepageContent = {
  seo: {
    title: 'Bandie — Find players, run bands, book gigs',
    description:
      'Bandie is a platform for players, bands and organisers: promote yourself, find bands and gigs, manage songs and rehearsals, and book local live music.',
    canonicalPath: '/',
    ogImage: '/og-bandie.png',
  },
  nav: {
    brand: BANDIE_BRAND_NAME,
    brandMark: BANDIE_BRAND_MARK,
    links: [
      { label: 'For Players', href: '#players' },
      { label: 'For Bands', href: '#bands' },
      { label: 'For Organisers', href: '#organisers' },
      { label: 'Features', href: '#features' },
    ],
  },
  hero: {
    eyebrow: 'One platform. Serving 3 communities of live music.',
    heading: 'Find players. Run bands. Book gigs.',
    headingHighlight: 'All in Bandie.',
    bodyLead:
      'Bandie connects the people who make local live music happen.',
    body:
      'Players promote themselves and find opportunities. Bands look professional and stay organised. Organisers discover bands, plan gigs and create promotional content.',
    ctas: [
      {
        label: "I'm a player",
        href: '#players',
        intent: 'player',
        variant: 'primary',
      },
      {
        label: "I'm in a band",
        href: '#bands',
        intent: 'band',
        variant: 'secondary',
      },
      {
        label: 'I organise events',
        href: '#organisers',
        intent: 'organiser',
        variant: 'pink',
      },
    ] satisfies CtaLink[],
    jumpCards: [
      {
        href: '#players',
        title: 'Players',
        text: 'Build a profile, find bands, find gigs.',
      },
      {
        href: '#bands',
        title: 'Bands',
        text: 'Promote, manage line-ups, rehearse, get gig-ready.',
      },
      {
        href: '#organisers',
        title: 'Organisers',
        text: 'Find bands, plan gigs, create promo.',
      },
    ],
  },
  exampleProfile: {
    initials: 'SC',
    status: 'Available for bookings',
    name: 'Skin Condition',
    subtitle: 'Indie, new wave and crowd-friendly guitar classics · Surrey and West London',
    tags: ['5-piece', '2 x 45 min sets', 'Female lead vocal', 'Pub / party / festival'],
    stats: [
      { label: 'Rating', value: '4.8 ★' },
      { label: 'Typical fee', value: '£250–£400' },
      { label: 'Next free date', value: 'Sat 14 Sep' },
      { label: 'Gig readiness', value: '92%' },
    ],
    profileRows: [
      { title: 'Videos, tracks and socials', badge: 'Media' },
      { title: 'Available dates and enquiry form', badge: 'Bookings' },
      { title: 'Approved line-up and set length', badge: 'Band info' },
      { title: 'Event page and poster generator', badge: 'Promo' },
    ],
    profileUrl: 'bandie.app/the-neon-mondays',
    profileAction: 'View profile',
  },
  modes: {
    kicker: 'The three Bandie modes',
    heading: 'Bandie is built around what you are trying to do.',
    text: 'Most music tools only serve one group. Bandie connects individual musicians, band workspaces and event organisers so discovery, preparation and promotion all meet in one place.',
    cards: [
      {
        id: 'players',
        icon: '🎸',
        tone: 'players' as const,
        title: 'For Players',
        text: 'Create a musician profile that shows what you play, what you like, where you are based and when you are available.',
        bullets: [
          'Promote yourself to bands and organisers.',
          'Find bands looking for members or deps.',
          'Find local gigs and playing opportunities.',
        ],
        cta: {
          label: 'How it works',
          href: '#players',
          intent: 'player',
          variant: 'secondary',
        } satisfies CtaLink,
      },
      {
        id: 'bands',
        icon: '🥁',
        tone: 'bands' as const,
        title: 'For Bands',
        text: 'Create a public band profile and a private workspace for everything the band needs to rehearse, organise and perform.',
        bullets: [
          'Promote the band to organisers and players.',
          'Manage line-ups, songs, setlists and readiness.',
          'Coordinate rehearsals, gigs and availability.',
        ],
        cta: {
          label: 'How it works',
          href: '#bands',
          intent: 'band',
          variant: 'primary',
        } satisfies CtaLink,
      },
      {
        id: 'organisers',
        icon: '🎟️',
        tone: 'organisers' as const,
        title: 'For Organisers',
        text: 'Search for suitable bands, check availability, organise gigs and generate the content needed to promote the event.',
        bullets: [
          'Find bands by genre, location, price and rating.',
          'Plan dates and enquiries in one place.',
          'Create gig pages, posters and social content.',
        ],
        cta: {
          label: 'How it works',
          href: '#organisers',
          intent: 'organiser',
          variant: 'pink',
        } satisfies CtaLink,
      },
    ],
  },
  useCases: {
    players: {
      id: 'players',
      kicker: 'For Players',
      heading: 'Get seen. Find people to play with.',
      text: 'Bandie gives individual musicians a profile that helps them be discovered by bands, other players and event organisers. It is for guitarists, singers, drummers, bassists, keys players, deps and anyone looking for the next musical opportunity.',
      tags: ['Guitarists', 'Singers', 'Drummers', 'Deps', 'New members'],
      howTitle: 'How it works for players',
      howText: 'Build a useful player profile and turn it into band, gig and dep opportunities.',
      rolePill: 'Player mode',
      steps: [
        {
          title: 'Create your player profile',
          description:
            'Add instruments, genres, influences, location, availability, media links and experience level.',
        },
        {
          title: 'Show what you can do',
          description:
            'Link to clips, tracks, socials and examples of you playing, without having to build a separate site.',
        },
        {
          title: 'Find bands and gigs',
          description: 'Search bands looking for members, dep slots or local events needing musicians.',
        },
        {
          title: 'Join the workspace',
          description:
            'When accepted by a band, get access to the songs, setlists, notes and rehearsal plans you need.',
        },
      ],
      previews: [
        {
          label: 'Profile',
          title: 'Sarah — Lead vocals',
          description: 'Female vocalist, rock/pop covers, available evenings, based in Hounslow.',
        },
        {
          label: 'Opportunity',
          title: 'Skin Condition need a dep singer',
          description: 'Friday gig, 2 x 45 min sets, setlist already shared in Bandie.',
        },
      ],
      cta: {
        label: 'Build your player profile →',
        href: '/signup?intent=player-profile',
        intent: 'player',
        variant: 'primary',
      },
    },
    bands: {
      id: 'bands',
      kicker: 'For Bands',
      heading: 'Look professional outside. Stay organised inside.',
      text: 'Bandie gives every band a public promotion page and a private operating workspace. It is built for amateur bands without managers who still need to organise songs, setlists, members, rehearsals, availability and gigs.',
      tags: ['Cover bands', 'Pub bands', 'Originals', 'Wedding bands', 'Community bands'],
      howTitle: 'How it works for bands',
      howText: 'Promote the band, coordinate the people, and track whether the band is ready to play.',
      rolePill: 'Band mode',
      steps: [
        {
          title: 'Register the band',
          description:
            'Create a public band profile with genre, location, lineup, media links, pricing guidance and booking CTA.',
        },
        {
          title: 'Manage the line-up',
          description:
            'Add members, roles and permissions. Invite players, manage deps and keep member access controlled.',
        },
        {
          title: 'Build the working songbook',
          description:
            'Store song links, parts, notes, folders, setlists and track song readiness for upcoming gigs.',
        },
        {
          title: 'Organise rehearsals and gigs',
          description:
            'Poll availability, propose rehearsal series, confirm gig dates and publish public availability when ready.',
        },
      ],
      previews: [
        {
          label: 'Private workspace',
          title: 'Gig readiness: 82%',
          description: 'Setlist confirmed, 14 songs ready, two songs need drummer review.',
        },
        {
          label: 'Public profile',
          title: 'Bookable in Surrey & Hounslow',
          description: 'Logo, videos, track links, pricing range, reviews and contact route.',
        },
      ],
      cta: {
        label: 'Create your band page →',
        href: '/signup?intent=create-band',
        intent: 'band',
        variant: 'primary',
      },
    },
    organisers: {
      id: 'organisers',
      kicker: 'For Organisers',
      heading: 'Find the right band and promote the gig.',
      text: 'Bandie helps organisers discover local bands, compare suitability, check availability and generate professional event content. It is for pubs, venues, festivals, community events, private parties and local promoters.',
      tags: ['Pubs', 'Venues', 'Festivals', 'Parties', 'Community events'],
      howTitle: 'How it works for organisers',
      howText: 'Search the directory, shortlist bands, organise the gig and generate promotion assets.',
      rolePill: 'Organiser mode',
      steps: [
        {
          title: 'Search the directory',
          description: 'Filter bands by name, genre, location, price range, rating and availability.',
        },
        {
          title: 'Review band profiles',
          description:
            'Check videos, tracks, bios, areas served, line-up, set length, reviews and booking information.',
        },
        {
          title: 'Plan and confirm the gig',
          description: 'Send enquiries, propose dates and track whether the band is provisional or confirmed.',
        },
        {
          title: 'Generate promo content',
          description:
            'Create a gig page, QR code, poster and shareable content for social channels and venues.',
        },
      ],
      previews: [
        {
          label: 'Directory result',
          title: '20 bands found near Weybridge',
          description: 'Filter: post-punk, £300–£700, available in February, rating 4★+.',
        },
        {
          label: 'Event content',
          title: 'Poster + QR page generated',
          description: 'Venue, date, time, price and band details turned into promotional assets.',
        },
      ],
      cta: {
        label: 'Find a band →',
        href: '/signup?intent=organiser',
        intent: 'organiser',
        variant: 'pink',
      },
    },
  } satisfies Record<string, UseCaseAudience>,
  platform: {
    id: 'features',
    kicker: 'Why it works',
    heading: 'Bandie connects public discovery with private preparation.',
    text: 'A band can be discovered publicly, then prepare privately. Organisers see the polished profile and public availability. Members see the song folders, setlists, notes and readiness tasks.',
    map: [
      {
        label: 'Profile',
        value: 'Public band and player pages for discovery and credibility.',
      },
      {
        label: 'Directory',
        value: 'Searchable marketplace for organisers and players.',
      },
      {
        label: 'Workspace',
        value: 'Private band management for members, songs and gigs.',
      },
      {
        label: 'Calendar',
        value: 'Availability, rehearsal planning and public gig readiness.',
      },
      {
        label: 'Promotion',
        value: 'Event pages, QR links, poster templates and shareable content.',
      },
    ],
  },
  capabilities: {
    kicker: 'Core capabilities',
    heading: 'Everything the early platform needs, without becoming heavy.',
    text: 'Bandie should stay lightweight and practical. The goal is less admin, fewer lost messages and a clearer route from discovery to gig readiness.',
    tiles: [
      {
        title: 'Player profiles',
        description: 'Promote instruments, genres, clips, availability and location.',
      },
      {
        title: 'Band profiles',
        description: 'Public mini-sites for organisers, players and prospective bookers.',
      },
      {
        title: 'Band directory',
        description: 'Find bands by genre, location, price, rating and availability.',
      },
      {
        title: 'Line-up management',
        description: 'Members, roles, approvals, deps and private workspace access.',
      },
      {
        title: 'Songs & folders',
        description: 'Song metadata, external resources, parts, files, notes and readiness.',
      },
      {
        title: 'Setlists',
        description: 'Create, reuse and track setlists for gigs and rehearsals.',
      },
      {
        title: 'Calendar',
        description: 'Rehearsal proposals, gig availability and public calendar outputs.',
      },
      {
        title: 'Promo generator',
        description: 'Event pages, QR codes, posters and shareable gig content.',
      },
    ],
  },
  footer: {
    tagline: 'Find players, run bands, book gigs.',
    note: 'Bandie — the band hub for local live music.',
  },
} as const;
