import type { I18nDictionary } from "./admin-panel.i18n.js";

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
    const state = { keys: [], pools: [], providers: [], presets: [], auditLogs: [], fakeProvider: false, server: null, retry: null };
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
      if (r === "settings") renderAuditLogs();
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

    function renderKeys() {
      const search = $("keys-search").value.trim().toLowerCase();
      const status = $("keys-status-filter").value;
      const prov = $("keys-provider-filter").value;
      const filtered = state.keys.filter((k) => {
        if (search && !((k.id + " " + k.provider + " " + k.pool).toLowerCase().includes(search))) return false;
        if (status && k.status !== status) return false;
        if (prov && k.provider !== prov) return false;
        return true;
      });
      const tbody = $("keys-body");
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11"><div class="empty">'
          + '<div class="icon">' + ICONS.plus + '</div>'
          + '<h3>' + escapeHtml(t("keys.empty.title")) + '</h3>'
          + '<p>' + escapeHtml(t("keys.empty.desc")) + '</p>'
          + '</div></td></tr>';
        return;
      }
      tbody.innerHTML = filtered.map((k) => {
        const statusPill = '<span class="pill pill-' + pillKindForStatus(k.status) + ' pill-dot">' + escapeHtml(k.status) + '</span>';
        const testTitle = t("keys.act.test");
        const toggleTitle = t("keys.act.toggle");
        const deleteTitle = t("keys.act.delete");
        return '<tr data-key-id="' + escapeHtml(k.id) + '">'
          + '<td class="checkbox-cell"></td>'
          + '<td><code>' + escapeHtml(k.id) + '</code></td>'
          + '<td>' + escapeHtml(k.provider) + '</td>'
          + '<td>' + escapeHtml(k.pool) + '</td>'
          + '<td>' + statusPill + '</td>'
          + '<td class="num">' + k.weight + '</td>'
          + '<td class="num">' + (k.rpmLimit ?? "—") + '</td>'
          + '<td class="num">' + ((k.usage && k.usage.total) || 0) + '</td>'
          + '<td class="muted nowrap">' + (k.lastUsedAt ? escapeHtml(new Date(k.lastUsedAt).toLocaleString()) : "—") + '</td>'
          + '<td><span class="key-cell">' + escapeHtml(k.valuePreview || "—") + '</span></td>'
          + '<td class="text-right" style="padding-right: 16px;">'
          + '<button class="btn btn-ghost btn-icon btn-sm" data-act="test" data-key-id="' + escapeHtml(k.id) + '" title="' + escapeHtml(testTitle) + '">' + ICONS.play + '</button>'
          + '<button class="btn btn-ghost btn-icon btn-sm" data-act="toggle" data-key-id="' + escapeHtml(k.id) + '" title="' + escapeHtml(toggleTitle) + '">⏻</button>'
          + '<button class="btn btn-ghost btn-icon btn-sm" data-act="delete" data-key-id="' + escapeHtml(k.id) + '" title="' + escapeHtml(deleteTitle) + '">' + ICONS.trash + '</button>'
          + '</td>'
          + '</tr>';
      }).join("");
    }
    $("keys-search").addEventListener("input", renderKeys);
    $("keys-status-filter").addEventListener("change", renderKeys);
    $("keys-provider-filter").addEventListener("change", renderKeys);
    $("keys-body").addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const id = btn.dataset.keyId;
      const act = btn.dataset.act;
      const key = state.keys.find((k) => k.id === id);
      if (!key) return;
      if (act === "delete") {
        if (!confirm(t("keys.confirmDelete", { id: id }))) return;
        try {
          await requestJson("/admin/api/keys/" + encodeURIComponent(id), { method: "DELETE" });
          toast(t("keys.toast.deleted"), "ok");
          await refreshState();
        } catch (err) { toast(t("keys.toast.delFail", { msg: err.message }), "danger"); }
      } else if (act === "toggle") {
        const newStatus = key.status === "disabled" ? "healthy" : "disabled";
        try {
          await requestJson("/admin/api/keys/" + encodeURIComponent(id) + "/status", {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus })
          });
          toast(t("keys.toast.statusOk", { status: newStatus }), "ok");
          await refreshState();
        } catch (err) { toast(t("keys.toast.updateFail", { msg: err.message }), "danger"); }
      } else if (act === "test") {
        go("demo");
        setTimeout(() => {
          const modelSel = $("demo-model");
          if (modelSel.options.length > 1) modelSel.selectedIndex = 1;
          $("demo-count").value = 1;
          $("demo-run-single").click();
        }, 100);
      }
    });
    $("keys-add-btn").addEventListener("click", () => openDrawer());

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

    async function refreshAuditLogs() {
      try {
        const query = buildAuditLogQueryString();
        const data = await requestJson("/admin/api/audit-logs" + query);
        state.auditLogs = data.auditLogs || [];
        renderAuditLogs();
      } catch (err) {
        toast(t("settings.audit.err.load", { msg: err.message }), "danger");
      }
    }

    function buildAuditLogQueryString() {
      const params = new URLSearchParams();
      params.set("limit", "50");
      const action = $("settings-audit-action-filter").value;
      const outcome = $("settings-audit-outcome-filter").value;
      const targetId = $("settings-audit-target-filter").value.trim();
      if (action) params.set("action", action);
      if (outcome) params.set("outcome", outcome);
      if (targetId) params.set("targetId", targetId);
      return "?" + params.toString();
    }

    function renderAuditLogs() {
      const tbody = $("settings-audit-body");
      if (!tbody) return;
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

    async function refreshUsage() {
      try {
        const data = await requestJson("/admin/api/state");
        state.keys = data.keys;
        const stats = $("usage-stats");
        const totalReq = state.keys.reduce((a, k) => a + ((k.usage && k.usage.total) || 0), 0);
        const totalSucc = state.keys.reduce((a, k) => a + ((k.usage && k.usage.success) || 0), 0);
        const totalErr = state.keys.reduce((a, k) => a + ((k.usage && k.usage.error) || 0), 0);
        const succRate = totalReq > 0 ? ((totalSucc / totalReq) * 100).toFixed(1) : "—";
        stats.innerHTML = ''
          + stat("usage.stat.totalReq", totalReq, "usage.stat.totalReqFoot")
          + stat("usage.stat.success", totalSucc, "usage.stat.successFoot", "ok")
          + stat("usage.stat.failed", totalErr, "usage.stat.failedFoot", "danger")
          + stat("usage.stat.rate", succRate + (totalReq > 0 ? "%" : ""), "usage.stat.rateFoot");
        const tbody = $("usage-body");
        if (state.keys.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9"><div class="empty"><h3>' + escapeHtml(t("usage.empty.title")) + '</h3><p>' + escapeHtml(t("usage.empty.desc")) + '</p></div></td></tr>';
          return;
        }
        tbody.innerHTML = state.keys.map((k) => {
          const u = k.usage || { total: 0, success: 0, error: 0 };
          return '<tr data-key-id="' + escapeHtml(k.id) + '">'
            + '<td><code>' + escapeHtml(k.id) + '</code></td>'
            + '<td>' + escapeHtml(k.provider) + '</td>'
            + '<td>' + escapeHtml(k.pool) + '</td>'
            + '<td class="num">' + u.total + '</td>'
            + '<td class="num" style="color: var(--ok);">' + u.success + '</td>'
            + '<td class="num" style="color: var(--danger);">' + (u.error || 0) + '</td>'
            + '<td class="num">—</td>'
            + '<td class="muted nowrap">' + (k.lastUsedAt ? escapeHtml(new Date(k.lastUsedAt).toLocaleString()) : "—") + '</td>'
            + '<td class="text-right" style="padding-right: 16px;">'
            + '<button class="btn btn-ghost btn-sm" data-act="timeline" data-key-id="' + escapeHtml(k.id) + '">' + escapeHtml(t("usage.view")) + '</button>'
            + '</td>'
            + '</tr>';
        }).join("");
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }
    function stat(labelKey, value, footKey, accent) {
      const colorStyle = accent === "ok" ? "color: var(--ok);" : accent === "danger" ? "color: var(--danger);" : "";
      return '<div class="stat">'
        + '<div class="stat-label">' + escapeHtml(t(labelKey)) + '</div>'
        + '<div class="stat-value" style="' + colorStyle + '">' + escapeHtml(String(value)) + '</div>'
        + '<div class="stat-foot">' + escapeHtml(t(footKey)) + '</div>'
        + '</div>';
    }
    $("usage-refresh-btn").addEventListener("click", refreshUsage);
    $("usage-body").addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-act='timeline']");
      if (!btn) return;
      const id = btn.dataset.keyId;
      try {
        const r = await requestJson("/admin/api/keys/" + encodeURIComponent(id) + "/usage?limit=64");
        openTimelineDrawer(id, r);
      } catch (err) { toast(t("usage.err.load", { msg: err.message }), "danger"); }
    });

    function openTimelineDrawer(keyId, data) {
      $("drawer-title").textContent = t("drawer.timelineTitle", { id: keyId });
      const body = $("key-form");
      body.innerHTML = '<div class="stack" style="gap: 12px;">'
        + stat("demo.summary.total", data.summary.total, "demo.summary.total")
        + stat("demo.summary.success", data.summary.success, "demo.summary.success", "ok")
        + stat("demo.summary.failed", data.summary.error, "demo.summary.failed", "danger")
        + '</div>'
        + '<div class="table-wrap" style="max-height: 480px; margin-top: 12px;">'
        + '<table class="data"><thead><tr><th>' + escapeHtml(t("usage.col.lastUsed")) + '</th><th>' + escapeHtml(t("demo.col.status")) + '</th><th class="num">' + escapeHtml(t("demo.col.latency")) + '</th></tr></thead><tbody>'
        + data.entries.map((e) => '<tr>'
          + '<td class="muted nowrap">' + escapeHtml(new Date(e.at).toLocaleString()) + '</td>'
          + '<td><span class="pill pill-' + (e.outcome === "success" ? "ok" : "danger") + '">' + e.outcome + (e.statusCode ? " " + e.statusCode : "") + (e.errorCode ? " · " + e.errorCode : "") + '</span></td>'
          + '<td class="num">' + e.latencyMs + '</td>'
          + '</tr>').join("")
        + '</tbody></table></div>';
      openDrawer();
    }

    function openDrawer() {
      $("drawer-backdrop").classList.add("open");
      $("drawer").classList.add("open");
      $("drawer-title").textContent = t("drawer.addTitle");
    }
    function closeDrawer() {
      $("drawer-backdrop").classList.remove("open");
      $("drawer").classList.remove("open");
    }
    $("drawer-close").addEventListener("click", closeDrawer);
    $("drawer-cancel").addEventListener("click", closeDrawer);
    $("drawer-backdrop").addEventListener("click", closeDrawer);
    $("drawer-save").addEventListener("click", async () => {
      const payload = {
        provider: $("form-provider").value.trim(),
        providerType: "openai",
        baseUrl: $("form-baseUrl").value.trim(),
        pool: $("form-pool").value.trim(),
        model: $("form-model").value.trim(),
        id: $("form-keyId").value.trim(),
        value: $("form-keyValue").value,
        weight: Number($("form-weight").value || 1)
      };
      const rpm = $("form-rpm").value.trim();
      if (rpm) payload.rpmLimit = Number(rpm);
      try {
        await requestJson("/admin/api/keys", { method: "POST", body: JSON.stringify(payload) });
        toast(t("drawer.saved"), "ok");
        closeDrawer();
        await refreshState();
      } catch (err) {
        toast(t("drawer.saveFail", { msg: err.message }), "danger");
      }
    });

    $("form-preset").addEventListener("change", () => {
      const p = state.presets.find((x) => x.id === $("form-preset").value);
      if (!p) return;
      $("form-provider").value = p.provider;
      $("form-baseUrl").value = p.baseUrl;
      $("form-pool").value = p.pool;
      $("form-model").value = p.model;
      if (!$("form-keyId").value || /^openai-|^minimax-/.test($("form-keyId").value)) {
        $("form-keyId").value = p.keyIdPrefix + "-prod-1";
      }
    });

    const demoTurnsHost = $("demo-turns");
    function addTurn(value) {
      const idx = demoTurnsHost.querySelectorAll(".demo-turn").length;
      const wrap = document.createElement("div");
      wrap.className = "row demo-turn";
      wrap.style.gap = "6px";
      wrap.innerHTML = '<span class="muted" style="min-width: 56px; font-size: 12px;">' + escapeHtml(t("demo.field.turns")) + ' ' + (idx + 1) + '</span>'
        + '<textarea class="demo-turn-input" style="flex: 1; min-height: 56px; height: 56px; resize: vertical; padding: 6px 8px; border: 1px solid var(--line-strong); border-radius: var(--radius); font-family: inherit; font-size: 13px;">' + escapeHtml(value || "") + '</textarea>'
        + '<button type="button" class="btn btn-ghost btn-icon btn-sm demo-turn-remove" title="' + escapeHtml(t("demo.addTurn")) + '">' + ICONS.close + '</button>';
      wrap.querySelector(".demo-turn-remove").addEventListener("click", () => {
        wrap.remove();
        renumberTurns();
      });
      demoTurnsHost.appendChild(wrap);
    }
    function renumberTurns() {
      Array.from(demoTurnsHost.querySelectorAll(".demo-turn")).forEach((el, i) => {
        const label = el.querySelector("span.muted");
        if (label) label.textContent = t("demo.field.turns") + " " + (i + 1);
      });
    }
    function readTurns() {
      return Array.from(demoTurnsHost.querySelectorAll(".demo-turn-input"))
        .map((el) => el.value.trim())
        .filter((v) => v.length > 0);
    }
    function resetTurns() {
      demoTurnsHost.innerHTML = "";
      addTurn("Say hello from KeyPool.");
    }
    resetTurns();
    $("demo-add-turn").addEventListener("click", () => addTurn(""));

    function clearSummary() {
      $("demo-summary").querySelectorAll("[data-metric]").forEach((el) => { el.textContent = "0"; });
      $("demo-results").innerHTML = "";
      $("demo-progress").textContent = "";
    }
    function setStatus(text, kind) {
      const el = $("demo-status");
      el.textContent = text;
      el.className = "pill pill-" + (kind || "neutral") + " pill-dot";
    }
    function statusKey(kind) {
      if (kind === "warn" || kind === "running") return "demo.status.running";
      if (kind === "ok" || kind === "done") return "demo.status.done";
      if (kind === "danger" || kind === "error") return "demo.status.error";
      return "demo.status.idle";
    }

    async function runDemo(mode) {
      const model = $("demo-model").value;
      if (!model) { toast(t("demo.err.noModel"), "warn"); return; }
      const turns = readTurns();
      const prompt = turns[0] || "";
      const payload = { model };
      if (mode === "single") {
        if (prompt) payload.prompt = prompt;
        payload.count = 1;
      } else if (mode === "multi") {
        if (turns.length > 0) payload.turns = turns;
        else if (prompt) payload.prompt = prompt;
        payload.count = 1;
      } else if (mode === "load") {
        if (prompt) payload.prompt = prompt;
        payload.count = Math.max(1, Math.min(500, Number($("demo-count").value) || 1));
        payload.intervalMs = Math.max(0, Math.min(10000, Number($("demo-interval").value) || 0));
      }
      const sid = $("demo-session").value.trim();
      if (sid) payload.sessionId = sid;
      const strat = $("demo-strategy").value;
      if (strat) payload.strategy = strat;

      clearSummary();
      setStatus(t("demo.status.running"), "warn");
      $("demo-progress").textContent = "";

      try {
        const data = await requestJson("/_demo/chat", { method: "POST", body: JSON.stringify(payload) });
        renderDemoResult(data);
        setStatus(t("demo.status.done"), data.summary.failed === 0 ? "ok" : "warn");
        $("demo-progress").textContent = t("demo.progress.session") + " " + data.sessionId.slice(0, 8);
        await refreshState();
      } catch (err) {
        setStatus(t("demo.status.error"), "danger");
        $("demo-progress").textContent = (err.body && err.body.error && err.body.error.message) || err.message;
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    function renderDemoResult(data) {
      const set = (k, v) => {
        const el = $("demo-summary").querySelector('[data-metric="' + k + '"]');
        if (el) el.textContent = String(v);
      };
      set("total", data.summary.total);
      set("success", data.summary.success);
      set("failed", data.summary.failed);
      set("avg", data.summary.avgLatencyMs);
      set("p50", data.summary.p50LatencyMs);
      set("p95", data.summary.p95LatencyMs);
      set("keys", data.summary.distinctKeys);
      const keysList = $("demo-summary").querySelector('[data-metric="keysList"]');
      if (keysList) keysList.textContent = data.summary.distinctKeyIds.join(" · ") || "—";

      const tbody = $("demo-results");
      $("demo-empty").classList.add("hidden");
      tbody.innerHTML = data.results.map((r) => {
        const statusClass = r.status >= 200 && r.status < 400 ? "ok" : "danger";
        const attemptsHtml = r.attempts.map((a, idx) => {
          const isFinal = idx === r.attempts.length - 1;
          const cls = a.outcome === "success" ? "attempt-ok" : "attempt-err";
          const label = a.outcome + (a.statusCode ? " " + a.statusCode : "") + (a.errorCode ? " " + a.errorCode : "");
          return '<span class="attempt-chip ' + cls + (isFinal ? " attempt-final" : "") + '" title="' + escapeHtml(a.keyId) + " · " + a.latencyMs + 'ms">' + escapeHtml(label) + '</span>';
        }).join('<span class="muted" style="font-size: 11px;">→</span>');
        const responseText = r.error
          ? (r.error.code + " · " + r.error.message)
          : (r.responseText || "").slice(0, 80);
        return '<tr>'
          + '<td class="checkbox-cell muted">' + r.turn + '</td>'
          + '<td><span class="pill pill-' + statusClass + '"><span class="status-code">' + r.status + '</span></span></td>'
          + '<td><code>' + escapeHtml(r.servedBy) + '</code> <span class="muted" style="font-size: 12px;">' + escapeHtml(r.keyId) + '</span></td>'
          + '<td><div class="attempts">' + attemptsHtml + '</div></td>'
          + '<td class="num">' + r.latencyMs + '</td>'
          + '<td style="white-space: normal; max-width: 360px;"><span class="muted" style="font-size: 12px;">' + escapeHtml(responseText) + '</span></td>'
          + '</tr>';
      }).join("");
    }

    $("demo-run-single").addEventListener("click", () => runDemo("single"));
    $("demo-run-multi").addEventListener("click", () => runDemo("multi"));
    $("demo-run-load").addEventListener("click", () => runDemo("load"));
    $("demo-clear").addEventListener("click", () => {
      clearSummary();
      $("demo-empty").classList.remove("hidden");
      setStatus(t("demo.status.idle"), "neutral");
    });

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
    function pillKindForStatus(status) {
      if (status === "healthy") return "ok";
      if (status === "degraded" || status === "cooling_down") return "warn";
      if (status === "disabled") return "neutral";
      return "info";
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
