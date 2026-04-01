# Golden Seal Life Sciences Frontend

Modern Angular 21 website and CMS-style admin portal for Golden Seal Life Sciences.

## Highlights

- Angular 21 with standalone architecture
- Hidden admin portal (`/admin/login`)
- Single-admin authentication flow
- Firebase-powered content, products, themes, media, analytics, and lead storage
- WordPress-style content editing experience for core site data
- Image upload + crop + hash-based storage pathing
- Three.js atmospheric background and GSAP pointer motion
- Angular Material 21 UI components

## Project Structure

- `src/app/features/public`: public pages and shell
- `src/app/features/admin`: admin login + dashboard
- `src/app/core/services`: Firebase, auth, content, media, theme, analytics services
- `src/app/shared/components`: ambient background, custom cursor, consent banner
- `docs/ARCHITECTURE.md`: end-to-end architecture plan
- `docs/FIREBASE_SETUP.md`: Firebase wiring and rules

## Admin Access

- Hidden URL: `/admin/login`
- Test credentials for initial setup:
  - Username: `admin`
  - Password: `password`
- Username is mapped to Firebase email format `admin@goldenseal.local`

You can manually rotate credentials in Firebase Auth.

## Privacy Model

The app implements consent-based analytics and explicit lead capture.

- Optional analytics only after consent
- Email/phone data only via explicit contact form submission with consent
- No stealth personal data extraction workflow

## Prerequisites

- Node 22.12+ recommended (required by latest Angular CLI)
- npm 11+

This workspace includes helper scripts for a portable runtime:

- `npm run start:portable`
- `npm run build:portable`

## Local Development

```bash
npm install
npm run start:portable
```

Visit:

- Public site: `http://localhost:4200`
- Admin portal: `http://localhost:4200/admin/login`

## Build

```bash
npm run build:portable
```

Production output is generated in `dist/golden-seal-life-sciences`.

## Deploy To GitHub Pages

This repository is ready for GitHub Pages deployment using a GitHub Actions workflow.

### 1. Push to GitHub

Push your code to `main` (or `master`).

### 2. Enable Pages Source

In your GitHub repository:

- Open **Settings** -> **Pages**
- Under **Build and deployment**, set **Source** to **GitHub Actions**

### 3. Automatic Deploy

After every push to `main` or `master`, the workflow:

- installs dependencies
- builds Angular with the correct base href for your repository
- configures SPA fallback (`404.html`)
- deploys to GitHub Pages

### 4. URL Format

- User/org site repo (`<username>.github.io`): `https://<username>.github.io/`
- Project repo (`my-repo`): `https://<username>.github.io/my-repo/`

### 5. Optional Custom Domain

If you use a custom domain, add a `CNAME` file at repository root. The workflow copies it to the Pages artifact.

This repository already includes:

- `CNAME` with `goldenseallifesciences.com`

### 6. Cloudflare DNS (Apex + www)

In Cloudflare DNS for `goldenseallifesciences.com`, add:

- `A` record: Name `@`, Content `185.199.108.153`, Proxy status `DNS only`
- `A` record: Name `@`, Content `185.199.109.153`, Proxy status `DNS only`
- `A` record: Name `@`, Content `185.199.110.153`, Proxy status `DNS only`
- `A` record: Name `@`, Content `185.199.111.153`, Proxy status `DNS only`
- `CNAME` record: Name `www`, Target `Mr-Jerry-Haxor.github.io`, Proxy status `DNS only`

Optional IPv6 records:

- `AAAA` record: Name `@`, Content `2606:50c0:8000::153`, Proxy status `DNS only`
- `AAAA` record: Name `@`, Content `2606:50c0:8001::153`, Proxy status `DNS only`
- `AAAA` record: Name `@`, Content `2606:50c0:8002::153`, Proxy status `DNS only`
- `AAAA` record: Name `@`, Content `2606:50c0:8003::153`, Proxy status `DNS only`

Then in GitHub -> Repository Settings -> Pages:

- Set custom domain to `goldenseallifesciences.com`
- Enable `Enforce HTTPS`

With this setup, both apex and `www` will resolve for the site.

## Firebase Configuration

See `docs/FIREBASE_SETUP.md` and update:

- `src/app/core/config/firebase.config.ts`

If Firebase config remains as placeholders, the app runs in local mock mode for UI testing.
