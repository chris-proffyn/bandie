# Bandie Homepage — Functional and Technical Specification

**Document status:** Draft functional and technical specification  
**Product:** Bandie  
**Product area:** Bandie Homepage / Public Marketing Landing Page  
**Primary implementation target:** Responsive web application  
**Intended implementation workflow:** Cursor-assisted development  
**Source mockup:** `bandie_homepage_three_modes_v3.html` (supersedes `bandie_homepage_mockup.html`)  
**Related source documents:** `bandie_product_description.md`, `bandie_build_elements.md`  
**Last updated:** 28 June 2026

---

## 1. Purpose of this Document

This document defines the functional and technical specification for the Bandie Homepage.

The homepage is the first public surface of Bandie. It introduces the product, explains who it is for, communicates the core promise, and routes users toward one of three main journeys:

1. **Bands** who want to create or manage a band presence.
2. **Event organisers** who want to find and book a band.
3. **Players** who want to promote themselves for permanent membership or deputy / stand-in gigs.

This document is intended to be used as an implementation guide for building the homepage as part of the Bandie web product. It should provide enough detail for Cursor to generate a production-ready first version and leave clear extension points for later development.

---

## 2. Product Context

Bandie is a web and mobile platform for amateur bands who want to look professional, stay organised, and reduce the admin that normally happens across WhatsApp, spreadsheets, shared drives, social media links, calendars, tab sites, and scattered notes.

Bandie combines:

- A public marketing homepage.
- Public band profiles / mini-sites.
- A searchable band directory for organisers.
- A private band workspace for approved members.
- Songs and repertoire management.
- Song folders and file storage.
- Setlist management.
- Calendar and availability planning.
- Gig management.
- Booking enquiry workflows.
- Notifications and activity.
- Mobile / performance-friendly views.
- Core administration, permissions, storage, search and audit foundations.

The homepage is the entry point into this broader product. It should not attempt to expose every feature in full detail. Its job is to explain the proposition simply and direct users to the next relevant action.

---

## 3. Source Mockup Reference

The homepage implementation should use `bandie_homepage_three_modes_v3.html` as the visual and structural reference.

The mockup contains the following major areas:

1. Sticky top navigation (For Players, For Bands, For Organisers, Features).
2. Hero section with three audience CTAs and audience jump cards.
3. Example public band profile preview card.
4. Three-mode summary cards (Players, Bands, Organisers).
5. Per-audience “how it works” sections with steps and workflow previews.
6. Platform connection strip (Profile, Directory, Workspace, Calendar, Promotion).
7. Core capabilities feature grid.
8. Footer.

The current mockup is a static HTML prototype. The production implementation should preserve the spirit, content hierarchy and visual tone of the mockup while converting it into reusable application components.

---

## 4. Homepage Goals

### 4.1 Primary Goals

The homepage must:

- Explain what Bandie is in one clear proposition.
- Position Bandie as a platform for **players**, **bands** and **event organisers**.
- Show that Bandie serves all three audiences with equal weight.
- Encourage players to build a profile and find opportunities.
- Encourage bands to create a band page / account.
- Encourage organisers to search for bands.
- Establish a bold, music-oriented brand feel.
- Provide a clear path into the wider Bandie product.

### 4.2 Secondary Goals

The homepage should also:

- Demonstrate the relationship between public promotion and private band planning.
- Show examples of the types of content Bandie will organise: songs, gigs, setlists, links, availability and booking information.
- Communicate that Bandie is built for bands without formal management.
- Set expectations that Bandie connects existing tools rather than replacing everything bands already use.
- Provide search-engine-readable content describing the product.

---

## 5. Target Users

### 5.1 Bands

The main homepage audience is amateur and semi-professional bands without formal management.

Examples:

- Cover bands.
- Originals bands.
- Pub bands.
- Wedding and party bands.
- Community event bands.
- Weekend musicians.
- Tribute or genre-specific bands.
- Newly formed bands building their first repertoire.
- Established amateur bands trying to become more organised.

These users need to understand quickly that Bandie helps them:

- Create a credible public presence.
- Manage gigs and rehearsals.
- Build setlists.
- Store and organise song resources.
- Coordinate member availability.
- Reduce repeated admin.

