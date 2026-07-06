export interface AdminPanelViewOptions {
  usingDevToken: boolean;
}

interface I18nDictionary {
  [key: string]: string;
}

const I18N_EN: I18nDictionary = {
  "brand.name": "KeyPool",
  "brand.tag": "console",
  "env.checking": "checking…",
  "env.fake": "Fake provider mode",
  "env.live": "Live providers",
  "topbar.docs": "Docs",
  "topbar.refresh": "Refresh",
  "topbar.logout": "Logout",
  "topbar.lang": "Language",

  "nav.workspace": "Workspace",
  "nav.observe": "Observe",
  "nav.system": "System",
  "nav.overview": "Overview",
  "nav.demo": "Demo Runner",
  "nav.keys": "Keys",
  "nav.pools": "Pools",
  "nav.usage": "Usage",
  "nav.settings": "Settings",
  "nav.demo.badge": "Run",
  "nav.usage.badge": "Live",

  "page.overview.title": "Overview",
  "page.overview.desc": "Platform-wide health, key inventory, and recent activity.",
  "page.overview.refresh": "↻ Refresh",
  "page.overview.openDemo": "▶ Open Demo Runner",
  "page.overview.viewAll": "View all usage →",
  "ov.stat.providers": "Providers",
  "ov.stat.pools": "Pools",
  "ov.stat.keys": "Keys",
  "ov.stat.fake": "Fake mode",
  "ov.stat.poolsFoot": "Routing groups",
  "ov.stat.fakeFoot": "No upstream traffic",
  "ov.recent.title": "Recent activity",
  "ov.col.key": "Key",
  "ov.col.provider": "Provider",
  "ov.col.pool": "Pool",
  "ov.col.total": "Total",
  "ov.col.success": "Success",
  "ov.col.failed": "Failed",
  "ov.col.lastUsed": "Last used",
  "ov.empty.title": "No keys yet",
  "ov.empty.desc": "Add your first key to start routing traffic.",

  "page.demo.title": "Demo Runner",
  "page.demo.desc": "Simulate real user traffic. Watch scheduling, retries, and quotas in real time.",
  "demo.status.idle": "idle",
  "demo.status.running": "running…",
  "demo.status.done": "done",
  "demo.status.error": "error",
  "demo.request.title": "Request",
  "demo.field.model": "Model",
  "demo.field.modelHint": "from registered pools",
  "demo.field.modelPlaceholder": "— pick a model —",
  "demo.field.session": "Session ID",
  "demo.field.sessionHint": "optional · sticky",
  "demo.field.sessionPlaceholder": "leave blank to auto-generate",
  "demo.field.turns": "Turns",
  "demo.field.turnsHint": "user messages in order",
  "demo.addTurn": "+ Add turn",
  "demo.field.count": "Count",
  "demo.field.countHint": "repeat N",
  "demo.field.interval": "Interval ms",
  "demo.field.intervalHint": "between repeats",
  "demo.field.strategy": "Strategy",
  "demo.field.strategyHint": "override pool default",
  "demo.strategy.default": "— use pool default —",
  "demo.run.single": "▶ Run single",
  "demo.run.multi": "Run multi-turn",
  "demo.run.load": "⚡ Load test",
  "demo.summary.title": "Summary",
  "demo.summary.total": "Total",
  "demo.summary.success": "Success",
  "demo.summary.failed": "Failed",
  "demo.summary.avg": "Avg ms",
  "demo.summary.p50": "p50 ms",
  "demo.summary.p95": "p95 ms",
  "demo.summary.keys": "Distinct keys hit",
  "demo.results.title": "Results",
  "demo.results.clear": "Clear",
  "demo.results.emptyTitle": "No runs yet",
  "demo.results.emptyDesc": "Configure a request on the left and hit Run. Results will appear here with full retry chains.",
  "demo.col.status": "Status",
  "demo.col.key": "Key",
  "demo.col.attempts": "Attempts",
  "demo.col.latency": "Latency",
  "demo.col.response": "Response",
  "demo.progress.session": "session",
  "demo.err.noModel": "Pick a model first",

  "page.keys.title": "API Keys",
  "page.keys.desc": "Manage the keys in your pool. Each key belongs to one provider and one pool.",
  "keys.add": "＋ Add key",
  "keys.searchPlaceholder": "Search by id, provider, pool…",
  "keys.filter.all": "All statuses",
  "keys.filter.allProv": "All providers",
  "keys.col.id": "ID",
  "keys.col.provider": "Provider",
  "keys.col.pool": "Pool",
  "keys.col.status": "Status",
  "keys.col.weight": "Weight",
  "keys.col.rpm": "RPM",
  "keys.col.usage24h": "24h req",
  "keys.col.lastUsed": "Last used",
  "keys.col.secret": "Secret",
  "keys.col.actions": "Actions",
  "keys.act.test": "Test",
  "keys.act.toggle": "Toggle status",
  "keys.act.delete": "Delete",
  "keys.confirmDelete": "Delete key {id}?",
  "keys.empty.title": "No keys match",
  "keys.empty.desc": "Adjust your filters, or add a new key to get started.",
  "keys.toast.deleted": "Key deleted",
  "keys.toast.statusOk": "Key {status}",
  "keys.toast.delFail": "Delete failed: {msg}",
  "keys.toast.updateFail": "Update failed: {msg}",

  "page.pools.title": "Pools",
  "page.pools.desc": "Routing groups. Each pool binds a strategy to one or more providers/models.",
  "pools.add": "＋ New pool",
  "pools.view": "View",
  "pools.keys": "{n} keys",
  "pools.empty.title": "No pools yet",
  "pools.empty.desc": "Create a pool to group providers and bind a scheduling strategy.",
  "pools.noModels": "no models",

  "page.usage.title": "Usage",
  "page.usage.desc": "Per-key request timeline. Last 64 events per key, kept in memory.",
  "usage.refresh": "↻ Refresh",
  "usage.foot": "hover rows for details",
  "usage.stat.totalReq": "Total requests",
  "usage.stat.totalReqFoot": "across all keys",
  "usage.stat.success": "Success",
  "usage.stat.successFoot": "in-memory only",
  "usage.stat.failed": "Failed",
  "usage.stat.failedFoot": "in-memory only",
  "usage.stat.rate": "Success rate",
  "usage.stat.rateFoot": "rolling window",
  "usage.col.key": "Key",
  "usage.col.provider": "Provider",
  "usage.col.pool": "Pool",
  "usage.col.total": "Total",
  "usage.col.success": "Success",
  "usage.col.failed": "Failed",
  "usage.col.avg": "Avg ms",
  "usage.col.lastUsed": "Last used",
  "usage.view": "Timeline →",
  "usage.empty.title": "No keys yet",
  "usage.empty.desc": "Usage appears here once you add keys and start routing traffic.",
  "usage.err.load": "Failed to load usage: {msg}",

  "page.settings.title": "Settings",
  "page.settings.desc": "Runtime configuration and auth.",
  "settings.auth.title": "Authentication",
  "settings.auth.token": "Admin token",
  "settings.auth.authenticated": "authenticated",
  "settings.runtime.title": "Runtime",
  "settings.runtime.host": "Server host",
  "settings.runtime.port": "Server port",
  "settings.runtime.retry": "Max retry attempts",
  "settings.runtime.fake": "Provider mode",
  "settings.openapi.title": "OpenAPI reference",
  "settings.openapi.desc": "All admin endpoints are served under /admin/api/* and the demo runner under /_demo/*.",
  "settings.openapi.health": "Health",
  "settings.openapi.session": "Session",
  "settings.openapi.state": "State",
  "settings.openapi.keys": "Keys CRUD",
  "settings.openapi.keyUsage": "Key usage",
  "settings.openapi.chat": "Chat proxy",
  "settings.openapi.demo": "Demo runner",

  "drawer.addTitle": "Add key",
  "drawer.timelineTitle": "Timeline · {id}",
  "drawer.cancel": "Cancel",
  "drawer.save": "Save key",
  "drawer.preset": "Provider preset",
  "drawer.presetManual": "Manual",
  "drawer.field.provider": "Provider",
  "drawer.field.pool": "Pool",
  "drawer.field.baseUrl": "Base URL",
  "drawer.field.model": "Model",
  "drawer.field.keyId": "Key ID",
  "drawer.field.keyIdPlaceholder": "my-key-1",
  "drawer.field.keyValue": "API Key",
  "drawer.field.keyValuePlaceholder": "sk-...",
  "drawer.field.weight": "Weight",
  "drawer.field.rpm": "RPM",
  "drawer.field.rpmHint": "optional",
  "drawer.saved": "Key added",
  "drawer.saveFail": "Save failed: {msg}",

  "auth.title": "Sign in",
  "auth.desc": "Enter your admin token to unlock the console.",
  "auth.tokenLabel": "Admin token",
  "auth.tokenPlaceholder": "Bearer token",
  "auth.submit": "Unlock",
  "auth.badToken": "Invalid token: {msg}",
  "auth.sessionExpired": "Session expired",
  "auth.signedIn": "Signed in",

  "toast.foot": "Live",
  "version": "KeyPool v0.1.0"
};

