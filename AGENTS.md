# omp-full-status-widget

A six-row status widget extension for [Oh My Pi](https://github.com/can1357/oh-my-pi) (OMP) that keeps `statusLine.preset: full` runtime data visible above the editor.

- The whole extension is a single file, `full-status-widget.ts`, registered through the `omp.extensions` field in `package.json`.
- `README.md` documents every displayed field and the install steps; keep it in sync when fields change.
- Verify with `bun test` (terminal-width regression tests) and `bun run check` (builds into the ignored `.check/` directory).

## Agent skills

### Issue tracker

Issues 在本仓 GitHub Issues（`Eridanus117/omp-full-status-widget`）里，`gh` 在仓内自动识别。See `docs/agents/issue-tracker.md`.

### Triage labels

使用默认五个标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

术语表在根 `GLOSSARY.md`（2026-10-07 建，issue #14；一词一条，新词先查它）；`docs/adr/` 按需生成。See `docs/agents/domain.md`.

<!-- shared:start files=common,personal hash=42128f8b9a6b -->
## 通用规则

由 `scripts/sync-agents.sh` 生成，勿手改。源在 `workspace-v2/docs/agents/`。

## 合入

MR 先 approve 后 ff-only。本地检查通过再推，CI 只作背景。

## 记录与边界

文档索引 `docs/README.md`，进度写分支名和提交说明。不提交凭据、本机配置、构建产物。生产资源操作先确认环境。发布与推送分别授权。

## 判据细节

`workspace-v2/docs/agents/references/` 下按需读：`change-patterns.md`、`logging.md`、`metrics.md`、`worktree.md`。

## 个人仓规则

适用于 `omp-full-status-widget`、`pstack-omp`。

## 定位

个人工具与配置，无外部消费约束。分支命名可用 `personal-` 前缀豁免 Issue 编号。

## 约定

- 配置类改动说明适用机器与场景，不把本机路径写死进共享文件。
- 上游是公开仓时，向 upstream 提 PR 走标准 fork 流程；本地分支保留 `personal-` 前缀表示不对外。
<!-- shared:end -->
