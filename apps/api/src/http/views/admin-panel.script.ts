import type { I18nDictionary } from "./admin-panel.i18n.js";
import { renderAdminPanelDemoScript } from "./admin-panel.demo-script.js";
import { renderAdminPanelHealthScript } from "./admin-panel.health-script.js";
import { renderAdminPanelKeysScript } from "./admin-panel.keys-script.js";
import { renderAdminPanelRequestsScript } from "./admin-panel.requests-script.js";
import { renderAdminPanelUsageScript } from "./admin-panel.usage-script.js";

export function renderAdminPanelScript(i18n: Record<string, I18nDictionary>): string {
  return String.raw`    const I18N = ${JSON.stringify(i18n)};
    const LANG_KEY = "keypool.lang";
    const TOKEN_KEY = "keypool.adminToken";

    function detectLang() {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
      const nav = (navigator.language || "en").toLowerCase();
      if (nav.startsWith("zh")) return "zh-CN";
      return "en";
    }

    let currentLang = detectLang();

    function t(key, vars) {
      const dict = I18N[currentLang] || I18N.en;
      let s = dict[key];
      if (s === undefined) s = I18N.en[key] !== undefined ? I18N.en[key] : key;
      if (vars) {
        for (const k in vars) {
          s = s.split("{" + k + "}").join(String(vars[k]));
        }
      }
      return s;
    }

    function applyI18n() {
      // text content
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
      });
      // placeholders
      document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", t(key));
      });
      // titles
      document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        el.setAttribute("title", t(key));
      });
      // html content (only used for the devTokenHint, which embeds a <code>)
      document.querySelectorAll("[data-i18n-html]").forEach((el) => {
        const key = el.getAttribute("data-i18n-html");
        const rendered = t(key);
        if (key === "devTokenHint") {
          el.innerHTML = '<span>' + t("devTokenPrefix") + ':</span> <code>keypool-admin-dev</code>';
        } else {
          el.innerHTML = rendered;
        }
      });
      // <option> elements
      document.querySelectorAll("option[data-i18n]").forEach((el) => {
        el.textContent = t(el.getAttribute("data-i18n"));
      });
      // lang switch active state
      document.querySelectorAll(".lang-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === currentLang);
      });
      // <html lang> attribute
      document.documentElement.lang = currentLang;
    }

    function setLang(lang) {
      if (!I18N[lang]) return;
      currentLang = lang;
      localStorage.setItem(LANG_KEY, lang);
      applyI18n();
      // re-render dynamic panels (so labels in JS-built content pick up new lang)
      if (typeof renderOverview === "function") renderOverview();
      if (typeof renderKeys === "function") renderKeys();
      if (typeof renderPools === "function") renderPools();
      if (currentRouteSafe() === "usage" && typeof refreshUsage === "function") refreshUsage();
    }

    // wire up lang buttons
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });

    // ---------- below is the existing app logic, refactored to use t() ----------
    const ICONS = {
      dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
      trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
      close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    };
    const $ = (id) => document.getElementById(id);
    const state = {
      keys: [],
      pools: [],
      providers: [],
      presets: [],
      auditLogs: [],
      auditPage: null,
      auditStats: null,
      usageEvents: [],
      usageEventPage: null,
      usageEventStats: null,
      healthEvents: [],
      healthEventPage: null,
      healthEventStats: null,
      fakeProvider: false,
      server: null,
      retry: null
    };
    function getToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
    function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
    function clearToken() { localStorage.removeItem(TOKEN_KEY); }
    function authHeaders() { return { authorization: "Bearer " + getToken() }; }

    async function requestJson(url, options = {}) {
      const headers = { ...authHeaders(), ...(options.headers || {}) };
      if (options.body) headers["content-type"] = "application/json";
      const response = await fetch(url, { ...options, headers });
      let body;
      try { body = await response.json(); } catch { body = await response.text(); }
      if (!response.ok) {
        const err = new Error(typeof body === "string" ? body : (body.error && body.error.message) || ("HTTP " + response.status));
        err.status = response.status;
        err.body = body;
        throw err;
      }
      return body;
    }

    function toast(message, kind) {
      const host = $("toast-host");
      const tEl = document.createElement("div");
      tEl.className = "toast" + (kind ? " toast-" + kind : "");
      tEl.textContent = message;
      host.appendChild(tEl);
      setTimeout(() => {
        tEl.style.opacity = "0";
        tEl.style.transform = "translateY(8px)";
        tEl.style.transition = "all 200ms";
        setTimeout(() => tEl.remove(), 200);
      }, 2400);
    }

    function go(route) { window.location.hash = "#/" + route; }
    function currentRouteSafe() {
      const h = window.location.hash || "#/overview";
      return h.replace(/^#[/]?/, "") || "overview";
    }
    function renderRoute() {
      const r = currentRouteSafe();
      document.querySelectorAll(".nav-item[data-route]").forEach((el) => {
        el.classList.toggle("active", el.dataset.route === r);
      });
      document.querySelectorAll(".page[data-page]").forEach((el) => {
        el.classList.toggle("active", el.dataset.page === r);
      });
      if (r === "usage") refreshUsage();
      if (r === "settings") refreshAuditLogs();
      if (r === "overview") renderOverview();
    }
    window.addEventListener("hashchange", renderRoute);
    document.querySelectorAll(".nav-item[data-route]").forEach((el) => {
      el.addEventListener("click", () => go(el.dataset.route));
    });

    function showAuth() { $("auth-overlay").classList.remove("hidden"); }
    function hideAuth() { $("auth-overlay").classList.add("hidden"); }

    $("auth-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      setToken($("adminToken").value.trim());
      try {
        await refreshState();
        hideAuth();
        toast(t("auth.signedIn"), "ok");
      } catch (err) {
        clearToken();
        showAuth();
        toast(t("auth.badToken", { msg: (err.body && err.body.error && err.body.error.message) || err.message }), "danger");
      }
    });
    $("logout-btn").addEventListener("click", () => { clearToken(); showAuth(); });
    $("refresh-btn").addEventListener("click", refreshState);

    async function refreshState() {
      const s = await requestJson("/admin/api/state");
      state.keys = s.keys;
      state.pools = s.pools;
      state.providers = s.providers;
      state.presets = s.presets || [];
      state.auditLogs = s.auditLogs || [];
      state.auditPage = null;
      state.auditStats = null;
      state.usageEvents = s.usage || [];
      state.usageEventPage = null;
      state.usageEventStats = null;
      state.healthEvents = s.healthEvents || [];
      state.healthEventPage = null;
      state.healthEventStats = null;
      state.fakeProvider = s.fakeProvider;
      state.server = s.server;
      state.retry = s.retry;

      $("nav-keys-count").textContent = s.keys.length;
      $("nav-pools-count").textContent = s.pools.length;
      $("ov-fake").textContent = s.fakeProvider ? "ON" : "off";
      $("ov-fake").style.color = s.fakeProvider ? "var(--brand)" : "var(--text-muted)";
      $("env-pill").textContent = s.fakeProvider ? t("env.fake") : t("env.live");

      // presets
      const presetSel = $("form-preset");
      const currentPreset = presetSel.value;
      presetSel.innerHTML = ['<option value="">' + t("drawer.presetManual") + '</option>']
        .concat(s.presets.map((p) => '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.label) + '</option>'))
        .join("");
      if (s.presets.some((p) => p.id === currentPreset)) presetSel.value = currentPreset;

      // provider filter
      const provFilter = $("keys-provider-filter");
      const prevProv = provFilter.value;
      provFilter.innerHTML = ['<option value="">' + t("keys.filter.allProv") + '</option>']
        .concat(s.providers.map((p) => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>'))
        .join("");
      if (s.providers.includes(prevProv)) provFilter.value = prevProv;

      const usageProviderFilter = $("usage-event-provider-filter");
      const prevUsageProvider = usageProviderFilter.value;
      usageProviderFilter.innerHTML = ['<option value="">' + t("usage.filter.allProvider") + '</option>']
        .concat(s.providers.map((p) => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + '</option>'))
        .join("");
      if (s.providers.includes(prevUsageProvider)) usageProviderFilter.value = prevUsageProvider;

      // demo model options
      const models = new Set();
      for (const pool of s.pools || []) {
        for (const item of pool.providers || []) {
          for (const m of (item.models || [])) if (m) models.add(m);
        }
      }
      const demoModel = $("demo-model");
      const prevModel = demoModel.value;
      const modelList = Array.from(models).sort();
      demoModel.innerHTML = ['<option value="">' + t("demo.field.modelPlaceholder") + '</option>']
        .concat(modelList.map((m) => '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + '</option>'))
        .join("");
      if (modelList.includes(prevModel)) demoModel.value = prevModel;
      else if (modelList.includes("gpt-4.1-mini")) demoModel.value = "gpt-4.1-mini";

      // settings form values
      $("settings-host").value = (s.server && s.server.host) || "";
      $("settings-port").value = (s.server && s.server.port) || "";
      $("settings-retry").value = (s.retry && s.retry.maxAttempts) || "";
      $("settings-fake").value = s.fakeProvider ? t("env.fake") : t("env.live");
      $("settings-token-mode").textContent = s.auth && s.auth.usingDevToken
        ? t("env.checking") + " (dev)"
        : t("settings.auth.authenticated");
      $("settings-auth-pill").textContent = s.auth && s.auth.usingDevToken ? "dev" : t("settings.auth.authenticated");
      $("settings-auth-pill").className = "pill pill-dot " + (s.auth && s.auth.usingDevToken ? "pill-warn" : "pill-ok");

      renderOverview();
      renderKeys();
      renderPools();
      renderAuditLogs();
      if (currentRouteSafe() === "usage") {
        renderUsageEvents();
        renderHealthEvents();
      }
      return s;
    }

    function renderOverview() {
      $("ov-providers").textContent = state.providers.length;
      $("ov-providers-names").textContent = state.providers.length ? state.providers.join(" · ") : "—";
      $("ov-pools").textContent = state.pools.length;
      $("ov-keys").textContent = state.keys.length;
      const active = state.keys.filter((k) => k.status !== "disabled").length;
      const disabled = state.keys.length - active;
      $("ov-keys-active").textContent = active;
      $("ov-keys-disabled").textContent = disabled;

      // Health stat cards (recent errors / degraded / cooling down).
      const recentErrors = (state.usageEvents || []).filter((u) => u.outcome === "error").length;
      $("ov-recent-errors").textContent = recentErrors;
      const degraded = state.keys.filter((k) => k.status === "degraded").length;
      $("ov-degraded-keys").textContent = degraded;
      const coolingDown = state.keys.filter((k) => k.status === "cooling_down").length;
      $("ov-cooling-down").textContent = coolingDown;

      const tbody = $("ov-activity");
      if (state.keys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><h3>' + escapeHtml(t("ov.empty.title")) + '</h3><p>' + escapeHtml(t("ov.empty.desc")) + '</p></div></td></tr>';
        return;
      }
      const sorted = state.keys.slice().sort((a, b) => {
        const at = a.usage && a.usage.lastUsedAt ? new Date(a.usage.lastUsedAt).getTime() : 0;
        const bt = b.usage && b.usage.lastUsedAt ? new Date(b.usage.lastUsedAt).getTime() : 0;
        return bt - at;
      }).slice(0, 8);
      tbody.innerHTML = sorted.map((k) => {
        const u = k.usage || { total: 0, success: 0, error: 0 };
        return '<tr>'
          + '<td><code>' + escapeHtml(k.id) + '</code></td>'
          + '<td>' + escapeHtml(k.provider) + '</td>'
          + '<td>' + escapeHtml(k.pool) + '</td>'
          + '<td class="num">' + u.total + '</td>'
          + '<td class="num" style="color: var(--ok);">' + u.success + '</td>'
          + '<td class="num" style="color: var(--danger);">' + (u.error || 0) + '</td>'
          + '<td class="muted">' + (k.lastUsedAt ? escapeHtml(new Date(k.lastUsedAt).toLocaleString()) : "—") + '</td>'
          + '</tr>';
      }).join("");
    }
    $("overview-refresh-btn").addEventListener("click", refreshState);
    $("overview-go-demo").addEventListener("click", () => go("demo"));

    // Health stat cards: click to jump to the corresponding events page with
    // pre-set filters (encoded as URL hash query params).
    document.querySelectorAll(".stat[data-go]").forEach((el) => {
      el.addEventListener("click", () => {
        const route = el.getAttribute("data-go") || "";
        const params = new URLSearchParams();
        const type = el.getAttribute("data-go-type");
        if (type) params.set("type", type);
        const outcome = el.getAttribute("data-go-query");
        if (outcome) params.set("outcome", outcome);
        const range = el.getAttribute("data-go-range");
        if (range) params.set("range", range);
        const qs = params.toString();
        window.location.hash = "#/" + route + (qs ? "?" + qs : "");
      });
    });

    function isWithin24h(d) {
      if (!d) return false;
      const ts = d instanceof Date ? d.getTime() : new Date(d).getTime();
      return Date.now() - ts <= 24 * 60 * 60 * 1000;
    }

${renderAdminPanelKeysScript()}

    function renderPools() {
      const grid = $("pools-grid");
      if (state.pools.length === 0) {
        grid.innerHTML = '<div class="empty" style="grid-column: 1 / -1;">'
          + '<div class="icon">' + ICONS.plus + '</div>'
          + '<h3>' + escapeHtml(t("pools.empty.title")) + '</h3>'
          + '<p>' + escapeHtml(t("pools.empty.desc")) + '</p>'
          + '</div>';
        return;
      }
      grid.innerHTML = state.pools.map((p) => {
        const models = p.providers.flatMap((pr) => pr.models).filter(Boolean);
        const providers = p.providers.map((pr) => pr.provider).join(", ");
        return '<div class="pool-card">'
          + '<div class="pool-card-head">'
          + '<h3><code>' + escapeHtml(p.name) + '</code></h3>'
          + '<span class="pill pill-' + (p.strategy === "weighted_round_robin" ? "brand" : "info") + '">' + escapeHtml(p.strategy) + '</span>'
          + '</div>'
          + '<div class="muted" style="font-size: 13px;">' + escapeHtml(providers) + '</div>'
          + '<div class="muted mono" style="font-size: 12px;">' + escapeHtml(models.join(" · ") || t("pools.noModels")) + '</div>'
          + '<div class="pool-card-foot">'
          + '<span class="muted" style="font-size: 12px;">' + escapeHtml(t("pools.keys", { n: countKeysInPool(p.name) })) + '</span>'
          + '<div class="grow"></div>'
          + '<button class="btn btn-ghost btn-sm">' + escapeHtml(t("pools.view")) + '</button>'
          + '</div>'
          + '</div>';
      }).join("");
    }
    function countKeysInPool(name) { return state.keys.filter((k) => k.pool === name).length; }

    async function refreshAuditLogs(cursor) {
      try {
        const query = buildAuditLogQueryString(cursor);
        const data = await requestJson("/admin/api/audit-logs" + query);
        state.auditLogs = cursor ? state.auditLogs.concat(data.auditLogs || []) : data.auditLogs || [];
        state.auditPage = data.page || null;
        state.auditStats = data.stats || null;
        renderAuditLogs();
      } catch (err) {
        toast(t("settings.audit.err.load", { msg: err.message }), "danger");
      }
    }

    function buildAuditLogQueryString(cursor) {
      const params = new URLSearchParams();
      params.set("limit", "50");
      const action = $("settings-audit-action-filter").value;
      const outcome = $("settings-audit-outcome-filter").value;
      const targetId = $("settings-audit-target-filter").value.trim();
      if (cursor) params.set("cursor", cursor);
      if (action) params.set("action", action);
      if (outcome) params.set("outcome", outcome);
      if (targetId) params.set("targetId", targetId);
      return "?" + params.toString();
    }

    function renderAuditLogs() {
      const tbody = $("settings-audit-body");
      if (!tbody) return;
      const summary = $("settings-audit-summary");
      const more = $("settings-audit-more");
      if (summary) {
        const stats = state.auditStats || { total: 0, byOutcome: { success: 0, error: 0 } };
        summary.textContent = t("settings.audit.summary", {
          total: stats.total,
          success: (stats.byOutcome && stats.byOutcome.success) || 0,
          error: (stats.byOutcome && stats.byOutcome.error) || 0
        });
      }
      if (more) {
        more.classList.toggle("hidden", !(state.auditPage && state.auditPage.hasMore));
      }
      if (state.auditLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="empty"><h3>' + escapeHtml(t("settings.audit.empty")) + '</h3></div></td></tr>';
        return;
      }
      tbody.innerHTML = state.auditLogs.map((entry) => {
        const actor = entry.actor ? entry.actor.type + ":" + entry.actor.id : "—";
        const target = (entry.targetType || "—") + (entry.targetId ? " · " + entry.targetId : "");
        const outcomeKind = entry.outcome === "success" ? "ok" : "danger";
        return '<tr>'
          + '<td class="muted nowrap">' + escapeHtml(new Date(entry.createdAt).toLocaleString()) + '</td>'
          + '<td><code>' + escapeHtml(entry.action) + '</code></td>'
          + '<td class="mono">' + escapeHtml(target) + '</td>'
          + '<td><span class="pill pill-' + outcomeKind + ' pill-dot">' + escapeHtml(entry.outcome) + '</span></td>'
          + '<td class="muted">' + escapeHtml(actor) + '</td>'
          + '</tr>';
      }).join("");
    }
    $("settings-audit-refresh").addEventListener("click", refreshAuditLogs);
    $("settings-audit-action-filter").addEventListener("change", refreshAuditLogs);
    $("settings-audit-outcome-filter").addEventListener("change", refreshAuditLogs);
    $("settings-audit-target-filter").addEventListener("keydown", (e) => {
      if (e.key === "Enter") refreshAuditLogs();
    });
    $("settings-audit-more").addEventListener("click", () => {
      if (state.auditPage && state.auditPage.nextCursor) refreshAuditLogs(state.auditPage.nextCursor);
    });

    function stat(labelKey, value, footKey, accent) {
      const colorStyle = accent === "ok" ? "color: var(--ok);" : accent === "danger" ? "color: var(--danger);" : "";
      return '<div class="stat">'
        + '<div class="stat-label">' + escapeHtml(t(labelKey)) + '</div>'
        + '<div class="stat-value" style="' + colorStyle + '">' + escapeHtml(String(value)) + '</div>'
        + '<div class="stat-foot">' + escapeHtml(t(footKey)) + '</div>'
        + '</div>';
    }
${renderAdminPanelUsageScript()}

${renderAdminPanelRequestsScript()}

${renderAdminPanelHealthScript()}

${renderAdminPanelDemoScript()}

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    // boot
    applyI18n();
    (async function init() {
      if (!getToken()) {
        showAuth();
        return;
      }
      try {
        await refreshState();
        hideAuth();
        renderRoute();
      } catch (err) {
        clearToken();
        showAuth();
        toast(t("auth.sessionExpired"), "warn");
      }
    })();`;
}
