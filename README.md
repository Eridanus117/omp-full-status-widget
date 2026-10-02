# OMP Full Status Widget

这是一个用于 [Oh My Pi](https://github.com/can1357/oh-my-pi) 的紧凑六行状态组件，显示在编辑器上方；终端宽度变化时，仍可查看有用的完整状态运行数据。

## 显示内容

组件沿用当前 OMP 主题，把公开运行数据分成六行：

1. 模型、思考级别、服务层级和 Agent 状态
2. 工作区、Git 分支同步情况和变更数
3. 会话名称、回合/条目数和上下文用量
4. 缓存命中率、输入/输出/缓存令牌和平均速率
5. 当前工具、异步任务、活动工具数和待处理消息
6. 成本、会话耗时和时钟

组件有意省略 Pi 与宿主标识。长路径、分支名、模型 ID、会话名和工具名会按需从左侧缩短。组件运行时定期刷新 Git 状态。终端宽度为 80 列时，正常布局可能换行；组件优先保留运行数据，不丢弃字段。

## 字段说明

下面是一次完整显示的示例。标签、状态值和配置字段名保留程序实际使用的原文：

~~~text
Model:openai/gpt-test | Thinking:high | Tier:openai=flex | State:tool · 00:00:04
WS:C:/Workspace/project | Git:main ↑2 ↓1 +2 ~1 ?0
Session:fix-auth | Turns:3 | Entries:18 | Context:42.0% · 84.0k/200.0k · 116.0k left
Cache:94.2% | In:12.4k | Out:3.2k | Read:80k | Write:4.1k | Rate:1.8k tok/s
Tool:bash · 00:00:04 | Jobs:2 running · 1 recent · 1 queued | Tools:14 | Pending:no
Cost:$0.184 | Time:00:42:18 | Clock:14:32:08
~~~

### 第一行：模型和运行状态

- Model：当前模型，格式为 provider/model。
- Thinking：思考级别，例如 low、high、xhigh。
- Tier：服务层级，例如 OpenAI 的 flex。没有可用数据时显示 n/a。
- State：OMP 当前状态，后面的时间表示该状态已持续多久。
  - idle：当前没有进行中的 Agent 运行。
  - thinking：Agent 正在生成回复或准备下一步。
  - tool：正在执行工具。
  - compacting：正在压缩上下文。
  - retrying：请求失败后正在重试，可能显示 retry 1/3。
  - waiting：正在等待工具授权。
  - error：最近一次压缩或重试失败。

### 第二行：工作区和 Git

- WS：当前工作目录。
- Git 分支名后面的箭头表示：
  - ↑2：本地比远端多 2 个提交。
  - ↓1：本地比远端少 1 个提交。
- Git 变更计数表示：
  - +2：已暂存变更。
  - ~1：未暂存变更。
  - ?0：未跟踪文件。
- Git 状态会定期刷新；没有 Git 仓库或读取失败时显示 n/a。

### 第三行：会话和上下文

- Session：会话名称。
- Turns：本次会话已开始的 Agent 回合数。
- Entries：会话管理器中的条目数，不是严格的消息数。
- Context 的格式为：

~~~text
百分比 · 已用/上限 · 剩余
~~~

例如 42.0% · 84.0k/200.0k · 116.0k left 表示估计已使用 84k，上限为 200k，剩余约 116k。

### 第四行：缓存和令牌

- Cache：缓存命中率，按 cacheRead / (input + cacheRead) 计算。
- In：输入令牌数。
- Out：输出令牌数。
- Read：从提示缓存读取的令牌数。
- Write：写入提示缓存的令牌数。
- Rate：平均令牌处理速率，单位为 tok/s；计算包含输入、输出和缓存读取令牌，不包含缓存写入令牌。

这些数值是当前会话累计值，不是单次请求值；k 和 m 分别表示千和百万。

### 第五行：工具和后台任务

- Tool：当前正在执行的工具及持续时间；没有工具运行时显示 n/a。
- Jobs：
  - running：当前运行中的异步任务。
  - recent：仍在保留窗口内的最近异步任务。
  - queued：等待投递结果的异步任务数。
- Tools：当前启用的工具数量。
- Pending：是否有排队等待处理的消息。

### 第六行：成本和时间

- Cost：当前会话累计成本；成本数据不可用时显示 n/a。
- Time：本次会话开始后经过的时间（widget 在会话开始时加载并开始计时）。
- Clock：本地系统时间。

当前版本是全量观测版，字段较多，窄终端换行属于预期行为。后续会根据实际使用频率裁剪常驻字段。

## 安装

需要 OMP 18.0.0 或更新版本，以及 Bun 1.3.7 或更新版本（使用其 ANSI／Unicode 显示宽度工具）。在 bootstrap 部署中，statusLine.preset 由 client-config 管理；手动安装命令显式设为 nerd。

### Marketplace（推荐）

注册随仓库提供的 marketplace catalog，并安装 widget：

~~~sh
omp plugin marketplace add Eridanus117/omp-full-status-widget
omp plugin discover omp-full-status
omp plugin install omp-full-status-widget@omp-full-status
omp config set statusLine.preset nerd
~~~

之后更新 marketplace catalog 和已安装插件：

~~~sh
omp plugin marketplace update
omp plugin upgrade
~~~

如果以前通过 extensions 配置过 widget，请在 marketplace 安装后移除它的绝对路径条目。不要同时通过两种方式加载同一个 widget。

### 手动安装或本地开发安装

将仓库克隆到任意目录，再用绝对路径注册 widget。此方式适用于本地开发，或 marketplace 不可用时作为备用方案。

macOS / Linux（sh）：

~~~sh
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '["/path/to/omp-full-status-widget/full-status-widget.ts"]'
omp config set statusLine.preset nerd
~~~

Windows（PowerShell）：

~~~powershell
git clone https://github.com/Eridanus117/omp-full-status-widget.git
omp config set extensions '[\"C:/path/to/omp-full-status-widget/full-status-widget.ts\"]'
omp config set statusLine.preset nerd
~~~

反斜杠转义的引号可确保 Windows PowerShell 5.1 中 JSON 值保持完整；PowerShell 7.3 及更新版本也可以使用未转义的 sh 写法。

更改扩展配置后重启 OMP。

如果已经使用其他扩展，应把本文件加入现有 extensions 数组，而不是替换整个数组。

## 验证

在仓库根目录运行以下命令，验证带主题图标、颜色、中文和 emoji 的显示宽度，并确认 widget 能成功构建：

~~~sh
bun test
bun run check
~~~

## 设计约束

OMP 的公开扩展 API 可读取主题、模型、会话元数据、上下文使用情况、消息用量，并能显示靠近编辑器的 widget；但不提供原生状态行渲染器，也不提供 PR/子 Agent 区段。因此 widget 沿用 OMP 主题排版，只镜像公开的 full 状态数据，不伪造无法获取的值。

## 许可证

[MIT 许可证](LICENSE)
