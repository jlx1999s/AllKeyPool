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
      --bg: #f7f8fa;
      --panel: #ffffff;
      --line: #d9dde5;
      --text: #1f2937;
      --muted: #667085;
      --accent: #0f766e;
      --accent-strong: #115e59;
      --danger: #b42318;
      --ok: #067647;
      --warn: #b54708;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      letter-spacing: 0;
    }
    header {
      min-height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 24px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    h1 { font-size: 18px; margin: 0; font-weight: 700; }
    main {
      display: grid;
      grid-template-columns: minmax(280px, 380px) 1fr;
      gap: 16px;
      padding: 16px;
      max-width: 1480px;
      margin: 0 auto;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      min-width: 0;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
    }
    h2 { margin: 0; font-size: 14px; font-weight: 700; }
    .body { padding: 14px; }
    .stack { display: grid; gap: 16px; }
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
    }
    button.secondary { background: #fff; color: var(--accent-strong); }
    button.danger { background: var(--danger); border-color: var(--danger); }
    button:disabled { opacity: 0.55; cursor: not-allowed; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      background: #fbfcfe;
    }
    .metric .value { font-size: 24px; font-weight: 800; margin-top: 4px; }
    .table-wrap { overflow: auto; border: 1px solid var(--line); border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; min-width: 960px; }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
      white-space: nowrap;
    }
    th { font-size: 12px; color: var(--muted); background: #fbfcfe; }
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
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      background: #ecfdf3;
      color: var(--ok);
      font-size: 12px;
      font-weight: 700;
    }
    .pill.warn { background: #fffaeb; color: var(--warn); }
    .pill.disabled { background: #f2f4f7; color: var(--muted); }
    .muted { color: var(--muted); }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
    .auth-shell {
      max-width: 520px;
      margin: 48px auto 0;
      padding: 0 16px;
    }
    .hidden { display: none; }
    @media (max-width: 980px) {
      main { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr; }
      header { padding: 10px 14px; }
    }
  </style>
</head>
<body>
  <header>
    <h1>KeyPool Admin Console</h1>
    <div class="row">
      ${devTokenHint}
      <span id="status-pill" class="pill warn">locked</span>
      <button class="secondary" id="refresh-btn" title="Refresh state">↻</button>
      <button class="secondary" id="logout-btn">Logout</button>
    </div>
  </header>

  <div id="auth-panel" class="auth-shell">
    <section>
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

  <main id="console" class="hidden">
    <div class="stack">
      <section>
        <div class="section-head"><h2>API Key</h2></div>
        <form id="key-form" class="body stack">
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
          <div class="grid" style="grid-template-columns: 1fr 1fr;">
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

      <section>
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

    <div class="stack">
      <section>
        <div class="section-head">
          <h2>Overview</h2>
          <span class="muted" id="server-label"></span>
        </div>
        <div class="body">
          <div class="grid">
            <div class="metric"><div class="muted">Providers</div><div class="value" id="provider-count">0</div></div>
            <div class="metric"><div class="muted">Pools</div><div class="value" id="pool-count">0</div></div>
            <div class="metric"><div class="muted">Keys</div><div class="value" id="key-count">0</div></div>
          </div>
        </div>
      </section>

      <section>
        <div class="section-head"><h2>Keys</h2></div>
        <div class="body">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Provider</th><th>Pool</th><th>Status</th><th>Weight</th><th>RPM</th><th>Last Used</th><th>Secret</th><th>Actions</th>
                </tr>
              </thead>
              <tbody id="keys-body"></tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
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

      <section>
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
      $("keys-body").innerHTML = state.keys.map((key) => \`
        <tr>
          <td><code>\${escapeHtml(key.id)}</code></td>
          <td>\${escapeHtml(key.provider)}</td>
          <td>\${escapeHtml(key.pool)}</td>
          <td><span class="pill \${key.status === "disabled" ? "disabled" : ""}">\${escapeHtml(key.status)}</span></td>
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
      $("pools-body").innerHTML = state.pools.map((pool) => \`
        <tr>
          <td><code>\${escapeHtml(pool.name)}</code></td>
          <td>\${escapeHtml(pool.strategy)}</td>
          <td>\${escapeHtml(pool.providers.map((item) => item.provider).join(", "))}</td>
          <td>\${escapeHtml(pool.providers.flatMap((item) => item.models).join(", "))}</td>
        </tr>
      \`).join("");
      return state;
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
