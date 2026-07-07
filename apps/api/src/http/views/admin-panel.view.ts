import { I18N_DICTS } from "./admin-panel.i18n.js";
import { renderAdminPanelScript } from "./admin-panel.script.js";
import { ADMIN_PANEL_CSS } from "./admin-panel.styles.js";

export interface AdminPanelViewOptions {
  usingDevToken: boolean;
}

export function renderAdminPanelHtml(options: AdminPanelViewOptions): string {
  const devTokenHint = options.usingDevToken
    ? `<span class="pill pill-warn" data-i18n-html="devTokenHint"><span data-i18n="devTokenPrefix">dev token</span>: <code>keypool-admin-dev</code></span>`
    : `<span class="pill pill-ok" data-i18n="env.authEnabled">admin auth enabled</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KeyPool Console</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230F766E'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-family='monospace' fill='white' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E">
  <style>
${ADMIN_PANEL_CSS}
  </style>
</head>
<body>
  <div class="app" id="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div class="brand-text"><span data-i18n="brand.name">KeyPool</span> <small data-i18n="brand.tag">console</small></div>
      </div>
      <div class="env-pill" id="env-pill" data-i18n="env.checking">checking…</div>
      <div class="topbar-spacer"></div>
      <div class="topbar-actions">
        <div class="lang-switch" id="lang-switch" role="group" aria-label="Language">
          <button class="lang-btn" data-lang="en" type="button">EN</button>
          <button class="lang-btn" data-lang="zh-CN" type="button">中</button>
        </div>
        <button class="btn btn-ghost btn-sm" id="docs-btn" title="OpenAPI reference" data-i18n-title="page.settings.openapi.title" data-i18n="topbar.docs">Docs</button>
        <button class="btn btn-ghost btn-sm" id="refresh-btn" title="Refresh" data-i18n-title="topbar.refresh" data-i18n="topbar.refresh">↻</button>
        <button class="btn btn-ghost btn-sm" id="logout-btn" data-i18n="topbar.logout">Logout</button>
      </div>
    </header>

    <div class="shell">
      <aside class="sidebar">
        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.workspace">Workspace</div>
          <div class="nav-item active" data-route="overview">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
            <span data-i18n="nav.overview">Overview</span>
          </div>
          <div class="nav-item" data-route="demo">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            <span data-i18n="nav.demo">Demo Runner</span>
            <span class="badge" data-i18n="nav.demo.badge">Run</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.manage">Manage</div>
          <div class="nav-item" data-route="keys">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <span data-i18n="nav.keys">Keys</span>
            <span class="badge" id="nav-keys-count">0</span>
          </div>
          <div class="nav-item" data-route="pools">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span data-i18n="nav.pools">Pools</span>
            <span class="badge" id="nav-pools-count">0</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.observe">Observe</div>
          <div class="nav-item" data-route="usage">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
            <span data-i18n="nav.usage">Usage</span>
            <span class="badge" data-i18n="nav.usage.badge">Live</span>
          </div>
          <div class="nav-item" data-route="events-requests">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>
            <span data-i18n="nav.eventsRequests">Request events</span>
            <span class="badge" data-events-requests-badge>0</span>
          </div>
          <div class="nav-item" data-route="events-health">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span data-i18n="nav.eventsHealth">Health events</span>
            <span class="badge" data-events-health-badge>0</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.system">System</div>
          <div class="nav-item" data-route="settings">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span data-i18n="nav.settings">Settings</span>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="muted" style="font-size: 11px; padding: 0 12px;" data-i18n="version">KeyPool v0.1.0</div>
        </div>
      </aside>

      <main class="main">
        <section class="page active" data-page="overview">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.overview.title">Overview</h1>
              <p data-i18n="page.overview.desc">Platform-wide health, key inventory, and recent activity.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="overview-refresh-btn" data-i18n="page.overview.refresh">↻ Refresh</button>
              <button class="btn btn-primary" id="overview-go-demo" data-i18n="page.overview.openDemo">▶ Open Demo Runner</button>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.providers">Providers</div>
              <div class="stat-value" id="ov-providers">—</div>
              <div class="stat-foot"><span id="ov-providers-names">—</span></div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.pools">Pools</div>
              <div class="stat-value" id="ov-pools">—</div>
              <div class="stat-foot" data-i18n="ov.stat.poolsFoot">Routing groups</div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.keys">Keys</div>
              <div class="stat-value" id="ov-keys">—</div>
              <div class="stat-foot"><span id="ov-keys-active">0</span> <span data-i18n="ov.col.success">active</span> · <span id="ov-keys-disabled">0</span> <span data-i18n="ov.col.failed">disabled</span></div>
            </div>
            <div class="stat" style="cursor: pointer;" data-go="events-requests" data-go-query="outcome=error" data-go-range="24h">
              <div class="stat-label" data-i18n="ov.stat.recentErrors">Recent errors (24h)</div>
              <div class="stat-value" id="ov-recent-errors" style="color: var(--danger);">—</div>
              <div class="stat-foot" data-i18n="ov.stat.recentErrorsFoot">Click to view error events →</div>
            </div>
            <div class="stat" style="cursor: pointer;" data-go="events-health" data-go-type="key_degraded">
              <div class="stat-label" data-i18n="ov.stat.degraded">Degraded keys</div>
              <div class="stat-value" id="ov-degraded-keys" style="color: var(--warn);">—</div>
              <div class="stat-foot" data-i18n="ov.stat.degradedFoot">Click to view →</div>
            </div>
            <div class="stat" style="cursor: pointer;" data-go="events-health" data-go-type="key_cooling_down">
              <div class="stat-label" data-i18n="ov.stat.coolingDown">Cooling down</div>
              <div class="stat-value" id="ov-cooling-down" style="color: var(--danger);">—</div>
              <div class="stat-foot" data-i18n="ov.stat.coolingDownFoot">Click to view →</div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.fake">Fake mode</div>
              <div class="stat-value" id="ov-fake">—</div>
              <div class="stat-foot" data-i18n="ov.stat.fakeFoot">No upstream traffic</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2 data-i18n="ov.recent.title">Recent activity</h2>
              <div class="actions">
                <button class="btn btn-ghost btn-sm" data-route="usage" data-i18n="page.overview.viewAll">View all usage →</button>
              </div>
            </div>
            <div class="table-wrap" id="ov-activity-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="ov.col.key">Key</th>
                    <th data-i18n="ov.col.provider">Provider</th>
                    <th data-i18n="ov.col.pool">Pool</th>
                    <th class="num" data-i18n="ov.col.total">Total</th>
                    <th class="num" data-i18n="ov.col.success">Success</th>
                    <th class="num" data-i18n="ov.col.failed">Failed</th>
                    <th data-i18n="ov.col.lastUsed">Last used</th>
                  </tr>
                </thead>
                <tbody id="ov-activity"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="page" data-page="demo">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.demo.title">Demo Runner</h1>
              <p data-i18n="page.demo.desc">Simulate real user traffic. Watch scheduling, retries, and quotas in real time.</p>
            </div>
            <div class="actions">
              <span class="pill pill-dot" id="demo-status" data-i18n="demo.status.idle">idle</span>
            </div>
          </div>

          <div class="split">
            <div class="panel">
              <div class="panel-head"><h2 data-i18n="demo.request.title">Request</h2></div>
              <div class="panel-body stack">
                <div class="field">
                  <label><span data-i18n="demo.field.model">Model</span> <span class="hint" data-i18n="demo.field.modelHint">from registered pools</span></label>
                  <select id="demo-model"></select>
                </div>
                <div class="field">
                  <label><span data-i18n="demo.field.session">Session ID</span> <span class="hint" data-i18n="demo.field.sessionHint">optional · sticky</span></label>
                  <input id="demo-session" data-i18n-placeholder="demo.field.sessionPlaceholder" placeholder="leave blank to auto-generate">
                </div>

                <div class="field">
                  <label style="justify-content: space-between; width: 100%;">
                    <span><span data-i18n="demo.field.turns">Turns</span> <span class="hint" data-i18n="demo.field.turnsHint">user messages in order</span></span>
                    <button type="button" class="btn btn-ghost btn-sm" id="demo-add-turn" data-i18n="demo.addTurn">+ Add turn</button>
                  </label>
                  <div id="demo-turns" class="stack" style="gap: 6px;"></div>
                </div>

                <div class="form-grid">
                  <div class="field">
                    <label><span data-i18n="demo.field.count">Count</span> <span class="hint" data-i18n="demo.field.countHint">repeat N</span></label>
                    <input id="demo-count" type="number" min="1" max="500" value="1">
                  </div>
                  <div class="field">
                    <label><span data-i18n="demo.field.interval">Interval ms</span> <span class="hint" data-i18n="demo.field.intervalHint">between repeats</span></label>
                    <input id="demo-interval" type="number" min="0" max="10000" value="0">
                  </div>
                  <div class="field full">
                    <label><span data-i18n="demo.field.strategy">Strategy</span> <span class="hint" data-i18n="demo.field.strategyHint">override pool default</span></label>
                    <select id="demo-strategy">
                      <option value="" data-i18n="demo.strategy.default">— use pool default —</option>
                      <option value="round_robin">round_robin</option>
                      <option value="weighted_round_robin">weighted_round_robin</option>
                    </select>
                  </div>
                </div>

                <div class="row" style="margin-top: 4px;">
                  <button class="btn btn-primary" id="demo-run-single" data-i18n="demo.run.single">▶ Run single</button>
                  <button class="btn btn-secondary" id="demo-run-multi" data-i18n="demo.run.multi">Run multi-turn</button>
                  <button class="btn btn-secondary" id="demo-run-load" data-i18n="demo.run.load">⚡ Load test</button>
                </div>
              </div>
            </div>

            <div class="stack-lg">
              <div class="stat-grid" id="demo-summary">
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.total">Total</div><div class="stat-value" data-metric="total">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.success">Success</div><div class="stat-value" data-metric="success" style="color: var(--ok);">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.failed">Failed</div><div class="stat-value" data-metric="failed" style="color: var(--danger);">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.avg">Avg ms</div><div class="stat-value" data-metric="avg">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.p50">p50 ms</div><div class="stat-value" data-metric="p50">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.p95">p95 ms</div><div class="stat-value" data-metric="p95">0</div></div>
                <div class="stat" style="grid-column: span 3;">
                  <div class="stat-label" data-i18n="demo.summary.keys">Distinct keys hit</div>
                  <div class="stat-value" data-metric="keys">0</div>
                  <div class="stat-foot mono truncate" data-metric="keysList">—</div>
                </div>
              </div>

              <div class="panel">
                <div class="panel-head">
                  <h2 data-i18n="demo.results.title">Results</h2>
                  <div class="actions">
                    <span class="muted" id="demo-progress" style="font-size: 12px;"></span>
                    <button class="btn btn-ghost btn-sm" id="demo-clear" data-i18n="demo.results.clear">Clear</button>
                  </div>
                </div>
                <div class="table-wrap" style="max-height: 540px;">
                  <table class="data">
                    <thead>
                      <tr>
                        <th class="checkbox-cell">#</th>
                        <th data-i18n="demo.col.status">Status</th>
                        <th data-i18n="demo.col.key">Key</th>
                        <th data-i18n="demo.col.attempts">Attempts</th>
                        <th class="num" data-i18n="demo.col.latency">Latency</th>
                        <th data-i18n="demo.col.response">Response</th>
                      </tr>
                    </thead>
                    <tbody id="demo-results"></tbody>
                  </table>
                </div>
                <div id="demo-empty" class="empty">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                  </div>
                  <h3 data-i18n="demo.results.emptyTitle">No runs yet</h3>
                  <p data-i18n="demo.results.emptyDesc">Configure a request on the left and hit Run. Results will appear here with full retry chains.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="page" data-page="keys">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.keys.title">API Keys</h1>
              <p data-i18n="page.keys.desc">Manage the keys in your pool. Each key belongs to one provider and one pool.</p>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="keys-add-btn" data-i18n="keys.add">＋ Add key</button>
            </div>
          </div>

          <div class="panel">
            <div class="table-toolbar">
              <div class="search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input id="keys-search" data-i18n-placeholder="keys.searchPlaceholder" placeholder="Search by id, provider, pool…">
              </div>
              <select class="filter-select" id="keys-status-filter">
                <option value="" data-i18n="keys.filter.all">All statuses</option>
                <option value="healthy">healthy</option>
                <option value="degraded">degraded</option>
                <option value="cooling_down">cooling_down</option>
                <option value="disabled">disabled</option>
              </select>
              <select class="filter-select" id="keys-provider-filter">
                <option value="" data-i18n="keys.filter.allProv">All providers</option>
              </select>
            </div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th class="checkbox-cell"></th>
                    <th data-i18n="keys.col.id">ID</th>
                    <th data-i18n="keys.col.provider">Provider</th>
                    <th data-i18n="keys.col.pool">Pool</th>
                    <th data-i18n="keys.col.status">Status</th>
                    <th class="num" data-i18n="keys.col.weight">Weight</th>
                    <th class="num" data-i18n="keys.col.rpm">RPM</th>
                    <th class="num" data-i18n="keys.col.usage24h">24h req</th>
                    <th data-i18n="keys.col.lastUsed">Last used</th>
                    <th data-i18n="keys.col.secret">Secret</th>
                    <th class="text-right" style="padding-right: 16px;" data-i18n="keys.col.actions">Actions</th>
                  </tr>
                </thead>
                <tbody id="keys-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="page" data-page="pools">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.pools.title">Pools</h1>
              <p data-i18n="page.pools.desc">Routing groups. Each pool binds a strategy to one or more providers/models.</p>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="pools-add-btn" data-i18n="pools.add">＋ New pool</button>
            </div>
          </div>
          <div id="pools-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;"></div>
        </section>

        <section class="page" data-page="usage">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.usage.title">Usage</h1>
              <p data-i18n="page.usage.desc">Per-key request timeline. Last 64 events per key, kept in memory.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="usage-refresh-btn" data-i18n="usage.refresh">↻ Refresh</button>
            </div>
          </div>

          <div class="stat-grid" id="usage-stats"></div>

          <div class="panel">
            <div class="panel-head">
              <h2 data-i18n="usage.col.key">Key timeline</h2>
              <div class="actions">
                <span class="muted" style="font-size: 12px;" data-i18n="usage.foot">hover rows for details</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="usage.col.key">Key</th>
                    <th data-i18n="usage.col.provider">Provider</th>
                    <th data-i18n="usage.col.pool">Pool</th>
                    <th class="num" data-i18n="usage.col.total">Total</th>
                    <th class="num" data-i18n="usage.col.success">Success</th>
                    <th class="num" data-i18n="usage.col.failed">Failed</th>
                    <th class="num" data-i18n="usage.col.avg">Avg ms</th>
                    <th data-i18n="usage.col.lastUsed">Last used</th>
                    <th class="text-right" style="padding-right: 16px;" data-i18n="usage.view">View</th>
                  </tr>
                </thead>
                <tbody id="usage-body"></tbody>
              </table>
            </div>
          </div>

        <section class="page" data-page="events-requests">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.eventsRequests.title">Request events</h1>
              <p data-i18n="page.eventsRequests.desc">Per-request records: time, key, provider, model, status, latency.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="requests-refresh-btn" data-i18n="events.refresh">↻ Refresh</button>
            </div>
          </div>
          <div class="stat-grid" id="requests-stats"></div>
          <div class="panel">
            <div class="panel-head"><h2 data-i18n="events.toolbar">Filters</h2></div>
            <div class="panel-body">
              <div class="row" style="gap: 6px; flex-wrap: wrap;">
                <div class="seg" id="requests-time-seg" role="group" aria-label="Time range">
                  <button class="seg-btn" data-range="1h" data-i18n="events.range.1h">1h</button>
                  <button class="seg-btn" data-range="24h" data-i18n="events.range.24h">24h</button>
                  <button class="seg-btn active" data-range="all" data-i18n="events.range.all">All</button>
                </div>
                <div class="seg" id="requests-outcome-seg" role="group" aria-label="Outcome">
                  <button class="seg-btn active" data-outcome="" data-i18n="events.outcome.all">All</button>
                  <button class="seg-btn" data-outcome="success" data-i18n="events.outcome.success">Success</button>
                  <button class="seg-btn" data-outcome="error" data-i18n="events.outcome.error">Error</button>
                </div>
                <select class="filter-select" id="requests-provider-filter">
                  <option value="" data-i18n="events.filter.allProvider">All providers</option>
                </select>
                <div class="search" style="max-width: 280px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                  <input id="requests-key-filter" data-i18n-placeholder="events.filter.keyPlaceholder" placeholder="Filter key id…">
                </div>
              </div>
              <div class="muted" id="requests-summary" style="font-size: 12px; margin-top: 10px;"></div>
            </div>
          </div>
          <div class="panel">
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="usage.col.time">Time</th>
                    <th data-i18n="usage.col.key">Key</th>
                    <th data-i18n="usage.col.provider">Provider</th>
                    <th data-i18n="usage.col.model">Model</th>
                    <th data-i18n="usage.col.status">Status</th>
                    <th class="num" data-i18n="usage.col.latency">Latency</th>
                  </tr>
                </thead>
                <tbody id="requests-body"></tbody>
              </table>
            </div>
            <div class="row" style="justify-content: flex-end; margin: 10px 16px;">
              <button class="btn btn-secondary btn-sm hidden" id="requests-more" data-i18n="events.loadMore">Load more</button>
            </div>
          </div>
        </section>

        <section class="page" data-page="events-health">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.eventsHealth.title">Health events</h1>
              <p data-i18n="page.eventsHealth.desc">Provider attempts, key state transitions, and cooldown events.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="health-refresh-btn" data-i18n="events.refresh">↻ Refresh</button>
            </div>
          </div>
          <div class="stat-grid" id="health-stats"></div>
          <div class="panel">
            <div class="panel-head"><h2 data-i18n="events.toolbar">Filters</h2></div>
            <div class="panel-body">
              <div class="row" style="gap: 6px; flex-wrap: wrap;">
                <div class="seg" id="health-time-seg" role="group" aria-label="Time range">
                  <button class="seg-btn" data-range="1h" data-i18n="events.range.1h">1h</button>
                  <button class="seg-btn" data-range="24h" data-i18n="events.range.24h">24h</button>
                  <button class="seg-btn active" data-range="all" data-i18n="events.range.all">All</button>
                </div>
                <div class="seg" id="health-level-seg" role="group" aria-label="Level">
                  <button class="seg-btn active" data-level="" data-i18n="events.level.all">All</button>
                  <button class="seg-btn" data-level="info" data-i18n="events.level.info">Info</button>
                  <button class="seg-btn" data-level="warn" data-i18n="events.level.warn">Warn</button>
                  <button class="seg-btn" data-level="error" data-i18n="events.level.error">Error</button>
                </div>
                <select class="filter-select" id="health-type-filter">
                  <option value="" data-i18n="events.filter.allType">All event types</option>
                  <option value="provider_attempt_succeeded">provider_attempt_succeeded</option>
                  <option value="provider_attempt_failed">provider_attempt_failed</option>
                  <option value="key_exhausted">key_exhausted</option>
                  <option value="key_degraded">key_degraded</option>
                  <option value="key_cooling_down">key_cooling_down</option>
                  <option value="key_recovered">key_recovered</option>
                  <option value="key_status_changed">key_status_changed</option>
                </select>
                <div class="search" style="max-width: 280px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                  <input id="health-key-filter" data-i18n-placeholder="events.filter.keyPlaceholder" placeholder="Filter key id…">
                </div>
              </div>
              <div class="muted" id="health-summary" style="font-size: 12px; margin-top: 10px;"></div>
            </div>
          </div>
          <div class="panel">
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="usage.col.time">Time</th>
                    <th data-i18n="usage.col.type">Type</th>
                    <th data-i18n="usage.col.level">Level</th>
                    <th data-i18n="usage.col.key">Key</th>
                    <th data-i18n="usage.col.code">Code</th>
                    <th data-i18n="usage.col.message">Message</th>
                  </tr>
                </thead>
                <tbody id="health-body"></tbody>
              </table>
            </div>
            <div class="row" style="justify-content: flex-end; margin: 10px 16px;">
              <button class="btn btn-secondary btn-sm hidden" id="health-more" data-i18n="events.loadMore">Load more</button>
            </div>
          </div>
        </section>

        </section>

        <section class="page" data-page="settings">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.settings.title">Settings</h1>
              <p data-i18n="page.settings.desc">Runtime configuration and auth.</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.auth.title">Authentication</h2></div>
            <div class="panel-body stack">
              <div class="row">
                <div class="grow">
                  <div style="font-weight: 600;" data-i18n="settings.auth.token">Admin token</div>
                  <div class="muted" style="font-size: 13px;" id="settings-token-mode">—</div>
                </div>
                <span class="pill pill-dot pill-ok" id="settings-auth-pill" data-i18n="settings.auth.authenticated">authenticated</span>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.runtime.title">Runtime</h2></div>
            <div class="panel-body">
              <div class="form-grid">
                <div class="field"><label data-i18n="settings.runtime.host">Server host</label><input id="settings-host" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.port">Server port</label><input id="settings-port" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.retry">Max retry attempts</label><input id="settings-retry" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.fake">Provider mode</label><input id="settings-fake" disabled></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.openapi.title">OpenAPI reference</h2></div>
            <div class="panel-body stack">
              <p class="muted" data-i18n="settings.openapi.desc">All admin endpoints are served under /admin/api/* and the demo runner under /_demo/*.</p>
              <div class="form-grid">
                <div class="field"><label data-i18n="settings.openapi.health">Health</label><input class="mono" value="GET /health" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.session">Session</label><input class="mono" value="GET /admin/api/session" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.state">State</label><input class="mono" value="GET /admin/api/state" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.keys">Keys CRUD</label><input class="mono" value="POST/PATCH/DELETE /admin/api/keys" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.keyUsage">Key usage</label><input class="mono" value="GET /admin/api/keys/:id/usage" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.audit">Audit log</label><input class="mono" value="GET /admin/api/audit-logs" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.chat">Chat proxy</label><input class="mono" value="POST /v1/chat/completions" disabled></div>
                <div class="field full"><label data-i18n="settings.openapi.demo">Demo runner</label><input class="mono" value="POST /_demo/chat" disabled></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <div>
                <h2 data-i18n="settings.audit.title">Audit log</h2>
                <p class="muted" style="margin: 4px 0 0; font-size: 13px;" data-i18n="settings.audit.desc">Recent admin operations.</p>
              </div>
              <div class="actions">
                <button class="btn btn-secondary btn-sm" id="settings-audit-refresh" data-i18n="settings.audit.refresh">Refresh audit</button>
              </div>
            </div>
            <div class="table-toolbar">
              <select class="filter-select" id="settings-audit-action-filter">
                <option value="" data-i18n="settings.audit.filter.allAction">All actions</option>
                <option value="key_created">key_created</option>
                <option value="key_updated">key_updated</option>
                <option value="key_status_changed">key_status_changed</option>
                <option value="key_deleted">key_deleted</option>
              </select>
              <select class="filter-select" id="settings-audit-outcome-filter">
                <option value="" data-i18n="settings.audit.filter.allOutcome">All outcomes</option>
                <option value="success">success</option>
                <option value="error">error</option>
              </select>
              <div class="search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input id="settings-audit-target-filter" data-i18n-placeholder="settings.audit.filter.targetPlaceholder" placeholder="Filter target id…">
              </div>
            </div>
            <div class="muted" id="settings-audit-summary" style="font-size: 12px; margin: -4px 0 10px;"></div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="settings.audit.col.time">Time</th>
                    <th data-i18n="settings.audit.col.action">Action</th>
                    <th data-i18n="settings.audit.col.target">Target</th>
                    <th data-i18n="settings.audit.col.outcome">Outcome</th>
                    <th data-i18n="settings.audit.col.actor">Actor</th>
                  </tr>
                </thead>
                <tbody id="settings-audit-body"></tbody>
              </table>
            </div>
            <div class="row" style="justify-content: flex-end; margin-top: 10px;">
              <button class="btn btn-secondary btn-sm hidden" id="settings-audit-more" data-i18n="events.loadMore">Load more</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>

  <div class="drawer-backdrop" id="drawer-backdrop"></div>
  <aside class="drawer" id="drawer" aria-hidden="true">
    <div class="drawer-head">
      <h2 id="drawer-title" data-i18n="drawer.addTitle">Add key</h2>
      <button class="btn btn-ghost btn-icon btn-sm" id="drawer-close" style="margin-left: auto;">✕</button>
    </div>
    <div class="drawer-body">
      <form id="key-form" class="stack">
        <div class="field">
          <label data-i18n="drawer.preset">Provider preset</label>
          <select id="form-preset">
            <option value="" data-i18n="drawer.presetManual">Manual</option>
          </select>
        </div>
        <div class="form-grid">
          <div class="field">
            <label data-i18n="drawer.field.provider">Provider</label>
            <input id="form-provider" value="openai">
          </div>
          <div class="field">
            <label data-i18n="drawer.field.pool">Pool</label>
            <input id="form-pool" value="text_generation">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.baseUrl">Base URL</label>
            <input id="form-baseUrl" value="https://api.openai.com/v1">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.model">Model</label>
            <input id="form-model" value="gpt-4.1-mini">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.keyId">Key ID</label>
            <input id="form-keyId" data-i18n-placeholder="drawer.field.keyIdPlaceholder" placeholder="my-key-1">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.keyValue">API Key</label>
            <input id="form-keyValue" type="password" data-i18n-placeholder="drawer.field.keyValuePlaceholder" placeholder="sk-..." autocomplete="new-password">
          </div>
          <div class="field">
            <label data-i18n="drawer.field.weight">Weight</label>
            <input id="form-weight" type="number" min="1" value="1">
          </div>
          <div class="field">
            <label><span data-i18n="drawer.field.rpm">RPM</span> <span class="hint" data-i18n="drawer.field.rpmHint">optional</span></label>
            <input id="form-rpm" type="number" min="1" placeholder="unlimited">
          </div>
        </div>
      </form>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-ghost" id="drawer-cancel" data-i18n="drawer.cancel">Cancel</button>
      <button class="btn btn-primary" id="drawer-save" data-i18n="drawer.save">Save key</button>
    </div>
  </aside>

  <div class="toast-host" id="toast-host"></div>

  <div class="auth-overlay" id="auth-overlay">
    <div class="auth-card">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div class="brand-text"><span data-i18n="brand.name">KeyPool</span> <small data-i18n="brand.tag">console</small></div>
      </div>
      <h1 data-i18n="auth.title">Sign in</h1>
      <p data-i18n="auth.desc">Enter your admin token to unlock the console.</p>
      <div class="lang-switch" id="auth-lang-switch" role="group" aria-label="Language">
        <button class="lang-btn" data-lang="en" type="button">EN</button>
        <button class="lang-btn" data-lang="zh-CN" type="button">中</button>
      </div>
      <form id="auth-form" class="stack">
        <div class="field">
          <label data-i18n="auth.tokenLabel">Admin token</label>
          <input id="adminToken" type="password" autocomplete="current-password" data-i18n-placeholder="auth.tokenPlaceholder" placeholder="Bearer token">
        </div>
        <button class="btn btn-primary" type="submit" style="width: 100%; height: 38px;" data-i18n="auth.submit">Unlock</button>
        <p class="muted" style="text-align: center; font-size: 12px;">${devTokenHint}</p>
      </form>
    </div>
  </div>

  <script>
${renderAdminPanelScript(I18N_DICTS)}
  </script>
</body>
</html>`;
}
