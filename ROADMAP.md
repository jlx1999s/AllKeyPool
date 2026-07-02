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

## v0.3 — Resilience
- ⏳ Circuit breaker (Closed / Open / Half-Open)
- ⏳ Fallback chain (provider-level)
- ⏳ Cooldown & auto-recovery for failing keys
- ⏳ Prometheus `/metrics` endpoint
- ⏳ HTTP client with retry, backoff, timeout

## v0.3.5 — Admin console
- ✅ Runtime overview: providers, pools, keys
- ✅ In-memory key add/update
- ✅ Provider presets for key creation
- ✅ MiniMax official OpenAI-compatible preset
- ✅ Bearer-token protected admin APIs
- ✅ Key enable/disable/delete
- ✅ Health test
- ✅ OpenAI-compatible chat test
- ⏳ Persist config changes safely
- ⏳ Usage and health event timeline

## v0.4 — Task-level API
- ⏳ `tasks.*` registry — script / storyboard / image / video / tts / review
- ⏳ Cost- and capability-aware routing
- ⏳ Per-task default model + per-task pool binding
- ⏳ Image / video provider adapters (Kling, Runway, fal, …)

## v0.5 — Observability & ops
- ⏳ OpenTelemetry tracing
- ⏳ Grafana JSON dashboard
- ⏳ Structured audit log per request
- ✅ Admin API for runtime key management
- ⏳ Admin usage API
- ⏳ Key encryption at rest (AES-GCM)

## v0.6 — Storage & multi-instance
- ⏳ SQLite storage backend
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
