# 06 — Infrastructure, delivery & quality

## 1. Environments

| Env | Where | Data | Stripe | AI | Deploys from |
|-----|-------|------|--------|----|--------------|
| **Local** | `pnpm dev` + `docker compose up` (Mongo 7, Redis 7) | Local, seeded (`pnpm seed`) | Test keys + `stripe listen` | Real key with a low budget, or `AI_ENABLED=false` | — |
| **PR preview** | Railway PR environment (auto per PR) | Staging Atlas cluster, DB `typedash_pr_<n>` (dropped on close) | Test | Disabled by default | PR branch |
| **Staging** | Railway `staging` environment | Atlas staging cluster | Test | Enabled, low budget | `main` (after CI passes) |
| **Production** | Railway `production` environment | Atlas production cluster (dedicated tier before M5) | **Live** | Enabled, budget cap | Manual promote / `release` tag |

## 2. Railway setup

**Project `typedash`, services:**

| Service | Source | Start command | Notes |
|---------|--------|---------------|-------|
| `web` | Repo root `Dockerfile` | `node apps/server/dist/index.js` | Public domain. Healthcheck `/api/ready`. Serves API, Socket.IO, and the SPA |
| `worker` | Same image | `node apps/server/dist/worker.js` | No public domain. BullMQ processors + repeatable jobs |
| `redis` | Railway Redis | — | Private networking only |
| MongoDB | **Atlas** (external) | — | Atlas over Railway's Mongo because of managed backups, point-in-time restore, and metrics |

- **Config as code:** keep build and deploy settings in the repo (Railway config
  file per service, or service settings documented in `docs/ops/railway.md`):
  Dockerfile builder, healthcheck path and timeout, restart policy (on failure),
  and the pre-deploy command `node apps/server/dist/migrate.js` (DB migrations).
- **Region:** the same region for Railway and Atlas, nearest to most players (check
  PostHog geo after beta; start with US-East or EU-West). Add a second region only
  with the Stage 2 scaling work (§8).
- **Domain:** custom domain on `web` (e.g. `typedash.app`), DNS on Cloudflare.
  WebSockets work through Cloudflare's proxy. Raise the proxy timeouts if you
  enable it.
- **Private networking:** `web` and `worker` reach Redis over Railway's internal
  network. Never expose Redis publicly.
- **Graceful deploys:**
  1. On `SIGTERM`, `web` stops creating new rooms and races and emits
     `server:restarting`. It lets in-progress races finish (use Railway's
     deployment draining window, set to about 150 s) and snapshots LOBBY rooms to
     Redis (`roomsnap:{code}`, TTL 5 min).
  2. Clients auto-reconnect (Socket.IO backoff) and re-join by room code. The new
     instance restores snapshotted lobbies on demand.
  3. Avoid deploying production during peak hours, using the PostHog
     concurrency chart.

### 2.1 Dockerfile (multi-stage)
```
FROM node:24-alpine AS base     # enable corepack → pnpm
FROM base AS deps               # pnpm fetch + install --frozen-lockfile (cached by lockfile)
FROM deps AS build              # pnpm -r build (shared → web → server); prune dev deps
FROM node:24-alpine AS runtime  # copy dist + prod node_modules; USER node; NODE_ENV=production
```
Image under 250 MB. No source maps in the image (uploaded to Sentry in CI instead).

### 2.2 Configuration (`apps/server/src/config.ts`, zod-validated, fails fast)

