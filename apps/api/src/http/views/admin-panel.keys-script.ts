export function renderAdminPanelKeysScript(): string {
  return String.raw`    function renderKeys() {
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

    function pillKindForStatus(status) {
      if (status === "healthy") return "ok";
      if (status === "degraded" || status === "cooling_down") return "warn";
      if (status === "disabled") return "neutral";
      return "info";
    }
`;
}
