import { type FormEvent, useMemo, useState } from "react";
import {
  dockerCommandFixtures,
  dockerFileFixture,
  dockerFixture,
  dockerLessonSteps,
  dockerScenarioFixtures,
  type DockerScenarioFixture,
  type DockerScenarioId,
  type DockerStepId,
} from "./content";
import {
  createInitialDockerState,
  isDockerLabComplete,
  runDockerEvent,
  type DockerLabEvent,
  type DockerLabState,
} from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import "./styles.css";

interface DockerHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly DockerHistoryEntry[] = [
];

function scenarioFor(scenarioId: DockerScenarioId | null): DockerScenarioFixture | undefined {
  return scenarioId ? dockerScenarioFixtures.find((scenario) => scenario.id === scenarioId) : undefined;
}

function statusTone(state: DockerLabState): TopicStatusTone {
  if (state.phase === "completed" && isDockerLabComplete(state)) return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: DockerLabState, stepId: DockerStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

export function dockerLabProgress(state: DockerLabState): number {
  const scenarioProgress = (state.completedScenarioIds.length / dockerScenarioFixtures.length) * 80;
  return Math.round(scenarioProgress + (state.regressionVerified ? 20 : 0));
}

function eventForStep(stepId: DockerStepId): DockerLabEvent {
  return { type: stepId };
}

function eventForCommand(rawCommand: string, state: DockerLabState): DockerLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  if (command === "docker run --name workshop-web -p 8080:80 workshop-web:1" && state.probeState === "unreachable") {
    return { type: "repair-port" };
  }
  const step = dockerLessonSteps.find((candidate) => candidate.command === command);
  return step ? eventForStep(step.id) : null;
}

function scenarioOutcomeLabel(scenario: DockerScenarioFixture): string {
  if (scenario.id === "static-site-success") return "HTTP 200";
  if (scenario.id === "missing-build-artifact") return "COPY failed";
  return "unreachable → repair";
}

function stateValue(value: string | number | null): string {
  return value === null ? "—" : String(value);
}

