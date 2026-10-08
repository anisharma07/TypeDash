# 12 — Agent playbook

How to run this plan with AI coding agents without losing quality or control.
Everything here is a template: copy it into the repo during M1-01 and adjust it
as the project teaches you things.

## 1. `CLAUDE.md` draft (create in M1-01, repo root)

Keep it short. Agents read it on every task, so every line must earn its place.
Commands below are the targets M1-01 must make real.

````markdown
# TypeDash

Multiplayer typing platform. Plan and specs: `docs/plan/` (start at README.md).
Work is organised as tasks in `docs/plan/07-backlog.md`. One task = one PR.

## Commands
- `pnpm i` · `docker compose up -d` · `pnpm seed` · `pnpm dev`   (web :5173, server :3000)
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:int` · `pnpm e2e`
- `pnpm build` · `pnpm eval:ai` (costs money — only when asked)
- `pnpm stripe:sync` (test mode unless `STRIPE_ENV=live` and confirmed by a human)

## Layout
- `apps/web` React SPA · `apps/server` API + Socket.IO + worker · `packages/shared` engine + zod contracts
- `legacy/` old app: read-only reference. Never import from it.

## Non-negotiable rules
1. Validate every socket event and REST body with a zod schema from `packages/shared`.
2. The server owns race text, timing and scores. Never store a client-reported WPM.
3. Emit only room-scoped (`io.to(room)`). Never `io.emit`. (Lint enforces it.)
4. Never render user content as HTML: no `innerHTML`, no `dangerouslySetInnerHTML`.
5. Gate features with `can(entitlements, feature)`, never `plan === 'pro'`.
6. Only verified Stripe webhooks grant access. Never the success redirect.
7. AI calls only through `apps/server/src/ai`. Never from the race path. Always keep a non-AI fallback.
8. Secrets come from validated env config. Never log secrets, tokens, emails or typed text.
9. DB migrations are backward compatible for one release (expand → migrate → contract).
10. Time and randomness are injected (clock, rng) in `rooms/`, `race/`, `progression/` so tests are deterministic.

## Definition of done
Typecheck, lint, unit + integration tests pass. New logic has tests that fail without it.
Docs updated if a contract or behaviour changed. PR body has "How to verify manually".
No skipped tests. No new TODO without a backlog ID.

## When unsure
Read the spec section linked from the task. If the spec is ambiguous or wrong, say so in the
PR description and propose the fix to the spec in the same PR. Do not silently improvise.
````

## 2. Working a task

### 2.1 Task prompt template

```
Implement backlog task {ID} from docs/plan/07-backlog.md.

Read first: CLAUDE.md, the {ID} row (task, deps, acceptance criteria), and these
spec sections: {spec refs from the row}.

Scope: only what the task row asks for. If you find adjacent problems, list them in
the PR description instead of fixing them.

Deliver:
1. Implementation on branch `{ID}-short-slug`.
2. Tests that prove every acceptance criterion in the row. Name each test after the
   criterion it proves.
3. Run `pnpm typecheck && pnpm lint && pnpm test` (and `pnpm test:int` / `pnpm e2e`
   if you touched sockets, DB, or UI flows). Paste the results.
4. PR description using .github/pull_request_template.md.

Stop and ask if: a dependency isn't merged, the acceptance criteria conflict with the
spec, or the task needs a new third-party service or secret.
```

### 2.2 Pull request template (`.github/pull_request_template.md`, M1-01)

```markdown
## Task
Backlog ID: <!-- e.g. M2-05 -->  ·  Spec: <!-- e.g. 02§2.4 -->

## What changed
<!-- 3–6 bullets. What and why, not a file list. -->

## Acceptance criteria
<!-- Copy the criteria from the backlog row. Tick each, naming the test that proves it. -->
- [ ] criterion — `test name`

## How to verify manually
<!-- Steps a reviewer can follow in under 5 minutes. Include seed/setup commands. -->

## Risk & rollout
<!-- Data migrations? New env vars? Feature flag? Anything to do after deploy? -->

## Checklist
- [ ] typecheck, lint, tests pass locally
- [ ] No new `any`/`@ts-ignore` at contract boundaries
- [ ] No secrets, tokens, or personal data in logs or fixtures
- [ ] Docs/spec updated if behaviour or contracts changed
- [ ] Out-of-scope findings listed below, not fixed here
```

### 2.3 Review checklist by area (the human review hotspots)

| Area | Check before merging |
|------|----------------------|
| **Auth & sessions** | Cookies httpOnly/Secure/SameSite. Guest → account merge keeps data and can't be used to take over another account. Rate limits on sign-in. Every protected route has a negative test (no session → 401) |
| **Payments** | Webhook signature verified, handler idempotent (duplicate delivery test), subscription re-fetched, entitlements change only from webhooks. Test-clock scenario included. No live keys in code or CI |
| **Anti-cheat / scoring** | Each rejection rule has a test with a forged input. Metrics computed server-side only. No new path stores a client-reported number |
| **AI** | Structured output validated by zod. Quota + budget + kill switch present. Fallback tested by forcing a failure. Prompt version recorded. No personal data in the prompt (grep the template) |
| **Realtime** | Every emit room-scoped. Payloads validated. Rate limited. Disconnect/reconnect during the new flow tested. No timer left running after the room closes |
| **Data & migrations** | Backward compatible. Idempotent. Dry-run mode. Indexes match 03§1. Deletion/anonymization paths updated for any new user-linked field |
| **Privacy** | New data fields appear in the retention table (10§3) and the export. Analytics events exist in the catalog (10§1) and contain no free text |

### 2.4 Red flags in agent output

Reject or send back a PR that shows any of these:
- Tests that assert nothing, assert only mocks, or pass when the feature is deleted
  (spot-check by temporarily breaking the code).
- `.skip`, `.only`, a loosened lint rule, a weakened `tsconfig`, or a widened
  coverage exclusion.
- `any`, `as unknown as`, or `// @ts-ignore` at a contract boundary.
- Swallowed errors (`catch {}`), `console.log` of request bodies, or secrets in
  fixtures.
