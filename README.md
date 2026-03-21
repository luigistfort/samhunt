# SAMHunt 🏛️

**A production-ready SAM.gov contract opportunity search tool built for small businesses.**

SAMHunt provides a dramatically simpler interface to SAM.gov's contract opportunities database — with AI-powered smart search, set-aside filtering, fit scoring, saved searches, and a full user profile system.

---

## ✨ Features

- **🔍 Smart Search** — Type naturally: *"IT support in Indiana under $500k for small business"* and the app converts it to structured SAM.gov API filters using GPT-4o-mini
- **🎛️ Advanced Filters** — NAICS code, set-aside type, notice type, posted date, deadline, state, ZIP, solicitation number
- **⚡ Quick Filters** — New this week, closing soon, small business set-aside, sources sought
- **🤖 AI Assistant** — "Explain this opportunity" and "Is this a good fit for me?" with fit scores, key requirements, risks, and next steps
- **⭐ Save & Track** — Favorite opportunities, save searches, track deadlines
- **👤 Business Profile** — NAICS codes, certifications (8(a), HUBZone, SDVOSB, WOSB, etc.), preferred states, target agencies
- **🚦 Urgency Indicators** — Visual deadline urgency (critical / urgent / normal / closed)
- **📄 Pagination & Sorting** — Sort by newest posted, soonest deadline, or relevance
- **🔐 Auth** — Google, GitHub, or magic link email sign-in via NextAuth v5
- **💾 Caching** — Redis (or in-memory fallback) for search results and AI responses
- **🔒 Security** — API key never exposed to browser; server-side only

---

## 🏗️ Architecture

```
samhunt/
├── src/
│   ├── app/                        # Next.js App Router pages & API routes
│   │   ├── page.tsx                # Landing page
│   │   ├── search/page.tsx         # Main search experience
│   │   ├── dashboard/page.tsx      # User dashboard
│   │   ├── favorites/page.tsx      # Saved opportunities
│   │   ├── profile/page.tsx        # Business profile editor
│   │   ├── login/page.tsx          # Auth page
│   │   ├── opportunities/[noticeId]/page.tsx   # Opportunity detail
│   │   └── api/
│   │       ├── auth/[...nextauth]/ # NextAuth handler
│   │       ├── opportunities/
│   │       │   ├── search/         # POST /api/opportunities/search
│   │       │   └── [noticeId]/     # GET  /api/opportunities/:id
│   │       ├── search/smart/       # POST /api/search/smart (AI parse)
│   │       ├── ai/analyze/         # POST /api/ai/analyze
│   │       ├── favorites/          # GET/POST/DELETE
│   │       ├── saved-searches/     # GET/POST/DELETE
│   │       └── profile/            # GET/PUT
│   │
│   ├── components/
│   │   ├── layout/app-shell.tsx    # Sidebar navigation shell
│   │   ├── search/
│   │   │   ├── smart-search-bar.tsx  # AI search bar with suggestions
│   │   │   ├── filter-panel.tsx      # Left sidebar filter panel
│   │   │   └── search-results.tsx    # Results list with pagination
│   │   ├── opportunities/
│   │   │   └── opportunity-card.tsx  # Individual result card
│   │   ├── ai/
│   │   │   └── ai-assistant.tsx      # AI explain/fit panel
│   │   └── ui/
│   │       ├── skeleton.tsx          # Loading skeletons
│   │       └── toaster.tsx           # Toast notifications
│   │
│   ├── lib/
│   │   ├── sam/
│   │   │   ├── client.ts         # SAM.gov API client (server-only)
│   │   │   ├── normalize.ts      # SearchParams → SAM query params
│   │   │   ├── enrich.ts         # Add computed fields to results
│   │   │   └── smart-search.ts   # NL → structured filters via OpenAI
│   │   ├── ai/
│   │   │   └── summarize.ts      # Opportunity explanation & fit analysis
│   │   ├── cache/index.ts        # Redis + in-memory two-tier cache
│   │   ├── db/index.ts           # Prisma client singleton
│   │   ├── auth/index.ts         # NextAuth v5 config
│   │   ├── store.ts              # Zustand global state
│   │   ├── constants.ts          # NAICS, states, agencies, labels
│   │   └── utils.ts              # Date formatting, cn(), etc.
│   │
│   ├── types/index.ts            # All TypeScript interfaces
│   └── middleware.ts             # Auth route protection
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                  # Demo data seeder
│
├── .env.example                  # Environment variable template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourorg/samhunt.git
cd samhunt
npm install
```

