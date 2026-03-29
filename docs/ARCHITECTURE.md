# Golden Seal Life Sciences Web Architecture

## 1. Technology Stack

- Frontend framework: Angular 21 (latest stable at scaffold time)
- UI library: Angular Material 21
- Motion and effects: GSAP + Three.js
- Image editing: `ngx-image-cropper`
- Backend platform: Firebase (Auth, Firestore, Storage)

## 2. Runtime Architecture

### Public App

- Route shell: `PublicShellComponent`
- Pages:
  - Home (`/`)
  - Products catalog (`/products`)
  - Product details (`/products/:slug`)
  - About (`/about`)
  - Contact / lead form (`/contact`)
- Visual engine:
  - Three.js atmospheric background
  - GSAP custom cursor
  - staggered page reveal motion

### Admin App (Hidden URL)

- Login URL: `/admin/login`
- Dashboard URL: `/admin/dashboard` (guarded)
- Guard: `adminAuthGuard`
- Authentication strategy:
  - Primary: Firebase Auth email/password
  - Mapping support: username `admin` -> `admin@goldenseal.local`
  - Single-admin enforcement via allowed email check
  - Local fallback mode available only when Firebase is not configured

## 3. Data Model (Firestore)

### Collections / Documents

- `site/content` (document): hero + homepage sections + highlights
- `site/settings` (document): company profile and contact data
- `site/theme` (document): brand colors and visual tokens
- `products/{productId}` (collection): product records
- `media/{mediaId}` (collection): uploaded image metadata
- `analytics_events/{eventId}` (collection): consented analytics events
- `leads/{leadId}` (collection): explicit user-submitted lead data

### Product Document Shape

- `id`, `slug`, `name`, `category`
- `shortDescription`, `longDescription`
- `imageUrl`, `highlighted`, `sectionId`, `tags`
- `createdAt`, `updatedAt`

### Media Document Shape

- `id`, `name`, `hash`, `storagePath`, `downloadUrl`, `createdAt`

## 4. Image Storage Strategy

- Uploaded image is cropped in admin using image cropper.
- SHA-256 hash is computed in-browser.
- Storage path format: `site-media/{sha256}.{ext}`.
- Metadata is written to Firestore `media` collection.
- Resulting URL can be attached to products and reused throughout the site.

## 5. Theme Engine

- Theme values are stored in `site/theme`.
- `ThemeService` maps theme data to CSS custom properties on `:root`.
- Admin can change all major brand colors from dashboard.

## 6. Security and Access

- Main navigation does not expose admin routes.
- Admin routes are protected by authentication guard.
- Single admin account policy is enforced in `AdminAuthService`.
- Firebase Security Rules should enforce:
  - read access to public data (`site`, `products`, selected `media`)
  - write access only for authenticated admin UID/email

## 7. Analytics and Lead Capture (Compliance-Safe)

- Consent banner controls optional analytics tracking.
- Page/event analytics are stored only after consent.
- Lead data (email/phone) is captured only through explicit form submission with consent.
- Stealth collection and unsolicited messaging workflows are intentionally not implemented.

## 8. Scalability Plan

### Phase 1 (Current)

- Angular SPA + Firebase realtime CMS pattern
- Single admin account
- Content, media, products, and theme editing

### Phase 2

- Firebase Cloud Functions for image post-processing and webhooks
- Admin role migration to custom claims
- Preview/publish workflow and content version history

### Phase 3

- Multi-language content model
- Product filtering/search indexing (Algolia or Vertex AI Search)
- CDN strategy and edge rendering path
