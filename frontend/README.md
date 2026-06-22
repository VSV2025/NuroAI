# NuroAI — Plagiarism Intelligence Platform

> Protecting Authentic Learning

A premium, dark-themed front-end for **NuroAI**, a multi-dimensional AI plagiarism-intelligence platform. Built to feel like a funded cybersecurity product (Palantir / Stripe / Linear / Vercel energy) rather than a dashboard template. The entire visual language — metallic silver type, crimson intelligence glow, beveled "machined metal" panel edges, and an animated neural field — is derived directly from the NuroAI shield logo.

## Stack

- **React 18 + TypeScript** (Vite)
- **Tailwind CSS** with a custom token system (ink / silver / crimson, metal bevels, glows)
- **Hand-built ShadCN-style UI primitives** (Button, Card, Badge, Progress, ScoreRing)
- **Framer Motion** — page transitions, scroll reveals, count-ups, glow pulses
- **React Router** — landing + 9 app routes
- **Recharts** — trend, threat, category and language analytics
- **Lucide React** — iconography

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

Build for production:

```bash
npm run build
npm run preview
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Landing (hero, problem, intelligence engine, impact stats) |
| `/login` | Sign-in screen |
| `/dashboard` | Intelligence Center (overview cards + 4 charts) |
| `/dashboard/analyze` | Document Analysis (drag-drop + animated pipeline) |
| `/dashboard/results` | Premium results report (authenticity / risk / confidence) |
| `/dashboard/explainable` | Explainable Intelligence (interactive highlighting) |
| `/dashboard/authorship` | Writing DNA Analysis (radar + fingerprint viz) |
| `/dashboard/cross-language` | Cross-Language Intelligence (relationship graph) |
| `/dashboard/code` | Code Intelligence (side-by-side diff + AST) |
| `/dashboard/settings` | Settings |
| `*` | 404 |

## Design system notes

- **Fonts:** Spectral (display / brand serif, mirrors the wordmark), Inter (UI), JetBrains Mono (scores & data). Loaded via Google Fonts in `index.html`.
- **Signature touches:** `.metal-edge` adds a beveled hairline to glass panels; `NeuralBackground` is a canvas synapse field with pulsing crimson nodes; both honor `prefers-reduced-motion`.
- **Tokens** live in `tailwind.config.ts` and `src/index.css`.
- **Logo:** the supplied artwork is at `public/nuroai-logo.jpeg` (used in hero, login, loading). The shield is also re-drawn as crisp SVG in `src/components/brand/Logo.tsx` for the navbar / sidebar / favicon.

All content is mock data (`src/data/mock.ts`) — this is a front-end showcase, no backend.

## Note on testing

This project was authored in a sandbox **without network access**, so `npm install`, `tsc`, and `vite build` could not be run here. The code was written and cross-checked carefully (imports, exports, token names, icon names all verified), but you should expect to run `npm install` locally before it compiles. If your editor flags anything, it'll surface on first `npm run dev`.
