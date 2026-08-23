// OMP full-status-widget: a compact five-row status widget above the editor.

interface ContextUsage {
  tokens?: number | null;
  contextWindow?: number | null;
  percent?: number | null;
}

interface Usage {
  input?: unknown;
  output?: unknown;
  cacheRead?: unknown;
  cacheWrite?: unknown;
  cost?: unknown;
}

interface SessionEntry {
  message?: { usage?: Usage };
  usage?: Usage;
}

interface SessionManager {
  getEntries(): readonly SessionEntry[];
  getSessionName(): string | undefined;
}

interface Tui {
  requestRender(): void;
}

interface Theme {
  fg(color: string, text: string): string;
  icon: Readonly<Record<string, unknown>>;
}

interface Widget {
  render(width: number): string[];
}

interface ExtensionContext {
  mode: string;
  cwd: string;
  model?: { provider?: string; id?: string };
  sessionManager: SessionManager;
  getContextUsage(): ContextUsage | undefined;
  isIdle(): boolean;
  ui: {
    setWidget(key: string, content: (tui: Tui, theme: unknown) => Widget, options?: { placement?: "aboveEditor" | "belowEditor" }): void;
  };
}

interface MinimalPi {
  getThinkingLevel(): string | undefined;
  on(event: string, handler: (event: unknown, context: ExtensionContext) => void): void;
}

interface UsageTotal {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number | null;
}

interface GitState {
  branch: string | undefined;
  staged: number;
  unstaged: number;
  untracked: number;
}

