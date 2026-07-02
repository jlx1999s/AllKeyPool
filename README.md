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
| ⚖️ | Weighted round-robin | ⏳ v0.2 |
| 🎯 | Sticky session (role consistency) | ⏳ v0.3 |
| 🚦 | Per-key RPM / TPM rate limiting | ⏳ v0.2 |
| 💥 | Circuit breaker | ⏳ v0.3 |
| 🧬 | OpenAI-compatible pass-through | ⏳ v0.2 |
| 🪜 | Provider fallback chain | ⏳ v0.3 |
| 📊 | Prometheus metrics | ⏳ v0.3 |
| 🧱 | Multi-provider (Anthropic, Gemini, custom) | ⏳ v0.2 |
| 🗂️ | SQLite / Postgres / Redis storage | ⏳ v0.6 |
| 🔌 | Python / TS SDKs | ⏳ v0.7 |
| 🌐 | Minimal admin web UI | ⏳ v0.7 |

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

Requires Node ≥ 20.

```bash
git clone https://github.com/jlx1999s/AllKeyPool.git
cd AllKeyPool

npm install

# build shared types first
npm run build -w @keypool/shared

# copy & edit the example config
cp config/keypool.example.yaml config/keypool.yaml

# at least one provider key in your environment
export OPENAI_API_KEY_1=sk-...

# start the API
npm run dev -w @keypool/api
```

The service listens on `:3000` by default.

```bash
curl http://localhost:3000/healthz
```

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
