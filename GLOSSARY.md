# 术语表

本仓的用词，一词一条，只收概念定义；每个字段的逐项含义仍以 README“字段说明”为准。首次建表来自 issue #14（2026-10-07），每条的原句位置和别处的叫法见那里。主名优先用业界通用词，README 原文不因此改。

## 状态组件（status widget）

本仓做的那个扩展：在 OMP 终端界面的编辑器上方占六行，镜像 OMP 公开的运行数据，不渲染 OMP 自带的状态行。
名称说明：“widget”“组件”指它；“扩展”（extension）和“插件”（plugin）是它的两种装法，不是两个东西；“状态行”（status line，也叫状态栏）是 OMP 自带的 statusLine，不是它。

## 预设（preset）

OMP 自带状态行的三档显示方案 full、nerd、minimal，由 `statusLine.preset` 选。本组件镜像 full 那一档的运行数据，安装时把原生状态行设成 nerd，两件事不矛盾。
名称说明：“full 状态数据”“statusLine.preset: full”说的是数据那一档，不是组件的模式。

## 显示宽度（display width）

一段文字在终端里实际占的列数：中文占两列，emoji 与组合字符按字符簇算，ANSI 颜色序列不占列。组件的换行与缩短都按它算，不按 JavaScript 字符串长度。
名称说明：“终端宽度”是终端有多少列，是容器；显示宽度是内容。

## 缩短、换行与裁剪（truncate / wrap / prune）

三种不同的处理。缩短：长路径、分支名、模型 ID、会话名、工具名从左侧截短，按字符簇截、不拆 emoji，代码里叫 abbreviate。换行：整行超过终端宽度时按显示宽度折行，不丢字段。裁剪：以后按使用频率减少常驻字段，是版本层面的事，不在运行时发生。
名称说明：缩短也叫截短、截断；换行也叫折行。

## 上下文用量（context usage）

当前上下文窗口里已占的量，显示为百分比、已用／上限、剩余，是一个时点的存量。第四行的 In、Out、Read、Write 是本会话累计的令牌（token）数，是流量；两者单位相同，不能相加比较。
名称说明：“上下文使用情况”“Context”指它；令牌也写作 token、tok。

## Agent 状态（agent state）

第一行 State 字段：OMP 的 agent 此刻在做什么，取值 idle、thinking、tool、compacting、retrying、waiting、error，后跟该状态已持续的时间。
名称说明：README 里的“运行状态”“OMP 当前状态”指它；单说“状态”还可能指第二行的 Git 状态或状态组件本身，要带限定语。

## 异步任务（async job）

OMP 在后台跑、不阻塞当前回合的任务；第五行 Jobs 分三种计数：running 正在跑，recent 跑完但还在保留窗口内，queued 等待投递结果。
名称说明：README 小标题“后台任务”、代码里的 job、task 都指它。工具（Tool）是当前回合里同步执行的；待处理消息（Pending）是排队的消息，不是任务。

## 编辑器（editor）

OMP 终端界面里输入提示词的那块区域，组件显示在它上方（代码里的 aboveEditor）；不是代码编辑器。

## 耗时（elapsed time）

组件里三个时间量，起点各不同：State 后面的时间是当前状态已持续多久；Tool 后面的时间是当前工具已跑多久；Time 是本次会话开始后经过的时间，起点是组件加载那一刻。Clock 是本地时钟，不是耗时。

## 推理强度（reasoning effort）

第一行 Thinking 字段：模型推理投入的档位，low、high、xhigh；值由 OMP 给，组件只显示。
名称说明：README 和字段名用“思考级别”“Thinking”，指它；业界通用词是 reasoning effort，主人在别的仓也叫推理强度，新文字优先用推理强度。

## 插件市场目录（marketplace catalog）

本仓随代码提供的一份目录文件；注册到 OMP 的插件市场（marketplace）后，OMP 能按它发现并安装本组件。更新目录和升级插件是两条命令。
名称说明：扩展配置（extensions 数组写绝对路径）是另一种装法，两种不能同时装同一个组件。

## 运行数据（runtime data）

OMP 公开扩展 API 能读到的值：主题、模型、会话元数据、上下文用量、消息用量等；组件只镜像它们，拿不到的不伪造。
名称说明：“公开运行数据”“状态数据”“full 状态数据”都指它；PR、子 Agent 区段这类 OMP 不公开的数据不在其中。

## 常驻字段（always-shown fields）

每次刷新都显示的字段。当前版本所有字段都常驻，README 称之为“全量观测版”，窄终端换行是预期；以后按使用频率裁剪。
名称说明：“全量观测版”只在说版本时用，没有业界对应词。

## 条目、回合与消息（entry / turn / message）

回合：一次 agent 运行，Turns 计数。条目：会话管理器里的记录条数，Entries 计数，不等于消息数。消息：Pending 里排队等待处理的那种。

## 行、字段与区段（row / field / segment）

行：组件的六行之一。字段：一行里的一个标签加值，如 Model、Cache。区段：OMP 原生状态行里的一块，如 PR、子 Agent 区段；组件没有区段这一层。
名称说明：代码里的 segment 指字段的样式单元，与 OMP 的区段不是一回事；package.json 描述里的“five-row”是过时文字。

## 缓存命中率（cache hit rate）

第四行 Cache：按 cacheRead ÷ (input + cacheRead) 算，用本会话累计值。Read、Write 是从提示缓存读取、写入的令牌数。

## 服务层级（service tier）

第一行 Tier：供应商侧的服务档，例如 OpenAI 的 flex；没有数据时显示 n/a。与推理强度无关。
