# Roadmap

KeyPool's path from a single-process TS monorepo MVP to a production-grade AI key pool.

## Status legend
- ✅ Done
- 🚧 In progress
- ⏳ Planned
- ❌ Cancelled / out of scope

---

## v0.1 — MVP scaffold (current)
**Goal**: a runnable TypeScript monorepo with the scheduler core wired up.

- ✅ Workspaces (`apps/*`, `packages/*`)
- ✅ Fastify 5 + Pino + Zod + Vitest + tsx toolchain
- ✅ YAML config loader with `${ENV}` expansion
- ✅ Round-robin scheduling strategy
- ✅ Weighted round-robin scheduling strategy
- ✅ Health check route (`/health`)
- ✅ Structured logging with secret redaction
- ✅ Provider registry
- ✅ Scheduler orchestrator (key selection)
- ✅ In-memory key state store
- ✅ Pool→Provider→Key dispatch
- ✅ OpenAI-compatible adapter
- ✅ `POST /v1/chat/completions`
- ✅ Retry orchestration for retryable provider errors
- ✅ RetryPolicy abstraction
- ✅ ProviderRequestExecutor abstraction
- ✅ In-memory per-key RPM quota manager
- ✅ Token-protected admin console (`/admin`)
- ✅ Admin API auth via bearer token
- ✅ Runtime in-memory key add/update from admin console
- ✅ Key enable/disable/delete controls
- ✅ Admin health and chat tests

---

## v0.2 — Real LLM traffic
- ✅ OpenAI-compatible HTTP adapter (`apps/api/src/providers/openai/openai.adapter.ts`)
- ✅ `POST /v1/chat/completions` route (OpenAI-compatible pass-through)
- ✅ Basic error classification (RateLimit / Auth / Server / Client / Network)
- ✅ Weighted round-robin strategy
- ✅ Retry with another eligible key for retryable provider errors
- ✅ Per-key RPM rate limiting (in-memory fixed window)
- ⏳ Per-key TPM rate limiting
- ✅ In-memory key state store

## v0.2.5 — Fake pool & observability
- ✅ `FakeOpenAIAdapter` (no network, OpenAI-shaped responses with `servedBy` / `keyId` markers)
- ✅ Failure DSL: `sequence` / `periodic` / `burst` / `probability`
- ✅ YAML string spec parser for failure scripts
- ✅ Static `config/keypool.fake.yaml` covering 6 strategies (RR, WRR, periodic 429, burst, chaos, RPM)
- ✅ `KEYPOOL_FAKE_PROVIDER=1` env switch
- ✅ `UsageRecorder` interface + `InMemoryUsageRecorder` (capacity 64 / key)
- ✅ `ProviderRequestExecutor.onAttemptSuccess` hook with latency
- ✅ Admin `GET /admin/api/state` exposes per-key usage summary
- ✅ Admin `GET /admin/api/keys/:id/usage?limit=N` returns per-key timeline

## v0.2.6 — Demo Runner
- ✅ `POST /_demo/chat` endpoint with admin auth
- ✅ Three modes: single / multi-turn / load
- ✅ Per-call attempt chain via `ProviderRequestExecutor.attemptSink`
- ✅ Sticky session simulation via caller-supplied `excludedKeyIds`
- ✅ Summary metrics: success / failed / avg / p50 / p95 / distinct keys
- ✅ Admin panel "Demo Runner" section with model picker, turns editor, results table, metric cards
- ✅ Executor fix: caller-supplied `excludedKeyIds` no longer overwritten by `attemptedKeyIds`

## v0.2.7 — Admin console rewrite
- ✅ Sidebar IA: 6 pages (Overview / Demo Runner / Keys / Pools / Usage / Settings)
- ✅ Topbar with brand mark, env pill, language switch, action buttons
- ✅ Right-side drawer (Add Key form, Timeline details)
- ✅ Toast notifications (4 kinds)
- ✅ Hash routing for navigation
- ✅ Sticky-header tables with toolbar (search + filter)
- ✅ Pool cards grid
- ✅ Empty states with primary CTAs
- ✅ Stat grids with auto-fit layout
- ✅ Settings page (auth, runtime, OpenAPI reference)
- ✅ Admin panel template split into i18n / styles / script / HTML modules