### 5.2 Event Organisers

The second major homepage audience is people who need to find and book suitable bands.

Examples:

- Pub landlords.
- Venue managers.
- Festival organisers.
- Community event organisers.
- Party organisers.
- Wedding planners at the smaller end of the market.
- Corporate / social event organisers.
- School, charity and club event organisers.

These users need to understand that Bandie will help them:

- Search for bands.
- Compare band profiles.
- Check genre, location, suitability and availability.
- Watch or listen to media.
- Submit a booking enquiry.

### 5.3 Players

The third major homepage audience is musicians who want to be discovered by bands — either to join permanently or to cover gigs as a dep.

Examples:

- Session musicians between bands.
- Players open to stand-in / deputy work.
- Multi-band musicians who want one public player profile.
- Musicians relocating and looking for a new band.

These users need to understand that Bandie will help them:

- List instruments, genres, location and experience in a player directory.
- Signal openness to deputy gigs or permanent member invites.
- Show travel distance and fee guidance for dep work.
- Be found by band leaders searching the player directory.

---

## 6. Page Scope

### 6.1 In Scope for MVP

The homepage MVP should include:

- Public, unauthenticated access.
- Responsive layout across desktop, tablet and mobile.
- Static marketing content based on the mockup.
- Sticky top navigation with anchor links.
- Hero section with product proposition and three audience CTAs.
- Audience jump cards (Players, Bands, Organisers).
- Example public band profile preview card.
- Three-mode summary cards.
- Per-audience “how it works” sections (players, bands, organisers).
- Platform connection strip.
- Core capabilities feature grid.
- Footer.
- Basic analytics event tracking for CTA clicks and navigation clicks.
- SEO metadata.
- Accessibility-friendly markup.

### 6.2 Out of Scope for Homepage MVP

The homepage MVP does not need to include:

- Full user registration flow.
- Authentication implementation beyond routing to future auth pages.
- Live band directory search results.
- Live band profile data.
- Dynamic pricing.
- Testimonials sourced from real users.
- Blog, articles or content marketing.
- Payment or subscription flows.
- Embedded videos or audio players.
- CMS authoring tools.
- Personalised content.

### 6.3 Deferred Enhancements

Future homepage versions may include:

- Dynamic featured bands.
- Location-aware organiser CTA.
- Real testimonials.
- Video product walkthrough.
- Email waitlist capture.
- Pricing section.
- Product screenshots / carousel.
- FAQ section.
- Blog / resources links.
- A/B tested messaging.
- Experiment-driven CTA variants.

---

## 7. Information Architecture

The homepage sits in the public information architecture:

```text
Public
├── /                         Bandie Homepage
├── /bands                    Band Directory
├── /bands/[slug]             Public Band Profile
├── /book/[bandSlug]          Booking Enquiry Form
├── /signup                   Account Creation / Band Creation Entry
├── /login                    Login
└── /about or /how-it-works   Optional future marketing pages
```

For MVP, the homepage links to live routes: `/bands` (directory), `/login`, `/signup?intent=create-band`. Signed-in users see their display name in the nav (linking to `/app`) instead of “Log in”.

Recommended route mapping:

| Homepage action | Target route | MVP behaviour |
|---|---:|---|
| Brand logo | `/` | Reload / navigate to homepage |
| For Players | `#players` | Anchor scroll |
| For Bands | `#bands` | Anchor scroll |
| For Organisers | `#organisers` | Anchor scroll |
| Features | `#features` | Anchor scroll |
| I'm a player (hero) | `#players` | Anchor scroll |
| I'm in a band (hero) | `#bands` | Anchor scroll |
| I organise events (hero) | `#organisers` | Anchor scroll |
| Build your player profile | `/signup?intent=player-profile` | Route to signup, then player profile editor |
| Create your band page | `/signup?intent=create-band` | Route to signup / waitlist |
| Find a band | `/bands` | Route to Band Directory |

---

## 8. Functional Requirements

### 8.1 Navigation

The homepage must include a top navigation bar with:

- Bandie brand mark.
- Bandie wordmark.
- Anchor link to “What it is”.
- Anchor link to “For bands”.
- Anchor link to “For organisers”.
- Anchor link to “For players”.
- Anchor link to “How it works”.