| Var | Example / notes |
|-----|-----------------|
| `NODE_ENV`, `PORT` | Railway provides `PORT` |
| `APP_URL` | `https://typedash.app` (used for redirects and OG URLs) |
| `MONGODB_URI` | Atlas SRV string, one DB user per environment, least privilege |
| `REDIS_URL` | Railway Redis private URL |
| `SESSION_SECRET` / `BETTER_AUTH_SECRET` | 32+ random bytes |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | OAuth apps per env |
| `RESEND_API_KEY`, `EMAIL_FROM` | Magic links, receipts, digests |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` | Test vs live per env |
| `ANTHROPIC_API_KEY` | Separate key per env (spend tracking) |
| `AI_ENABLED`, `AI_MODEL_COACH`, `AI_MODEL_TEXTGEN`, `AI_MODEL_MODERATION`, `AI_MONTHLY_BUDGET_USD` | Defaults: `true`, `claude-opus-5-5` ×3, `200` |
| `SENTRY_DSN`, `POSTHOG_KEY`, `POSTHOG_HOST` | Observability |
| `ENCRYPTION_KEY` | For encrypted fields (prize contacts), 32-byte base64 |
| `ADMIN_EMAILS` | Bootstrap admin accounts |

Secrets live only in Railway variables (and GitHub Actions secrets for CI
uploads). `.env.example` lists every var with no real values. Config **never
logs values**, only which vars are present.

## 3. CI/CD (GitHub Actions)

`.github/workflows/ci.yml`, on every PR and on push to `main`:

| Job | Steps | Blocking |
|-----|-------|----------|
| `setup` | Checkout, pnpm via corepack, cache store, `pnpm install --frozen-lockfile` | — |
| `static` | `pnpm typecheck` · `pnpm lint` (ESLint incl. custom rules: no `io.emit`, no `dangerouslySetInnerHTML`, no `innerHTML`) · `pnpm format:check` | ✅ |
| `unit` | `pnpm test --filter shared --filter server -- --coverage` (Vitest). Coverage gates: `packages/shared/engine` ≥ 95%, `server/rooms`, `race`, `progression`, `billing` ≥ 90% | ✅ |
| `integration` | Service containers `mongo:7`, `redis:7`. Socket.IO + REST integration tests (supertest, socket.io-client), Stripe webhook fixtures | ✅ |
| `build` | `pnpm build` and Docker build (no push) | ✅ |
| `e2e` | Start the built app with services and run Playwright (Chromium + WebKit mobile viewport): solo test, 4-player private room, quick match with bots, reconnect, (M5) checkout via Stripe test mode on staging only | ✅ for PRs touching web/server |
| `lighthouse` | Lighthouse CI on `/`, `/practice`, `/r/:code` (perf ≥ 90, a11y ≥ 95) | ✅ (M1 onward) |
| `security` | `pnpm audit --prod` (high+), CodeQL (weekly + PR), Dependabot, GitHub secret scanning | ⚠️ advisory → ✅ from M5 |

**Deploy flow:**
- PR → Railway PR environment (auto). The URL is posted on the PR.
- Merge to `main` → Railway deploys **staging** after GitHub checks pass (enable
  "wait for CI"). Sentry release + source maps are uploaded from CI.
- Production: promote the staging deployment manually in Railway, or push a
  `release/*` tag. Keep a changelog (`CHANGELOG.md`, generated from PR titles).
- **Rollback:** redeploy the previous Railway deployment (one click). DB migrations
  must be backward compatible for one release (expand → migrate → contract).

## 4. Observability

| Signal | Tool | Alerts |
|--------|------|--------|
| Errors (web + server) | Sentry with releases + source maps | New issue in prod; error-rate spike |
| Traces | Sentry performance (sample 10%) | p95 `/api/*` > 500 ms |
| Logs | pino JSON → Railway logs (optionally drained to Axiom/Better Stack). Every log line carries `reqId` / `roomCode` / `raceId` / `userId` | — |
| Game health | Every 60 s, log + PostHog: active sockets, rooms by state, races/min, `race:tick` loop lag p95, replay rejects/min | Tick lag p95 > 100 ms; reject spike |
| Uptime | External monitor on `/api/health` and a synthetic "join room" check every 5 min | Down for 2 min |
| Product analytics | PostHog (funnels, retention, feature flags, session replay with **typing area masked**) | — |
| AI spend | `AiUsage` dashboard in `/admin` | 80% of monthly budget |
| Payments | Stripe Dashboard + webhook failure emails | Any webhook failure in prod |

## 5. Security checklist

- [ ] zod validation on every socket event and REST body. Unknown keys rejected.
- [ ] Rate limits: per IP (REST, Redis-backed), per socket (token bucket), per user (AI, room creation, chat, friend requests).
- [ ] Helmet with a strict **CSP** (self + Stripe + PostHog + Sentry + ad network on specific routes only), HSTS, `frame-ancestors 'none'` (except the projector embed route, M7).
- [ ] Cookies: httpOnly, Secure, SameSite=Lax. CSRF header + Origin check on mutations.
- [ ] Socket.IO: authenticate the handshake with the session cookie. `cors.origin = APP_URL` only. `maxHttpBufferSize = 64 KB`.
- [ ] No user content rendered as HTML anywhere (lint-enforced). Display names and chat are rendered as text.
- [ ] Admin accounts require 2FA (Better Auth two-factor plugin). Admin actions are written to `AuditLog`.
- [ ] Encrypted fields (AES-256-GCM with `ENCRYPTION_KEY`) for prize contacts and assessment candidate emails.
- [ ] Per-environment DB users with least privilege. Atlas network access restricted as far as the hosting plan allows (static egress IPs if available).
- [ ] Stripe webhook signature verification + idempotency. Entitlements granted only from webhooks.
- [ ] Dependency and secret scanning in CI. Renovate/Dependabot weekly.
- [ ] Backups: Atlas continuous backup on the production tier. **Run a restore drill** before M5 launch and quarterly after.
- [ ] Abuse: reCAPTCHA-free approach first (rate limits + behavioral checks). Add Cloudflare Turnstile on sign-up and room creation only if abuse appears.

## 6. Testing strategy

| Layer | Tooling | What | Target |
|-------|---------|------|--------|
| Unit | Vitest | Engine & metrics, replay, anti-cheat rules, room FSM (fake clock + seeded RNG), matchmaker, rating, XP/streaks (timezone edge cases), achievements, entitlements, webhook handlers | Coverage gates in §3 |
| Property tests | fast-check | Engine invariants (accuracy within 0–100, replay(log) = live state, metrics monotonic where expected) | In unit job |
| Integration | Vitest + supertest + socket.io-client + Mongo/Redis containers | Full room lifecycle over real sockets, REST auth flows, leaderboards, Stripe webhook → entitlement | Every PR |
| E2E | Playwright (multi-context) | Golden paths: first visit → practice → sign up; create room → 4 players race → results → rematch; quick match with bots; reconnect mid-race; daily challenge; checkout (staging) | Every PR touching app code |
| Load | Artillery (Socket.IO engine) | 2,000 concurrent racers in 200 rooms for 10 min on a production-sized instance | Before beta, before v1.0, then monthly |
| AI evals | Custom script (`pnpm eval:ai`) | See 04-ai.md §5 | Manual, per prompt version |
| Accessibility | axe-core in Playwright + Lighthouse | No serious or critical violations | Every PR touching web |

## 7. Local developer experience

- `pnpm i && docker compose up -d && pnpm seed && pnpm dev` gives a working app at
  `http://localhost:5173` (Vite proxies `/api` and `/socket.io` to `:3000`).
- `pnpm dev:multi` opens 4 browser contexts in one race (Playwright script) for
  quick manual multiplayer testing.
- `CLAUDE.md` documents all commands, conventions, and where specs live.

## 8. Scaling path

| Stage | Trigger | What changes |
|-------|---------|--------------|
| **1. Single web replica** (launch) | — | Vertical scaling on Railway. Load tests must show ≥ 2,000 concurrent racers with tick lag p95 < 50 ms |
| **2. Multiple game nodes** | Sustained CPU > 60% or > ~3,000 concurrent racers | Socket.IO `transports: ['websocket']` (no long-polling, so no sticky sessions needed for the handshake) + `@socket.io/redis-adapter` for cross-node user notifications + a **room directory** in Redis (`roomdir:{code} → nodeId`). Each room lives on exactly one node. **Room affinity** needs request routing to a specific node: move the `web` service to **Fly.io** and use the `fly-replay` header to send a room's sockets to its owning machine. API and worker can stay on Railway. Code changes are limited to `RoomManager` + the join handshake |
| **3. Multi-region** | Significant traffic from 2+ continents with RTT complaints | Fly.io machines per region. Rooms are created in the host's nearest region. Mongo Atlas global cluster or read replicas, depending on need |

Stay on Stage 1 as long as metrics allow. Most typing games never need Stage 3.