const I18N_ZH: I18nDictionary = {
  "brand.name": "KeyPool",
  "brand.tag": "控制台",
  "env.checking": "检查中…",
  "env.fake": "Fake 提供方模式",
  "env.live": "真实提供方",
  "topbar.docs": "文档",
  "topbar.refresh": "刷新",
  "topbar.logout": "退出",
  "topbar.lang": "语言",

  "nav.workspace": "工作区",
  "nav.observe": "观测",
  "nav.system": "系统",
  "nav.overview": "概览",
  "nav.demo": "模拟运行",
  "nav.keys": "密钥",
  "nav.pools": "密钥池",
  "nav.usage": "用量",
  "nav.settings": "设置",
  "nav.demo.badge": "运行",
  "nav.usage.badge": "实时",

  "page.overview.title": "概览",
  "page.overview.desc": "平台运行状况、密钥清单与最近活动。",
  "page.overview.refresh": "↻ 刷新",
  "page.overview.openDemo": "▶ 打开模拟运行",
  "page.overview.viewAll": "查看全部用量 →",
  "ov.stat.providers": "提供方",
  "ov.stat.pools": "密钥池",
  "ov.stat.keys": "密钥",
  "ov.stat.fake": "Fake 模式",
  "ov.stat.poolsFoot": "路由分组",
  "ov.stat.fakeFoot": "无上游流量",
  "ov.recent.title": "最近活动",
  "ov.col.key": "密钥",
  "ov.col.provider": "提供方",
  "ov.col.pool": "密钥池",
  "ov.col.total": "总请求",
  "ov.col.success": "成功",
  "ov.col.failed": "失败",
  "ov.col.lastUsed": "最近使用",
  "ov.empty.title": "暂无密钥",
  "ov.empty.desc": "添加第一个密钥以开始路由流量。",

  "page.demo.title": "模拟运行",
  "page.demo.desc": "模拟真实用户流量,实时观察调度、重试与限流。",
  "demo.status.idle": "空闲",
  "demo.status.running": "运行中…",
  "demo.status.done": "完成",
  "demo.status.error": "错误",
  "demo.request.title": "请求",
  "demo.field.model": "模型",
  "demo.field.modelHint": "从已注册池选择",
  "demo.field.modelPlaceholder": "— 选择模型 —",
  "demo.field.session": "会话 ID",
  "demo.field.sessionHint": "可选 · 粘性",
  "demo.field.sessionPlaceholder": "留空自动生成",
  "demo.field.turns": "轮次",
  "demo.field.turnsHint": "按顺序的用户消息",
  "demo.addTurn": "+ 新增轮次",
  "demo.field.count": "次数",
  "demo.field.countHint": "重复 N 次",
  "demo.field.interval": "间隔(毫秒)",
  "demo.field.intervalHint": "每次之间",
  "demo.field.strategy": "策略",
  "demo.field.strategyHint": "覆盖池默认",
  "demo.strategy.default": "— 使用池默认 —",
  "demo.run.single": "▶ 单次",
  "demo.run.multi": "多轮",
  "demo.run.load": "⚡ 压测",
  "demo.summary.title": "汇总",
  "demo.summary.total": "总请求",
  "demo.summary.success": "成功",
  "demo.summary.failed": "失败",
  "demo.summary.avg": "平均 ms",
  "demo.summary.p50": "p50 ms",
  "demo.summary.p95": "p95 ms",
  "demo.summary.keys": "命中的不同密钥",
  "demo.results.title": "结果",
  "demo.results.clear": "清空",
  "demo.results.emptyTitle": "暂无运行",
  "demo.results.emptyDesc": "在左侧配置请求并点击运行,结果与完整重试链会显示在这里。",
  "demo.col.status": "状态",
  "demo.col.key": "密钥",
  "demo.col.attempts": "重试链",
  "demo.col.latency": "耗时",
  "demo.col.response": "响应",
  "demo.progress.session": "会话",
  "demo.err.noModel": "请先选择模型",

  "page.keys.title": "API 密钥",
  "page.keys.desc": "管理密钥池中的密钥。每个密钥属于一个提供方和一个池。",
  "keys.add": "＋ 新增密钥",
  "keys.searchPlaceholder": "按 ID、提供方、池搜索…",
  "keys.filter.all": "所有状态",
  "keys.filter.allProv": "所有提供方",
  "keys.col.id": "ID",
  "keys.col.provider": "提供方",
  "keys.col.pool": "密钥池",
  "keys.col.status": "状态",
  "keys.col.weight": "权重",
  "keys.col.rpm": "RPM",
  "keys.col.usage24h": "24h 请求",
  "keys.col.lastUsed": "最近使用",
  "keys.col.secret": "密钥",
  "keys.col.actions": "操作",
  "keys.act.test": "测试",
  "keys.act.toggle": "切换状态",
  "keys.act.delete": "删除",
  "keys.confirmDelete": "删除密钥 {id}?",
  "keys.empty.title": "无匹配密钥",
  "keys.empty.desc": "调整筛选条件,或新增一个密钥开始。",
  "keys.toast.deleted": "已删除密钥",
  "keys.toast.statusOk": "密钥已{status}",
  "keys.toast.delFail": "删除失败:{msg}",
  "keys.toast.updateFail": "更新失败:{msg}",

  "page.pools.title": "密钥池",
  "page.pools.desc": "路由分组。每个池将一种策略绑定到一个或多个提供方/模型。",
  "pools.add": "＋ 新建池",
  "pools.view": "查看",
  "pools.keys": "{n} 个密钥",
  "pools.empty.title": "暂无密钥池",
  "pools.empty.desc": "新建一个池以将提供方分组并绑定调度策略。",
  "pools.noModels": "无模型",

  "page.usage.title": "用量",
  "page.usage.desc": "按密钥的请求时间线。每个密钥保留最近 64 条事件,内存中。",
  "usage.refresh": "↻ 刷新",
  "usage.foot": "鼠标悬停查看详情",
  "usage.stat.totalReq": "总请求",
  "usage.stat.totalReqFoot": "所有密钥合计",
  "usage.stat.success": "成功",
  "usage.stat.successFoot": "仅内存记录",
  "usage.stat.failed": "失败",
  "usage.stat.failedFoot": "仅内存记录",
  "usage.stat.rate": "成功率",
  "usage.stat.rateFoot": "滚动窗口",
  "usage.col.key": "密钥",
  "usage.col.provider": "提供方",
  "usage.col.pool": "密钥池",
  "usage.col.total": "总请求",
  "usage.col.success": "成功",
  "usage.col.failed": "失败",
  "usage.col.avg": "平均 ms",
  "usage.col.lastUsed": "最近使用",
  "usage.view": "时间线 →",
  "usage.empty.title": "暂无密钥",
  "usage.empty.desc": "添加密钥并开始路由流量后,用量将显示在这里。",
  "usage.err.load": "加载用量失败:{msg}",

  "page.settings.title": "设置",
  "page.settings.desc": "运行时配置与鉴权。",
  "settings.auth.title": "鉴权",
  "settings.auth.token": "Admin Token",
  "settings.auth.authenticated": "已认证",
  "settings.runtime.title": "运行时",
  "settings.runtime.host": "服务端 Host",
  "settings.runtime.port": "服务端 Port",
  "settings.runtime.retry": "最大重试次数",
  "settings.runtime.fake": "提供方模式",
  "settings.openapi.title": "OpenAPI 参考",
  "settings.openapi.desc": "所有管理端点位于 /admin/api/*,模拟运行端点位于 /_demo/*。",
  "settings.openapi.health": "健康检查",
  "settings.openapi.session": "会话",
  "settings.openapi.state": "状态",
  "settings.openapi.keys": "密钥 CRUD",
  "settings.openapi.keyUsage": "密钥用量",
  "settings.openapi.chat": "聊天代理",
  "settings.openapi.demo": "模拟运行",

  "drawer.addTitle": "新增密钥",
  "drawer.timelineTitle": "时间线 · {id}",
  "drawer.cancel": "取消",
  "drawer.save": "保存密钥",
  "drawer.preset": "提供方预设",
  "drawer.presetManual": "手动",
  "drawer.field.provider": "提供方",
  "drawer.field.pool": "密钥池",
  "drawer.field.baseUrl": "Base URL",
  "drawer.field.model": "模型",
  "drawer.field.keyId": "密钥 ID",
  "drawer.field.keyIdPlaceholder": "my-key-1",
  "drawer.field.keyValue": "API Key",
  "drawer.field.keyValuePlaceholder": "sk-...",
  "drawer.field.weight": "权重",
  "drawer.field.rpm": "RPM",
  "drawer.field.rpmHint": "可选",
  "drawer.saved": "已添加密钥",
  "drawer.saveFail": "保存失败:{msg}",

  "auth.title": "登录",
  "auth.desc": "输入 admin token 以解锁控制台。",
  "auth.tokenLabel": "Admin Token",
  "auth.tokenPlaceholder": "Bearer token",
  "auth.submit": "解锁",
  "auth.badToken": "Token 无效:{msg}",
  "auth.sessionExpired": "会话已过期",
  "auth.signedIn": "已登录",

  "toast.foot": "实时",
  "version": "KeyPool v0.1.0"
};

