# omp-full-status-widget

A six-row status widget extension for [Oh My Pi](https://github.com/can1357/oh-my-pi) (OMP) that keeps `statusLine.preset: full` runtime data visible above the editor.

- The whole extension is a single file, `full-status-widget.ts`, registered through the `omp.extensions` field in `package.json`.
- `README.md` documents every displayed field and the install steps; keep it in sync when fields change.
- Verify with `bun run check` (builds into the ignored `.check/` directory). There is no test suite.

## Agent skills

### Issue tracker

Issues 在本仓 GitHub Issues（`Eridanus117/omp-full-status-widget`）里，`gh` 在仓内自动识别。See `docs/agents/issue-tracker.md`.

### Triage labels

使用默认五个标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

Single-context：根 `CONTEXT.md` + `docs/adr/`（按需生成）。See `docs/agents/domain.md`.
