# KeyPool 双 Agent 协作流程（Git 完整版）

> 这份文档写给 KeyPool 的 **PR Reviewer**（你自己）。你同时管 **两个 AI Agent**：
> - **Claude Code**（在 `~/Desktop/KeyPool-claude/`，分支 `feature/claude-backend`，负责后端核心）
> - **Codex / 其他 Agent**（在 `~/Desktop/KeyPool/`，分支 `main` 或 `feature/codex-*`，负责前端视图 / admin 模板）
>
> 两个人共用 **同一个 git 仓库**（`jlx1999s/AllKeyPool`），用 **worktree + 分支** 隔离写入。

---

## 目录

- 0. 一次性环境准备
- 1. 提需求 → 分配 → 写入
- 2. Agent 开发 → 本地提交
- 3. 推到远端
- 4. PR Review + 合并
- 5. 处理冲突
- 6. 同步 + 下一次迭代
- 7. 紧急情况（回滚 / 反悔 / Agent 失控）

---

## 0. 一次性环境准备

只需做一次。后续所有轮次都在这个已准备好的环境上跑。

### 0.1 克隆主仓库

```bash
mkdir -p ~/Desktop && cd ~/Desktop
git clone https://github.com/jlx1999s/AllKeyPool.git KeyPool
cd KeyPool
```

> `KeyPool/` **留给 Codex 用**（或任何一个写前端/视图的 Agent）。

### 0.2 创建我的工作目录（worktree）

```bash
cd ~/Desktop/KeyPool
git worktree add -b feature/claude-backend ../KeyPool-claude main
```

效果：

```
~/Desktop/
├── KeyPool/         ← main 分支（Codex 区域）
└── KeyPool-claude/  ← feature/claude-backend 分支（Claude 区域）
```

两个目录共享同一个 `.git` 后端，commit 历史互通，但文件落盘互不干扰。

### 0.3 验证环境

```bash
cd ~/Desktop/KeyPool && git status -sb           # 应该是: ## main...origin/main
cd ~/Desktop/KeyPool-claude && git status -sb    # 应该是: ## feature/claude-backend
git worktree list                                # 看到两个 worktree
```

### 0.4 各自安装依赖

```bash
cd ~/Desktop/KeyPool && npm install
cd ~/Desktop/KeyPool-claude && npm install
```

---

## 1. 提需求 → 分配 → 写入需求单

### 1.1 需求单模板（写进你自己的笔记，不入 git）

创建一个文件 `~/Desktop/keypool-tickets.md`，每条需求这样写：

```md
## T-2026-07-02-001  v0.3 Circuit Breaker

### 描述
为 Provider 加三态 circuit breaker（Closed / Open / Half-Open）。

### 谁来写（PR Author）
- [ ] Claude  → 分支: `feature/claude-v0.3-breaker`
- [ ] Codex   → 分支: `feature/codex-<其它子类>`

### 验收
- [ ] 单元测试覆盖三态转换
- [ ] 集成测试覆盖"上游持续 5xx → 熔断 → 不再发请求"
- [ ] Prometheus 指标暴露 `keypool_circuit_state{provider,key_id}`

### 关联文件
- `apps/api/src/core/breaker/`（新建）
- `apps/api/src/core/provider-executor/provider-request-executor.ts`（接入）
- `apps/api/src/http/routes/metrics.routes.ts`（新建）

### 优先级
🔥 P0
```

### 1.2 分配原则

