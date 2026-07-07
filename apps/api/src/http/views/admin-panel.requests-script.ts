export function renderAdminPanelRequestsScript(): string {
  return String.raw`    const requestsState = {
      items: [],
      page: null,
      stats: null,
      range: "all",
      outcome: "",
      provider: "",
      keyId: ""
    };

    function buildRequestsQueryString(cursor) {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (cursor) params.set("cursor", cursor);
      if (requestsState.range && requestsState.range !== "all") params.set("since", rangeToSince(requestsState.range));
      if (requestsState.outcome) params.set("outcome", requestsState.outcome);
      if (requestsState.provider) params.set("provider", requestsState.provider);
      if (requestsState.keyId) params.set("keyId", requestsState.keyId);
      return "?" + params.toString();
    }

    function rangeToSince(range) {
      const ms = range === "1h" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      return new Date(Date.now() - ms).toISOString();
    }

    async function refreshRequests() {
      try {
        const data = await requestJson("/admin/api/usage" + buildRequestsQueryString());
        requestsState.items = data.usage || [];
        requestsState.page = data.page || null;
        requestsState.stats = data.stats || null;
        renderRequestsStats();
        renderRequestsTable();
        renderRequestsSummary();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    async function loadMoreRequests() {
      if (!(requestsState.page && requestsState.page.nextCursor)) return;
      try {
        const data = await requestJson("/admin/api/usage" + buildRequestsQueryString(requestsState.page.nextCursor));
        requestsState.items = requestsState.items.concat(data.usage || []);
        requestsState.page = data.page || null;
        requestsState.stats = data.stats || requestsState.stats;
        renderRequestsTable();
        renderRequestsSummary();
      } catch (err) {
        toast(t("usage.err.load", { msg: err.message }), "danger");
      }
    }

    function renderRequestsStats() {
      const host = $("requests-stats");
      if (!host) return;
      const s = requestsState.stats || { total: 0, success: 0, error: 0, avgLatencyMs: 0 };
      host.innerHTML = ''
        + stat("usage.stat.totalReq", s.total, "usage.stat.totalReqFoot")
        + stat("usage.stat.success", s.success, "usage.stat.successFoot", "ok")
        + stat("usage.stat.failed", s.error, "usage.stat.failedFoot", "danger")
        + stat("usage.stat.rate", s.avgLatencyMs, "usage.stat.avgFoot");
    }

    function renderRequestsSummary() {
      const el = $("requests-summary");
      if (!el) return;
      el.textContent = t("usage.events.summary", {
        total: requestsState.items.length,
        more: requestsState.page && requestsState.page.hasMore ? 1 : 0
      });
      const more = $("requests-more");
      if (more) more.classList.toggle("hidden", !(requestsState.page && requestsState.page.hasMore));
    }

    function renderRequestsTable() {
      const tbody = $("requests-body");
      if (!tbody) return;
      if (requestsState.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6"><div class="empty"><h3>' + escapeHtml(t("usage.events.empty")) + '</h3></div></td></tr>';
        return;
      }
      tbody.innerHTML = requestsState.items.map((entry) => {
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

    // seg-btn groups: time range + outcome quick filter
    document.querySelectorAll("#requests-time-seg .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#requests-time-seg .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        requestsState.range = btn.getAttribute("data-range") || "all";
        refreshRequests();
      });
    });
    document.querySelectorAll("#requests-outcome-seg .seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#requests-outcome-seg .seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        requestsState.outcome = btn.getAttribute("data-outcome") || "";
        refreshRequests();
      });
    });
    const requestsProviderFilter = $("requests-provider-filter");
    if (requestsProviderFilter) {
      requestsProviderFilter.addEventListener("change", () => {
        requestsState.provider = requestsProviderFilter.value;
        refreshRequests();
      });
    }
    const requestsKeyFilter = $("requests-key-filter");
    if (requestsKeyFilter) {
      requestsKeyFilter.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          requestsState.keyId = requestsKeyFilter.value.trim();
          refreshRequests();
        }
      });
    }
    const requestsRefreshBtn = $("requests-refresh-btn");
    if (requestsRefreshBtn) requestsRefreshBtn.addEventListener("click", refreshRequests);
    const requestsMore = $("requests-more");
    if (requestsMore) requestsMore.addEventListener("click", loadMoreRequests);
`;
}
