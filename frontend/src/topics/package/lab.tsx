import { type FormEvent, type KeyboardEvent, useMemo, useState } from "react";
import {
  packageLabHappyPath,
  packageLessonSteps,
  type PackageLabEvent,
  type PackageLabState,
  type PackageStepId,
} from "./content";
import { createInitialPackageState, isPackageLabComplete, runPackageEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import { tabIndexForKey } from "../../components/tab-navigation";

interface PackageHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

type PackageFile = "package.json" | "package-lock.json" | "node_modules";

const PACKAGE_FILES: readonly PackageFile[] = ["package.json", "package-lock.json", "node_modules"];
const INITIAL_HISTORY: readonly PackageHistoryEntry[] = [];

function eventForStep(stepId: PackageStepId): PackageLabEvent {
  return packageLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function eventForCommand(rawCommand: string): PackageLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  if (command === "cat package.json") return { type: "inspect-manifest" };
  if (command === "npm install @workshop/format@^1.2.0") return { type: "add-dependency", packageSpec: "@workshop/format@^1.2.0" };
  if (command.startsWith("npm install ")) return { type: "add-dependency", packageSpec: command.slice("npm install ".length) };
  if (command === "npm install") return { type: "install" };
  if (command === "cat package-lock.json") return { type: "inspect-lockfile" };
  if (command === "npm ci") return { type: "clean-install" };
  return null;
}

function statusTone(state: PackageLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked" || state.phase === "failed") return "error";
  return "neutral";
}

function stepDone(state: PackageLabState, stepId: PackageStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function packageFileLines(state: PackageLabState, file: PackageFile): readonly string[] {
  if (file === "package.json") {
    return JSON.stringify(state.manifest, null, 2).split("\n");
  }
  if (file === "package-lock.json") {
    return state.lockfile ? JSON.stringify(state.lockfile, null, 2).split("\n") : ["// package-lock.json 尚未產生", "// 執行 npm install 後再檢查"];
  }
  return state.installedModules.length
    ? ["node_modules/", ...state.installedModules.map((module) => `  ${module}`)]
    : ["node_modules/", "  // 尚未安裝任何依賴"];
}

function packageFileSlug(file: PackageFile): string {
  return file.replace(/[^a-z0-9]+/gi, "-");
}

function packageTabId(file: PackageFile): string {
  return `package-file-tab-${packageFileSlug(file)}`;
}

function packagePanelId(file: PackageFile): string {
  return `package-file-panel-${packageFileSlug(file)}`;
}

export function packageLabProgress(state: PackageLabState): number {
  return Math.round((state.completedStepIds.length / packageLessonSteps.length) * 100);
}

export function PackageLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<PackageLabState>(createInitialPackageState);
  const [command, setCommand] = useState("");
  const [selectedFile, setSelectedFile] = useState<PackageFile>("package.json");
  const [history, setHistory] = useState<readonly PackageHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isPackageLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => packageLessonSteps.find((step) => !stepDone(state, step.id)) ?? packageLessonSteps[packageLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: PackageLabEvent, rawCommand?: string) {
    if (completed) return;
    const result = runPackageEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      { command: rawCommand ?? packageLessonSteps.find((step) => step.id === event.type)?.command, lines: result.output, accepted: result.accepted },
    ]);
    if (result.accepted && isPackageLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const packageEvent = eventForCommand(rawCommand);
    if (packageEvent) {
      dispatch(packageEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    setState(createInitialPackageState());
    setCommand("");
    setSelectedFile("package.json");
    setHistory([{ lines: ["已重設。從 cat package.json 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      className="foundation-lab-shell"
      showMeta={false}
      title={<>讓依賴變得可重現<br /><em>而不是碰運氣</em></>}
      progressLabel={`${completedCount} / ${packageLessonSteps.length} STEPS`}
      progress={packageLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="依賴已乾淨重建。"
          description="你已完成 manifest、lockfile 與 installed modules 的同步流程，並用 npm ci 從 exact resolution 重建相同 dependency graph。"
          onReset={reset}
        />
      ) : (
        <div className="package-lab-grid">
          <section className="package-workspace-panel" aria-label="套件工作區">
            <div className="package-workspace-top">
              <span className="package-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="package-phase">{state.phase}</span>
            </div>
            <div className="package-file-tabs" role="tablist" aria-orientation="horizontal" aria-label="套件檔案">
              {PACKAGE_FILES.map((file, index) => (
                <button
                  className={selectedFile === file ? "active" : ""}
                  key={file}
                  type="button"
                  role="tab"
                  id={packageTabId(file)}
                  aria-controls={packagePanelId(file)}
                  aria-selected={selectedFile === file}
                  tabIndex={selectedFile === file ? 0 : -1}
                  onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                    const nextIndex = tabIndexForKey(event.key, index, PACKAGE_FILES.length);
                    if (nextIndex === null) return;
                    event.preventDefault();
                    const nextFile = PACKAGE_FILES[nextIndex];
                    setSelectedFile(nextFile);
                    document.getElementById(packageTabId(nextFile))?.focus();
                  }}
                  onClick={() => setSelectedFile(file)}
                >
                  {file}
                </button>
              ))}
            </div>
            {PACKAGE_FILES.map((file) => (
              <div
                className="package-editor"
                id={packagePanelId(file)}
                key={file}
                role="tabpanel"
                aria-labelledby={packageTabId(file)}
                aria-label={file}
                tabIndex={0}
                hidden={selectedFile !== file}
              >
                {packageFileLines(state, file).map((line, index) => (
                  <div className="package-code-line" key={`${file}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span><code>{line || " "}</code>
                  </div>
                ))}
              </div>
            ))}
            <div className="package-terminal-output" role="log" aria-live="polite" aria-label="Package command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form package-command-form" onSubmit={submit}>
              <label htmlFor="package-command">❯</label>
              <input
                id="package-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 npm 指令…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="package-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="package-command-help" className="sr-only">可輸入教材中的 package 指令，或使用右側 action buttons。</p>
          </section>

          <aside className="package-control-panel" aria-label="Package management controls">
            <div className="package-panel-heading">
              <div><h2>依序同步三層狀態</h2></div>
            </div>
            <div className="package-action-list">
              {packageLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`package-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="package-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="package-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="package-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="package-current-hint">目前任務：{currentStep.title}。</p>
          </aside>
        </div>
      )}

      <section className="package-state-section" aria-labelledby="package-state-title">
        <div className="section-heading"><div><h2 id="package-state-title">目前的依賴線索</h2></div></div>
        <div className="package-state-grid">
          <div><small>MANIFEST</small><b>{state.manifestState}</b></div>
          <div><small>LOCKFILE</small><b>{state.lockfileState}</b></div>
          <div><small>INSTALL</small><b>{state.installState}</b></div>
          <div><small>MODULES</small><b>{state.installedModules.length || "—"}</b></div>
          <div className="package-state-wide"><small>DECLARED DEPENDENCIES</small><b>{Object.entries(state.manifest.dependencies).map(([name, version]) => `${name}@${version}`).join(" · ") || "—"}</b></div>
          <div className="package-state-wide"><small>LAST COMMAND</small><b>{state.lastCommand ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
