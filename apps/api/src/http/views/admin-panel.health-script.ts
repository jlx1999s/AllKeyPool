export function renderAdminPanelHealthScript(): string {
  return String.raw`    const healthState = {
      items: [],
      page: null,
      stats: null,
      range: "all",
      level: "",
      type: "",
      keyId: ""
    };

    function buildHealthQueryString(cursor) {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (cursor) params.set("cursor", cursor);
      if (healthState.range && healthState.range !== "all") params.set("since", rangeToSince(healthState.range));
      if (healthState.level) params.set("level", healthState.level);
      if (healthState.type) params.set("type", healthState.type);
      if (healthState.keyId) params.set("keyId", healthState.keyId);
      return "?" + params.toString();
    }

    function rangeToSince(range) {
      const ms = range === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      return new Date(Date.now() - ms).toISOString();
    }

    async function refreshHealth() {
      try {
        const data = await requestJson("/admin/api/health-events" + buildHealthQueryString());
        healthState.items = data.events || [];
        healthState.page = data.page || null;
        healthState.stats = data.stats || null;
        renderHealthStats();
        renderHealthTable();
        renderHealthSummary();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    async function loadMoreHealth() {
      if (!(healthState.page && healthState.page.nextCursor)) return;
      try {
        const data = await requestJson("/admin/api/health-events" + buildHealthQueryString(healthState.page.nextCursor));
        healthState.items = healthState.items.concat(data.events || []);
        healthState.page = data.page || null;
        healthState.stats = data.stats || healthState.stats;
        renderHealthTable();
        renderHealthSummary();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    function renderHealthStats() {
      const host = $("health-stats");
      if (!host) return;
      const s = healthState.stats || { total: 0, byLevel: { info: 0, warn: 0, error: 0 } };
      host.innerHTML = ''
        + stat("health.stat.total", s.total, "health.stat.totalFoot")
        + stat("health.stat.info", (s.byLevel && s.byLevel.info) || 0, "health.stat.infoFoot", "ok")
        + stat("health.stat.warn", (s.byLevel && s.byLevel.warn) || 0, "health.stat.warnFoot", "warn")
        + stat("health.stat.error", (s.byLevel && s.byLevel.error) || 0, "health.stat.errorFoot", "danger");
    }

    function renderHealthSummary() {
      const el = $("health-summary");
      if (!el) return;
      el.textContent = t("health.summary", {
        total: healthState.items.length,
        more: healthState.page && healthState.page.hasMore ? 1 : 0
      });
      const more = $("health-more");
      if (more) more.classList.toggle("hidden", !(healthState.page && healthState.page.hasMore));
    }

    function renderHealthTable() {
      const tbody = $("health-body");
      if (!tbody) return;
      if (healthState.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><h3>' + escapeHtml(t("usage.health.empty")) + '</h3></div></td></tr>';
        return;
      }
      tbody.innerHTML = healthState.items.map((entry) => {
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

    document.querySelectorAll("#health-time-seg .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#health-time-seg .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        healthState.range = btn.getAttribute("data-range") || "all";
        refreshHealth();
      });
    });
    document.querySelectorAll("#health-level-seg .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#health-level-seg .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        healthState.level = btn.getAttribute("data-level") || "";
        refreshHealth();
      });
    });
    const healthTypeFilter = $("health-type-filter");
    if (healthTypeFilter) {
      healthTypeFilter.addEventListener("change", () => {
        healthState.type = healthTypeFilter.value;
        refreshHealth();
      });
    }
    const healthKeyFilter = $("health-key-filter");
    if (healthKeyFilter) {
      healthKeyFilter.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          healthState.keyId = healthKeyFilter.value.trim();
          refreshHealth();
        }
      });
    }
    const healthRefreshBtn = $("health-refresh-btn");
    if (healthRefreshBtn) healthRefreshBtn.addEventListener("click", refreshHealth);
    const healthMore = $("health-more");
    if (healthMore) healthMore.addEventListener("click", loadMoreHealth);
`;
}