## v0.2.8 — i18n
- ✅ EN + zh-CN dictionaries, ~150 translation keys
- ✅ `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` attributes
- ✅ `t(key, vars)` helper with `{var}` substitution
- ✅ Language switch in topbar + auth card
- ✅ localStorage persistence; browser-language auto-detect
- ✅ CJK font fallbacks (PingFang SC, Microsoft YaHei)

## v0.3 — Resilience
- ⏳ Circuit breaker (Closed / Open / Half-Open)
- ⏳ Fallback chain (provider-level)
- ✅ Cooldown & auto-recovery for failing keys
- ⏳ Prometheus `/metrics` endpoint
- ⏳ HTTP client with retry, backoff, timeout

## v0.3.5 — Admin console
- ✅ Runtime overview: providers, pools, keys
- ✅ In-memory key add/update
- ✅ Provider presets for key creation
- ✅ MiniMax official OpenAI-compatible preset
- ✅ Preset catalog API
- ✅ Preset id based key creation
- ✅ Bearer-token protected admin APIs
- ✅ Key enable/disable/delete
- ✅ Health test
- ✅ OpenAI-compatible chat test
- ✅ In-memory usage recorder
- ✅ Admin recent usage API and table
- ✅ In-memory health event recorder
- ✅ Admin recent health event API and table
- ✅ Admin operation audit log API and Settings table
- ✅ Automatic degraded / cooling_down key states
- ✅ Cooldown expiry and auto-recovery
- ⏳ Persist config changes safely
- ✅ Usage and health event filtering
- ✅ Admin Usage page event filter panels

## v0.4 — Task-level API
- ⏳ `tasks.*` registry — script / storyboard / image / video / tts / review
- ⏳ Cost- and capability-aware routing
- ⏳ Per-task default model + per-task pool binding
- ⏳ Image / video provider adapters (Kling, Runway, fal, …)

## v0.5 — Observability & ops
- ⏳ OpenTelemetry tracing
- ⏳ Grafana JSON dashboard
- ✅ Admin operation audit log
- ✅ Admin audit log filtering
- ⏳ Structured audit log per request
- ✅ Admin API for runtime key management
- ✅ Admin usage API
- ✅ Key encryption at rest (AES-GCM)

## v0.6 — Storage & multi-instance
- ✅ SQLite storage backend for runtime keys, usage records, health events, and audit logs
- ⏳ Postgres storage backend
- ⏳ Redis adapter for distributed rate-limit
- ⏳ Hot config reload

## v0.7 — SDKs
- ⏳ Python SDK (`@keypool/sdk-python`)
- ⏳ TS SDK (`@keypool/sdk-ts` first-class package)
- ✅ Minimal web admin UI

## v1.0 — Production hardening
- ⏳ Complete e2e test suite
- ⏳ Benchmark report (vs direct upstream vs One API vs Portkey)
- ⏳ Helm / Docker Compose one-click deploy
- ⏳ Documentation site
- ⏳ Security review (key redaction, RBAC, audit log)

---

## Design principles (stay honest to these)

1. **Single responsibility** — KeyPool routes keys. No user accounts, no billing.
2. **Protocol-agnostic** — Provider interface, business code never branches by provider.
3. **Pluggable first** — Interface stable, implementation swappable.
4. **Config as code** — YAML drives everything; no fork needed to extend.
5. **Observable-first** — Metrics/logging/tracing are infra, not features.
6. **Failure is the norm** — classify errors, retry, failover, circuit-break.

## Out of scope (for clarity)
- User accounts / billing / rate plans (use One API / New API for that)
- Hosting / multi-tenant SaaS
- LLM SDK that talks to providers directly (litellm territory)
