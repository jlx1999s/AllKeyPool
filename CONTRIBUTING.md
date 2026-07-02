# Contributing to KeyPool

Thanks for taking the time to contribute. KeyPool is intentionally small — its value is doing one thing (key routing) really well.

## Code of conduct

Be respectful. Assume good intent. Critique code, not people.

## Project layout

```
KeyPool/
├── apps/
│   └── api/                     # Fastify HTTP service (entrypoint)
│       ├── src/
│       │   ├── adapters/        # Provider adapters (openai, anthropic, …)
│       │   ├── config/          # YAML loader + Zod schema
│       │   ├── core/            # Scheduler, strategies, breaker, ratelimit
│       │   ├── http/            # Routes + middleware
│       │   ├── security/        # Secret redaction
│       │   ├── storage/         # Key state store
│       │   └── main.ts
│       └── test/                # Vitest specs
├── packages/
│   └── shared/                  # Cross-package types
└── config/
    └── keypool.yaml             # Local config (gitignored in prod)
```

The rule: **`apps/api/src/core/` is reusable business logic with no Fastify dependency**. Routes and adapters are thin shells.

## Development setup

Requires Node ≥ 20.

```bash
npm install
npm run build -w @keypool/shared   # build shared types first
npm run dev -w @keypool/api        # start the API on :3000
```

Set `KEYPOOL_CONFIG=./config/keypool.yaml` and provide at least one API key in your env (e.g. `OPENAI_API_KEY_1`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Build every workspace |
| `npm run dev` | Hot-reload the API |
| `npm test` | Run Vitest across workspaces |
| `npm run typecheck` | `tsc --noEmit` across workspaces |

## Tests

- Unit tests live next to the code (`*.test.ts`).
- Aim for coverage of the strategy / scheduler / config / route layers first.
- Mock HTTP traffic at the boundary (use `msw` or Fastify's `inject` for routes).

## Coding style

- TypeScript strict mode is on — no `any` unless justified.
- Prefer named exports.
- Prefer pure functions; isolate side effects in adapters.
- Keep dependencies peer-honest: each workspace owns its own `dependencies`.

## Branch / commit / PR conventions

- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).
- PRs: one logical change per PR. Link the issue if any.

Example:

```
feat(scheduler): add weighted round-robin strategy

Closes #42
```

## Adding a new provider adapter

1. Create `apps/api/src/adapters/<name>.ts`.
2. Implement the `Provider` interface (see `packages/shared/src/types/provider.ts`).
3. Register it in `apps/api/src/adapters/registry.ts`.
4. Add the provider name as a Zod enum in `apps/api/src/config/schema.ts`.
5. Add an example block in `config/keypool.example.yaml`.
6. Write at least one happy-path and one error-classification test.

## Adding a new scheduling strategy

1. Create `apps/api/src/core/scheduler/strategies/<name>.strategy.ts`.
2. Implement the `Strategy` interface.
3. Add the strategy name as a Zod enum.
4. Cover with unit tests across at least: empty pool, single key, weighted distribution.

## Security: never commit secrets

- Use `${ENV_VAR}` placeholders in YAML.
- Add new ignores to `.gitignore`, never commit `.env`.
- Logger redaction is enabled by default; do not bypass it.

## Reporting issues

- Bug reports: include repro, expected vs actual, KeyPool version, Node version.
- Feature requests: describe the workflow, the pain, and any prior art.
- Security issues: email the maintainer privately, do not open a public issue.

## License

By contributing, you agree your contributions are licensed under Apache-2.0.