Functional behaviour:

- Clicking the Bandie brand should navigate to the homepage top.
- Anchor links should scroll smoothly to the correct section.
- Navigation should remain usable on mobile.
- On smaller screens, the nav links may collapse, wrap, or be hidden behind a menu depending on the selected implementation approach.
- If a mobile menu is implemented, it must be keyboard accessible and closable.

Acceptance criteria:

- Desktop navigation is visible and readable.
- Mobile navigation does not overflow the viewport.
- All navigation links have accessible names.
- Keyboard users can tab through navigation links in a logical order.

---

### 8.2 Hero Section

The hero section must communicate the main proposition:

> The simple hub for your band life.

Supporting copy should explain that Bandie helps bands promote themselves, organise gigs, agree setlists, share song resources, and keep everyone aligned without turning band admin into a full-time job.

The hero must include:

- Eyebrow message: “Built for amateur bands who want to look pro”.
- Main heading.
- Supporting paragraph.
- Primary CTA: “For Bands”.
- Secondary CTA: “Find a Band”.
- Trust / benefit pills:
  - Mini band website.
  - Gig planning.
  - Votable setlists.
  - Song links & notes.
- Example band profile card.

Functional behaviour:

- “For Bands” should route to the band-focused journey.
- “Find a Band” should route to the organiser / directory journey.
- CTA clicks should emit analytics events.
- The hero should be the first meaningful content after navigation.

Acceptance criteria:

- User can understand what Bandie does within five seconds.
- Primary and secondary CTAs are visible above the fold on desktop.
- CTAs remain visible and tappable on mobile.
- Hero content does not rely only on images to convey meaning.

---

### 8.3 Example Bandie Profile Preview

The homepage should include a stylised example card showing how Bandie connects public promotion and private readiness.

The mockup uses the example band “Skin Condition”.

The preview card should include:

- Band initials / placeholder logo: `SC`.
- Status chip: “Available for gigs”.
- Band name: “Skin Condition”.
- Band description: “Post-punk / new wave covers · London”.
- Promo mini-card: videos, tracks, socials and booking info in one link.
- Next gig mini-card: example date and set length.
- Band status mini-card: member confirmation and setlist readiness.
- Song hub mini-card: tabs, videos, lyrics and band notes linked.
- Setlist preview rows with example songs and vote counts.

Functional behaviour for MVP:

- This card is illustrative and does not need to be connected to live data.
- Card content should be implemented as structured content in a component, not embedded directly in large template strings.
- The design should be responsive and should stack beneath the hero copy on narrow screens.

Future behaviour:

- Replace static data with a featured band or example profile object.
- Link the card to a sample public band profile.
- Allow the card to show real public profile completeness indicators.

Acceptance criteria:

- Card visually communicates the public/private Bandie concept.
- Card content is readable on mobile.
- Card is labelled for assistive technology as an example Bandie band profile.

---

### 8.4 “What Bandie Is” Section

This section explains the core product idea:

> One place for the things bands usually scatter everywhere.

It should explain that bands already use many tools and that Bandie gives them structure by attaching those resources to band objects such as songs, gigs, setlists, availability, promotion and decisions.

The section must include three feature cards:

1. **Promote the band**
   - Public profile with name, logo, bio, photos, videos, tracks, socials and booking contact.
2. **Organise the gig**
   - Dates, venues, arrival times, availability, setlists, notes and gear checklists.
3. **Agree the songs**
   - Repertoire with keys, links, parts, lyrics, tabs, videos, rehearsal recordings and band-approved notes.

Functional behaviour:

- Feature cards are static in MVP.
- Cards should be implemented from an array/config where possible to make content easier to maintain.
- Icons may be emoji in MVP or replaced with the product icon system later.

Acceptance criteria:

- Feature cards are displayed as a three-column layout on desktop.
- Feature cards stack cleanly on tablet/mobile.
- Each card has a heading and supporting copy.

---

### 8.5 Audience Split Section

The homepage must include three audience panels:

1. For bands.
2. For event organisers.
3. For players.

#### For Bands Panel

Heading:

> Stop chasing everyone. Start sounding organised.

