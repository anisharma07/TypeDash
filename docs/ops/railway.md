# Railway runbook

Companion to [06-infrastructure.md](../plan/06-infrastructure.md). Written for the
first setup (task M1-04) and for day-to-day operations. UI labels move around, so
use this as a checklist of *what* to configure, and check Railway's current docs
for *where*.

## 1. One-time setup

1. Create a Railway team and project `typedash`. Turn on 2FA.
2. Create two **environments**: `staging`, `production`. Enable **PR environments**
   so every pull request gets an isolated preview.
3. Add services to each environment:
   - `web`: deploy from the GitHub repo, builder = Dockerfile at the repo root.
   - `worker`: same repo and image, different start command.
   - `redis`: Railway Redis plugin (private network only).
4. Link GitHub and turn on **"wait for CI"**, so deploys only start after the GitHub
   checks pass.
5. MongoDB stays on **Atlas** (managed backups). Create separate Atlas projects and
   DB users for staging and production. Copy each connection string into the matching
   Railway environment as `MONGODB_URI`.

## 2. Service settings

| Setting | `web` | `worker` |
|---------|-------|----------|
| Start command | `node apps/server/dist/index.js` | `node apps/server/dist/worker.js` |
| Pre-deploy command | `node apps/server/dist/migrate.js` | none |
| Healthcheck path | `/api/ready` (timeout 30 s) | none |
| Public domain | yes (custom domain on production) | **no** |
| Restart policy | on failure (max retries 10) | on failure |
| Replicas | 1 (see scaling stages in 06§8 before raising) | 1 |
| Draining / shutdown window | ~150 s so in-flight races finish on deploy | 60 s |
| Resource limits | start at 1 vCPU / 1 GB, raise based on the load test (M2-15) | 0.5 vCPU / 512 MB |

## 3. Variables

Set per environment. Use Railway's **shared variables** for values common to both
services, and **reference variables** for the Redis URL. The full list and meaning is
in 06§2.2. Rules:

- Never commit real values. `.env.example` has placeholders only.
- Production and staging use **different** secrets, API keys, OAuth apps, Stripe keys
  (live vs test), and Anthropic workspaces.
- PR environments inherit staging's non-secret config but use a throwaway DB name
  (`typedash_pr_<n>`) and Stripe **test** keys. AI is off by default.

## 4. Domains and DNS

1. Add the custom domain to the production `web` service. Railway shows the DNS
   record to create.
2. In Cloudflare, create the record. If you proxy through Cloudflare, confirm
   WebSockets work (they do, but check the idle-timeout behavior) and that Railway's
   certificate issuance succeeds. DNS-only is the simplest start.
3. Staging gets its own subdomain (`staging.<domain>`).
4. Set `APP_URL` to the final HTTPS origin in each environment. OAuth redirect URIs,
   Stripe URLs and email links all derive from it.

## 5. Deploy, promote, roll back

- **Normal flow:** merge to `main` → CI passes → staging deploys → verify → promote
  to production (manual, or tag a `release/*`).
- **Roll back:** open the service's deployments list and redeploy the previous
  successful deployment. Database migrations must be backward compatible for one
  release so this is always safe (CLAUDE.md rule 9).
- **Deploying during an active race:** avoid peak hours. The server snapshots lobbies
  and clients reconnect automatically (06§2, M3-20). After the deploy, check the
  reconnect rate in PostHog (`socket_reconnected`).

## 6. Monitoring checklist

- Railway metrics (CPU, memory, restarts) for `web` and `worker`.
- Sentry alert on any new production issue. Uptime monitor on `/api/health`.
- Game health log line every 60 s (06§4). Alert if tick lag p95 > 100 ms.
- Memory trend: a steadily rising line over days means a leak (rooms or timers not
  cleaned up). The M2-15 load test is the guard.

## 7. When it goes wrong

| Symptom | First checks |
|---------|--------------|
| Deploy fails at pre-deploy | Migration error: read the logs, fix forward or roll back. Never skip migrations |
| Healthcheck failing | `/api/ready` reports which dependency (Mongo / Redis) is down. Check Atlas network access and `MONGODB_URI` |
| Sockets disconnecting every ~60 s | A proxy idle timeout. Check Cloudflare/Railway settings and the Socket.IO ping interval |
| Memory climbing | Rooms not closing, intervals not cleared, or large per-room buffers. Dump the room count metric against memory |
| Bill spike | Egress, an AI loop, or a Redis memory plan. Check `AiUsage` and the Railway usage page first |
| Need to freeze AI spend now | Set `AI_ENABLED=false` and redeploy (or flip the PostHog kill switch) |