function formatCount(value: number): string {
  if (value < 1_000) return String(value);
  if (value < 1_000_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${(value / 1_000_000).toFixed(1)}m`;
}

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDuration(milliseconds: number): string {
  const elapsed = Math.floor(milliseconds / 1_000);
  return `${String(Math.floor(elapsed / 3_600)).padStart(2, "0")}:${String(Math.floor(elapsed / 60) % 60).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
}

function abbreviate(value: string, maximumLength: number): string {
  if (value.length <= maximumLength) return value;
  return `…${value.slice(1 - maximumLength)}`;
}

function addUsage(total: UsageTotal, usage: Usage | undefined): void {
  if (!usage) return;
  const input = finiteNumber(usage.input);
  const output = finiteNumber(usage.output);
  const cacheRead = finiteNumber(usage.cacheRead);
  const cacheWrite = finiteNumber(usage.cacheWrite);
  const cost = finiteNumber(usage.cost);
  total.input += input ?? 0;
  total.output += output ?? 0;
  total.cacheRead += cacheRead ?? 0;
  total.cacheWrite += cacheWrite ?? 0;
  if (usage.cost !== undefined && cost === undefined) total.cost = null;
  else if (cost !== undefined && total.cost !== null) total.cost += cost;
}

function collectUsage(sessionManager: SessionManager): UsageTotal {
  const total: UsageTotal = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  for (const entry of sessionManager.getEntries()) {
    addUsage(total, entry.message?.usage ?? entry.usage);
  }
  return total;
}

function wrapLine(line: string, width: number): string[] {
  const maximumWidth = Math.max(1, width);
  if (line.length <= maximumWidth) return [line];

  const wrapped: string[] = [];
  let remaining = line;
  while (remaining.length > maximumWidth) {
    const splitAt = remaining.lastIndexOf(" ", maximumWidth);
    const boundary = splitAt > 0 ? splitAt : maximumWidth;
    wrapped.push(remaining.slice(0, boundary));
    remaining = remaining.slice(boundary).trimStart();
  }
  if (remaining.length > 0) wrapped.push(remaining);
  return wrapped;
}

function unrefTimer(timer: unknown): void {
  if (timer !== null && typeof timer === "object" && "unref" in timer && typeof timer.unref === "function") {
    timer.unref();
  }
}

async function readGitState(cwd: string): Promise<GitState | undefined> {
  try {
    const child = Bun.spawn(["git", "status", "--porcelain=v1", "--branch"], {
      cwd,
      stdout: "pipe",
      stderr: "ignore",
    });
    const output = await new Response(child.stdout).text();
    if (await child.exited !== 0) return undefined;

    const state: GitState = { branch: undefined, staged: 0, unstaged: 0, untracked: 0 };
    for (const line of output.split(/\r?\n/)) {
      if (line.startsWith("## ")) {
        const branch = line.slice(3).split("...")[0]?.trim();
        state.branch = branch && !branch.startsWith("HEAD") ? branch : undefined;
      } else if (line.startsWith("??")) {
        state.untracked += 1;
      } else if (line.length >= 2) {
        if (line[0] !== " ") state.staged += 1;
        if (line[1] !== " ") state.unstaged += 1;
      }
    }
    return state;
  } catch {
    return undefined;
  }
}

function formatGitState(state: GitState | undefined, branchMaximumLength: number): string {
  if (!state) return "n/a";
  return `${abbreviate(state.branch ?? "detached", branchMaximumLength)} +${state.staged} ~${state.unstaged} ?${state.untracked}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

function themeIcon(theme: Theme, name: string, fallback: string): string {
  const icon = theme.icon[name];
  return typeof icon === "string" && icon ? icon : fallback;
}

function resolveTheme(value: unknown): Theme {
  if (isRecord(value) && isFunction(value.fg)) {
    const icons = isRecord(value.icon) ? value.icon : {};
    return {
      fg: (color, text) => {
        const rendered = value.fg.call(value, color, text);
        return typeof rendered === "string" ? rendered : text;
      },
      icon: icons,
    };
  }
  return { fg: (_color, text) => text, icon: {} };
}

class FullStatusWidget implements Widget {
  constructor(
    private readonly context: ExtensionContext,
    private readonly thinkingLevel: () => string | undefined,
    private readonly startedAt: number,
    private readonly gitState: () => GitState | undefined,
    private readonly theme: Theme,
  ) {}

  private styleSegment(segment: string): string {
    const separatorIndex = segment.indexOf(":");
    if (separatorIndex < 0) return segment;

    const label = segment.slice(0, separatorIndex);
    const gitState = this.gitState();
    const contextPercent = this.context.getContextUsage()?.percent;
    const contextColor = contextPercent != null && contextPercent >= 80
      ? "error"
      : contextPercent != null && contextPercent >= 50
        ? "warning"
        : "statusLineContext";
    const gitDirty = gitState !== undefined && (gitState.staged > 0 || gitState.unstaged > 0 || gitState.untracked > 0);
    const styles: Record<string, { color: string; icon: string; fallback: string }> = {
      Pi: { color: "accent", icon: "pi", fallback: "π" },
      Host: { color: "dim", icon: "host", fallback: "⌂" },
      Model: { color: "statusLineModel", icon: "model", fallback: "◆" },
      WS: { color: "statusLinePath", icon: "folder", fallback: "▣" },
      Git: { color: gitDirty ? "statusLineGitDirty" : "statusLineGitClean", icon: "branch", fallback: "⎇" },
      Session: { color: "accent", icon: "session", fallback: "◌" },
      Context: { color: contextColor, icon: "context", fallback: "◐" },
      Cache: { color: "statusLineSpend", icon: "cache", fallback: "◫" },
      In: { color: "statusLineSpend", icon: "input", fallback: "←" },
      Out: { color: "statusLineOutput", icon: "output", fallback: "→" },
      Read: { color: "statusLineSpend", icon: "cache", fallback: "◫" },
      Rate: { color: "statusLineOutput", icon: "throughput", fallback: "↯" },
      Cost: { color: "statusLineCost", icon: "cost", fallback: "$" },
      Time: { color: "dim", icon: "time", fallback: "◷" },
      Clock: { color: "dim", icon: "time", fallback: "◷" },
    };
    const style = styles[label];
    if (!style) return segment;
    return this.theme.fg(style.color, `${themeIcon(this.theme, style.icon, style.fallback)} ${segment}`);
  }

  render(width: number): string[] {
    const contextUsage = this.context.getContextUsage();
    const usage = collectUsage(this.context.sessionManager);
    const sessionName = this.context.sessionManager.getSessionName() ?? "unnamed";
    const model = [this.context.model?.provider, this.context.model?.id].filter(Boolean).join("/") || "unknown";
    const elapsedMilliseconds = Date.now() - this.startedAt;
    const elapsedSeconds = Math.max(1, Math.floor(elapsedMilliseconds / 1_000));
    const cacheHit = usage.input + usage.cacheRead === 0 ? "n/a" : `${(usage.cacheRead / (usage.input + usage.cacheRead) * 100).toFixed(1)}%`;
    const contextText = contextUsage?.percent == null || contextUsage?.contextWindow == null
      ? "n/a"
      : `${contextUsage.percent.toFixed(1)}%/${formatCount(contextUsage.contextWindow)}`;
    const costText = usage.cost === null ? "n/a" : `$${usage.cost.toFixed(3)}`;
    const host = process.env.COMPUTERNAME ?? process.env.HOSTNAME ?? "unknown";
    const valueWidth = Math.max(12, Math.floor(width * 0.35));
    const hostText = abbreviate(host, 16);
    const thinkingText = abbreviate(this.thinkingLevel() ?? "default", 12);
    const modelText = abbreviate(model, Math.max(12, width - hostText.length - thinkingText.length - 38));
    const workspaceText = abbreviate(this.context.cwd, valueWidth);
    const gitText = formatGitState(this.gitState(), valueWidth);
    const sessionText = abbreviate(sessionName, valueWidth);
    const rawLines = [
      `Pi:omp | Host:${hostText} | Model:${modelText} · ${thinkingText}`,
      `WS:${workspaceText} | Git:${gitText}`,
      `Session:${sessionText} | Context:${contextText} | Cache:${cacheHit}`,
      `In:${formatCount(usage.input)} | Out:${formatCount(usage.output)} | Read:${formatCount(usage.cacheRead)} | Rate:${formatCount(Math.round((usage.input + usage.output + usage.cacheRead) / elapsedSeconds))} tok/s`,
      `Cost:${costText} | Time:${formatDuration(elapsedMilliseconds)} | Clock:${new Date().toLocaleTimeString()}`,
    ];
    return rawLines
      .flatMap(line => wrapLine(line, width))
      .map(line => line.split(" | ").map(segment => this.styleSegment(segment)).join(this.theme.fg("dim", " | ")));
  }
}

export default function registerFullStatusWidget(pi: MinimalPi): void {
  let tui: Tui | undefined;
  let gitState: GitState | undefined;
  let renderTimer: ReturnType<typeof setInterval> | undefined;

  function requestRender(): void {
    tui?.requestRender();
  }

  async function install(_event: unknown, context: ExtensionContext): Promise<void> {
    if (context.mode !== "tui") return;
    const startedAt = Date.now();
    context.ui.setWidget("full-status", (nextTui, theme) => {
      tui = nextTui;
      return new FullStatusWidget(context, () => pi.getThinkingLevel(), startedAt, () => gitState, resolveTheme(theme));
    }, { placement: "aboveEditor" });
    clearInterval(renderTimer);
    renderTimer = setInterval(requestRender, 1_000);
    unrefTimer(renderTimer);
    gitState = await readGitState(context.cwd);
    requestRender();
  }

  function refresh(_event: unknown, context: ExtensionContext): void {
    if (context.mode === "tui") requestRender();
  }

  pi.on("session_start", install);
  pi.on("model_select", refresh);
  pi.on("thinking_level_select", refresh);
  pi.on("agent_end", refresh);
  pi.on("message_end", refresh);
}