| 文件 / 模块 | 默认负责 Agent | 备注 |
|---|---|---|
| `apps/api/src/core/**` | Claude | 后端核心，唯一 owner |
| `apps/api/src/providers/**` | Claude | 供应商抽象 |
| `apps/api/src/storage/**` | Claude | 持久化 |
| `apps/api/src/http/views/**` | Codex | 前端 HTML 模板 |
| `apps/api/src/http/routes/admin.routes.ts` | **协商** | 路由行为归 Claude；模板 HTML 段归 Codex |
| `apps/api/src/security/**` | Claude | 鉴权 |
| `apps/api/src/config/**` | Claude | YAML schema + loader |
| `apps/api/src/http/routes/proxy.routes.ts` | Claude | 代理路由 |
| `apps/api/src/http/routes/health.routes.ts` | Claude | |
| `packages/shared/**` | Claude | 跨包类型契约 |
| `app.ts` / `main.ts` | **协商** | 谁改谁 PR + 提醒另一个 review |
| `package.json` / `tsconfig*` | **协商** | |
| `config/*` / `README.md` / `ROADMAP.md` / `CONTRIBUTING.md` | 各改各 | 不在同一需求里改同一文件 |
| `docs/**` | 各写各 | 文档不需要所有人 review |

**冲突预警区**（提前打招呼）：
- `app.ts`：装配点，两边都可能调
- `provider-registry.ts`：新增 Provider 时两边都可能用
- `admin.routes.ts`：上面说过

### 1.3 把需求递交给 Agent

**发 Claude**（在我下次启动时直接说）：

> "我在 `/Users/jinlingxiao/Desktop/KeyPool-claude/`，分支 `feature/claude-backend`，请基于 `main` 拉分支 `feature/claude-v0.3-breaker`，实现 T-2026-07-02-001，验收清单见我的需求单。完成本地 commit 后通知我，不要 push。"

**发 Codex**（你的另一个 session，类似说法）：

> "我在 `/Users/jinlingxiao/Desktop/KeyPool/`，分支 `main`。请基于 `main` 拉 `feature/codex-<topic>`，实现你的子类，实现完成后本地 commit 通知我，不要 push。"

每个 Agent 完成全部步骤在第 2 节和第 3 节。

---

## 2. Agent 开发 → 本地提交

### 2.1 我（Claude）的标准流程

```bash
# 进入我的工作目录
cd ~/Desktop/KeyPool-claude

# 拉最新 main（拿到 Codex 的合并成果，避免过期）
git fetch origin main
git rebase origin/main

# 基于最新 main 拉特性分支（每个 ticket 一个分支）
git checkout -b feature/claude-v0.3-breaker origin/main

# 写代码、跑测试、跑 typecheck
npm run typecheck
npm test

# 单次 commit（Conventional Commits）
git add .
git commit -m "feat(breaker): add three-state circuit breaker

- Closed → Open after N consecutive failures (default 5)
- Open → HalfOpen after resetTimeout (default 60s)
- HalfOpen → Closed on success, Open on failure
- Exposes metrics via @keypool/metrics
- Tests cover all three transitions

Refs T-2026-07-02-001"

# 验证
git log --oneline -3
git status                # 应该是: nothing to commit, working tree clean

# ⚠️ 不在这一步 push！等用户确认
```

### 2.2 Codex 的标准流程

```bash
cd ~/Desktop/KeyPool
git fetch origin main
git rebase origin/main
git checkout -b feature/codex-admin-batch-ops origin/main
# 写代码、npm run typecheck、npm test
git add .
git commit -m "feat(admin): batch enable/disable keys"
# 不 push，等通知
```

### 2.3 你（PR Reviewer）验收本地

两个 Agent 都通知"commit 完成"后，**用户先在他们终端 review 一次**：

```bash
cd ~/Desktop/KeyPool-claude
git log --oneline origin/main..HEAD    # 看本次 commit
git diff origin/main..HEAD --stat       # 看改了什么
```

或者逐项对照"验收清单"。

---

## 3. 推到远端

⚠️ **这一步 PR Reviewer（你）亲自做**，因为涉及你的 GitHub 凭据。如果让 Agent 自己 push，会暴露 PAT/SSH key。

### 3.1 推送我的特性分支

```bash
cd ~/Desktop/KeyPool-claude
git push -u origin feature/claude-v0.3-breaker
```