### 2. Get your SAM.gov API key

1. Go to [sam.gov](https://sam.gov)
2. Create or log in to your account
3. Click your name → **Edit Profile** → scroll to **API Key** → **Generate Key**
4. Copy the key — it's shown only once

> **Important:** SAM.gov public API keys have a rate limit of **~500 requests/day**. SAMHunt caches aggressively to stay well under this limit.

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in at minimum:

```env
SAM_GOV_API_KEY=your_key_here
DATABASE_URL=postgresql://postgres:password@localhost:5432/samhunt
AUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
```

Optional but recommended:
- `OPENAI_API_KEY` — enables AI smart search and fit analysis
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth login
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — GitHub OAuth login
- `REDIS_URL` — production caching (falls back to in-memory without it)

### 4. Set up the database

```bash
# Start a local PostgreSQL database (or use Supabase/Neon/Railway)
# Then:
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # (Optional) seed demo data
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database

SAMHunt uses **PostgreSQL** with **Prisma ORM**.

### Schema Overview

| Table | Purpose |
|-------|---------|
| `User` | Auth users (NextAuth) |
| `Account` | OAuth provider accounts |
| `Session` | Auth sessions |
| `BusinessProfile` | NAICS codes, certs, preferences per user |
| `SavedSearch` | Named saved search queries |
| `FavoriteOpportunity` | Starred opportunities with notes & AI summaries |
| `SearchHistory` | Per-user search log |
| `SearchCache` | DB-level cache for popular searches |

### Migrations

```bash
# Create a new migration after schema changes
npm run db:migrate -- --name describe_your_change

# View and edit data
npm run db:studio
```

---

## 🔌 SAM.gov API Integration

The SAM.gov API client lives entirely in `src/lib/sam/` and is **never imported by any client component**.

### Key endpoints used

```
GET https://api.sam.gov/opportunities/v2/search
```

### Filter mapping (`src/lib/sam/normalize.ts`)

Our internal `SearchParams` type maps to SAM.gov query parameters:

| Our Field | SAM.gov Param | Notes |
|-----------|--------------|-------|
| `keyword` | `q` | Full-text search |
| `noticeType[]` | `ptype` | Comma-separated codes (o, p, k, r, a...) |
| `naicsCodes[]` | `naics` | Comma-separated |
| `setAsideTypes[]` | `typeOfSetAside` | SBA, 8A, 8AN, HZC, SDVOSBC... |
| `state` | `state` | 2-letter code |
| `zip` | `zip` | 5-digit ZIP |
| `postedFrom` | `postedFrom` | MM/DD/YYYY format |
| `responseDeadLineTo` | `rdlto` | MM/DD/YYYY format |
| `solicitationNumber` | `solnum` | Exact match |

### Rate Limiting

SAMHunt enforces a client-side counter with a daily limit of 450 requests (safely under SAM.gov's ~500/day limit). All search results are cached for 5 minutes; individual opportunities for 30 minutes; AI summaries for 24 hours.

---

## 🤖 AI Features

AI features require `OPENAI_API_KEY`. If not set, the app works fully without AI (smart search falls back to rule-based parsing; AI assistant buttons are hidden).

### Smart Search

```
User: "cybersecurity consulting for SDVOSB in Virginia, closing soon"
         ↓ GPT-4o-mini
Params: { keyword: "cybersecurity consulting", setAsideTypes: ["sdvosb"],
          state: "VA", closingSoon: true }
```

### AI Explain

Reads the opportunity text and returns:
- Plain-English summary (2-3 sentences)
- Key requirements (3-6 bullets)
- Risks (2-4 bullets)
- Estimated value (if discernible)
- Recommended next steps (3-4 bullets)

### AI Fit Analysis

Compares the opportunity against the user's business profile and returns:
- Fit score (0–100)
- Fit reasons
- Profile-specific risks
- Next steps tailored to their certifications and NAICS

---

## 🚢 Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial SAMHunt deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Framework: **Next.js** (auto-detected)

### 3. Set Environment Variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**, add all variables from `.env.example`:

```
SAM_GOV_API_KEY          → your SAM.gov API key (Production only)
DATABASE_URL             → your production PostgreSQL URL
AUTH_SECRET              → generated secret (openssl rand -base64 32)
NEXTAUTH_URL             → https://your-domain.vercel.app
GOOGLE_CLIENT_ID         → from Google Cloud Console
GOOGLE_CLIENT_SECRET     → from Google Cloud Console
OPENAI_API_KEY           → from OpenAI platform
REDIS_URL                → from Upstash (recommended for production)
```

### 4. Recommended Production Services

| Service | Provider | Notes |
|---------|---------|-------|
| PostgreSQL | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Free tiers available |
| Redis | [Upstash](https://upstash.com) | Serverless Redis, free tier |
| Email | [Resend](https://resend.com) | For magic link auth |
| Monitoring | [Sentry](https://sentry.io) | Add `SENTRY_DSN` |

### 5. After Deploy

```bash
# Run database migrations
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

### 6. Update OAuth Redirect URIs

For Google: Add `https://your-domain.vercel.app/api/auth/callback/google`
For GitHub: Add `https://your-domain.vercel.app/api/auth/callback/github`

---

## 🔧 Extending the App

### Adding a new filter

1. Add the field to `SearchParams` in `src/types/index.ts`
2. Map it to a SAM.gov query param in `src/lib/sam/normalize.ts`
3. Add the UI control in `src/components/search/filter-panel.tsx`
4. Update the Zod schema in `src/app/api/opportunities/search/route.ts`

### Adding attachment parsing

The `opportunity.resourceLinks` field contains attachment URLs. To parse them:

1. Add an `/api/opportunities/[noticeId]/attachments` route
2. Fetch attachment URLs from SAM.gov
3. Download and parse PDFs using `pdf-parse` or send to OpenAI with document input
4. Cache parsed content in `FavoriteOpportunity.aiSummary` or a new `Attachment` table

### Adding email notifications for saved searches

1. Create a `/api/cron/notify-searches` route
2. Configure Vercel Cron to call it daily
3. For each `SavedSearch` with `notifyEmail: true`, run the search and email new results via Resend

---

## 🛡️ Security Notes

- **`SAM_GOV_API_KEY` is server-side only** — never imported in `'use client'` components
- **`OPENAI_API_KEY` is server-side only** — same
- API routes validate all inputs with Zod before processing
- Auth-protected API routes check `auth()` before any database access
- SQL injection: impossible via Prisma's parameterized queries
- XSS: Next.js escapes JSX by default; the one `dangerouslySetInnerHTML` in the detail page is limited to SAM.gov's own description field
- CSRF: mitigated by NextAuth's built-in CSRF protection on auth routes
- Rate limiting: client-side counter + recommended to add [Upstash Rate Limit](https://upstash.com/docs/redis/sdks/ratelimit/overview) in production

---

## 📝 License

MIT — use freely for your own business or clients.

---

## 🙏 Credits

- [SAM.gov Opportunities API](https://open.gsa.gov/api/opportunities-api/) by GSA
- [Next.js](https://nextjs.org) · [Prisma](https://prisma.io) · [NextAuth.js](https://authjs.dev)
- [Tailwind CSS](https://tailwindcss.com) · [Lucide Icons](https://lucide.dev)
- [OpenAI](https://openai.com) for AI features
