export function renderAdminPanelDemoScript(): string {
  return String.raw`    const demoTurnsHost = $("demo-turns");
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
`;
}