export function DockerLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<DockerLabState>(createInitialDockerState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly DockerHistoryEntry[]>(INITIAL_HISTORY);
  const scenario = scenarioFor(state.selectedScenarioId);
  const completed = isDockerLabComplete(state);
  const currentStep = useMemo(
    () => dockerLessonSteps.find((step) => !stepDone(state, step.id)) ?? dockerLessonSteps[dockerLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: DockerLabEvent, rawCommand?: string) {
    const result = runDockerEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        command: rawCommand ?? dockerLessonSteps.find((step) => step.id === event.type)?.command,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (!completed && isDockerLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const dockerEvent = eventForCommand(rawCommand, state);
    if (dockerEvent) {
      dispatch(dockerEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    dispatch({ type: "reset" });
    setCommand("");
    setHistory([]);
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>把 image、container 與 port<br /><em>都留下可觀察證據</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${dockerScenarioFixtures.length} SCENARIOS · ${state.regressionVerified ? "REPLAY OK" : "REPLAY PENDING"}`}
      progress={dockerLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="三個 Docker scenarios 與 replay 都完成了。"
          description="你已驗證 image、COPY failure、container state、host port mapping、HTTP probe 與 cleanup；Docker Lab 完成。"
          onReset={reset}
        />
      ) : null}

      <section className="docker-scenario-panel" aria-labelledby="docker-scenario-title">
        <div className="docker-panel-heading">
          <div><h2 id="docker-scenario-title">先選擇一條可重跑的 Docker flow</h2></div>
        </div>
        <div className="docker-scenario-list" role="group" aria-label="Required Docker scenarios">
          {dockerScenarioFixtures.map((item, index) => {
            const selected = state.selectedScenarioId === item.id;
            const done = state.completedScenarioIds.includes(item.id);
            return (
              <button
                className={`docker-scenario ${selected ? "active" : ""} ${done ? "done" : ""}`}
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ type: "select-scenario", scenarioId: item.id })}
              >
                <span className="docker-scenario-index" aria-hidden="true">{done ? "✓" : `0${index + 1}`}</span>
                <span className="docker-scenario-copy"><b>{item.title}</b><small>{item.learningPoint}</small></span>
                <i>{scenarioOutcomeLabel(item)}</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="docker-workbench-panel" aria-labelledby="docker-workbench-title">
        <div className="docker-panel-heading docker-workbench-heading">
          <div><h2 id="docker-workbench-title">每一步都對應一個 runtime boundary</h2></div>
          <span>{scenario ? `${state.completedStepIds.length} / ${dockerLessonSteps.length} stages` : "未選擇"}</span>
        </div>
        <div className="docker-workbench-grid">
          <section className="docker-context-panel" aria-labelledby="docker-context-title">
            <div className="docker-file-header">
              <div><h3 id="docker-context-title">static-site build context</h3></div>
              <span>{dockerFixture.contextPath}</span>
            </div>
            <div className="docker-file-card" aria-label="Dockerfile">
              <header><span>{dockerFileFixture.path}</span></header>
              {dockerFileFixture.lines.map((line, index) => (
                <div className="docker-code-line" key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><code>{line}</code></div>
              ))}
              <div className="docker-artifact-line"><span>＋</span><code>{dockerFixture.sourceArtifact}</code><small>{scenario?.artifactPresent === false ? "missing in this scenario" : "available in context"}</small></div>
            </div>
            <div className="docker-terminal-output" role="log" aria-live="polite" aria-label="Docker command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form docker-command-form" onSubmit={submit}>
              <label htmlFor="docker-command">❯</label>
              <input
                id="docker-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 Docker 指令…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="docker-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="docker-command-help" className="sr-only">可輸入教材中的 Docker command，或使用右側 action buttons。</p>
          </section>

          <aside className="docker-control-panel" aria-label="Docker Lab controls">
            <div className="docker-panel-heading">
              <div><h3>從 context 走到 cleanup</h3></div>
              <span className="docker-lab-meta">no daemon</span>
            </div>
            <div className="docker-action-list">
              {dockerLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`docker-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="docker-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="docker-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="docker-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
              {state.selectedScenarioId === "unpublished-container-port" && state.probeState === "unreachable" ? (
                <button className="docker-action docker-repair-action" type="button" onClick={() => dispatch({ type: "repair-port" }, "docker run --name workshop-web -p 8080:80 workshop-web:1")}>
                  <span className="docker-action-index" aria-hidden="true">↻</span>
                  <span className="docker-action-copy"><b>修正 host port mapping</b><code>docker run --name workshop-web -p 8080:80 workshop-web:1</code></span>
                  <span className="docker-action-arrow" aria-hidden="true">→</span>
                </button>
              ) : null}
            </div>
            <p className="docker-current-hint">{scenario ? `目前任務：${currentStep.title}。可以先觀察錯誤，再依 feedback 修正 boundary。` : "先選一個 scenario，才能開始 inspect context。"}</p>
          </aside>
        </div>
      </section>

      <section className="docker-state-section" aria-labelledby="docker-state-title">
        <div className="docker-panel-heading"><div><h2 id="docker-state-title">目前的 image／container 線索</h2></div></div>
        <div className="docker-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>SCENARIO</small><b>{state.selectedScenarioId ?? "—"}</b></div>
          <div><small>IMAGE</small><b>{state.imageState}</b></div>
          <div><small>CONTAINER</small><b>{state.containerState}</b></div>
          <div><small>PORT MAPPING</small><b>{state.portMapping === "published" ? "8080→80" : state.portMapping}</b></div>
          <div><small>PROBE</small><b>{state.probeState}{state.probeStatus === null ? "" : ` · ${state.probeStatus}`}</b></div>
          <div><small>COMPLETED</small><b>{state.completedScenarioIds.length} / {dockerScenarioFixtures.length}</b></div>
          <div><small>REPLAY</small><b>{state.regressionVerified ? "verified" : "pending"}</b></div>
          <div className="docker-state-wide"><small>IMAGE EVIDENCE</small><b>{stateValue(state.imageTag)} · {stateValue(state.imageDigest)}</b></div>
          <div className="docker-state-wide"><small>LAST COMMAND</small><b>{state.lastCommand ?? "—"}</b></div>
        </div>
      </section>

      <section className="docker-evidence-section" aria-labelledby="docker-evidence-title">
        <div className="docker-panel-heading"><div><h2 id="docker-evidence-title">每個 command 都留下 boundary evidence</h2></div></div>
        <div className="docker-evidence-table" role="table" aria-label="Docker command evidence">
          {dockerCommandFixtures.map((fixture) => (
            <div className="docker-evidence-row" key={fixture.stepId} role="row">
              <code role="cell">{fixture.command}</code>
              <span role="cell">{fixture.boundary}</span>
              <small role="cell">{fixture.successEvidence}</small>
            </div>
          ))}
        </div>
      </section>
    </TopicLabShell>
  );
}
