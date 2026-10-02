import { describe, expect, test } from "bun:test";
import { FullStatusWidget } from "./full-status-widget.ts";

function widget(sessionName = "synthetic-session", cwd = "C:/synthetic-project", icon = "◆") {
  return new FullStatusWidget(
    {
      mode: "tui", cwd, model: { provider: "openai", id: "example-model" },
      sessionManager: { getEntries: () => [], getSessionName: () => sessionName },
      getContextUsage: () => ({ tokens: 84_000, contextWindow: 200_000, percent: 42 }),
      getAsyncJobSnapshot: () => ({ running: [], recent: [] }),
      isIdle: () => true, hasPendingMessages: () => false,
      ui: { setWidget() {} },
    },
    () => "high", () => ({ openai: "flex" }), () => [], Date.now(),
    () => ({ branch: "main", ahead: 2, behind: 1, staged: 2, unstaged: 1, untracked: 0 }),
    { status: "idle", statusSince: Date.now(), turnIndex: 0 },
    { fg: (_color, text) => `\u001b[31m${text}\u001b[39m`, icon: { model: icon, session: icon, folder: icon } },
  );
}

function expectWithinColumns(lines: string[], columns: number) {
  for (const line of lines) {
    expect(Bun.stringWidth(line)).toBeLessThanOrEqual(columns);
    // Removing complete ANSI codes must leave no broken escape sequences.
    expect(Bun.stripANSI(line)).not.toContain("\u001b");
  }
}

describe("terminal display width", () => {
  test("accounts for theme icons and ANSI colors before wrapping at 80 columns", () => {
    const lines = widget().render(80);
    expectWithinColumns(lines, 80);
    const text = Bun.stripANSI(lines.join("\n"));
    for (const label of ["Model:", "Thinking:", "State:", "WS:", "Git:", "Session:", "Context:", "Cache:", "Tool:", "Cost:", "Time:", "Clock:"]) {
      expect(text).toContain(label);
    }
  });

  test("fits Chinese fields and wide icons at several terminal widths", () => {
    const value = widget("中文会话名字需要保留末尾", "C:/项目/目录/状态组件", "界");
    for (const columns of [20, 40, 80, 120]) expectWithinColumns(value.render(columns), columns);
  });

  test("does not cut an emoji or combining-character cluster when abbreviating", () => {
    const value = widget("🧑‍💻".repeat(20), "C:/" + "e\u0301".repeat(30), "🧑‍💻");
    const lines = value.render(40);
    expectWithinColumns(lines, 40);
    const plain = Bun.stripANSI(lines.join("\n"));
    expect(plain.isWellFormed()).toBe(true);
    expect(plain).not.toMatch(/(?:…|\n)[\u0301\u200d]/u);
  });
});
