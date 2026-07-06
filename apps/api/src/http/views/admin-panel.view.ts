export interface AdminPanelViewOptions {
  usingDevToken: boolean;
}

export function renderAdminPanelHtml(options: AdminPanelViewOptions): string {
  const devTokenHint = options.usingDevToken
    ? `<span class="pill warn">dev token: <code>keypool-admin-dev</code></span>`
    : `<span class="pill">admin auth enabled</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KeyPool Admin Console</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f3f5f8;
      --panel: #ffffff;
      --panel-soft: #f8fafc;
      --line: #d7dde7;
      --line-strong: #c7d0dd;
      --text: #152033;
      --muted: #64748b;
      --muted-strong: #475569;
      --accent: #0f766e;
      --accent-strong: #0b5f59;
      --accent-soft: #e6f4f1;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
      --danger: #b42318;
      --danger-soft: #fef3f2;
      --ok: #067647;
      --ok-soft: #ecfdf3;
      --warn: #b54708;
      --warn-soft: #fffaeb;
      --shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      letter-spacing: 0;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
      background-size: 36px 36px;
      mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 520px);
    }
    .topbar {
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 22px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(14px);
      position: sticky;
      top: 0;
      z-index: 4;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .brand-mark {
      width: 34px;
      height: 34px;
      display: inline-grid;
      place-items: center;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      background: #0f766e;
      color: #fff;
      font-weight: 900;
      box-shadow: 0 8px 20px rgba(15, 118, 110, 0.22);
    }
    h1 { font-size: 18px; margin: 0; font-weight: 800; }
    .subtitle { margin-top: 2px; color: var(--muted); font-size: 12px; font-weight: 600; }
    .app-shell {
      display: grid;
      grid-template-columns: 260px minmax(0, 1fr);
      gap: 18px;
      padding: 18px;
      max-width: 1540px;
      margin: 0 auto;
    }
    .sidebar {
      display: grid;
      align-content: start;
      gap: 14px;
      position: sticky;
      top: 82px;
      height: calc(100vh - 100px);
    }
    .sidebar-panel, section {
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
      box-shadow: var(--shadow);
    }
    .nav {
      display: grid;
      gap: 4px;
      padding: 8px;
    }
    .nav a {
      display: flex;
      align-items: center;
      gap: 9px;
      min-height: 34px;
      padding: 0 10px;
      border-radius: 6px;
      color: var(--muted-strong);
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
    }
    .nav a:hover { background: var(--panel-soft); color: var(--text); }
    .nav .glyph { width: 18px; text-align: center; color: var(--accent); }
    .content {
      display: grid;
      gap: 16px;
      min-width: 0;
    }
    .workbench {
      display: grid;
      grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }
    section {
      scroll-margin-top: 84px;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 48px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: var(--panel-soft);
      border-radius: 8px 8px 0 0;
    }
    h2 { margin: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: var(--muted-strong); }
    .body { padding: 14px; }
    .stack { display: grid; gap: 16px; }
    .form-grid { display: grid; gap: 12px; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
    }
    input, textarea, select {
      width: 100%;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--text);
      border-radius: 6px;
      padding: 9px 10px;
      font: inherit;
      min-height: 38px;
      outline: none;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    input:focus, textarea:focus, select:focus {
      border-color: #14b8a6;
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.16);
    }
    textarea { resize: vertical; min-height: 92px; }
    button {
      border: 1px solid var(--accent);
      background: var(--accent);
      color: #fff;
      border-radius: 6px;
      min-height: 36px;
      padding: 0 12px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
    }
    button:hover { transform: translateY(-1px); box-shadow: 0 8px 16px rgba(15, 118, 110, 0.14); }
    button.secondary { background: #fff; color: var(--accent-strong); box-shadow: none; }
    button.ghost { background: var(--panel-soft); color: var(--muted-strong); border-color: var(--line); }
    button.danger { background: var(--danger); border-color: var(--danger); }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    .icon-btn {
      width: 36px;
      min-width: 36px;
      padding: 0;
      font-size: 16px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(130px, 1fr));
      gap: 10px;
    }
    .metric {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 12px 11px;
      background: #fff;
      min-height: 86px;
    }
    .metric .value { font-size: 26px; font-weight: 850; margin-top: 6px; line-height: 1; }
    .metric .muted { font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; min-width: 960px; background: #fff; }
    th, td {
      padding: 9px 11px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
    }
    th {
      font-size: 11px;
      color: var(--muted);
      background: #f8fafc;
      text-transform: uppercase;
      letter-spacing: 0;
      position: sticky;
      top: 0;
    }
    tbody tr:hover { background: #fbfcfe; }
    tr:last-child td { border-bottom: 0; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
    pre {
      min-height: 160px;
      max-height: 360px;
      overflow: auto;
      margin: 0;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--line);
      background: #101828;
      color: #e5e7eb;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 6px;
      background: var(--ok-soft);
      color: var(--ok);
      font-size: 12px;
      font-weight: 700;
    }
    .pill code {
      display: inline-block;
      max-width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }
    .pill.warn { background: var(--warn-soft); color: var(--warn); }
    .pill.error { background: var(--danger-soft); color: var(--danger); }
    .pill.info { background: var(--blue-soft); color: var(--blue); }
    .pill.disabled { background: #f2f4f7; color: var(--muted); }
    .pill.cooling { background: var(--danger-soft); color: var(--danger); }
    .muted { color: var(--muted); }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
    .auth-shell {
      max-width: 520px;
      margin: 48px auto 0;
      padding: 0 16px;
    }
    .auth-card { box-shadow: var(--shadow); }
    .mini-note {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.5;
      padding: 10px 12px;
    }
    .note-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 24px;
    }
    .note-row + .note-row { border-top: 1px solid var(--line); padding-top: 8px; margin-top: 6px; }
    .note-row strong { color: var(--muted-strong); font-size: 11px; text-transform: uppercase; }
    .note-row span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      color: var(--muted);
      font-size: 13px;
      padding: 18px 12px;
      text-align: center;
    }
    .hidden { display: none; }
    @media (max-width: 1180px) {
      .app-shell { grid-template-columns: 1fr; }
      .sidebar { position: static; height: auto; }
      .nav { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .workbench { grid-template-columns: 1fr; }
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .topbar { padding: 10px 14px; align-items: stretch; flex-direction: column; }
      .topbar > .row { width: 100%; justify-content: space-between; }
      .topbar .pill code { max-width: 118px; }
      .brand { align-items: flex-start; }
      .subtitle { display: none; }
      .app-shell { padding: 12px; }
      .nav { grid-template-columns: 1fr 1fr; }
      .metrics-grid, .grid, .split { grid-template-columns: 1fr; }
      .row { gap: 6px; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">K</div>
      <div>
        <h1>KeyPool Admin Console</h1>
        <div class="subtitle">Production Control Plane</div>
      </div>
    </div>
    <div class="row">
      ${devTokenHint}
      <span id="status-pill" class="pill warn">locked</span>
      <button class="secondary icon-btn" id="refresh-btn" title="Refresh state">↻</button>
      <button class="ghost" id="logout-btn">Logout</button>
    </div>
  </header>

  <div id="auth-panel" class="auth-shell">
    <section class="auth-card">
      <div class="section-head">
        <h2>Admin Login</h2>
      </div>
      <form id="auth-form" class="body stack">
        <label>Admin Token
          <input id="adminToken" type="password" autocomplete="current-password" placeholder="Bearer token">
        </label>
        <button type="submit">Unlock Console</button>
      </form>
    </section>
  </div>

  <main id="console" class="app-shell hidden">
    <aside class="sidebar">
      <div class="sidebar-panel">
        <nav class="nav" aria-label="Console navigation">
          <a href="#overview"><span class="glyph">⌁</span>Overview</a>
          <a href="#keys"><span class="glyph">⌘</span>Keys</a>
          <a href="#pools"><span class="glyph">⇄</span>Pools</a>
          <a href="#usage"><span class="glyph">◷</span>Usage</a>
          <a href="#events"><span class="glyph">◇</span>Events</a>
          <a href="#output-panel"><span class="glyph">{}</span>Output</a>
        </nav>
      </div>
      <div class="sidebar-panel mini-note">
        <div class="note-row"><strong>Runtime</strong><span>In-memory</span></div>
        <div class="note-row"><strong>Auth</strong><span><code>KEYPOOL_ADMIN_TOKEN</code></span></div>
      </div>
    </aside>

    <div class="content">
      <div class="workbench">
        <section id="key-editor">
        <div class="section-head"><h2>API Key</h2></div>
        <form id="key-form" class="body form-grid">
          <label>Provider Preset
            <select id="providerPreset">
              <option value="">Manual</option>
            </select>
          </label>
          <label>Provider
            <input id="provider" value="openai">
          </label>
          <label>Base URL
            <input id="baseUrl" value="https://api.openai.com/v1">
          </label>
          <label>Pool
            <input id="pool" value="text_generation">
          </label>
          <label>Model
            <input id="keyModel" value="gpt-4.1-mini">
          </label>
          <label>Key ID
            <input id="keyId" value="openai-prod-1">
          </label>
          <label>API Key
            <input id="keyValue" type="password" autocomplete="new-password" placeholder="sk-...">
          </label>
          <div class="split">
            <label>Weight
              <input id="weight" type="number" min="1" value="1">
            </label>
            <label>RPM
              <input id="rpmLimit" type="number" min="1" placeholder="optional">
            </label>
          </div>
          <button type="submit">＋ Add / Update Key</button>
        </form>
      </section>

      <section id="tests">
        <div class="section-head">
          <h2>Tests</h2>
          <button class="secondary" id="health-btn">Health</button>
        </div>
        <div class="body stack">
          <label>Model
            <input id="model" value="gpt-4.1-mini">
          </label>
          <label>Prompt
            <textarea id="prompt">Say hello from KeyPool.</textarea>
          </label>
          <button id="chat-btn">▶ Run Chat Test</button>
        </div>
      </section>
      </div>

      <section id="overview">
        <div class="section-head">
          <h2>Overview</h2>
          <span class="muted" id="server-label"></span>
        </div>
        <div class="body">
          <div class="metrics-grid">
            <div class="metric"><div class="muted">Providers</div><div class="value" id="provider-count">0</div></div>
            <div class="metric"><div class="muted">Pools</div><div class="value" id="pool-count">0</div></div>
            <div class="metric"><div class="muted">Keys</div><div class="value" id="key-count">0</div></div>
            <div class="metric"><div class="muted">Requests</div><div class="value" id="usage-count">0</div></div>
            <div class="metric"><div class="muted">Events</div><div class="value" id="event-count">0</div></div>
          </div>
        </div>
      </section>

      <section id="keys">
        <div class="section-head"><h2>Keys</h2></div>
        <div class="body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Provider</th><th>Pool</th><th>Status</th><th>Cooldown Until</th><th>Weight</th><th>RPM</th><th>Last Used</th><th>Secret</th><th>Actions</th>
                </tr>
              </thead>
              <tbody id="keys-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="pools">
        <div class="section-head"><h2>Pools</h2></div>
        <div class="body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Strategy</th><th>Providers</th><th>Models</th></tr>
              </thead>
              <tbody id="pools-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="usage">
        <div class="section-head"><h2>Usage</h2></div>
        <div class="body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Outcome</th><th>Status</th><th>Provider</th><th>Key</th><th>Model</th><th>Latency</th><th>Error</th></tr>
              </thead>
              <tbody id="usage-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="events">
        <div class="section-head"><h2>Health Events</h2></div>
        <div class="body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Level</th><th>Type</th><th>Provider</th><th>Key</th><th>Status</th><th>Code</th><th>Message</th></tr>
              </thead>
              <tbody id="events-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="output-panel">
        <div class="section-head">
          <h2>Output</h2>
          <button class="secondary" id="clear-output-btn">Clear</button>
        </div>
        <div class="body"><pre id="output">{}</pre></div>
      </section>
    </div>
  </main>

  <script>
    const $ = (id) => document.getElementById(id);
    const output = $("output");
    const tokenKey = "keypool.adminToken";
    let providerPresets = [];

    function getToken() {
      return localStorage.getItem(tokenKey) || "";
    }

    function setToken(token) {
      localStorage.setItem(tokenKey, token);
    }

    function clearToken() {
      localStorage.removeItem(tokenKey);
    }

    function authHeaders() {
      return {
        "authorization": "Bearer " + getToken()
      };
    }

    function writeOutput(value) {
      output.textContent = JSON.stringify(value, null, 2);
    }

    async function requestJson(url, options = {}) {
      const headers = {
        ...authHeaders(),
        ...(options.headers || {})
      };
      if (options.body) {
        headers["content-type"] = "application/json";
      }
      const response = await fetch(url, {
        ...options,
        headers
      });
      const body = await response.json();
      if (!response.ok) {
        throw body;
      }
      return body;
    }

    async function refreshState() {
      const state = await requestJson("/admin/api/state");
      $("auth-panel").classList.add("hidden");
      $("console").classList.remove("hidden");
      $("status-pill").textContent = "authenticated";
      $("status-pill").className = "pill";
      renderProviderPresets(state.presets || []);
      $("server-label").textContent = state.server.host + ":" + state.server.port;
      $("provider-count").textContent = state.providers.length;
      $("pool-count").textContent = state.pools.length;
      $("key-count").textContent = state.keys.length;
      $("usage-count").textContent = state.usage.length;
      $("event-count").textContent = state.healthEvents.length;
      $("keys-body").innerHTML = state.keys.length === 0 ? emptyRow(10, "No runtime keys configured") : state.keys.map((key) => \`
        <tr>
          <td><code>\${escapeHtml(key.id)}</code></td>
          <td>\${escapeHtml(key.provider)}</td>
          <td>\${escapeHtml(key.pool)}</td>
          <td><span class="pill \${keyStatusClass(key.status)}">\${escapeHtml(key.status)}</span></td>
          <td>\${key.coolingDownUntil ? escapeHtml(new Date(key.coolingDownUntil).toLocaleString()) : ""}</td>
          <td>\${key.weight}</td>
          <td>\${key.rpmLimit ?? ""}</td>
          <td>\${key.lastUsedAt ? escapeHtml(new Date(key.lastUsedAt).toLocaleString()) : ""}</td>
          <td><code>\${escapeHtml(key.valuePreview)}</code></td>
          <td>
            <div class="row">
              <button class="secondary" data-action="enable" data-key-id="\${escapeHtml(key.id)}">Enable</button>
              <button class="secondary" data-action="disable" data-key-id="\${escapeHtml(key.id)}">Disable</button>
              <button class="danger" data-action="delete" data-key-id="\${escapeHtml(key.id)}">Delete</button>
            </div>
          </td>
        </tr>
      \`).join("");
      $("pools-body").innerHTML = state.pools.length === 0 ? emptyRow(4, "No pools configured") : state.pools.map((pool) => \`
        <tr>
          <td><code>\${escapeHtml(pool.name)}</code></td>
          <td>\${escapeHtml(pool.strategy)}</td>
          <td>\${escapeHtml(pool.providers.map((item) => item.provider).join(", "))}</td>
          <td>\${escapeHtml(pool.providers.flatMap((item) => item.models).join(", "))}</td>
        </tr>
      \`).join("");
      $("usage-body").innerHTML = state.usage.length === 0 ? emptyRow(8, "No usage records yet") : state.usage.map((usage) => \`
        <tr>
          <td>\${escapeHtml(new Date(usage.createdAt).toLocaleString())}</td>
          <td><span class="pill \${usage.outcome === "error" ? "error" : ""}">\${escapeHtml(usage.outcome)}</span></td>
          <td>\${usage.statusCode}</td>
          <td>\${escapeHtml(usage.provider ?? "")}</td>
          <td><code>\${escapeHtml(usage.keyId ?? "")}</code></td>
          <td>\${escapeHtml(usage.model ?? "")}</td>
          <td>\${usage.latencyMs}ms</td>
          <td>\${escapeHtml(usage.errorCode ?? "")}</td>
        </tr>
      \`).join("");
      $("events-body").innerHTML = state.healthEvents.length === 0 ? emptyRow(8, "No health events yet") : state.healthEvents.map((event) => \`
        <tr>
          <td>\${escapeHtml(new Date(event.createdAt).toLocaleString())}</td>
          <td><span class="pill \${eventLevelClass(event.level)}">\${escapeHtml(event.level)}</span></td>
          <td>\${escapeHtml(event.type)}</td>
          <td>\${escapeHtml(event.provider ?? "")}</td>
          <td><code>\${escapeHtml(event.keyId ?? "")}</code></td>
          <td>\${event.statusCode ?? ""}</td>
          <td>\${escapeHtml(event.code ?? "")}</td>
          <td>\${escapeHtml(event.message)}</td>
        </tr>
      \`).join("");
      return state;
    }

    function emptyRow(colspan, label) {
      return \`<tr><td colspan="\${colspan}" class="empty">\${escapeHtml(label)}</td></tr>\`;
    }

    function keyStatusClass(status) {
      if (status === "disabled") return "disabled";
      if (status === "cooling_down") return "cooling";
      if (status === "degraded") return "warn";
      return "";
    }

    function eventLevelClass(level) {
      if (level === "error") return "error";
      if (level === "warn") return "warn";
      return "info";
    }

    function renderProviderPresets(items) {
      providerPresets = items;
      const selectedValue = $("providerPreset").value;
      $("providerPreset").innerHTML = [
        '<option value="">Manual</option>',
        ...items.map((preset) => \`
          <option value="\${escapeHtml(preset.id)}">\${escapeHtml(preset.label)}</option>
        \`)
      ].join("");
      if (items.some((preset) => preset.id === selectedValue)) {
        $("providerPreset").value = selectedValue;
      }
    }

    function applyProviderPreset(presetId) {
      const preset = providerPresets.find((item) => item.id === presetId);
      if (!preset) return;

      $("provider").value = preset.provider;
      $("baseUrl").value = preset.baseUrl;
      $("pool").value = preset.pool;
      $("keyModel").value = preset.model;
      $("model").value = preset.model;
      if (!formValue("keyId") || formValue("keyId").startsWith("openai-") || formValue("keyId").startsWith("minimax-")) {
        $("keyId").value = preset.keyIdPrefix + "-prod-1";
      }
    }

    function lockConsole() {
      $("auth-panel").classList.remove("hidden");
      $("console").classList.add("hidden");
      $("status-pill").textContent = "locked";
      $("status-pill").className = "pill warn";
    }

    function formValue(id) {
      return $(id).value.trim();
    }

    $("auth-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      setToken(formValue("adminToken"));
      try {
        writeOutput(await refreshState());
      } catch (error) {
        clearToken();
        lockConsole();
        writeOutput(error);
      }
    });

    $("logout-btn").addEventListener("click", () => {
      clearToken();
      lockConsole();
      writeOutput({});
    });

    $("refresh-btn").addEventListener("click", async () => {
      try { writeOutput(await refreshState()); } catch (error) { lockConsole(); writeOutput(error); }
    });

    $("providerPreset").addEventListener("change", () => {
      applyProviderPreset(formValue("providerPreset"));
    });

    $("key-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const payload = {
          presetId: formValue("providerPreset") || undefined,
          provider: formValue("provider"),
          providerType: "openai",
          baseUrl: formValue("baseUrl"),
          pool: formValue("pool"),
          model: formValue("keyModel"),
          id: formValue("keyId"),
          value: formValue("keyValue"),
          weight: Number(formValue("weight") || 1)
        };
        const rpmLimit = formValue("rpmLimit");
        if (rpmLimit) payload.rpmLimit = Number(rpmLimit);
        writeOutput(await requestJson("/admin/api/keys", {
          method: "POST",
          body: JSON.stringify(payload)
        }));
        await refreshState();
      } catch (error) {
        writeOutput(error);
      }
    });

    $("keys-body").addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const keyId = target.dataset.keyId;
      const action = target.dataset.action;
      if (!keyId || !action) return;
      try {
        if (action === "delete") {
          writeOutput(await requestJson("/admin/api/keys/" + encodeURIComponent(keyId), { method: "DELETE" }));
        } else {
          writeOutput(await requestJson("/admin/api/keys/" + encodeURIComponent(keyId) + "/status", {
            method: "PATCH",
            body: JSON.stringify({ status: action === "disable" ? "disabled" : "healthy" })
          }));
        }
        await refreshState();
      } catch (error) {
        writeOutput(error);
      }
    });

    $("health-btn").addEventListener("click", async () => {
      try { writeOutput(await requestJson("/admin/api/test/health", { method: "POST" })); } catch (error) { writeOutput(error); }
    });

    $("chat-btn").addEventListener("click", async () => {
      try {
        writeOutput(await requestJson("/admin/api/test/chat", {
          method: "POST",
          body: JSON.stringify({
            model: formValue("model"),
            content: formValue("prompt")
          })
        }));
        await refreshState();
      } catch (error) {
        writeOutput(error);
      }
    });

    $("clear-output-btn").addEventListener("click", () => writeOutput({}));

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    if (getToken()) {
      refreshState().then(writeOutput).catch((error) => {
        clearToken();
        lockConsole();
        writeOutput(error);
      });
    } else {
      lockConsole();
    }
  </script>
</body>
</html>`;
}
