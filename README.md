# Pulse

Real-time shipping tracker for [Crafter Station](https://github.com/crafter-station).

Tracks pushes to `main` across all org repos via GitHub webhooks.

## Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Neon (Serverless Postgres) + Drizzle ORM
- **Webhooks**: GitHub org webhooks → Next.js API route
- **Deployment**: Vercel

## Features

- **Real-time Activity Feed**: See commits as they happen
- **Stats Dashboard**: Commits today, active repos, team streak
- **Weekly Leaderboard**: Top contributors for the week
- **Auto-discovery**: Automatically tracks all crafter-station repos

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Set up Neon database

1. Create a Neon database at [neon.tech](https://neon.tech)
2. Copy the connection string

### 3. Environment variables

Create `.env.local`:

```env
DATABASE_URL=postgresql://user:password@host/database
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_TOKEN=your_github_token_here
```

Generate webhook secret:

```bash
openssl rand -hex 32
```

### 4. Push database schema

```bash
bun db:push
```

### 5. Backfill historical data (optional)

```bash
bun backfill
```

This fetches the last 30 days of commits from all crafter-station repos.

### 6. Run development server

```bash
bun dev
```

`bun dev` runs next through [portless](https://github.com/vercel-labs/portless),
so the app is always available at a stable URL — no port juggling when
other dev servers are running:

[https://pulse.localhost](https://pulse.localhost)

If the portless proxy is not running yet:

```bash
portless proxy start       # HTTPS on :443 (needs sudo on first run)
portless proxy start -p 1355  # or without sudo on a custom port
```

To run next directly (bypassing portless) use `bun dev:raw`.

## Deployment

### 1. Deploy to Vercel

```bash
vercel --prod
```

Add environment variables in Vercel dashboard:

- `DATABASE_URL`
- `GITHUB_WEBHOOK_SECRET`

### 2. Configure GitHub webhook

1. Go to https://github.com/organizations/crafter-station/settings/hooks
2. Add webhook:
   - **Payload URL**: `https://pulse.crafterstation.com/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: Same as `GITHUB_WEBHOOK_SECRET`
   - **Events**: Just `push` events
   - **Active**: ✓

### 3. Test

Push a commit to any crafter-station repo and verify it appears in the activity feed.

## API Routes

- `GET /api/activity` - Recent commits (last 50)
- `GET /api/stats` - Dashboard stats (commits today, active repos, streak)
- `GET /api/leaderboard` - Weekly top contributors (last 7 days)
- `POST /api/webhooks/github` - GitHub webhook handler

## Database Scripts

```bash
bun db:generate  # Generate migrations
bun db:push      # Apply schema to database
bun db:studio    # Open Drizzle Studio
bun backfill     # Seed with historical data
```

- [pulse.crafterstation.com](https://pulse.crafterstation.com)
- [org.crafter.run](https://org.crafter.run)
- [GitHub Org](https://github.com/crafter-station)
