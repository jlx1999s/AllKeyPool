export const ADMIN_PANEL_CSS = String.raw`    :root {
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

    .seg {
      display: inline-flex; align-items: center;
      background: var(--bg-subtle);
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 2px;
      font-size: 12px;
      font-weight: 600;
    }
    .seg-btn {
      padding: 3px 10px;
      border: none; background: transparent;
      color: var(--text-muted);
      border-radius: 999px;
      cursor: pointer;
      transition: background 120ms, color 120ms;
    }
    .seg-btn:hover { color: var(--text); }
    .seg-btn.active {
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
    .pool-card-foot { display: flex; align-items: center; gap: 8px; margin-top: 4px; }`;
