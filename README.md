# OMP Full Status Widget

A compact six-row status widget for [Oh My Pi](https://github.com/can1357/oh-my-pi). It sits above the editor and keeps useful `statusLine.preset: full` runtime data visible when terminal width changes.

## Display

The widget keeps the current OMP theme and groups public runtime data into six logical rows:

1. Model, thinking level, service tier, and live agent state
2. Workspace and Git branch, sync, and change counts
3. Session name, turn/entry counts, and context usage
4. Cache-hit rate, input/output/cache tokens, and average token rate
5. Current tool, async jobs, active tools, and pending messages
6. Cost, elapsed session time, and clock

Pi and host identity are intentionally omitted. Long paths, branch names, model IDs, session names, and tool names are abbreviated from the left as needed. Git state refreshes periodically while the widget is active. At 80 columns the normal layout may wrap because the widget favors preserving runtime data over dropping fields.

## 字段说明

下面是一行全量显示的示例：

```text
Model:openai/gpt-test | Thinking:high | Tier:openai=flex | State:tool · 00:00:04
WS:C:/Workspace/project | Git:main ↑2 ↓1 +2 ~1 ?0
Session:fix-auth | Turns:3 | Entries:18 | Context:42.0% · 84.0k/200.0k · 116.0k left
Cache:94.2% | In:12.4k | Out:3.2k | Read:80k | Write:4.1k | Rate:1.8k tok/s
Tool:bash · 00:00:04 | Jobs:2 running · 1 recent · 1 queued | Tools:14 | Pending:no
Cost:$0.184 | Time:00:42:18 | Clock:14:32:08
```

### 第一行：模型和运行状态

- `Model`：当前模型，格式为 `provider/model`。
- `Thinking`：当前 thinking level，例如 `low`、`high`、`xhigh`。
- `Tier`：provider 的服务层级，例如 OpenAI 的 `flex`。没有可用数据时显示 `n/a`。
- `State`：OMP 当前状态，后面的时间是该状态持续时间。
  - `idle`：当前没有进行中的 agent 运行。
  - `thinking`：agent 正在生成或准备下一步。
  - `tool`：正在执行工具。
  - `compacting`：正在压缩上下文。
  - `retrying`：请求失败后正在重试，可能显示为 `retry 1/3`。
  - `waiting`：正在等待工具授权。
  - `error`：最近一次压缩或重试失败。

### 第二行：工作区和 Git

- `WS`：当前工作目录（workspace）。
- Git 分支名后面的箭头：
  - `↑2`：本地比远端多 2 个 commit（ahead）。
  - `↓1`：本地比远端少 1 个 commit（behind）。
- Git 变更计数：
  - `+2`：staged changes。
  - `~1`：unstaged changes。
  - `?0`：untracked files。
- Git 状态会定期刷新；没有 Git 仓库或读取失败时显示 `n/a`。

### 第三行：会话和上下文

- `Session`：当前会话名称。
- `Turns`：本次会话中已经开始的 agent turns。
- `Entries`：session manager 中的会话条目数量。它不是严格的消息数。
- `Context` 的格式：
  ```text
  百分比 · 已用/上限 · 剩余
  ```
  例如 `42.0% · 84.0k/200.0k · 116.0k left` 表示估计已使用 84k，上限 200k，剩余约 116k。

### 第四行：缓存和 token

- `Cache`：缓存命中率，按 `cacheRead / (input + cacheRead)` 计算。
- `In`：输入 token。
- `Out`：输出 token。
- `Read`：从 prompt cache 读取的 token。
- `Write`：写入 prompt cache 的 token。
- `Rate`：平均 token 处理速率，单位是 `tok/s`。它使用输入、输出和 cache-read token，不包含 cache-write token。

这些数值是当前 session 累计值，不是单次请求值；`k` 和 `m` 分别表示千和百万。

### 第五行：工具和后台任务

- `Tool`：当前正在执行的工具和持续时间；没有工具运行时显示 `n/a`。
- `Jobs`：
  - `running`：当前运行中的异步任务。
  - `recent`：仍在保留窗口内的最近异步任务。
  - `queued`：等待投递结果的异步任务数。
- `Tools`：当前启用的工具数量。
- `Pending`：是否有排队等待处理的消息。

### 第六行：成本和时间

- `Cost`：当前 session 累计成本；成本数据不可用时显示 `n/a`。
- `Time`：插件安装后经过的时间。
- `Clock`：本地系统时间。

当前版本是全量观测版，字段较多，窄终端换行是预期行为。后续会根据真实使用频率裁剪常驻字段。

## Install

Requires OMP 18.0.0 or later and Bun, which OMP already uses at runtime.

Clone the repository into a directory of your choice, then register the widget by its absolute path: replace the `/path/to` (or `C:/path/to`) placeholder below with the directory you cloned into.

macOS / Linux (sh):

```sh
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '["/path/to/omp-full-status-widget/full-status-widget.ts"]'
omp config set statusLine.preset minimal
```

Windows (PowerShell):

```powershell
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '[\"C:/path/to/omp-full-status-widget/full-status-widget.ts\"]'
omp config set statusLine.preset minimal
```

The backslash-escaped quotes keep the JSON value intact in Windows PowerShell 5.1; on PowerShell 7.3 and later the unescaped sh form also works.

Restart OMP after changing its extension configuration.

If you already use other extensions, include this file in the existing `extensions` array instead of replacing it.

## Verify

From the repository root, run the check script to verify that the widget builds successfully:

```sh
bun run check
```

## Design constraints

OMP's public extension API exposes the theme, model, session metadata, context use, message usage, and editor-adjacent widgets. It does not expose the native status-line renderer or its PR/subagent segments. The widget therefore reuses OMP theme typography and mirrors only the public `full`-status data; it never fabricates unavailable values.

## License

[MIT](LICENSE)
