# KeyPool

> A pluggable API key routing and load-balancing gateway for AI production pipelines.

KeyPool is a single-purpose scheduler for LLM and AI API keys. It sits between your application and upstream providers (OpenAI, Anthropic, Gemini, OpenAI-compatible endpoints, image/video adapters…) and handles the messy operational work: **rotating keys, retrying on the right error class, breaking the circuit on chronic failure, rate-limiting per key, observing cost**.

It is designed for workloads like **AI comic/video drama production** where a single pipeline may call many providers in sequence — script generation, storyboards, image generation, video generation, voice, subtitle, translation, review.

---

## Why KeyPool exists

Most teams hand-roll retry/rotation logic per provider. It is duplicated, drifts, never quite agrees with itself, and falls over at 3am when a vendor changes a rate-limit policy.

KeyPool does exactly one thing — **pick the right key, for the right task, at the right moment** — and tries to do that well.

## Key features (current and planned)

| | Feature | Status |
|---|---|---|
| 🔁 | Round-robin key selection | ✅ done |
| ⚖️ | Weighted round-robin | ✅ done |
| 🧭 | Scheduler orchestrator | ✅ key selection done |
| 🧰 | In-memory key repository | ✅ done |
| 🧱 | Provider registry | ✅ done |
| 🎯 | Sticky session (role consistency) | ⏳ v0.3 |
| 🚦 | Per-key RPM rate limiting | ✅ in-memory done |
| 🚦 | Per-key TPM rate limiting | ⏳ v0.3 |
| 💥 | Circuit breaker | ⏳ v0.3 |
| 🧬 | OpenAI-compatible chat pass-through | ✅ basic done |
| 🔁 | RetryPolicy + ProviderRequestExecutor | ✅ basic done |
| 🛠️ | Token-protected admin console | ✅ basic done |
| 🧪 | Fake provider pool + failure DSL | ✅ done |
| 📈 | Per-key usage timeline | ✅ basic done |
| 🧾 | Admin operation audit log | ✅ basic done |
| 🎬 | Demo Runner endpoint + panel | ✅ done |
| 🎨 | Sidebar/drawer/toast admin UI | ✅ done |
| 🌐 | EN + zh-CN i18n | ✅ done |
| 🪜 | Provider fallback chain | ⏳ v0.3 |
| 📊 | Prometheus metrics | ⏳ v0.3 |
| 🧩 | Multi-provider adapters (Anthropic, Gemini, custom) | ⏳ v0.2 |
| 🗂️ | SQLite / Postgres / Redis storage | ✅ SQLite basic / ⏳ Postgres Redis |
| 🔌 | Python / TS SDKs | ⏳ v0.7 |
| 🌐 | Production admin web UI | ✅ basic done |

---

## Architecture (high-level)

```
                ┌─────────────────────────────────────┐
   Your app ──▶ │  Fastify HTTP entrypoint (:3000)    │
                └─────────────┬───────────────────────┘
                              │
                ┌─────────────▼───────────────────────┐
                │  Scheduler (strategy + retry)      │
                └──┬──────────────┬──────────────┬───┘
                   │              │              │
                ┌──▼───┐      ┌───▼───┐     ┌────▼────┐
                │ RR   │      │ WRR   │     │ Sticky  │   ← pluggable
                └──────┘      └───────┘     └─────────┘
                              │
                ┌─────────────▼───────────────────────┐
                │  Provider registry                  │
                │  (openai, anthropic, custom, …)     │
                └─────────────┬───────────────────────┘
                              │
                ┌─────────────▼───────────────────────┐
                │  Circuit breaker + rate limiter     │
                └─────────────┬───────────────────────┘
                              │
                ┌─────────────▼───────────────────────┐
                │  Upstream providers                 │
                └─────────────────────────────────────┘
```

## Repository layout

```
KeyPool/
├── apps/
│   └── api/                    # Fastify HTTP service
│       ├── src/
│       │   ├── adapters/       # Provider adapters (one per upstream)
│       │   ├── config/         # YAML loader + Zod validation
│       │   ├── core/           # Scheduler, strategies, breaker, ratelimit
│       │   ├── http/           # Routes + middleware
│       │   ├── security/       # Secret redaction
│       │   ├── storage/        # Key state store
│       │   └── main.ts
│       └── test/               # Vitest specs
├── packages/
│   └── shared/                 # Cross-package types and contracts
└── config/
    └── keypool.example.yaml    # Sample configuration
```