成功的话输出：
```
remote: Create a pull request for 'feature/claude-v0.3-breaker' on GitHub by visiting:
remote:      https://github.com/jlx1999s/AllKeyPool/pull/new/feature/claude-v0.3-breaker
```

### 3.2 网络超时的应急处理

如果 `git push` 超时（我在沙盒里就遇到这个问题）：
1. 让 Agent **只本地 commit，不 push**（已完成）
2. PR Reviewer 自己复制 patch：
   ```bash
   cd ~/Desktop/KeyPool-claude
   git format-patch origin/main..HEAD -o /tmp/keypool-patches/
   # 手动把 patches/ 复制到你能 push 的环境
   ```

或直接在 `KeyPool-claude/` 里跑 `git push`（你 push 时用自己的网络环境）。

### 3.3 推送 Codex 的特性分支

```bash
cd ~/Desktop/KeyPool
git push -u origin feature/codex-admin-batch-ops
```

### 3.4 推送次序

**任意**：因为两人分支互不冲突，**谁先 push 都可以**。不要等对方，否则会卡住协作。

---

## 4. PR Review + 合并

每个特性分支一个 PR。

### 4.1 创建 PR

GitHub web 上：
- 进入 https://github.com/jlx1999s/AllKeyPool/pulls
- New Pull Request
- base: `main`，compare: `feature/claude-v0.3-breaker`
- 标题: `feat(breaker): add circuit breaker (T-2026-07-02-001)`
- 描述内容（粘贴）：

```md
## Ticket
T-2026-07-02-001

## 改动概要
- 新增 `apps/api/src/core/breaker/circuit-breaker.ts`
- `provider-request-executor.ts` 接入 breaker
- 新增 `/metrics` 路由暴露 `keypool_circuit_state`

## 验收清单
- [x] 单元测试覆盖三态转换
- [x] 集成测试：上游持续 5xx → Open → 不再发请求
- [x] Prometheus 指标导出

## 测试
```
$ npm run typecheck
$ npm test
...（粘贴输出）
```

## 风险
- executor 行为变更，未走默认配置；CI 必须跑通
```

### 4.2 Reviewer 关注点

| 关注点 | 检查方式 |
|---|---|
| 改对了文件 | `git diff origin/main..HEAD --stat` |
| 没动到不该动的文件 | 排除 `app.ts / admin.routes.ts / package.json / config/*` |
| 测试通过 | `npm test` 输出 |
| typecheck 通过 | `npm run typecheck` 输出 |
| 单一职责 | commit 是否一次只做一件事；不是就要求拆 commit |
| 注释 / 文档 | 公共 API 是否写了 JSDoc |
| 敏感信息 | `git diff` 搜 `sk-` `${.*KEY` `Bearer ` `password ` 等 |

### 4.3 合并策略

| 情况 | 策略 |
|---|---|
| 单 Agent 单 PR，无冲突 | **Squash and merge**（提交历史干净） |
| 单 PR 多 commit 值得保留 | **Rebase and merge**（保留分支轨迹） |
| Codex 和 Claude 都改了 `app.ts` | 走 step 5 处理冲突后 merge |
| 主分支保护已开 | 走 PR review（推荐开 Settings → Branches → Require 1 approval） |

合并后清理：

```bash
cd ~/Desktop/KeyPool
git fetch origin
git rebase origin/main           # sync 你的本地 main 到远端最新 main
git branch -d feature/claude-v0.3-breaker    # 删本地分支（已合并会自动）
```

远程清理在 GitHub web 上 `Close and delete branch`。

---

## 5. 处理冲突

冲突只可能出现在**两个人都改了同一个文件**的情况。常见冲突区：`app.ts`、`admin.routes.ts`、`package.json`、文档合集。

### 5.1 冲突检测

PR 页面会显示 "This branch has conflicts"。

### 5.2 谁来解决？

