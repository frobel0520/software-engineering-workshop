import { type FormEvent, useMemo, useState } from "react";
import { ideFileFixture, type IdeLabState, type IdeStepId } from "../topics/ide/content";
import {
  createIdeLabState,
  ideLabIsComplete,
  runIdeCommand,
} from "../topics/ide/simulator";
import {
  TopicCompletionCard,
  TopicLabShell,
  TopicStatusFeedback,
  type TopicStatusTone,
} from "./TopicShell";

interface IdeAction {
  id: IdeStepId;
  label: string;
  command: string;
}
interface DebugHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
  stream?: "stdout" | "stderr";
  exitCode?: number | null;
}

const IDE_ACTIONS: readonly IdeAction[] = [
  { id: "open", label: "開啟固定檔案", command: "open src/order.ts" },
  { id: "breakpoint", label: "設定第 3 行 breakpoint", command: "breakpoint 3" },
  { id: "run", label: "啟動 calculateTotal", command: "run calculateTotal(10, 2, 3)" },
  { id: "inspect", label: "檢查目前 variables", command: "inspect variables" },
  { id: "step", label: "執行 step over", command: "step over" },
  { id: "continue", label: "繼續到程式結束", command: "continue" },
];

const initialHistory: readonly DebugHistoryEntry[] = [
  { lines: ["IDE Workshop sandbox v1", "固定 order.ts fixture 已準備好。選擇一個 debugger action 開始。"] },
];

function statusTone(state: IdeLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "failed") return "error";
  return "neutral";
}

function statusMessage(state: IdeLabState): string {
  if (state.phase === "failed") {
    return `${state.lastStream ?? "stderr"} · exit ${state.exitCode ?? "—"} · phase ${state.phase} · line ${state.currentLine ?? "—"} · ${state.lastMessage}`;
  }
  return state.lastMessage;
}

export function IdeLab({ onComplete }: { onComplete?: () => void }) {
  const [ide, setIde] = useState<IdeLabState>(createIdeLabState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly DebugHistoryEntry[]>(initialHistory);
  const completed = ideLabIsComplete(ide);
  const completedCount = ide.completedStepIds.length;
  const currentAction = useMemo(
    () => IDE_ACTIONS.find((action) => !ide.completedStepIds.includes(action.id)) ?? IDE_ACTIONS[IDE_ACTIONS.length - 1],
    [ide.completedStepIds],
  );

  function dispatch(rawCommand: string) {
    if (!rawCommand.trim() || completed) return;
    const result = runIdeCommand(ide, rawCommand);
    setIde(result.state);
    setHistory((items) => [
      ...items,
      {
        command: rawCommand.trim(),
        lines: result.output,
        accepted: result.accepted,
        stream: result.stream ?? undefined,
        exitCode: result.state.exitCode,
      },
    ]);
    if (!completed && ideLabIsComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch(command);
    setCommand("");
  }

  function reset() {
    setIde(createIdeLabState());
    setCommand("");
    setHistory([{ lines: ["Sandbox 已重設。從開啟 src/order.ts 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / IDE"
      title={<>用除錯器看見<br /><em>程式正在做什麼</em></>}
      progressLabel={completed ? "完成" : `${completedCount} / ${IDE_ACTIONS.length}`}
      progress={Math.round((completedCount / IDE_ACTIONS.length) * 100)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(ide)} message={statusMessage(ide)} />

      {completed ? (
        <TopicCompletionCard
          title="Debug 流程完成"
          description="你已能設定 breakpoint、讀取 paused frame、逐行觀察 variables，並用 continue 完成固定函式。"
          onReset={reset}
        />
      ) : (
        <div className="ide-lab-layout">
          <section className="ide-editor-panel" aria-label="IDE editor fixture">
            <div className="ide-editor-top">
              <span className="ide-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>{ide.selectedFile ?? "workspace"}</b>
              <span className="ide-phase">{ide.phase}</span>
            </div>
            <div className="ide-file-tab"><span>TS</span> src/order.ts</div>
            <div className="ide-editor" role="region" aria-label="order.ts 程式碼">
              {ideFileFixture.content.split("\n").map((line, index) => {
                const lineNumber = index + 1;
                const isCurrent = ide.currentLine === lineNumber;
                const hasBreakpoint = ide.breakpointLines.includes(lineNumber);
                return (
                  <button
                    className={`ide-code-line ${isCurrent ? "current" : ""} ${hasBreakpoint ? "has-breakpoint" : ""}`}
                    key={lineNumber}
                    type="button"
                    disabled={completed}
                    aria-label={`第 ${lineNumber} 行${hasBreakpoint ? "，已設定 breakpoint" : ""}${isCurrent ? "，目前執行位置" : ""}`}
                    onClick={() => dispatch(`breakpoint ${lineNumber}`)}
                  >
                    <span className="ide-line-number">{lineNumber}</span>
                    <span className="ide-breakpoint" aria-hidden="true">{hasBreakpoint ? "●" : ""}</span>
                    <code>{line || " "}</code>
                  </button>
                );
              })}
            </div>
            <div className="ide-terminal-output" role="log" aria-live="polite" aria-label="Debugger command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{entry.stream ? `${entry.stream} · exit ${entry.exitCode ?? "—"} · ` : null}{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form ide-command-form" onSubmit={submit}>
              <label htmlFor="ide-command">❯</label>
              <input
                id="ide-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 debugger 指令…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="ide-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="ide-command-help" className="sr-only">可輸入教材中的 debugger 指令，或使用右側 mission buttons。</p>
          </section>

          <aside className="ide-control-panel" aria-label="Debugger controls">
            <div className="ide-panel-heading">
              <div><p className="kicker">DEBUGGER CONTROL</p><h2>依序收集執行線索</h2></div>
              <span className="ide-lab-meta">{ide.selectedFile ?? "no file"}</span>
            </div>
            <div className="ide-action-list">
              {IDE_ACTIONS.map((action, index) => {
                const done = ide.completedStepIds.includes(action.id);
                return (
                  <button
                    className={`ide-action ${done ? "done" : ""}`}
                    key={action.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(action.command)}
                    aria-label={`${action.label}：${action.command}`}
                  >
                    <span className="ide-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="ide-action-copy"><b>{action.label}</b><code>{action.command}</code></span>
                    <span className="ide-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="ide-current-hint">目前任務：{currentAction.label}。按鈕只派送 deterministic event，不會啟動真實 debugger。</p>
          </aside>
        </div>
      )}

      <section className="ide-debug-state" aria-labelledby="ide-debug-state-title">
        <div className="section-heading"><div><p className="kicker">LIVE DEBUG STATE</p><h2 id="ide-debug-state-title">目前的執行線索</h2></div><p>只顯示 simulator 狀態，不連接本機 process。</p></div>
        <div className="ide-state-grid">
          <div><small>PHASE</small><b>{ide.phase}</b></div>
          <div><small>CURRENT LINE</small><b>{ide.currentLine ?? "—"}</b></div>
          <div><small>CALL STACK</small><b>{ide.callStack.join(" → ") || "—"}</b></div>
          <div><small>BREAKPOINTS</small><b>{ide.breakpointLines.join(", ") || "—"}</b></div>
          <div className="ide-state-wide"><small>VARIABLES</small><b>{Object.entries(ide.variables).map(([name, value]) => `${name}=${value}`).join(" · ") || "—"}</b></div>
          <div className="ide-state-wide"><small>OUTPUT</small><b>{ide.output.at(-1) ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
