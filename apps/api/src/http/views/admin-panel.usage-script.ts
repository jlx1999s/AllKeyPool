export function renderAdminPanelUsageScript(): string {
  return String.raw`    async function refreshUsage() {
      try {
        const data = await requestJson("/admin/api/state");
        const usageData = await requestJson("/admin/api/usage" + buildUsageEventQueryString());
        const healthData = await requestJson("/admin/api/health-events" + buildHealthEventQueryString());
        state.keys = data.keys;
        state.usageEvents = usageData.usage || [];
        state.usageEventPage = usageData.page || null;
        state.usageEventStats = usageData.stats || null;
        state.healthEvents = healthData.events || [];
        state.healthEventPage = healthData.page || null;
        state.healthEventStats = healthData.stats || null;
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
          renderUsageEvents();
          renderHealthEvents();
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
        renderUsageEvents();
        renderHealthEvents();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    async function loadMoreUsageEvents() {
      if (!(state.usageEventPage && state.usageEventPage.nextCursor)) return;
      try {
        const data = await requestJson("/admin/api/usage" + buildUsageEventQueryString(state.usageEventPage.nextCursor));
        state.usageEvents = state.usageEvents.concat(data.usage || []);
        state.usageEventPage = data.page || null;
        state.usageEventStats = data.stats || state.usageEventStats;
        renderUsageEvents();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    async function loadMoreHealthEvents() {
      if (!(state.healthEventPage && state.healthEventPage.nextCursor)) return;
      try {
        const data = await requestJson("/admin/api/health-events" + buildHealthEventQueryString(state.healthEventPage.nextCursor));
        state.healthEvents = state.healthEvents.concat(data.events || []);
        state.healthEventPage = data.page || null;
        state.healthEventStats = data.stats || state.healthEventStats;
        renderHealthEvents();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    function buildUsageEventQueryString(cursor) {
      const params = new URLSearchParams();
      params.set("limit", "50");
      const outcome = $("usage-event-outcome-filter").value;
      const provider = $("usage-event-provider-filter").value;
      const keyId = $("usage-event-key-filter").value.trim();
      if (cursor) params.set("cursor", cursor);
      if (outcome) params.set("outcome", outcome);
      if (provider) params.set("provider", provider);
      if (keyId) params.set("keyId", keyId);
      return "?" + params.toString();
    }

    function buildHealthEventQueryString(cursor) {
      const params = new URLSearchParams();
      params.set("limit", "50");
      const type = $("health-event-type-filter").value;
      const level = $("health-event-level-filter").value;
      const keyId = $("health-event-key-filter").value.trim();
      if (cursor) params.set("cursor", cursor);
      if (type) params.set("type", type);
      if (level) params.set("level", level);
      if (keyId) params.set("keyId", keyId);
      return "?" + params.toString();
    }

    function renderUsageEvents() {
      const tbody = $("usage-events-body");
      if (!tbody) return;
      const summary = $("usage-events-summary");
      const more = $("usage-events-more");
      if (summary) {
        const stats = state.usageEventStats || { total: 0, success: 0, error: 0, avgLatencyMs: 0 };
        summary.textContent = t("usage.events.summary", {
          total: stats.total,
          success: stats.success,
          error: stats.error,
          avg: stats.avgLatencyMs
        });
      }
      if (more) {
        more.classList.toggle("hidden", !(state.usageEventPage && state.usageEventPage.hasMore));
      }
      if (state.usageEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><h3>' + escapeHtml(t("usage.events.empty")) + '</h3></div></td></tr>';
        return;
      }
      tbody.innerHTML = state.usageEvents.map((entry) => {
        const outcomeKind = entry.outcome === "success" ? "ok" : "danger";
        return '<tr>'
          + '<td class="muted nowrap">' + escapeHtml(new Date(entry.createdAt).toLocaleString()) + '</td>'
          + '<td><code>' + escapeHtml(entry.keyId || "—") + '</code></td>'
          + '<td>' + escapeHtml(entry.provider || "—") + '</td>'
          + '<td class="mono">' + escapeHtml(entry.model || "—") + '</td>'
          + '<td><span class="pill pill-' + outcomeKind + ' pill-dot">' + escapeHtml(entry.outcome) + ' ' + escapeHtml(entry.statusCode ?? "—") + '</span></td>'
          + '<td class="num">' + escapeHtml(entry.latencyMs ?? 0) + ' ms</td>'
          + '</tr>';
      }).join("");
    }

    function renderHealthEvents() {
      const tbody = $("health-events-body");
      if (!tbody) return;
      const summary = $("health-events-summary");
      const more = $("health-events-more");
      if (summary) {
        const stats = state.healthEventStats || { total: 0, byLevel: { info: 0, warn: 0, error: 0 } };
        summary.textContent = t("usage.health.summary", {
          total: stats.total,
          info: (stats.byLevel && stats.byLevel.info) || 0,
          warn: (stats.byLevel && stats.byLevel.warn) || 0,
          error: (stats.byLevel && stats.byLevel.error) || 0
        });
      }
      if (more) {
        more.classList.toggle("hidden", !(state.healthEventPage && state.healthEventPage.hasMore));
      }
      if (state.healthEvents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><h3>' + escapeHtml(t("usage.health.empty")) + '</h3></div></td></tr>';
        return;
      }
      tbody.innerHTML = state.healthEvents.map((entry) => {
        const levelKind = entry.level === "error" ? "danger" : entry.level === "warn" ? "warn" : "info";
        return '<tr>'
          + '<td class="muted nowrap">' + escapeHtml(new Date(entry.createdAt).toLocaleString()) + '</td>'
          + '<td><code>' + escapeHtml(entry.type) + '</code></td>'
          + '<td><span class="pill pill-' + levelKind + ' pill-dot">' + escapeHtml(entry.level) + '</span></td>'
          + '<td><code>' + escapeHtml(entry.keyId || "—") + '</code></td>'
          + '<td class="mono">' + escapeHtml(entry.code || "—") + '</td>'
          + '<td style="white-space: normal; max-width: 420px;">' + escapeHtml(entry.message || "—") + '</td>'
          + '</tr>';
      }).join("");
    }

    $("usage-refresh-btn").addEventListener("click", refreshUsage);
    $("usage-event-outcome-filter").addEventListener("change", refreshUsage);
    $("usage-event-provider-filter").addEventListener("change", refreshUsage);
    $("health-event-type-filter").addEventListener("change", refreshUsage);
    $("health-event-level-filter").addEventListener("change", refreshUsage);
    $("usage-events-more").addEventListener("click", loadMoreUsageEvents);
    $("health-events-more").addEventListener("click", loadMoreHealthEvents);
    $("usage-event-key-filter").addEventListener("keydown", (e) => {
      if (e.key === "Enter") refreshUsage();
    });
    $("health-event-key-filter").addEventListener("keydown", (e) => {
      if (e.key === "Enter") refreshUsage();
    });
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
`;
}
