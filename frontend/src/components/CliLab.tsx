import { FormEvent, useMemo, useState } from "react";
import { cliLessonSteps, type CliLabState } from "../topics/cli/content";
import {
  cliLabIsComplete,
  createCliLabState,
  runCliCommand,
} from "../topics/cli/simulator";
import {
  TopicCompletionCard,
  TopicLabShell,
  TopicStatusFeedback,
  type TopicStatusTone,
} from "./TopicShell";

interface TerminalEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
  stream?: "stdout" | "stderr";
  exitCode?: number | null;
}

const initialHistory: readonly TerminalEntry[] = [];

function statusTone(state: CliLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "failed") return "error";
  return "neutral";
}

function statusMessage(state: CliLabState): string {
  if (state.phase === "failed") {
    return `${state.lastStream ?? "stderr"} · exit ${state.exitCode ?? "—"} · cwd ${state.cwd} · ${state.lastMessage}`;
  }
  return state.lastMessage;
}

export function CliLab({ onComplete }: { onComplete: () => void }) {
  const [cli, setCli] = useState<CliLabState>(createCliLabState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly TerminalEntry[]>(initialHistory);
  const completedCount = cli.completedStepIds.length;
  const progress = Math.round((completedCount / cliLessonSteps.length) * 100);
  const currentStep = useMemo(
    () => cliLessonSteps.find((step) => !cli.completedStepIds.includes(step.id)) ?? cliLessonSteps[cliLessonSteps.length - 1],
    [cli.completedStepIds],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!command.trim() || cliLabIsComplete(cli)) return;

    const result = runCliCommand(cli, command);
    setCli(result.state);
    setHistory((items) => [
      ...items,
      {
        command: command.trim(),
        lines: result.output,
        accepted: result.accepted,
        stream: result.stream ?? undefined,
        exitCode: result.state.exitCode,
      },
    ]);
    setCommand("");
    if (!cliLabIsComplete(cli) && cliLabIsComplete(result.state)) onComplete();
  }

  function reset() {
    setCli(createCliLabState());
    setCommand("");
    setHistory([{ lines: ["已重設。從 pwd 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      className="foundation-lab-shell"
      showMeta={false}
      title={<>在工作目錄中<br /><em>讀懂命令列</em></>}
      progressLabel={cliLabIsComplete(cli) ? "完成" : `${completedCount} / ${cliLessonSteps.length}`}
      progress={progress}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(cli)} message={statusMessage(cli)} />

      <div className="lab-layout cli-lab-layout">
          <section className="terminal-panel" aria-label="CLI 命令列">
          <div className="terminal-top">
            <span className="terminal-dots" aria-hidden="true"><i /><i /><i /></span>
            <b>{cli.cwd}</b>
            <span aria-label={`目前 exit code ${cli.exitCode ?? "尚未執行"}`}>exit {cli.exitCode ?? "—"}</span>
          </div>
          <div className="terminal-output" role="log" aria-live="polite" aria-label="命令列輸出">
            {history.map((entry, index) => (
              <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                {entry.lines.map((line, lineIndex) => (
                  <small key={lineIndex}>
                    {entry.stream ? `${entry.stream} · exit ${entry.exitCode ?? "—"} · ` : null}{line}
                  </small>
                ))}
              </div>
            ))}
          </div>
          <form className="terminal-form" onSubmit={submit}>
            <label htmlFor="cli-command">❯</label>
            <input
              id="cli-command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder={cliLabIsComplete(cli) ? "Lab 已完成" : "輸入命令…"}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="cli-command-help"
              disabled={cliLabIsComplete(cli)}
            />
            <button type="submit" disabled={!command.trim() || cliLabIsComplete(cli)}>執行</button>
          </form>
          <p id="cli-command-help" className="sr-only">輸入教材中的命令，按 Enter 或執行送出。</p>
        </section>

        <aside className="mission-panel">
          {cliLabIsComplete(cli) ? (
            <TopicCompletionCard
              title="命令列流程完成"
              description="你已能確認 cwd、讀取檔案、解讀輸出，並完成一次可重複流程。"
              onReset={reset}
            />
          ) : (
            <>
              <span className="mission-number">{String(completedCount + 1).padStart(2, "0")}</span>
              <h2>{currentStep.title}</h2>
              <button className="command-chip" type="button" onClick={() => setCommand(currentStep.command)}>
                <code>{currentStep.command}</code><span>填入</span>
              </button>
              <p className="mission-note">{currentStep.takeaway} 提示只會填入命令，仍要由你執行。</p>
            </>
          )}

          <div className="repo-state">
            <div><small>CWD</small><b>{cli.cwd}</b></div>
            <div><small>STREAM</small><b>{cli.lastStream ?? "—"}</b></div>
            <div><small>EXIT CODE</small><b>{cli.exitCode ?? "—"}</b></div>
          </div>
        </aside>
      </div>
    </TopicLabShell>
  );
}
