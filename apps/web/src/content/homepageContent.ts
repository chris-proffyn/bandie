export type CtaLink = {
  label: string;
  href: string;
  intent: 'band' | 'organiser' | 'player' | 'general';
  variant: 'primary' | 'secondary';
};

export const homepageContent = {
  seo: {
    title: 'Bandie — The band hub for gigs, songs and bookings',
    description:
      'Bandie helps amateur bands promote themselves, organise gigs, manage setlists, share song resources and connect with event organisers from one simple hub.',
    canonicalPath: '/',
    ogImage: '/og-bandie.png',
  },
  nav: {
    brand: 'Bandie',
    brandMark: 'B',
    links: [
      { label: 'What it is', href: '#what' },
      { label: 'For bands', href: '#bands' },
      { label: 'For organisers', href: '#organisers' },
      { label: 'For players', href: '#players' },
      { label: 'How it works', href: '#how' },
    ],
  },
  hero: {
    eyebrow: 'Built for amateur bands who want to look pro',
    heading: 'The simple hub for your',
    headingHighlight: 'band life.',
    body: 'Bandie helps bands promote themselves, organise gigs, agree setlists, share song resources and keep everyone on the same page — without turning band admin into a full-time job.',
    primaryCta: {
      label: 'For Bands →',
      href: '/signup?intent=create-band',
      intent: 'band',
      variant: 'primary',
    } satisfies CtaLink,
    secondaryCta: {
      label: 'Find a Band →',
      href: '/bands',
      intent: 'organiser',
      variant: 'secondary',
    } satisfies CtaLink,
    trustPills: ['Mini band website', 'Gig planning', 'Votable setlists', 'Song links & notes'],
  },
  exampleProfile: {
    initials: 'SC',
    status: 'Available for gigs',
    name: 'Skin Condition',
    subtitle: 'Post-punk / new wave covers · London',
    miniCards: [
      { label: 'Promo', value: 'Videos, tracks, socials and booking info in one link.' },
      { label: 'Next gig', value: 'Sat 14 Sep · 2 x 45 min sets' },
      { label: 'Band status', value: '4/5 confirmed · setlist in progress' },
      { label: 'Song hub', value: 'Tabs, videos, lyrics and band notes linked.' },
    ],
    setlist: [
      { title: 'Town Called Malice', votes: '+8' },
      { title: 'Love Will Tear Us Apart', votes: '+6' },
      { title: 'Friday I\'m in Love', votes: '+5' },
    ],
  },
  what: {
    kicker: 'What Bandie is',
    heading: 'One place for the things bands usually scatter everywhere.',
    text: 'Bands already use YouTube, Spotify, Bandcamp, Google Drive, WhatsApp, tab sites and spreadsheets. Bandie does not replace all of that. It turns it into a structured band hub: songs, gigs, setlists, availability, promotion and decisions.',
    features: [
      {
        icon: '🎤',
        title: 'Promote the band',
        description:
          'Create a clean public profile with your name, logo, bio, photos, videos, tracks, social links and booking contact.',
      },
      {
        icon: '📅',
        title: 'Organise the gig',
        description:
          'Keep dates, venues, arrival times, availability, setlists, notes and gear checklists in one shared place.',
      },
      {
        icon: '🎸',
        title: 'Agree the songs',
        description:
          'Build your repertoire with keys, links, parts, lyrics, tabs, videos, rehearsal recordings and band-approved notes.',
      },
    ],
  },
  audience: {
    bands: {
      id: 'bands',
      kicker: 'For bands',
      heading: 'Stop chasing everyone. Start sounding organised.',
      text: 'Bandie is for amateur bands, cover bands, originals bands, weekend musicians and anyone without formal management.',
      benefits: [
        'Create a simple public band page you can send to venues.',
        'Track gigs, rehearsals and member availability.',
        'Build votable setlists for specific events.',
        'Store song notes and links to tabs, videos and files.',
        'Give every member the same version of the plan.',
      ],
      cta: {
        label: 'Create your band page →',
        href: '/signup?intent=create-band',
        intent: 'band',
        variant: 'primary',
      } satisfies CtaLink,
    },
    organisers: {
      id: 'organisers',
      kicker: 'For event organisers',
      heading: 'Find bands that are ready to play.',
      text: 'Event organisers need to know quickly: what does the band sound like, where are they based, are they suitable, and how do I book them?',
      benefits: [
        'Browse bands by location, genre and event type.',
        'Watch videos and listen to tracks from one clean profile.',
        'Check set length, setup needs and contact details.',
        'Shortlist suitable bands for pubs, parties, festivals and community events.',
        'Send a booking enquiry without hunting through socials.',
      ],
      cta: {
        label: 'Find a band →',
        href: '/bands',
        intent: 'organiser',
        variant: 'secondary',
      } satisfies CtaLink,
    },
    players: {
      id: 'players',
      kicker: 'For players',
      heading: 'Get seen by bands that need you.',
      text: 'Session musicians, deps and players between bands can list themselves in the Bandie player directory — whether you want to join permanently or cover a one-off gig.',
      benefits: [
        'Create a player profile with instruments, genres, location and experience.',
        'Say you are open to deputy / stand-in gigs or permanent member invites.',
        'Show travel distance and fee guidance for dep work.',
        'Let band leaders find you when they need a last-minute cover.',
        'Keep one profile that works across every band you play with.',
      ],
      cta: {
        label: 'Build your player profile →',
        href: '/signup?intent=player-profile',
        intent: 'player',
        variant: 'primary',
      } satisfies CtaLink,
    },
  },
  workflow: {
    kicker: 'How it works',
    heading: "Bandie connects the band's outside world to its inside plan.",
    text: 'Keep rich media and files where they already live. Use Bandie to make them useful: attached to songs, gigs, setlists and booking profiles.',
    steps: [
      {
        title: 'Create the band',
        description: 'Add name, logo, location, genre, socials, videos, tracks and booking details.',
      },
      {
        title: 'Add the songs',
        description: 'Build a shared repertoire with keys, durations, notes and links to tabs, videos and files.',
      },
      {
        title: 'Plan the gig',
        description: 'Check availability, build a setlist, confirm timings and make sure everyone knows the plan.',
      },
      {
        title: 'Share the profile',
        description: 'Send organisers one clean Bandie link instead of a messy chain of messages and scattered links.',
      },
    ],
  },
  finalCta: {
    heading: 'For bands who want the fun, not the admin.',
    text: 'Bandie helps amateur bands look credible, get organised and be ready for the next rehearsal, gig or booking enquiry.',
    primaryCta: {
      label: 'For Bands →',
      href: '/signup?intent=create-band',
      intent: 'band',
      variant: 'primary',
    } satisfies CtaLink,
    secondaryCta: {
      label: 'For Event Organisers →',
      href: '/bands',
      intent: 'organiser',
      variant: 'secondary',
    } satisfies CtaLink,
  },
  footer: {
    copyright: '© 2026 Bandie. Built for bands without managers.',
    tagline: 'Promote · Organise · Rehearse · Play',
  },
} as const;