The panel should state that Bandie is for amateur bands, cover bands, originals bands, weekend musicians and bands without formal management.

It should include benefits:

- Create a simple public band page to send to venues.
- Track gigs, rehearsals and member availability.
- Build votable setlists for specific events.
- Store song notes and links to tabs, videos and files.
- Give every member the same version of the plan.

CTA:

- “Create your band page”.

#### For Event Organisers Panel

Heading:

> Find bands that are ready to play.

The panel should state that organisers need to know what the band sounds like, where they are based, whether they are suitable, and how to book them.

It should include benefits:

- Browse bands by location, genre and event type.
- Watch videos and listen to tracks from one clean profile.
- Check set length, setup needs and contact details.
- Shortlist suitable bands for pubs, parties, festivals and community events.
- Send a booking enquiry without hunting through socials.

CTA:

- “Find a band”.

#### For Players Panel

Heading:

> Get seen by bands that need you.

The panel should state that session musicians, deps and players between bands can promote themselves in the Bandie player directory — for permanent membership or one-off stand-in gigs.

It should include benefits:

- Create a player profile with instruments, genres, location and experience.
- Say you are open to deputy / stand-in gigs or permanent member invites.
- Show travel distance and fee guidance for dep work.
- Let band leaders find you when they need a last-minute cover.
- Keep one profile that works across every band you play with.

CTA:

- “Build your player profile” (routes to signup with `intent=player-profile`, then `/app/profile`).

Functional behaviour:

- Band CTA routes to signup / band creation when available.
- Organiser CTA routes to the public band directory when available.
- Player CTA routes to signup / player profile editor when available.
- CTA clicks should emit analytics events.

Acceptance criteria:

- The three user groups are visibly distinct.
- Each panel has a clear next action.
- The section remains readable in a single-column mobile layout.

---

### 8.6 “How It Works” Workflow Section

This section should explain the core lifecycle:

1. Create the band.
2. Add the songs.
3. Plan the gig.
4. Share the profile.

Workflow card details:

| Step | Heading | Description |
|---:|---|---|
| 1 | Create the band | Add name, logo, location, genre, socials, videos, tracks and booking details. |
| 2 | Add the songs | Build a shared repertoire with keys, durations, notes and links to tabs, videos and files. |
| 3 | Plan the gig | Check availability, build a setlist, confirm timings and make sure everyone knows the plan. |
| 4 | Share the profile | Send organisers one clean Bandie link instead of a messy chain of messages and scattered links. |

Functional behaviour:

- Static in MVP.
- Should be easy to expand into an interactive walkthrough later.

Acceptance criteria:

- The workflow is understandable as a sequence.
- Each step has a short heading and one-sentence description.
- Layout adapts gracefully across breakpoints.

---

### 8.7 Final CTA Section

The final CTA should reinforce the brand promise:

> For bands who want the fun, not the admin.

Supporting copy:

> Bandie helps amateur bands look credible, get organised and be ready for the next rehearsal, gig or booking enquiry.

The section should include two CTAs:

- “For Bands”.
- “For Event Organisers”.

Functional behaviour:

- Band CTA routes to signup / band creation when available.
- Event organiser CTA routes to the directory when available.
- CTA clicks should emit analytics events.

Acceptance criteria:

- Final CTA is visually prominent.
- Both CTAs are available on desktop and mobile.
- The user has a clear next step at the end of the page.

---

### 8.8 Footer

The footer should include:

- Copyright line: “© 2026 Bandie. Built for bands without managers.”
- Brand phrase: “Promote · Organise · Rehearse · Play”.

Future footer links may include:

- About.
- Contact.
- Terms.
- Privacy.
- Help.
- Login.
- Create band.
- Find bands.

Acceptance criteria:

- Footer content is visible and readable.
- Footer does not distract from the homepage CTAs.

---

## 9. Content Requirements

### 9.1 Tone of Voice

The homepage tone should be:

- Practical.
- Music-oriented.
- Clear.
- Energetic.
- Friendly.
- Not overly corporate.
- Not too “startup jargon” heavy.

The product is for musicians who want less admin, not enterprise buyers. Copy should avoid language that makes the product feel like a heavy project management system.

### 9.2 Core Messaging

Recommended core message:

> Bandie helps amateur bands look credible, stay organised, and be ready for the next rehearsal, gig, or booking enquiry.

Supporting propositions:

- Built for bands without managers.
- Promote, organise, rehearse, play.
- A simple hub for band life.
- One clean link for the outside world, one shared plan for the band.

### 9.3 Terminology

Use:

- Band.
- Event organiser.
- Gig.
- Rehearsal.
- Setlist.
- Song resources.
- Band profile.
- Band directory.
- Booking enquiry.

Avoid overusing:

- Workflow automation.
- Enterprise orchestration.
- Resource management.
- Productivity suite.
- Project management.

---

## 10. User Journeys

### 10.1 Band Leader Journey

1. User lands on the homepage.
2. User reads the hero proposition.
3. User recognises the pain of scattered band admin.
4. User clicks “For Bands” or scrolls to the bands panel.
5. User sees benefits relevant to creating a band page and organising band activity.
6. User clicks “Create your band page”.
7. User is routed to signup, waitlist, or band creation flow.

MVP target route:

```text
/signup?intent=create-band
```

### 10.2 Band Member Journey

1. User lands on homepage after receiving a link from a band leader.
2. User understands that Bandie will centralise setlists, songs, gigs and availability.
3. User clicks a band-focused CTA.
4. User is routed to login/signup or invited band workspace when that flow exists.

MVP target route:

```text
/signup?intent=join-band
```

Optional: this route may be deferred until invitation flows exist.

### 10.3 Event Organiser Journey

1. User lands on homepage.
2. User sees that Bandie helps organisers find suitable bands.
3. User clicks “Find a Band”.
4. User is routed to the band directory.
5. User filters and compares bands.
6. User opens a public band profile.
7. User submits a booking enquiry.

MVP target route:

```text
/bands
```

### 10.4 Returning User Journey

1. User lands on homepage.
2. User clicks login, if present in future navigation.
3. User is routed to authentication.
4. After login, user is routed to their band workspace or band switcher.

Future route:

```text
/login
```

---

## 11. Interaction Requirements

### 11.1 Anchor Scrolling

- Anchor links should use browser-native anchor behaviour or framework-supported smooth scroll.
- Sections should have stable IDs:
  - `#what`
  - `#bands`
  - `#organisers`
  - `#how`
- When using a sticky header, ensure anchor targets are not hidden beneath the nav.

### 11.2 CTA Tracking

All primary CTAs should emit analytics events.

Recommended event names:

| Event | Trigger |
|---|---|
| `homepage_cta_clicked` | Any CTA click |
| `homepage_nav_clicked` | Header navigation click |
| `homepage_band_intent_clicked` | CTA into band creation flow |
| `homepage_organiser_intent_clicked` | CTA into directory flow |

Recommended event payload:

```json
{
  "location": "hero | audience_section | final_cta | nav",
  "label": "For Bands",
  "target": "/signup?intent=create-band",
  "audience_intent": "band | organiser | player",
  "page": "homepage"
}
```

### 11.3 Responsive Behaviour

Desktop:

- Hero uses two-column layout.
- Feature cards display in three columns.
- Audience panels display side by side.
- Workflow cards display in four columns or a flexible grid.

Tablet:

- Hero may remain two-column if space allows or collapse to single column.
- Feature cards may use two columns.
- Audience panels may stack.

Mobile:

- Single-column layout.
- Navigation simplified.
- Hero CTAs stack or wrap.
- Example profile card appears below hero copy.
- Touch targets must be at least 44px high.

---

## 12. Non-Functional Requirements

### 12.1 Performance

The homepage should be fast because it is the first impression of the product.

Requirements:

- Minimal JavaScript for MVP.
- Avoid heavy animation libraries.
- Avoid large images in the first release unless optimised.
- Use CSS gradients and lightweight assets where possible.
- Target Lighthouse Performance score: 90+.
- Largest Contentful Paint target: under 2.5 seconds on a normal mobile connection.
- Cumulative Layout Shift target: under 0.1.

### 12.2 Accessibility

Requirements:

- Semantic HTML structure.
- One `h1` on the page.
- Logical heading hierarchy.
- Accessible links and buttons.
- Sufficient colour contrast.
- Keyboard navigable CTAs.
- No meaningful content conveyed only through colour.
- Decorative icons hidden from assistive tech where appropriate.
- Example card should have an accessible label.
- Respect `prefers-reduced-motion` for any future animations.

### 12.3 SEO

The homepage should include:

- Page title.
- Meta description.
- Canonical URL.
- Open Graph title, description and image.
- Twitter card metadata.
- Structured, crawlable text.
- Valid heading hierarchy.

Recommended title:

```text
Bandie — The band hub for gigs, songs and bookings
```

Recommended meta description:

```text
Bandie helps amateur bands promote themselves, organise gigs, manage setlists, share song resources and connect with event organisers from one simple hub.
```

### 12.4 Security and Privacy

The homepage is public and should not expose private data.

Requirements:

- Do not fetch private band data for the homepage MVP.
- Do not expose service keys or private environment variables client-side.
- External links should use `rel="noopener noreferrer"` when opening in a new tab.
- Any future email capture form must include spam protection and consent wording.

### 12.5 Maintainability

Requirements:

- Build the page from reusable components.
- Keep content arrays separate from presentation where practical.
- Avoid a single monolithic component with all content hardcoded inline.
- Use shared design tokens for colours, spacing, border radius and typography.
- Match the mockup visually while creating production-friendly structure.

---

## 13. Recommended Technical Architecture

### 13.1 Frontend Stack

Recommended stack for the Bandie web application:

- React.
- TypeScript.
- Vite or Next.js depending on wider app direction.
- Tailwind CSS or CSS modules.
- Supabase for backend services when dynamic flows are introduced.

For a simple PWA-oriented build, Vite + React is sufficient. If SEO, routing, server rendering and public profile indexing become more important early, Next.js may be preferable.

### 13.2 Suggested Route

```text
/
```

Component:

```text
src/pages/HomePage.tsx
```

or, in a Next.js App Router structure:

```text
src/app/page.tsx
```

### 13.3 Component Structure

Recommended components:

```text
src/
├── components/
│   ├── marketing/
│   │   ├── MarketingNav.tsx
│   │   ├── HeroSection.tsx
│   │   ├── ExampleBandProfileCard.tsx
│   │   ├── ModeGridSection.tsx
│   │   ├── UseCaseSection.tsx
│   │   ├── PlatformStrip.tsx
│   │   ├── CoreCapabilities.tsx
│   │   ├── MarketingButton.tsx
│   │   └── MarketingFooter.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── SectionHeader.tsx
├── content/
│   └── homepageContent.ts
├── lib/
│   └── analytics.ts
└── pages/
    └── HomePage.tsx
```

### 13.4 Content Configuration

Use a typed content object to avoid scattering homepage copy across components.

Example:

```ts
export const homepageContent = {
  hero: {
    eyebrow: 'Built for amateur bands who want to look pro',
    heading: 'The simple hub for your band life.',
    body: 'Bandie helps bands promote themselves, organise gigs, agree setlists, share song resources and keep everyone on the same page — without turning band admin into a full-time job.',
    primaryCta: {
      label: 'For Bands',
      href: '/signup?intent=create-band',
      intent: 'band'
    },
    secondaryCta: {
      label: 'Find a Band',
      href: '/bands',
      intent: 'organiser'
    },
    trustPills: [
      'Mini band website',
      'Gig planning',
      'Votable setlists',
      'Song links & notes'
    ]
  }
};
```

### 13.5 Data Dependencies

MVP homepage data dependencies:

- None required.
- Static content only.

Future optional dependencies:

- Featured band profiles from Supabase.
- Directory stats from Supabase.
- Waitlist signup endpoint.
- CMS-backed homepage content.

---

## 14. Styling Requirements

The production page should preserve the mockup’s design direction:

- Dark background.
- High contrast typography.
- Strong rounded panels.
- Bright accent colours.
- Music-oriented energy.
- Playful but practical visual language.
- Polished public marketing feel.

### 14.1 Design Tokens

Recommended token names:

```ts
const theme = {
  colors: {
    background: '#101014',
    panel: '#191922',
    panelSoft: '#222230',
    text: '#f6f3ea',
    muted: '#bbb6aa',
    accent: '#ffcc33',
    accentPink: '#ff5e7e',
    accentGreen: '#61e3c2',
    line: 'rgba(255,255,255,0.12)'
  },
  radius: {
    md: '16px',
    lg: '22px',
    xl: '32px'
  },
  layout: {
    maxWidth: '1180px'
  }
};
```

### 14.2 Breakpoints

Recommended breakpoints:

```text
mobile: 0–639px
tablet: 640–1023px
desktop: 1024px+
wide: 1280px+
```

### 14.3 Layout Rules

- Main content max width: approximately 1180px.
- Horizontal page padding: 20px on mobile, 32px+ on larger screens.
- Hero section should have generous vertical space on desktop.
- Cards should use consistent border radius and border styling.
- CTA buttons should use pill-shaped styling.

---

## 15. Routing and Downstream Integration

### 15.1 Band Signup / Creation

When account and band creation flows exist, “For Bands” and “Create your band page” should route to:

```text
/signup?intent=create-band
```

The signup flow should preserve the `intent` parameter and use it to route the user into the band creation wizard after authentication.

### 15.2 Band Directory

“Find a Band” should route to:

```text
/bands
```

This should open the public band directory.

### 15.3 Login

A login link may be added later:

```text
/login
```

After login, the user should route to:

- Their band workspace if they belong to one band.
- Band switcher if they belong to multiple bands.
- Create/join band flow if they have no band memberships.

---

## 16. Analytics Specification

### 16.1 Events

| Event name | Description |
|---|---|
| `homepage_viewed` | User views the homepage |
| `homepage_nav_clicked` | User clicks a nav item |
| `homepage_cta_clicked` | User clicks any homepage CTA |
| `homepage_band_intent_clicked` | User clicks a band-focused CTA |
| `homepage_organiser_intent_clicked` | User clicks an organiser-focused CTA |

### 16.2 Event Fields

| Field | Type | Description |
|---|---|---|
| `page` | string | Always `homepage` |
| `section` | string | `nav`, `hero`, `bands`, `organisers`, `final_cta` |
| `label` | string | Visible CTA or link text |
| `target` | string | Target route or anchor |
| `audience_intent` | string | `band`, `organiser`, `player`, `general` |
| `timestamp` | string | ISO timestamp |

### 16.3 Analytics Implementation Notes

- Analytics should be abstracted behind a helper such as `trackEvent()`.
- Do not hard-code a vendor-specific implementation into UI components.
- MVP may log to console in development until an analytics provider is selected.

Example:

```ts
trackEvent('homepage_cta_clicked', {
  page: 'homepage',
  section: 'hero',
  label: 'For Bands',
  target: '/signup?intent=create-band',
  audience_intent: 'band'
});
```

---

## 17. Accessibility Checklist

Before completion, verify:

- Page has a single `h1`.
- Sections use `section`, `header`, `nav`, `main`, `footer` appropriately.
- Navigation has `aria-label="Main navigation"`.
- Example band profile card has an accessible label.
- CTA links describe their destination clearly.
- Keyboard focus state is visible.
- Colour contrast passes WCAG AA for normal text.
- Interactive elements are not smaller than 44px touch target height.
- Decorative icons are either hidden or harmless to screen readers.
- Reduced motion preference is respected.

---

## 18. SEO Checklist

Before completion, verify:

- Title is set.
- Meta description is set.
- Canonical URL is set.
- Open Graph metadata is set.
- Twitter card metadata is set.
- The main proposition appears in crawlable text.
- The page contains relevant terms such as amateur bands, band management, gigs, setlists, band directory and booking enquiries.
- No important text is only rendered inside inaccessible images.

---

## 19. Testing Requirements

### 19.1 Functional Tests

Test:

- Navigation anchor links.
- CTA links.
- Mobile layout.
- Desktop layout.
- Analytics events for CTA clicks.
- Footer display.

### 19.2 Accessibility Tests

Run:

- Keyboard navigation test.
- Screen reader spot check.
- Axe or equivalent accessibility scan.
- Colour contrast check.

### 19.3 Visual Regression Tests

If visual regression testing is available, capture:

- Desktop homepage.
- Tablet homepage.
- Mobile homepage.

### 19.4 Browser Coverage