**PR Author 解决**（更熟本次改动）+ Reviewer 监督。

### 5.3 解决流程

```bash
# 进入出冲突的 Agent 目录（假设是 claude 的 PR）
cd ~/Desktop/KeyPool-claude

# 把 main merge 到当前分支（带冲突标记）
git fetch origin main
git merge origin/main

# git 会输出：
# Auto-merging apps/api/src/app.ts
# CONFLICT (content): Merge conflict in apps/api/src/app.ts

# 手工编辑冲突文件
code apps/api/src/app.ts
```

冲突长这样：
```ts
<<<<<<< HEAD (feature/claude-v0.3-breaker)
const breaker = new CircuitBreaker(...);
app.decorate("circuitBreaker", breaker);
=======
const breaker = new CircuitBreaker(...);   // from Codex
app.decorate("circuitBreaker", breaker);
app.decorate("retryPolicyV2", new RetryPolicyV2(...));
>>>>>>> origin/main

# 沟通解决：保留两边的改动 → 删 >>> / <<< / === 行
```

解决后：
```bash
# 重新跑测试
npm run typecheck && npm test

# 完成 merge
git add apps/api/src/app.ts
git commit --no-edit

# push 回自己的 PR 分支
git push origin HEAD
```

GitHub 上 PR 会自动刷新为 "Mergeable"。

### 5.4 两个人都改 `app.ts` 时的预防

提前在 1.3 分配 task 时就把 `app.ts` 标红：

```
⚠️ 这条 ticket 会改 app.ts，请检查其它 in-flight PR 是否也改 app.ts
```

合并顺序：**先合靠后改 `app.ts` 的，再合另一个**（让后者在已合并的 main 基础上 rebase）。

### 5.5 多次冲突 / 解决不掉

1. 在 GitHub PR 上 "@author" 让他们沟通
2. 如果协调失败：暂时 lock 一个 PR，等另一个合
3. 实在不行：开三方会议（你 + Claude + Codex）决策保留谁

---

## 6. 同步 + 下一次迭代

### 6.1 当前 PR 全部合并后

```bash
# Claude 工作目录同步 main
cd ~/Desktop/KeyPool-claude
git fetch origin
git checkout main
git rebase origin/main
git checkout feature/claude-backend
git rebase origin/main

# Codex 工作目录同步
cd ~/Desktop/KeyPool
git fetch origin
git rebase origin/main
```

### 6.2 下一次迭代开始

回 1.1，创建新 ticket；1.3 分配给 Agent；2 启动开发。

### 6.3 状态面板

每个 ticket 的状态：

| Status | 含义 |
|---|---|
| 🆕 | ticket 创建，待分配 |
| 🚧 Claude-in-progress | Claude 在写 |
| 🚧 Codex-in-progress | Codex 在写 |
| ⏳ local-committed | Agent 已本地 commit，等 PR |
| 📤 pushed | 已 push，等 review |
| 🔍 in-review | PR 已开，待 review |
| 🔀 merge-conflict | 冲突处理中 |
| ✅ merged | 已合并 |
| ❌ abandoned | 取消 |

可以维护在 `~/Desktop/keypool-tickets.md` 顶部。

---

## 7. 紧急情况

### 7.1 Agent 写错了代码 / 改错文件

```bash
cd ~/Desktop/KeyPool-claude
# 看改了啥
git diff origin/main..HEAD
# 回滚所有未 commit 的改动
git checkout -- .
# 已 commit 但未 push：reset
git reset --hard origin/main
# ⚠️ 谨慎用 --hard：会丢本地 commit
```

### 7.2 Agent 推了敏感信息（key / token）

立即：
1. 在 GitHub 上 force-push 清掉历史：
   ```bash
   cd ~/Desktop/KeyPool-claude
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch <敏感文件>" \
     --prune-empty --tag-name-filter cat -- --all
   git push origin --force --all
   ```
