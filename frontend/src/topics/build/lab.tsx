import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import {
  buildFileFixtures,
  buildLabHappyPath,
  buildLessonSteps,
  type BuildFileId,
  type BuildLabEvent,
  type BuildLabState,
  type BuildStepId,
} from "./content";
import { createInitialBuildState, isBuildLabComplete, runBuildEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import { tabIndexForKey } from "../../components/tab-navigation";

interface BuildHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly BuildHistoryEntry[] = [];

function eventForStep(stepId: BuildStepId): BuildLabEvent {
  return buildLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function eventForCommand(rawCommand: string): BuildLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  if (command === "cat package.json") return { type: "inspect-scripts" };
  if (command === "npm run lint") return { type: "typecheck" };
  if (command === "npm run build:pages") return { type: "bundle" };
  if (command === "ls dist") return { type: "inspect-dist" };
  if (command === "npm run preview") return { type: "preview" };
  return null;
}

function statusTone(state: BuildLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked" || state.phase === "failed") return "error";
  return "neutral";
}

function stepDone(state: BuildLabState, stepId: BuildStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function buildFileLines(state: BuildLabState, fileId: BuildFileId): readonly string[] {
  if (fileId === "dist" && state.bundleState === "created") {
    return ["dist/", "├── index.html", "└── assets/", "    ├── index-[hash].js", "    └── index-[hash].css"];
  }
  const file = buildFileFixtures.find((candidate) => candidate.id === fileId);
  if (!file) {
    throw new Error(`Unknown build file fixture: ${fileId}`);
  }
  return file.lines;
}

function buildFileSlug(fileId: BuildFileId): string {
  return fileId.replace(/[^a-z0-9]+/gi, "-");
}

function buildTabId(fileId: BuildFileId): string {
  return `build-file-tab-${buildFileSlug(fileId)}`;
}

function buildPanelId(fileId: BuildFileId): string {
  return `build-file-panel-${buildFileSlug(fileId)}`;
}

export function buildLabProgress(state: BuildLabState): number {
  return Math.round((state.completedStepIds.length / buildLessonSteps.length) * 100);
}

export function BuildLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<BuildLabState>(createInitialBuildState);
  const [command, setCommand] = useState("");
  const [selectedFile, setSelectedFile] = useState<BuildFileId>("package-json");
  const [history, setHistory] = useState<readonly BuildHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isBuildLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => buildLessonSteps.find((step) => !stepDone(state, step.id)) ?? buildLessonSteps[buildLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: BuildLabEvent, rawCommand?: string) {
    if (completed) return;
    const result = runBuildEvent({ ...state, selectedFile }, event);
    setState(result.state);
    setSelectedFile(result.state.selectedFile);
    setHistory((items) => [
      ...items,
      { command: rawCommand ?? buildLessonSteps.find((step) => step.id === event.type)?.command, lines: result.output, accepted: result.accepted },
    ]);
    if (result.accepted && isBuildLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const buildEvent = eventForCommand(rawCommand);
    if (buildEvent) {
      dispatch(buildEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    setState(createInitialBuildState());
    setCommand("");
    setSelectedFile("package-json");
    setHistory([{ lines: ["已重設。從 cat package.json 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>把 source 變成<br /><em>可以交付的產品</em></>}
      progressLabel={`${completedCount} / ${buildLessonSteps.length} STEPS`}
      progress={buildLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="Artifact 已準備交付。"
          description="你已完成 script 契約、TypeScript gate、production bundle、dist 檢查與 preview；BUILD Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="build-lab-grid">
          <section className="build-workspace-panel" aria-label="Build workspace">
            <div className="build-workspace-top">
              <span className="build-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-build-lab</b>
              <span className="build-phase">{state.phase}</span>
            </div>
            <div className="build-file-tabs" role="tablist" aria-orientation="horizontal" aria-label="Build files">
              {buildFileFixtures.map((file, index) => (
                <button
                  className={selectedFile === file.id ? "active" : ""}
                  key={file.id}
                  type="button"
                  role="tab"
                  id={buildTabId(file.id)}
                  aria-controls={buildPanelId(file.id)}
                  aria-selected={selectedFile === file.id}
                  tabIndex={selectedFile === file.id ? 0 : -1}
                  onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                    const nextIndex = tabIndexForKey(event.key, index, buildFileFixtures.length);
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextFile = buildFileFixtures[nextIndex];
                    setSelectedFile(nextFile.id);
                    document.getElementById(buildTabId(nextFile.id))?.focus();
                  }}
                  onClick={() => setSelectedFile(file.id)}
                >
                  {file.name}
                </button>
              ))}
            </div>
            {buildFileFixtures.map((file) => (
              <div
                className="build-editor"
                id={buildPanelId(file.id)}
                key={file.id}
                role="tabpanel"
                aria-labelledby={buildTabId(file.id)}
                aria-label={file.id}
                tabIndex={0}
                hidden={selectedFile !== file.id}
              >
                {buildFileLines(state, file.id).map((line, index) => (
                  <div className="build-code-line" key={`${file.id}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span><code>{line || " "}</code>
                  </div>
                ))}
              </div>
            ))}
            <div className="build-terminal-output" role="log" aria-live="polite" aria-label="Build command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form build-command-form" onSubmit={submit}>
              <label htmlFor="build-command">❯</label>
              <input
                id="build-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 build 指令…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="build-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="build-command-help" className="sr-only">可輸入教材中的 build 指令，或使用右側 action buttons。</p>
          </section>

          <aside className="build-control-panel" aria-label="Build controls">
            <div className="build-panel-heading">
              <div><h2>從 source 走到 artifact</h2></div>
              <span className="build-lab-meta">Vite + TypeScript</span>
            </div>
            <div className="build-action-list">
              {buildLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`build-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="build-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="build-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="build-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="build-current-hint">目前任務：{currentStep.title}。可以故意點錯順序，觀察狀態如何保留並提示原因。</p>
          </aside>
        </div>
      )}

      <section className="build-state-section" aria-labelledby="build-state-title">
        <div className="section-heading"><div><h2 id="build-state-title">目前的交付線索</h2></div></div>
        <div className="build-state-grid">
          <div><small>TYPECHECK</small><b>{state.typecheckState}</b></div>
          <div><small>BUNDLE</small><b>{state.bundleState}</b></div>
          <div><small>ARTIFACT</small><b>{state.artifactState}</b></div>
          <div><small>PREVIEW</small><b>{state.previewState}</b></div>
          <div className="build-state-wide"><small>BASE PATH</small><b>{state.basePath}</b></div>
          <div className="build-state-wide"><small>LAST COMMAND</small><b>{state.lastCommand ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