const I18N_DICTS: Record<string, I18nDictionary> = { en: I18N_EN, "zh-CN": I18N_ZH };

export function renderAdminPanelHtml(options: AdminPanelViewOptions): string {
  const devTokenHint = options.usingDevToken
    ? `<span class="pill pill-warn" data-i18n-html="devTokenHint"><span data-i18n="devTokenPrefix">dev token</span>: <code>keypool-admin-dev</code></span>`
    : `<span class="pill pill-ok" data-i18n="env.authEnabled">admin auth enabled</span>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KeyPool Console</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230F766E'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-family='monospace' fill='white' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E">
  <style>
    :root {
      color-scheme: light;
      --bg-canvas: #F9FAFB;
      --bg-panel: #FFFFFF;
      --bg-subtle: #F3F4F6;
      --bg-hover: #F9FAFB;
      --line: #E5E7EB;
      --line-strong: #D1D5DB;
      --text: #111827;
      --text-muted: #6B7280;
      --text-subtle: #9CA3AF;
      --brand: #0F766E;
      --brand-strong: #115E59;
      --brand-bg: #F0FDFA;
      --accent: #2563EB;
      --accent-strong: #1D4ED8;
      --ok: #059669; --ok-bg: #ECFDF5;
      --warn: #D97706; --warn-bg: #FEF3C7;
      --danger: #DC2626; --danger-bg: #FEE2E2;
      --info: #0284C7; --info-bg: #E0F2FE;
      --neutral: #4B5563; --neutral-bg: #F3F4F6;
      --radius-sm: 4px;
      --radius: 6px;
      --radius-lg: 8px;
      --radius-xl: 12px;
      --shadow-sm: 0 1px 2px rgba(16,24,40,.04);
      --shadow: 0 4px 8px -2px rgba(16,24,40,.06), 0 2px 4px -2px rgba(16,24,40,.04);
      --shadow-lg: 0 12px 24px -4px rgba(16,24,40,.10), 0 4px 8px -2px rgba(16,24,40,.06);
      --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      background: var(--bg-canvas);
      color: var(--text);
      font-family: var(--font);
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    code, pre, .mono { font-family: var(--font-mono); font-size: 12.5px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    button { font-family: inherit; }
    input, select, textarea { font-family: inherit; font-size: 14px; }

    .app { display: grid; grid-template-rows: 56px 1fr; min-height: 100vh; }
    .topbar {
      display: flex; align-items: center; gap: 16px;
      padding: 0 20px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--line);
      position: sticky; top: 0; z-index: 20;
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; }
    .brand-mark {
      width: 28px; height: 28px; border-radius: var(--radius);
      background: var(--brand); color: #fff;
      display: grid; place-items: center;
      font-family: var(--font-mono); font-weight: 700;
    }
    .brand-text { font-size: 15px; letter-spacing: -0.01em; }
    .brand-text small { color: var(--text-muted); font-weight: 500; font-size: 12px; margin-left: 4px; }
    .topbar-spacer { flex: 1; }
    .topbar-actions { display: flex; gap: 8px; align-items: center; }
    .env-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 10px; border-radius: 999px;
      background: var(--brand-bg); color: var(--brand-strong);
      font-size: 12px; font-weight: 600;
    }
    .env-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--brand); }

    .lang-switch {
      display: inline-flex; align-items: center;
      background: var(--bg-subtle);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px;
      font-size: 12px;
      font-weight: 600;
    }
    .lang-btn {
      padding: 3px 10px;
      border: none; background: transparent;
      color: var(--text-muted);
      border-radius: 999px;
      cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .lang-btn:hover { color: var(--text); }
    .lang-btn.active {
      background: var(--bg-panel);
      color: var(--text);
      box-shadow: var(--shadow-sm);
    }

    .shell { display: grid; grid-template-columns: 240px 1fr; }
    @media (max-width: 900px) { .shell { grid-template-columns: 1fr; } }

    .sidebar {
      background: var(--bg-panel);
      border-right: 1px solid var(--line);
      padding: 16px 12px;
      display: flex; flex-direction: column; gap: 4px;
      min-height: 0;
    }
    .nav-section { margin-top: 12px; }
    .nav-section:first-child { margin-top: 0; }
    .nav-section-label {
      font-size: 11px; font-weight: 600; color: var(--text-subtle);
      letter-spacing: 0.06em; text-transform: uppercase;
      padding: 0 12px 6px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: var(--radius);
      color: var(--text); cursor: pointer;
      font-size: 14px; font-weight: 500;
      user-select: none;
    }
    .nav-item:hover { background: var(--bg-subtle); }
    .nav-item.active {
      background: var(--brand-bg); color: var(--brand-strong);
    }
    .nav-item .icon { width: 18px; height: 18px; flex: none; opacity: 0.8; }
    .nav-item.active .icon { opacity: 1; }
    .nav-item .badge {
      margin-left: auto;
      background: var(--bg-subtle); color: var(--text-muted);
      font-size: 11px; font-weight: 600;
      padding: 2px 6px; border-radius: 999px;
    }
    .nav-item.active .badge { background: var(--brand); color: #fff; }
    .sidebar-footer { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--line); }

    .main {
      padding: 24px 32px 48px;
      max-width: 1400px;
      width: 100%;
    }
    @media (max-width: 900px) { .main { padding: 16px; } }

    .page { display: none; }
    .page.active { display: block; }

    .page-head {
      display: flex; align-items: flex-end; gap: 16px;
      margin-bottom: 24px;
    }
    .page-head h1 {
      margin: 0 0 4px; font-size: 22px; font-weight: 700; letter-spacing: -0.01em;
    }
    .page-head p { margin: 0; color: var(--text-muted); font-size: 13px; }
    .page-head .actions { margin-left: auto; display: flex; gap: 8px; }

    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 12px; height: 34px;
      border-radius: var(--radius); border: 1px solid transparent;
      background: transparent; color: var(--text);
      font-size: 13px; font-weight: 600;
      cursor: pointer;
      transition: background 120ms, border-color 120ms, color 120ms;
      white-space: nowrap;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary {
      background: var(--accent); color: #fff; border-color: var(--accent);
    }
    .btn-primary:hover:not(:disabled) { background: var(--accent-strong); border-color: var(--accent-strong); }
    .btn-brand {
      background: var(--brand); color: #fff; border-color: var(--brand);
    }
    .btn-brand:hover:not(:disabled) { background: var(--brand-strong); border-color: var(--brand-strong); }
    .btn-secondary {
      background: var(--bg-panel); color: var(--text); border-color: var(--line-strong);
    }
    .btn-secondary:hover:not(:disabled) { background: var(--bg-subtle); }
    .btn-ghost {
      background: transparent; color: var(--text-muted);
    }
    .btn-ghost:hover:not(:disabled) { background: var(--bg-subtle); color: var(--text); }
    .btn-danger {
      background: #fff; color: var(--danger); border-color: var(--danger);
    }
    .btn-danger:hover:not(:disabled) { background: var(--danger); color: #fff; }
    .btn-sm { height: 28px; font-size: 12px; padding: 0 10px; }
    .btn-icon {
      width: 34px; height: 34px; padding: 0; justify-content: center;
    }
    .btn svg { width: 14px; height: 14px; }

    .panel {
      background: var(--bg-panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .panel-head {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--line);
    }
    .panel-head h2 { margin: 0; font-size: 14px; font-weight: 700; letter-spacing: -0.005em; }
    .panel-head .actions { margin-left: auto; display: flex; gap: 6px; }
    .panel-body { padding: 20px; }
    .panel-body.tight { padding: 0; }

    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat {
      background: var(--bg-panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      padding: 14px 16px;
    }
    .stat-label {
      font-size: 12px; color: var(--text-muted);
      display: flex; align-items: center; gap: 6px;
    }
    .stat-value {
      font-size: 24px; font-weight: 700; letter-spacing: -0.02em;
      margin-top: 4px;
      font-variant-numeric: tabular-nums;
    }
    .stat-foot {
      font-size: 12px; color: var(--text-muted);
      margin-top: 2px;
    }
    .stat-foot .delta-up { color: var(--ok); }
    .stat-foot .delta-down { color: var(--danger); }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px 16px;
    }
    .form-grid .full { grid-column: 1 / -1; }
    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label {
      font-size: 12px; font-weight: 600; color: var(--text-muted);
      display: flex; align-items: center; gap: 6px;
    }
    .field .hint { font-size: 11px; color: var(--text-subtle); font-weight: 500; }
    .field input, .field select, .field textarea {
      height: 36px; padding: 0 10px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      background: #fff; color: var(--text);
      outline: none;
      transition: border-color 120ms, box-shadow 120ms;
    }
    .field textarea { height: auto; min-height: 80px; padding: 8px 10px; resize: vertical; }
    .field input:focus, .field select:focus, .field textarea:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px var(--brand-bg);
    }
    .field-row { display: flex; gap: 8px; }

    .table-wrap { overflow: auto; }
    table.data {
      width: 100%; border-collapse: collapse; min-width: 720px;
    }
    table.data thead th {
      position: sticky; top: 0; z-index: 1;
      background: var(--bg-subtle);
      text-align: left;
      font-size: 11px; font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.04em; text-transform: uppercase;
      padding: 10px 14px;
      border-bottom: 1px solid var(--line);
    }
    table.data tbody td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      font-size: 13px;
      vertical-align: middle;
    }
    table.data tbody tr:hover { background: var(--bg-hover); }
    table.data tbody tr:last-child td { border-bottom: 0; }
    table.data .num { text-align: right; font-variant-numeric: tabular-nums; }
    table.data .checkbox-cell { width: 36px; padding-left: 16px; padding-right: 0; }

    .table-toolbar {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
      background: var(--bg-panel);
    }
    .search {
      position: relative; flex: 1; max-width: 360px;
    }
    .search input {
      width: 100%; height: 34px;
      padding: 0 10px 0 32px;
      border: 1px solid var(--line-strong);
      border-radius: var(--radius);
      background: var(--bg-canvas);
    }
    .search input:focus { border-color: var(--brand); background: #fff; box-shadow: 0 0 0 3px var(--brand-bg); }
    .search svg {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      width: 14px; height: 14px; color: var(--text-subtle);
    }
    .filter-select {
      height: 34px; padding: 0 10px;
      border: 1px solid var(--line-strong); border-radius: var(--radius);
      background: #fff; color: var(--text);
    }

    .pill {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600; line-height: 1.4;
      white-space: nowrap;
    }
    .pill-ok { background: var(--ok-bg); color: var(--ok); }
    .pill-warn { background: var(--warn-bg); color: var(--warn); }
    .pill-danger { background: var(--danger-bg); color: var(--danger); }
    .pill-info { background: var(--info-bg); color: var(--info); }
    .pill-neutral { background: var(--neutral-bg); color: var(--neutral); }
    .pill-brand { background: var(--brand-bg); color: var(--brand-strong); }
    .pill-dot::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-code { font-family: var(--font-mono); font-weight: 600; }

    .empty {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 60px 24px;
      text-align: center;
      color: var(--text-muted);
    }
    .empty .icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--bg-subtle); display: grid; place-items: center;
      color: var(--text-subtle);
    }
    .empty h3 { margin: 0; font-size: 15px; color: var(--text); }
    .empty p { margin: 0; font-size: 13px; max-width: 360px; }

    .key-cell {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 2px 6px; border-radius: var(--radius-sm);
      background: var(--bg-subtle); color: var(--text-muted);
      font-family: var(--font-mono); font-size: 12px;
    }

    .drawer-backdrop {
      position: fixed; inset: 0; background: rgba(16,24,40,.36);
      z-index: 40; opacity: 0; pointer-events: none;
      transition: opacity 160ms ease;
    }
    .drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 420px; max-width: 100vw;
      background: var(--bg-panel);
      box-shadow: var(--shadow-lg);
      z-index: 50;
      transform: translateX(100%);
      transition: transform 180ms ease;
      display: flex; flex-direction: column;
    }
    .drawer.open { transform: translateX(0); }
    .drawer-head {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--line);
    }
    .drawer-head h2 { margin: 0; font-size: 15px; font-weight: 700; }
    .drawer-body { padding: 20px; overflow: auto; flex: 1; }
    .drawer-foot {
      padding: 12px 20px;
      border-top: 1px solid var(--line);
      display: flex; gap: 8px; justify-content: flex-end;
    }

    .toast-host {
      position: fixed; bottom: 24px; right: 24px;
      display: flex; flex-direction: column; gap: 8px;
      z-index: 60;
    }
    .toast {
      background: var(--text);
      color: #fff;
      padding: 10px 14px;
      border-radius: var(--radius);
      font-size: 13px;
      box-shadow: var(--shadow-lg);
      min-width: 240px;
      animation: slideIn 160ms ease;
    }
    .toast.toast-ok { background: var(--ok); }
    .toast.toast-danger { background: var(--danger); }
    .toast.toast-warn { background: var(--warn); }
    @keyframes slideIn {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .progress {
      width: 100%; height: 4px;
      background: var(--bg-subtle);
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: var(--brand);
      transition: width 200ms ease;
    }

    .attempts {
      display: flex; flex-wrap: wrap; gap: 4px;
      margin-top: 4px;
    }
    .attempt-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 1px 6px;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 11px;
      background: var(--bg-subtle); color: var(--text-muted);
    }
    .attempt-chip.attempt-ok { background: var(--ok-bg); color: var(--ok); }
    .attempt-chip.attempt-err { background: var(--danger-bg); color: var(--danger); }
    .attempt-chip.attempt-final { box-shadow: inset 0 0 0 1px currentColor; }

    .auth-overlay {
      position: fixed; inset: 0;
      background: var(--bg-canvas);
      display: grid; place-items: center;
      z-index: 100;
    }
    .auth-card {
      width: 100%; max-width: 380px;
      background: var(--bg-panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-xl);
      padding: 28px;
      box-shadow: var(--shadow);
    }
    .auth-card .brand { justify-content: center; margin-bottom: 8px; }
    .auth-card h1 { font-size: 18px; text-align: center; margin: 8px 0 4px; }
    .auth-card p { text-align: center; color: var(--text-muted); margin: 0 0 20px; font-size: 13px; }
    .auth-card .lang-switch { margin: 0 auto 16px; }

    .row { display: flex; gap: 8px; align-items: center; }
    .stack { display: flex; flex-direction: column; gap: 12px; }
    .stack-lg { display: flex; flex-direction: column; gap: 20px; }
    .muted { color: var(--text-muted); }
    .subtle { color: var(--text-subtle); }
    .grow { flex: 1; }
    .hidden { display: none !important; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
    .text-right { text-align: right; }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .nowrap { white-space: nowrap; }

    .split { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
    @media (max-width: 1100px) { .split { grid-template-columns: 1fr; } }

    .pool-card {
      background: var(--bg-panel);
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
      transition: border-color 120ms, box-shadow 120ms;
    }
    .pool-card:hover { border-color: var(--line-strong); box-shadow: var(--shadow-sm); }
    .pool-card-head { display: flex; align-items: center; gap: 8px; }
    .pool-card-head h3 { margin: 0; font-size: 14px; font-weight: 700; }
    .pool-card-foot { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="app" id="app">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div class="brand-text"><span data-i18n="brand.name">KeyPool</span> <small data-i18n="brand.tag">console</small></div>
      </div>
      <div class="env-pill" id="env-pill" data-i18n="env.checking">checking…</div>
      <div class="topbar-spacer"></div>
      <div class="topbar-actions">
        <div class="lang-switch" id="lang-switch" role="group" aria-label="Language">
          <button class="lang-btn" data-lang="en" type="button">EN</button>
          <button class="lang-btn" data-lang="zh-CN" type="button">中</button>
        </div>
        <button class="btn btn-ghost btn-sm" id="docs-btn" title="OpenAPI reference" data-i18n-title="page.settings.openapi.title" data-i18n="topbar.docs">Docs</button>
        <button class="btn btn-ghost btn-sm" id="refresh-btn" title="Refresh" data-i18n-title="topbar.refresh" data-i18n="topbar.refresh">↻</button>
        <button class="btn btn-ghost btn-sm" id="logout-btn" data-i18n="topbar.logout">Logout</button>
      </div>
    </header>

    <div class="shell">
      <aside class="sidebar">
        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.workspace">Workspace</div>
          <div class="nav-item active" data-route="overview">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>
            <span data-i18n="nav.overview">Overview</span>
          </div>
          <div class="nav-item" data-route="demo">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>
            <span data-i18n="nav.demo">Demo Runner</span>
            <span class="badge" data-i18n="nav.demo.badge">Run</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.manage">Manage</div>
          <div class="nav-item" data-route="keys">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <span data-i18n="nav.keys">Keys</span>
            <span class="badge" id="nav-keys-count">0</span>
          </div>
          <div class="nav-item" data-route="pools">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            <span data-i18n="nav.pools">Pools</span>
            <span class="badge" id="nav-pools-count">0</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.observe">Observe</div>
          <div class="nav-item" data-route="usage">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>
            <span data-i18n="nav.usage">Usage</span>
            <span class="badge" data-i18n="nav.usage.badge">Live</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-label" data-i18n="nav.system">System</div>
          <div class="nav-item" data-route="settings">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span data-i18n="nav.settings">Settings</span>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="muted" style="font-size: 11px; padding: 0 12px;" data-i18n="version">KeyPool v0.1.0</div>
        </div>
      </aside>

      <main class="main">
        <section class="page active" data-page="overview">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.overview.title">Overview</h1>
              <p data-i18n="page.overview.desc">Platform-wide health, key inventory, and recent activity.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="overview-refresh-btn" data-i18n="page.overview.refresh">↻ Refresh</button>
              <button class="btn btn-primary" id="overview-go-demo" data-i18n="page.overview.openDemo">▶ Open Demo Runner</button>
            </div>
          </div>

          <div class="stat-grid">
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.providers">Providers</div>
              <div class="stat-value" id="ov-providers">—</div>
              <div class="stat-foot"><span id="ov-providers-names">—</span></div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.pools">Pools</div>
              <div class="stat-value" id="ov-pools">—</div>
              <div class="stat-foot" data-i18n="ov.stat.poolsFoot">Routing groups</div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.keys">Keys</div>
              <div class="stat-value" id="ov-keys">—</div>
              <div class="stat-foot"><span id="ov-keys-active">0</span> <span data-i18n="ov.col.success">active</span> · <span id="ov-keys-disabled">0</span> <span data-i18n="ov.col.failed">disabled</span></div>
            </div>
            <div class="stat">
              <div class="stat-label" data-i18n="ov.stat.fake">Fake mode</div>
              <div class="stat-value" id="ov-fake">—</div>
              <div class="stat-foot" data-i18n="ov.stat.fakeFoot">No upstream traffic</div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head">
              <h2 data-i18n="ov.recent.title">Recent activity</h2>
              <div class="actions">
                <button class="btn btn-ghost btn-sm" data-route="usage" data-i18n="page.overview.viewAll">View all usage →</button>
              </div>
            </div>
            <div class="table-wrap" id="ov-activity-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="ov.col.key">Key</th>
                    <th data-i18n="ov.col.provider">Provider</th>
                    <th data-i18n="ov.col.pool">Pool</th>
                    <th class="num" data-i18n="ov.col.total">Total</th>
                    <th class="num" data-i18n="ov.col.success">Success</th>
                    <th class="num" data-i18n="ov.col.failed">Failed</th>
                    <th data-i18n="ov.col.lastUsed">Last used</th>
                  </tr>
                </thead>
                <tbody id="ov-activity"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="page" data-page="demo">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.demo.title">Demo Runner</h1>
              <p data-i18n="page.demo.desc">Simulate real user traffic. Watch scheduling, retries, and quotas in real time.</p>
            </div>
            <div class="actions">
              <span class="pill pill-dot" id="demo-status" data-i18n="demo.status.idle">idle</span>
            </div>
          </div>

          <div class="split">
            <div class="panel">
              <div class="panel-head"><h2 data-i18n="demo.request.title">Request</h2></div>
              <div class="panel-body stack">
                <div class="field">
                  <label><span data-i18n="demo.field.model">Model</span> <span class="hint" data-i18n="demo.field.modelHint">from registered pools</span></label>
                  <select id="demo-model"></select>
                </div>
                <div class="field">
                  <label><span data-i18n="demo.field.session">Session ID</span> <span class="hint" data-i18n="demo.field.sessionHint">optional · sticky</span></label>
                  <input id="demo-session" data-i18n-placeholder="demo.field.sessionPlaceholder" placeholder="leave blank to auto-generate">
                </div>

                <div class="field">
                  <label style="justify-content: space-between; width: 100%;">
                    <span><span data-i18n="demo.field.turns">Turns</span> <span class="hint" data-i18n="demo.field.turnsHint">user messages in order</span></span>
                    <button type="button" class="btn btn-ghost btn-sm" id="demo-add-turn" data-i18n="demo.addTurn">+ Add turn</button>
                  </label>
                  <div id="demo-turns" class="stack" style="gap: 6px;"></div>
                </div>

                <div class="form-grid">
                  <div class="field">
                    <label><span data-i18n="demo.field.count">Count</span> <span class="hint" data-i18n="demo.field.countHint">repeat N</span></label>
                    <input id="demo-count" type="number" min="1" max="500" value="1">
                  </div>
                  <div class="field">
                    <label><span data-i18n="demo.field.interval">Interval ms</span> <span class="hint" data-i18n="demo.field.intervalHint">between repeats</span></label>
                    <input id="demo-interval" type="number" min="0" max="10000" value="0">
                  </div>
                  <div class="field full">
                    <label><span data-i18n="demo.field.strategy">Strategy</span> <span class="hint" data-i18n="demo.field.strategyHint">override pool default</span></label>
                    <select id="demo-strategy">
                      <option value="" data-i18n="demo.strategy.default">— use pool default —</option>
                      <option value="round_robin">round_robin</option>
                      <option value="weighted_round_robin">weighted_round_robin</option>
                    </select>
                  </div>
                </div>

                <div class="row" style="margin-top: 4px;">
                  <button class="btn btn-primary" id="demo-run-single" data-i18n="demo.run.single">▶ Run single</button>
                  <button class="btn btn-secondary" id="demo-run-multi" data-i18n="demo.run.multi">Run multi-turn</button>
                  <button class="btn btn-secondary" id="demo-run-load" data-i18n="demo.run.load">⚡ Load test</button>
                </div>
              </div>
            </div>

            <div class="stack-lg">
              <div class="stat-grid" id="demo-summary">
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.total">Total</div><div class="stat-value" data-metric="total">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.success">Success</div><div class="stat-value" data-metric="success" style="color: var(--ok);">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.failed">Failed</div><div class="stat-value" data-metric="failed" style="color: var(--danger);">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.avg">Avg ms</div><div class="stat-value" data-metric="avg">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.p50">p50 ms</div><div class="stat-value" data-metric="p50">0</div></div>
                <div class="stat"><div class="stat-label" data-i18n="demo.summary.p95">p95 ms</div><div class="stat-value" data-metric="p95">0</div></div>
                <div class="stat" style="grid-column: span 3;">
                  <div class="stat-label" data-i18n="demo.summary.keys">Distinct keys hit</div>
                  <div class="stat-value" data-metric="keys">0</div>
                  <div class="stat-foot mono truncate" data-metric="keysList">—</div>
                </div>
              </div>

              <div class="panel">
                <div class="panel-head">
                  <h2 data-i18n="demo.results.title">Results</h2>
                  <div class="actions">
                    <span class="muted" id="demo-progress" style="font-size: 12px;"></span>
                    <button class="btn btn-ghost btn-sm" id="demo-clear" data-i18n="demo.results.clear">Clear</button>
                  </div>
                </div>
                <div class="table-wrap" style="max-height: 540px;">
                  <table class="data">
                    <thead>
                      <tr>
                        <th class="checkbox-cell">#</th>
                        <th data-i18n="demo.col.status">Status</th>
                        <th data-i18n="demo.col.key">Key</th>
                        <th data-i18n="demo.col.attempts">Attempts</th>
                        <th class="num" data-i18n="demo.col.latency">Latency</th>
                        <th data-i18n="demo.col.response">Response</th>
                      </tr>
                    </thead>
                    <tbody id="demo-results"></tbody>
                  </table>
                </div>
                <div id="demo-empty" class="empty">
                  <div class="icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                  </div>
                  <h3 data-i18n="demo.results.emptyTitle">No runs yet</h3>
                  <p data-i18n="demo.results.emptyDesc">Configure a request on the left and hit Run. Results will appear here with full retry chains.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="page" data-page="keys">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.keys.title">API Keys</h1>
              <p data-i18n="page.keys.desc">Manage the keys in your pool. Each key belongs to one provider and one pool.</p>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="keys-add-btn" data-i18n="keys.add">＋ Add key</button>
            </div>
          </div>

          <div class="panel">
            <div class="table-toolbar">
              <div class="search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
                <input id="keys-search" data-i18n-placeholder="keys.searchPlaceholder" placeholder="Search by id, provider, pool…">
              </div>
              <select class="filter-select" id="keys-status-filter">
                <option value="" data-i18n="keys.filter.all">All statuses</option>
                <option value="healthy">healthy</option>
                <option value="degraded">degraded</option>
                <option value="cooling_down">cooling_down</option>
                <option value="disabled">disabled</option>
              </select>
              <select class="filter-select" id="keys-provider-filter">
                <option value="" data-i18n="keys.filter.allProv">All providers</option>
              </select>
            </div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th class="checkbox-cell"></th>
                    <th data-i18n="keys.col.id">ID</th>
                    <th data-i18n="keys.col.provider">Provider</th>
                    <th data-i18n="keys.col.pool">Pool</th>
                    <th data-i18n="keys.col.status">Status</th>
                    <th class="num" data-i18n="keys.col.weight">Weight</th>
                    <th class="num" data-i18n="keys.col.rpm">RPM</th>
                    <th class="num" data-i18n="keys.col.usage24h">24h req</th>
                    <th data-i18n="keys.col.lastUsed">Last used</th>
                    <th data-i18n="keys.col.secret">Secret</th>
                    <th class="text-right" style="padding-right: 16px;" data-i18n="keys.col.actions">Actions</th>
                  </tr>
                </thead>
                <tbody id="keys-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="page" data-page="pools">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.pools.title">Pools</h1>
              <p data-i18n="page.pools.desc">Routing groups. Each pool binds a strategy to one or more providers/models.</p>
            </div>
            <div class="actions">
              <button class="btn btn-primary" id="pools-add-btn" data-i18n="pools.add">＋ New pool</button>
            </div>
          </div>
          <div id="pools-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;"></div>
        </section>

        <section class="page" data-page="usage">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.usage.title">Usage</h1>
              <p data-i18n="page.usage.desc">Per-key request timeline. Last 64 events per key, kept in memory.</p>
            </div>
            <div class="actions">
              <button class="btn btn-secondary" id="usage-refresh-btn" data-i18n="usage.refresh">↻ Refresh</button>
            </div>
          </div>

          <div class="stat-grid" id="usage-stats"></div>

          <div class="panel">
            <div class="panel-head">
              <h2 data-i18n="usage.col.key">Key timeline</h2>
              <div class="actions">
                <span class="muted" style="font-size: 12px;" data-i18n="usage.foot">hover rows for details</span>
              </div>
            </div>
            <div class="table-wrap">
              <table class="data">
                <thead>
                  <tr>
                    <th data-i18n="usage.col.key">Key</th>
                    <th data-i18n="usage.col.provider">Provider</th>
                    <th data-i18n="usage.col.pool">Pool</th>
                    <th class="num" data-i18n="usage.col.total">Total</th>
                    <th class="num" data-i18n="usage.col.success">Success</th>
                    <th class="num" data-i18n="usage.col.failed">Failed</th>
                    <th class="num" data-i18n="usage.col.avg">Avg ms</th>
                    <th data-i18n="usage.col.lastUsed">Last used</th>
                    <th class="text-right" style="padding-right: 16px;" data-i18n="usage.view">View</th>
                  </tr>
                </thead>
                <tbody id="usage-body"></tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="page" data-page="settings">
          <div class="page-head">
            <div>
              <h1 data-i18n="page.settings.title">Settings</h1>
              <p data-i18n="page.settings.desc">Runtime configuration and auth.</p>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.auth.title">Authentication</h2></div>
            <div class="panel-body stack">
              <div class="row">
                <div class="grow">
                  <div style="font-weight: 600;" data-i18n="settings.auth.token">Admin token</div>
                  <div class="muted" style="font-size: 13px;" id="settings-token-mode">—</div>
                </div>
                <span class="pill pill-dot pill-ok" id="settings-auth-pill" data-i18n="settings.auth.authenticated">authenticated</span>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.runtime.title">Runtime</h2></div>
            <div class="panel-body">
              <div class="form-grid">
                <div class="field"><label data-i18n="settings.runtime.host">Server host</label><input id="settings-host" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.port">Server port</label><input id="settings-port" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.retry">Max retry attempts</label><input id="settings-retry" disabled></div>
                <div class="field"><label data-i18n="settings.runtime.fake">Provider mode</label><input id="settings-fake" disabled></div>
              </div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-head"><h2 data-i18n="settings.openapi.title">OpenAPI reference</h2></div>
            <div class="panel-body stack">
              <p class="muted" data-i18n="settings.openapi.desc">All admin endpoints are served under /admin/api/* and the demo runner under /_demo/*.</p>
              <div class="form-grid">
                <div class="field"><label data-i18n="settings.openapi.health">Health</label><input class="mono" value="GET /health" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.session">Session</label><input class="mono" value="GET /admin/api/session" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.state">State</label><input class="mono" value="GET /admin/api/state" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.keys">Keys CRUD</label><input class="mono" value="POST/PATCH/DELETE /admin/api/keys" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.keyUsage">Key usage</label><input class="mono" value="GET /admin/api/keys/:id/usage" disabled></div>
                <div class="field"><label data-i18n="settings.openapi.chat">Chat proxy</label><input class="mono" value="POST /v1/chat/completions" disabled></div>
                <div class="field full"><label data-i18n="settings.openapi.demo">Demo runner</label><input class="mono" value="POST /_demo/chat" disabled></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>

  <div class="drawer-backdrop" id="drawer-backdrop"></div>
  <aside class="drawer" id="drawer" aria-hidden="true">
    <div class="drawer-head">
      <h2 id="drawer-title" data-i18n="drawer.addTitle">Add key</h2>
      <button class="btn btn-ghost btn-icon btn-sm" id="drawer-close" style="margin-left: auto;">✕</button>
    </div>
    <div class="drawer-body">
      <form id="key-form" class="stack">
        <div class="field">
          <label data-i18n="drawer.preset">Provider preset</label>
          <select id="form-preset">
            <option value="" data-i18n="drawer.presetManual">Manual</option>
          </select>
        </div>
        <div class="form-grid">
          <div class="field">
            <label data-i18n="drawer.field.provider">Provider</label>
            <input id="form-provider" value="openai">
          </div>
          <div class="field">
            <label data-i18n="drawer.field.pool">Pool</label>
            <input id="form-pool" value="text_generation">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.baseUrl">Base URL</label>
            <input id="form-baseUrl" value="https://api.openai.com/v1">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.model">Model</label>
            <input id="form-model" value="gpt-4.1-mini">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.keyId">Key ID</label>
            <input id="form-keyId" data-i18n-placeholder="drawer.field.keyIdPlaceholder" placeholder="my-key-1">
          </div>
          <div class="field full">
            <label data-i18n="drawer.field.keyValue">API Key</label>
            <input id="form-keyValue" type="password" data-i18n-placeholder="drawer.field.keyValuePlaceholder" placeholder="sk-..." autocomplete="new-password">
          </div>
          <div class="field">
            <label data-i18n="drawer.field.weight">Weight</label>
            <input id="form-weight" type="number" min="1" value="1">
          </div>
          <div class="field">
            <label><span data-i18n="drawer.field.rpm">RPM</span> <span class="hint" data-i18n="drawer.field.rpmHint">optional</span></label>
            <input id="form-rpm" type="number" min="1" placeholder="unlimited">
          </div>
        </div>
      </form>
    </div>
    <div class="drawer-foot">
      <button class="btn btn-ghost" id="drawer-cancel" data-i18n="drawer.cancel">Cancel</button>
      <button class="btn btn-primary" id="drawer-save" data-i18n="drawer.save">Save key</button>
    </div>
  </aside>

  <div class="toast-host" id="toast-host"></div>

  <div class="auth-overlay" id="auth-overlay">
    <div class="auth-card">
      <div class="brand">
        <div class="brand-mark">K</div>
        <div class="brand-text"><span data-i18n="brand.name">KeyPool</span> <small data-i18n="brand.tag">console</small></div>
      </div>
      <h1 data-i18n="auth.title">Sign in</h1>
      <p data-i18n="auth.desc">Enter your admin token to unlock the console.</p>
      <div class="lang-switch" id="auth-lang-switch" role="group" aria-label="Language">
        <button class="lang-btn" data-lang="en" type="button">EN</button>
        <button class="lang-btn" data-lang="zh-CN" type="button">中</button>
      </div>
      <form id="auth-form" class="stack">
        <div class="field">
          <label data-i18n="auth.tokenLabel">Admin token</label>
          <input id="adminToken" type="password" autocomplete="current-password" data-i18n-placeholder="auth.tokenPlaceholder" placeholder="Bearer token">
        </div>
        <button class="btn btn-primary" type="submit" style="width: 100%; height: 38px;" data-i18n="auth.submit">Unlock</button>
        <p class="muted" style="text-align: center; font-size: 12px;">${devTokenHint}</p>
      </form>
    </div>
  </div>

  <script>
    const I18N = ${JSON.stringify(I18N_DICTS)};
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
    const state = { keys: [], pools: [], providers: [], presets: [], fakeProvider: false, server: null, retry: null };
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
    })();
  </script>
</body>
</html>`;
}