- A new dependency without a reason in the PR, especially for something the stack
  already does.
- Legacy habits creeping in: `innerHTML`, global `io.emit`, trusting client numbers,
  module-level mutable state for rooms outside `RoomManager`.
- Non-idempotent jobs or migrations.
- Edits outside the task's scope.

## 3. Parallel lanes

A **lane** is a stream of work that doesn't need to wait for another. The dependency
column in the backlog is the authority. This section only suggests splits that keep
merge conflicts low. Assign by **code ownership**, so two agents rarely touch the same
files.

### 3.1 Merge-conflict hotspots (serialize these)

| File / area | Rule |
|-------------|------|
| `packages/shared/src/contracts/*` | Land contract changes as **small separate PRs first**, then the feature PRs that use them |
| `pnpm-lock.yaml` | Rebase onto `main` and re-run `pnpm i` before merging. Never hand-edit |
| Router, socket handler index, model barrel files | Use auto-registration (one file per route / handler / model, discovered by glob) so tasks add files instead of editing a shared list. M1-03 and M1-08 set this up |
| `docs/plan/07-backlog.md` | Only change task status/sizes in a dedicated PR per milestone, not in feature PRs |

### 3.2 Suggested two-lane split per milestone

| Milestone | Lane A (server / data) | Lane B (web / product) |
|-----------|-----------------------|------------------------|
| **M0** | M0-08 → M0-03 → M0-05 → M0-06 | M0-01 → M0-02 → M0-04 → M0-07 |
| **M1** | M1-01 → M1-02 → M1-03 → M1-14 → M1-16 → M1-04 → M1-07 → M1-12 | M1-05 → M1-06 → M1-08 → M1-09 → M1-13 → M1-10 → M1-11 → M1-15 → M1-17 |
| **M2** | M2-01 → M2-02 → M2-03 → M2-05 → M2-06 → M2-09 → M2-10 → M2-11 | M2-04 → M2-07 → M2-08 → M2-12 → M2-13 → M2-14 → M2-15 |
| **M3** | M3-01 → M3-02 → M3-03 → M3-04 → M3-05 → M3-06 → M3-19 → M3-16 | M3-07 → M3-08 → M3-09 → M3-17 → M3-10 → M3-11 → M3-12 → M3-13 → M3-18 → M3-20 → (M3-14, M3-15 together) |
| **M4 ∥ M5** | M4 (AI): M4-01 → M4-02 → M4-03 → M4-04 → M4-05 → … | M5 (billing): M5-01 → M5-02 → M5-03 → M5-04 → M5-05 → … |
| **M6, M7** | Server-heavy: M6-01, M6-02, M6-05, M6-06, M6-08, M7-01 | UI-heavy: M6-03, M6-04, M6-07, M7-02, M7-03, M7-04 |

Why M4 and M5 can overlap: billing (M5) depends on auth and entitlements, not on the
AI features. The `ai.*` entitlement checks in M4 use a stub until M5-01 lands (M4-06
says so). This overlap is already reflected in the schedule.

### 3.3 Three or more lanes
The dependency graph gives diminishing returns past two or three lanes (README). A
third lane is best spent on **non-feature work**: test coverage, the load-test
harness, docs, the owner checklist (11), and G-tasks, not more features.

## 4. Re-planning the schedule

The schedule is a calculation, not a promise. Re-run it whenever sizes change or a
milestone closes.

```bash
python3 docs/plan/tools/schedule.py --lanes 1,2,3 --buffer 0.25
```

It reads `07-backlog.md`, checks the dependency graph (unknown deps and cycles fail
loudly), and prints finish weeks per milestone for each lane count.

**After every milestone:**
1. Record actuals in `docs/plan/actuals.csv` (`task,estimated_days,actual_days`).
2. Compute the **velocity factor** = Σ actual ÷ Σ estimated for the milestone.
   Multiply the remaining estimates by it (or just raise the `--buffer`).
3. Split any task that took more than 3 days. Re-size the rest of the backlog with
   what you learned.
4. Re-run the script, update the table in README, and tell stakeholders the new dates.

**Scope-cut order if you fall behind** (cut from the end, never from quality gates):
M7 → M6 → G-05 (i18n), G-04 (PWA) → M4-08/M4-09 (code mode, nightly pools) →
M4-10/M6-09/M6-10 (personas, packs, ask-your-stats). **Never cut:** M0, anti-cheat
(M2-06), webhook idempotency (M5-04), the restore drill (M5-12), privacy/deletion
(M3-13).

## 5. Milestone exit ritual

Do this before declaring any milestone done and starting the next:

1. All tasks merged. Every acceptance criterion has a test. CI green on `main`.
2. Deployed to staging. A 30-minute **bug bash** by someone who didn't write the
   code (use the real-device matrix from 09§6 from M2 onward).
3. The milestone's exit criteria in README verified, with evidence (screenshots,
   test runs, load-test report).
4. Sentry clean for 48 hours on staging, with no unresolved new issues.
5. Spec docs updated where reality diverged. Backlog statuses updated.
6. Retro (15 minutes): what was slower than sized, what surprised us, what to
   change in the next milestone. Feed it into the velocity factor (§4).
7. Cut a tag and a changelog entry.
