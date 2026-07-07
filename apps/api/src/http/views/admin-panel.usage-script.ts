export function renderAdminPanelUsageScript(): string {
  return String.raw`    async function refreshUsage() {
      try {
        const data = await requestJson("/admin/api/state");
        state.keys = data.keys;
        const stats = $("usage-stats");
        const totalReq = state.keys.reduce((a, k) => a + ((k.usage && k.usage.total) || 0), 0);
        const totalSucc = state.keys.reduce((a, k) => a + ((k.usage && k.usage.success) || 0), 0);
        const totalErr = state.keys.reduce((a, k) => a + ((k.usage && k.usage.error) || 0), 0);
        const succRate = totalReq > 0 ? ((totalSucc / totalReq) * 100).toFixed(1) : "—";
        if (stats) {
          stats.innerHTML = ''
            + stat("usage.stat.totalReq", totalReq, "usage.stat.totalReqFoot")
            + stat("usage.stat.success", totalSucc, "usage.stat.successFoot", "ok")
            + stat("usage.stat.failed", totalErr, "usage.stat.failedFoot", "danger")
            + stat("usage.stat.rate", succRate + (totalReq > 0 ? "%" : ""), "usage.stat.rateFoot");
        }
        const tbody = $("usage-body");
        if (!tbody) return;
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

    $("usage-refresh-btn").addEventListener("click", refreshUsage);
    const usageBody = $("usage-body");
    if (usageBody) {
      usageBody.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-act='timeline']");
        if (!btn) return;
        const id = btn.dataset.keyId;
        try {
          const r = await requestJson("/admin/api/keys/" + encodeURIComponent(id) + "/usage?limit=64");
          openTimelineDrawer(id, r);
        } catch (err) { toast(t("usage.err.load", { msg: err.message }), "danger"); }
      });
    }

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