See [ROADMAP.md](./ROADMAP.md) for what is planned and what is already done.

---

## Quick start

Requires Node ≥ 22.5.

```bash
git clone https://github.com/jlx1999s/AllKeyPool.git
cd AllKeyPool

npm install

# start the API
npm run dev
```

The service listens on `:3000` by default.

```bash
curl http://localhost:3000/health
```

Admin console:

[http://localhost:3000/admin](http://localhost:3000/admin)

Set `KEYPOOL_ADMIN_TOKEN` in production. When it is not set, local development uses the fallback token `keypool-admin-dev`.

The admin console can inspect runtime config, add OpenAI-compatible keys, enable/disable/delete keys, inspect recent usage, health events, audit logs, and run health/chat tests.

By default KeyPool uses in-memory storage for local development. Enable SQLite persistence for runtime keys, usage records, health events, and audit logs:

```bash
KEYPOOL_STORAGE=sqlite KEYPOOL_SQLITE_PATH=./data/keypool.db npm run dev
```

YAML remains the bootstrap config. Admin-added runtime keys are stored in SQLite with the provider/base URL/model metadata needed to restore routing after restart.

For production, set `KEYPOOL_ENCRYPTION_KEY` so API key values are encrypted at rest in SQLite:

```bash
KEYPOOL_STORAGE=sqlite KEYPOOL_SQLITE_PATH=./data/keypool.db KEYPOOL_ENCRYPTION_KEY='change-me' npm run dev
```

Provider presets are available when adding keys, so common vendors can be selected without manually filling every field. Current presets:

- OpenAI Compatible: `https://api.openai.com/v1`, `gpt-4.1-mini`
- MiniMax Official: `https://api.minimax.io/v1`, `MiniMax-M3`

Preset catalog API:

```bash
curl http://localhost:3000/admin/api/provider-presets \
  -H 'authorization: Bearer keypool-admin-dev'
```

Add a key with preset defaults:

```bash
curl http://localhost:3000/admin/api/keys \
  -H 'authorization: Bearer keypool-admin-dev' \
  -H 'content-type: application/json' \
  -d '{"presetId":"minimax-official","id":"minimax-prod-1","value":"sk-..."}'
```

Recent usage API:

```bash
curl 'http://localhost:3000/admin/api/usage?limit=20' \
  -H 'authorization: Bearer keypool-admin-dev'
```

Recent health events API:

```bash
curl 'http://localhost:3000/admin/api/health-events?limit=20' \
  -H 'authorization: Bearer keypool-admin-dev'
```

Recent admin audit log API:

```bash
curl 'http://localhost:3000/admin/api/audit-logs?limit=20' \
  -H 'authorization: Bearer keypool-admin-dev'
```

Audit logs can be filtered by `action`, `outcome`, `targetType`, `targetId`, `actorType`, and `actorId`:

```bash
curl 'http://localhost:3000/admin/api/audit-logs?action=key_status_changed&outcome=success&targetId=minimax-prod-1' \
  -H 'authorization: Bearer keypool-admin-dev'
```

Key health policy:

- First consecutive provider failure marks a key as `degraded`.
- Third consecutive provider failure marks a key as `cooling_down`.
- `cooling_down` and `disabled` keys are skipped by scheduling.
- Expired cooldowns are released before scheduling and return to `degraded`.
- A successful provider request resets failure count and recovers a `degraded` key to `healthy`.

OpenAI-compatible chat endpoint:

```bash
curl http://localhost:3000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gpt-4.1-mini","messages":[{"role":"user","content":"hello"}]}'
```

### Fake provider pool (for local testing & demos)

To exercise the scheduler, retry policy, and quota manager without any real provider, start KeyPool with the bundled fake config:

```bash
KEYPOOL_CONFIG=./config/keypool.fake.yaml KEYPOOL_FAKE_PROVIDER=1 npm run dev
```

`FakeOpenAIAdapter` never makes a network call. Each `provider` / `key` in the fake yaml can carry a `script:` field that drives the response. Supported directives:

- `sequence(ok, 429, 500)` — consume outcomes in order
- `periodic(period=3, rate_limited)` — every Nth call returns the outcome
- `burst(windowMs=1000, allowed=2, outcome=rate_limited)` — sliding-window burst limiter
- `probability(p=0.1, outcome=server_error, seed=42)` — chaos injection

Every response body includes a `servedBy` (last 4 chars of the keyId) and `keyId` field, so you can `curl` a few times and confirm round-robin / weighted-round-robin / cooldown steering with your own eyes. See `apps/api/src/providers/fake/fake-script.ts` for the full surface.

### Demo Runner

The `POST /_demo/chat` endpoint simulates a real user (or load test) and returns the **full per-call attempt chain** in a single response — including every retry, every key swap, and the reason for each swap. It powers the "Demo Runner" section at the top of the admin console, and is also `curl`-friendly:

```bash
curl -X POST http://localhost:3000/_demo/chat \
  -H "x-admin-token: keypool-admin-dev" \
  -H "content-type: application/json" \
  -d '{"model":"fake-rl","prompt":"ping","count":4}'
```

Response shape:

```jsonc
{
  "results": [
    {
      "turn": 1,
      "status": 200,
      "keyId": "rl-prod-2",
      "attempt": 2,
      "attempts": [
        { "attempt": 1, "keyId": "rl-prod-1", "outcome": "error", "statusCode": 429, "errorCode": "rate_limited", "latencyMs": 4 },
        { "attempt": 2, "keyId": "rl-prod-2", "outcome": "success", "statusCode": 200, "latencyMs": 5 }
      ],
      "responseText": "[fake:d-2] ping"
    }
  ],
  "summary": { "total": 4, "success": 4, "distinctKeys": 3, "avgLatencyMs": 5, "p50LatencyMs": 5, "p95LatencyMs": 6 }
}
```

Three modes in one endpoint:

- **single** — one request, `count` defaults to 1
- **multi** — pass `turns: ["a", "b", "c"]` for a multi-turn conversation
- **load** — pass `count: N` and optional `intervalMs` for pressure tests

Plus an optional `sessionId` to **pin all turns to the same key** (sticky session simulation, useful for previewing v0.3's planned sticky strategy).

Auth: same admin token as `/admin/api/*`.

---

## Configuration

`config/keypool.yaml` is the source of truth. It is loaded and validated with Zod, and `${VAR}` placeholders are expanded from the environment.

```yaml
server:
  host: 0.0.0.0
  port: 3000

providers:
  openai:
    type: openai
    baseUrl: https://api.openai.com/v1
    keys:
      - id: openai-main-1
        value: ${OPENAI_API_KEY_1}
        weight: 10
        rpm: 500
        dailyRequests: 10000

pools:
  text_generation:
    strategy: weighted_round_robin
    providers:
      - provider: openai
        models:
          - gpt-4.1-mini

tasks:
  script_generation:
    pool: text_generation
    defaultModel: gpt-4.1-mini

retry:
  maxAttempts: 3
  retryOn: [429, 500, 502, 503]
```

Three layers, deliberately separated:

- **providers** — where keys live and how to talk to that vendor.
- **pools** — a grouping of providers behind a strategy (the scheduling unit).
- **tasks** — your business vocabulary (`script_generation`, `storyboard_image`, …) bound to a pool.

See [`config/keypool.example.yaml`](./config/keypool.example.yaml) for the full example.

---

## Philosophy

1. **Single responsibility.** KeyPool routes keys. It does not do user accounts, billing, or quotas. Pair it with one of the existing API gateways if you need that layer.
2. **Pluggable over complete.** The interfaces are stable. Swap implementations freely.
3. **Failure is normal.** Errors are classified (rate-limit vs auth vs quota vs server vs network vs client), retried, and broken-circuit. KeyPool should be the thing that *does not* page you at 3am.
4. **Observable first.** Logs are structured, secrets are redacted, metrics are first-class.

## License

[Apache-2.0](./LICENSE)
