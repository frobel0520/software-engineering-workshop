import { type FormEvent, useMemo, useState } from "react";
import {
  cicdFixture,
  cicdLessonSteps,
  cicdScenarioFixtures,
  cicdStageFixtures,
  cicdWorkflowFixture,
  type CicdScenarioFixture,
  type CicdScenarioId,
  type CicdStageId,
} from "./content";
import {
  createInitialCicdState,
  isCicdLabComplete,
  runCicdEvent,
  type CicdLabEvent,
  type CicdLabState,
} from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import "./styles.css";

interface CicdHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly CicdHistoryEntry[] = [
  { lines: ["CI/CD sandbox v1", "固定 workflow、required check 與三個 pipeline scenario 已準備好。"] },
];

function scenarioFor(scenarioId: CicdScenarioId | null): CicdScenarioFixture | undefined {
  return scenarioId ? cicdScenarioFixtures.find((scenario) => scenario.id === scenarioId) : undefined;
}

function statusTone(state: CicdLabState): TopicStatusTone {
  if (state.phase === "completed" && isCicdLabComplete(state)) return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: CicdLabState, stepId: CicdStageId): boolean {
  return state.completedStageIds.includes(stepId);
}

export function cicdLabProgress(state: CicdLabState): number {
  const scenarioProgress = (state.completedScenarioIds.length / cicdScenarioFixtures.length) * 80;
  return Math.round(scenarioProgress + (state.regressionVerified ? 20 : 0));
}

function eventForStep(stepId: CicdStageId): CicdLabEvent {
  return { type: stepId };
}

function eventForCommand(rawCommand: string): CicdLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  const step = cicdLessonSteps.find((candidate) => candidate.command.replace(/\s+/g, " ") === command);
  return step ? eventForStep(step.id) : null;
}

function scenarioOutcomeLabel(scenario: CicdScenarioFixture): string {
  if (scenario.mergeGate === "mergeable") return "MERGEABLE";
  if (scenario.failureStage === "run-test") return "TEST BLOCKED";
  return "BUILD BLOCKED";
}

function stateValue(value: string | number | null): string {
  return value === null ? "—" : String(value);
}