Minimum browser support:

- Latest Chrome.
- Latest Safari.
- Latest Edge.
- Latest Firefox.
- iOS Safari.
- Android Chrome.

---

## 20. MVP Acceptance Criteria

The homepage MVP is complete when:

1. The route `/` renders the Bandie homepage.
2. The page matches the structure and spirit of `bandie_homepage_three_modes_v3.html`.
3. The page is fully responsive.
4. Navigation links work.
5. CTAs route to configured placeholder or live routes.
6. The hero proposition is visible above the fold on desktop.
7. The page clearly explains all three user groups: players, bands and event organisers.
8. The example band profile card is present and readable.
9. SEO metadata is implemented.
10. Accessibility checks pass at a basic level.
11. CTA analytics events are implemented or stubbed behind a provider-neutral helper.
12. The code is structured into reusable components rather than one large page file.

---

## 21. Implementation Tasks for Cursor

### Task 1 — Create Homepage Route

Create the public homepage route at `/`.

- Add a page component.
- Add semantic layout.
- Confirm the page renders without authentication.

### Task 2 — Create Marketing Components

Create reusable components:

- `MarketingNav`.
- `HeroSection`.
- `ExampleBandProfileCard`.
- `ModeGridSection`.
- `UseCaseSection`.
- `PlatformStrip`.
- `CoreCapabilities`.
- `MarketingFooter`.

### Task 3 — Add Homepage Content Configuration

Create `homepageContent.ts` containing:

- Hero copy.
- CTA labels and hrefs.
- Trust pills.
- Feature cards.
- Audience cards.
- Workflow steps.
- Footer content.

### Task 4 — Implement Styling

Implement styles to match the mockup:

- Dark background.
- Accent gradients.
- Rounded cards.
- Responsive grids.
- Pill CTAs.
- Strong typography.

### Task 5 — Add Responsive Behaviour

Implement breakpoints for:

- Hero two-column to one-column.
- Feature cards three-column to stacked.
- Audience panels two-column to stacked.
- Workflow cards flexible grid to stacked.
- Navigation mobile behaviour.

### Task 6 — Add Analytics Stub

Create a provider-neutral analytics helper.

- Track homepage view.
- Track nav clicks.
- Track CTA clicks.

### Task 7 — Add SEO Metadata

Add:

- Page title.
- Meta description.
- Open Graph metadata.
- Twitter card metadata.
- Canonical URL.

### Task 8 — Test and Polish

Run:

- Type check.
- Lint.
- Build.
- Responsive browser test.
- Basic accessibility scan.

---

## 22. Open Questions

These questions can be resolved before or during implementation:

1. Should the first CTA route to a live signup flow, a waitlist, or remain an anchor until authentication is built?
2. Should the homepage include a login link from day one?
3. Should organisers be able to search the directory before any real bands exist, or should the directory initially show demo / coming soon content?
4. Should there be an email capture form for early access?
5. Should the example profile card link to the Skin Condition profile mockup or remain non-clickable?
6. Should the homepage be static or CMS-managed in later versions?
7. Should the homepage be implemented with Vite SPA routing or server-rendered for stronger SEO?

---

## 23. Recommended MVP Decisions

For the first build:

- Implement the homepage as a static public page.
- Use the mockup content directly, structured through a content config file.
- Route “Find a Band” to `/bands` (live).
- Route “For Bands” to `/signup?intent=create-band` (live).
- Route “For Players” to `/signup?intent=player-profile` (live).
- Do not add email capture until consent, storage and spam handling are defined.
- Keep the example profile card static.
- Use reusable components so the visual system can be reused across Bandie public pages.

---

## 24. Summary

The Bandie Homepage is the public entry point for the product. It should introduce Bandie as the simple hub for band life, explain the three audiences of bands, event organisers and players, and route each user group into the correct journey.

The implementation should closely follow `bandie_homepage_three_modes_v3.html`, preserving its bold dark visual style, high-contrast cards, music-oriented tone, three-mode audience structure, example public band profile preview, per-audience how-it-works sections and clear CTAs.

The homepage should be simple in MVP, but built on a component structure that can later support live featured bands, real directory stats, signup flows, analytics, testimonials, pricing and richer product storytelling.
