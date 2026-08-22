import { type FormEvent, useMemo, useState } from "react";
import {
  envFileFixtures,
  envLabHappyPath,
  envLessonSteps,
  type EnvFileId,
  type EnvLabEvent,
  type EnvLabState,
  type EnvStepId,
} from "./content";
import { createInitialEnvState, isEnvLabComplete, runEnvEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface EnvHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly EnvHistoryEntry[] = [
  { lines: ["Environment sandbox v1", "固定 .env fixture 已準備好。請依序檢查設定來源與公開邊界。"] },
];

function eventForStep(stepId: EnvStepId): EnvLabEvent {
  return envLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function eventForCommand(rawCommand: string): EnvLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  if (command === "cat .env.example") return { type: "inspect-example" };
  if (command === "cp .env.example .env.local") return { type: "load-local" };
  if (command === "npm run check-config") return { type: "validate-config" };
  if (command === "npm run check-exposure") return { type: "check-exposure" };
  if (command === "git check-ignore .env.local") return { type: "check-ignore" };
  return null;
}

function statusTone(state: EnvLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked" || state.phase === "failed") return "error";
  return "neutral";
}

function stepDone(state: EnvLabState, stepId: EnvStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function envFileLines(state: EnvLabState, fileId: EnvFileId): readonly string[] {
  if (fileId === "env-local" && !state.loadedFiles.includes("env-local")) {
    return ["// .env.local 尚未建立", "// 執行 cp .env.example .env.local"]; 
  }
  const file = envFileFixtures.find((candidate) => candidate.id === fileId);
  if (!file) {
    throw new Error(`Unknown environment file fixture: ${fileId}`);
  }
  return file.lines;
}

export function envLabProgress(state: EnvLabState): number {
  return Math.round((state.completedStepIds.length / envLessonSteps.length) * 100);
}

export function EnvLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<EnvLabState>(createInitialEnvState);
  const [command, setCommand] = useState("");
  const [selectedFile, setSelectedFile] = useState<EnvFileId>("env-example");
  const [history, setHistory] = useState<readonly EnvHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isEnvLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => envLessonSteps.find((step) => !stepDone(state, step.id)) ?? envLessonSteps[envLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: EnvLabEvent, rawCommand?: string) {
    if (completed) return;
    const result = runEnvEvent({ ...state, selectedFile }, event);
    setState(result.state);
    setSelectedFile(result.state.selectedFile);
    setHistory((items) => [
      ...items,
      { command: rawCommand ?? envLessonSteps.find((step) => step.id === event.type)?.command, lines: result.output, accepted: result.accepted },
    ]);
    if (result.accepted && isEnvLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const envEvent = eventForCommand(rawCommand);
    if (envEvent) {
      dispatch(envEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    setState(createInitialEnvState());
    setCommand("");
    setSelectedFile("env-example");
    setHistory([{ lines: ["ENV Lab 已重設。從 cat .env.example 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / ENV"
      title={<>讓設定跟著環境走<br /><em>但別把秘密打包</em></>}
      progressLabel={`${completedCount} / ${envLessonSteps.length} STEPS`}
      progress={envLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="設定已放到正確邊界。"
          description="你已完成範本、本地載入、必要設定驗證、bundle 公開邊界與 git 忽略檢查；ENV Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="env-lab-grid">
          <section className="env-workspace-panel" aria-label="Environment workspace fixture">
            <div className="env-workspace-top">
              <span className="env-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-env-lab</b>
              <span className="env-phase">{state.phase}</span>
            </div>
            <div className="env-file-tabs" role="tablist" aria-label="Environment fixture files">
              {envFileFixtures.map((file) => (
                <button
                  className={selectedFile === file.id ? "active" : ""}
                  key={file.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedFile === file.id}
                  onClick={() => setSelectedFile(file.id)}
                >
                  {file.name}
                </button>
              ))}
            </div>
            <div className="env-editor" role="region" aria-label={`${selectedFile} fixture`}>
              {envFileLines(state, selectedFile).map((line, index) => (
                <div className="env-code-line" key={`${selectedFile}-${index}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span><code>{line || " "}</code>
                </div>
              ))}
            </div>
            <div className="env-terminal-output" role="log" aria-live="polite" aria-label="Environment command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form env-command-form" onSubmit={submit}>
              <label htmlFor="env-command">❯</label>
              <input
                id="env-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入環境設定指令…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="env-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="env-command-help" className="sr-only">可輸入教材中的環境設定指令，或使用右側 action buttons。</p>
          </section>

          <aside className="env-control-panel" aria-label="Environment controls">
            <div className="env-panel-heading">
              <div><p className="kicker">ENV CONTROL</p><h2>從來源走到安全邊界</h2></div>
              <span className="env-lab-meta">Vite mode<br />fixture only</span>
            </div>
            <div className="env-action-list">
              {envLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`env-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="env-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="env-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="env-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="env-current-hint">目前任務：{currentStep.title}。可以故意點錯順序，觀察 simulator 如何保留狀態並提示原因。</p>
          </aside>
        </div>
      )}

      <section className="env-state-section" aria-labelledby="env-state-title">
        <div className="section-heading"><div><p className="kicker">LIVE ENV STATE</p><h2 id="env-state-title">目前的設定線索</h2></div><p>只顯示 simulator 狀態，不讀取真實 .env。</p></div>
        <div className="env-state-grid">
          <div><small>SOURCE</small><b>{state.configState}</b></div>
          <div><small>EXPOSURE</small><b>{state.exposureState}</b></div>
          <div><small>LOCAL FILE</small><b>{state.localIgnored ? "ignored" : "unverified"}</b></div>
          <div><small>PUBLIC KEYS</small><b>{state.publicKeys.length || "—"}</b></div>
          <div className="env-state-wide"><small>CLIENT BUNDLE</small><b>{state.publicKeys.join(" · ") || "—"}</b></div>
          <div className="env-state-wide"><small>SERVER ONLY</small><b>{state.serverOnlyKeys.join(" · ") || "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