export function CicdLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<CicdLabState>(createInitialCicdState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly CicdHistoryEntry[]>(INITIAL_HISTORY);
  const scenario = scenarioFor(state.selectedScenarioId);
  const completed = isCicdLabComplete(state);
  const currentStep = useMemo(
    () => cicdLessonSteps.find((step) => step.id === state.activeStageId) ?? cicdLessonSteps.find((step) => !stepDone(state, step.id)),
    [state],
  );

  function dispatch(event: CicdLabEvent, rawCommand?: string) {
    const result = runCicdEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        command: rawCommand ?? (event.type === "select-scenario" ? event.scenarioId : cicdLessonSteps.find((step) => step.id === event.type)?.command),
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (!completed && isCicdLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const cicdEvent = eventForCommand(rawCommand);
    if (cicdEvent) {
      dispatch(cicdEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    dispatch({ type: "reset" });
    setCommand("");
    setHistory([{ lines: ["CI/CD Lab 已重設；保留 scenario audit，從固定 workflow 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / CI/CD"
      title={<>讓每次變更都經過同一條<br /><em>可重跑的檢查線</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${cicdScenarioFixtures.length} SCENARIOS · ${state.regressionVerified ? "REPLAY OK" : "REPLAY PENDING"}`}
      progress={cicdLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastFeedback} />

      {completed ? (
        <TopicCompletionCard
          title="三個 CI/CD scenarios 與 replay 都完成了。"
          description="你已驗證 workflow input、ordered gates、failure boundary、required check 與 merge gate；CI/CD Lab 完成。"
          onReset={reset}
        />
      ) : null}

      <section className="cicd-scenario-panel" aria-labelledby="cicd-scenario-title">
        <div className="cicd-panel-heading">
          <div><p className="kicker">FIXED PIPELINES</p><h2 id="cicd-scenario-title">先選擇一條可重跑的 CI/CD flow</h2></div>
          <span>{cicdScenarioFixtures.length} required outcomes</span>
        </div>
        <div className="cicd-scenario-list" role="group" aria-label="Required CI/CD scenarios">
          {cicdScenarioFixtures.map((item, index) => {
            const selected = state.selectedScenarioId === item.id;
            const done = state.completedScenarioIds.includes(item.id);
            return (
              <button
                className={`cicd-scenario ${selected ? "active" : ""} ${done ? "done" : ""}`}
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ type: "select-scenario", scenarioId: item.id })}
              >
                <span className="cicd-scenario-index" aria-hidden="true">{done ? "✓" : `0${index + 1}`}</span>
                <span className="cicd-scenario-copy"><b>{item.title}</b><small>{item.learningPoint}</small></span>
                <i>{scenarioOutcomeLabel(item)}</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cicd-workbench-panel" aria-labelledby="cicd-workbench-title">
        <div className="cicd-panel-heading cicd-workbench-heading">
          <div><p className="kicker">PIPELINE WORKBENCH</p><h2 id="cicd-workbench-title">每個 stage 都留下 gate evidence</h2></div>
          <span>{scenario ? `${state.completedStageIds.length} / ${cicdLessonSteps.length} stages` : "waiting for fixture"}</span>
        </div>
        <div className="cicd-workbench-grid">
          <section className="cicd-context-panel" aria-labelledby="cicd-context-title">
            <div className="cicd-file-header">
              <div><p className="kicker">WORKFLOW FIXTURE</p><h3 id="cicd-context-title">固定 CI workflow</h3></div>
              <span>{cicdFixture.workingDirectory}</span>
            </div>
            <div className="cicd-file-card" aria-label="CI workflow fixture">
              <header><span>{cicdWorkflowFixture.path}</span><b>fixture only</b></header>
              {cicdWorkflowFixture.lines.map((line, index) => (
                <div className="cicd-code-line" key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><code>{line}</code></div>
              ))}
            </div>
            <div className="cicd-terminal-output" role="log" aria-live="polite" aria-label="CI/CD command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form cicd-command-form" onSubmit={submit}>
              <label htmlFor="cicd-command">❯</label>
              <input
                id="cicd-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 workflow stage command…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="cicd-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="cicd-command-help" className="sr-only">可輸入教材中的 CI/CD command，或使用右側 action buttons。</p>
          </section>

          <aside className="cicd-control-panel" aria-label="CI/CD Lab controls">
            <div className="cicd-panel-heading">
              <div><p className="kicker">STAGE CONTROL</p><h3>從 trigger 走到 merge gate</h3></div>
              <span className="cicd-lab-meta">fixture only<br />no runner</span>
            </div>
            <div className="cicd-action-list">
              {cicdLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`cicd-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="cicd-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="cicd-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="cicd-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="cicd-current-hint">{scenario && currentStep ? `目前任務：${currentStep.title}。可先觀察 failure，再確認下游 not-run evidence。` : "先選一個 scenario，才能開始 inspect workflow。"}</p>
          </aside>
        </div>
      </section>

      <section className="cicd-state-section" aria-labelledby="cicd-state-title">
        <div className="cicd-panel-heading"><div><p className="kicker">LIVE PIPELINE STATE</p><h2 id="cicd-state-title">目前的 workflow／gate 線索</h2></div><span>只顯示 simulator，不啟動 runner</span></div>
        <div className="cicd-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>SCENARIO</small><b>{state.selectedScenarioId ?? "—"}</b></div>
          <div><small>EVENT</small><b>{state.triggerEvent ?? "—"}</b></div>
          <div><small>BASE REF</small><b>{state.targetRef ?? "—"}</b></div>
          <div><small>WORKFLOW</small><b>{state.workflowState}</b></div>
          <div><small>NPM CI</small><b>{state.installState}</b></div>
          <div><small>TEST</small><b>{state.testState}</b></div>
          <div><small>LINT</small><b>{state.lintState}</b></div>
          <div><small>BUILD</small><b>{state.buildState}</b></div>
          <div><small>ARTIFACT</small><b>{state.artifactState}</b></div>
          <div><small>REQUIRED CHECK</small><b>{state.requiredCheck}</b></div>
          <div><small>MERGE GATE</small><b>{state.mergeGate}</b></div>
          <div><small>SCENARIOS</small><b>{state.completedScenarioIds.length} / {cicdScenarioFixtures.length}</b></div>
          <div><small>REPLAY</small><b>{state.regressionVerified ? "verified" : "pending"}</b></div>
          <div className="cicd-state-wide"><small>LAST COMMAND</small><b>{state.lastCommand ?? "—"}</b></div>
          <div className="cicd-state-wide"><small>BASELINE / REPLAY</small><b>{stateValue(state.regressionBaselineSignature)} / {stateValue(state.regressionReplaySignature)}</b></div>
        </div>
      </section>

      <section className="cicd-evidence-section" aria-labelledby="cicd-evidence-title">
        <div className="cicd-panel-heading"><div><p className="kicker">OBSERVABLE CONTRACT</p><h2 id="cicd-evidence-title">每個 stage 都有 success／failure evidence</h2></div><span>不以顏色代替結果</span></div>
        <div className="cicd-evidence-table" role="table" aria-label="CI/CD stage evidence">
          {cicdStageFixtures.map((fixture) => (
            <div className="cicd-evidence-row" key={fixture.id} role="row">
              <code role="cell">{cicdLessonSteps.find((step) => step.id === fixture.id)?.command ?? fixture.id}</code>
              <span role="cell">{fixture.boundary}</span>
              <small role="cell">{fixture.successEvidence}</small>
              <small className="cicd-failure-evidence" role="cell">{fixture.failureEvidence}</small>
            </div>
          ))}
        </div>
      </section>
    </TopicLabShell>
  );
}