2. **轮换所有被泄露的 key**（这是必须的，git 历史不可信）
3. 在 `#keypool-ops` 频道发警报

### 7.3 main 推送错乱（两位 Agent 都 commit main）

```bash
# 谁先发现谁通知对方停下
git push origin main   # 不行：用保护规则，避免任何人能直接 push main

# 解决方案：Settings → Branches → Branch protection rules → main
# 开启 "Require pull request reviews before merging"
# 这样 Agent 再也 commit 不上 main，只能走 PR
```

**建议立刻做的事**：在 GitHub 上把 `main` 加保护规则（Settings → Branches → Add rule）：
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Include administrators

### 7.4 Agent 卡死 / 启动不了 / 跑出错的分支

```bash
# 删 worktree（不动 commit 历史）
git worktree remove --force ~/Desktop/KeyPool-claude

# 想恢复？重新 worktree add
cd ~/Desktop/KeyPool
git worktree add -b feature/claude-backend ../KeyPool-claude origin/main

# commit 丢了的话：reflog 找回
git reflog
git checkout -b feature/claude-backend <lost-commit-sha>
```

### 7.5 远程仓库被破坏 / 需要重建

```bash
# 用本地 main 重建远端 main（慎用！）
cd ~/Desktop/KeyPool
git push --force origin main
```

---

## 8. 速查卡（拷贝走）

### 我是 Claude Code
```bash
cd ~/Desktop/KeyPool-claude
git fetch origin main
git rebase origin/main
git checkout -b feature/claude-<topic> origin/main
# write code
npm run typecheck && npm test
git add . && git commit -m "feat: ..."
# DO NOT push — wait for user
```

### 我是 Codex
```bash
cd ~/Desktop/KeyPool
git fetch origin main
git rebase origin/main
git checkout -b feature/codex-<topic> origin/main
# write code
npm run typecheck && npm test
git add . && git commit -m "feat: ..."
# DO NOT push — wait for user
```

### 我是 PR Reviewer
```bash
# 每日节奏
cd ~/Desktop/KeyPool          # review Codex 的改动
git fetch origin
git diff origin/main..feature/codex-<topic>

cd ~/Desktop/KeyPool-claude   # review Claude 的改动
git fetch origin
git diff origin/main..feature/claude-<topic>

# 合 PR
gh pr merge <number> --squash  # 推荐 squash merge

# 同步本地
cd ~/Desktop/KeyPool && git fetch && git rebase origin/main
cd ~/Desktop/KeyPool-claude && git fetch && git rebase origin/main
```

---

## 9. 一些约定（贴进 CONTRIBUTING.md）

### 9.1 Commit 规范（Conventional Commits）

```bash
feat: 新功能
fix: 修复
docs: 文档
test: 测试
refactor: 重构
chore: 杂项
perf: 性能
```

例子：
```
feat(breaker): add three-state circuit breaker
fix(admin): handle missing valuePreview on empty keys
docs(readme): add quick start for v0.3
test(quota): cover boundary at minute window
```

### 9.2 Branch 命名

- Claude: `feature/claude-<topic>`
- Codex:  `feature/codex-<topic>`
- Hotfix: `hotfix/<short-desc>`

### 9.3 责任区（避免冲突）

| 责任区 | Owner |
|---|---|
| 后端核心 (core / providers / storage / shared) | Claude |
| 前端视图 (http/views) | Codex |
| 协调区 (app.ts / admin.routes.ts / package.json) | **协商** |
| 配置 / 文档 | 各改各 |

### 9.4 不允许的事

- ❌ 直接 push 到 main（开 Branch protection 后会被拦）
- ❌ 在同一需求里两人改同一文件
- ❌ push 含真实 API key / token 的 commit
- ❌ 把 `node_modules / dist` 提交上去（已 gitignore，但 Agent 偶尔出问题要盯）
- ❌ force push 共享分支（自己分支可 force push）
