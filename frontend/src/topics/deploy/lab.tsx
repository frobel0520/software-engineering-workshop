import { type FormEvent, useMemo, useState } from "react";
import {
  deployFixture,
  deployLessonSteps,
  deployScenarioFixtures,
  deployStageFixtures,
  deployWorkflowFixture,
  type DeployScenarioFixture,
  type DeployScenarioId,
  type DeployStageId,
} from "./content";
import {
  createInitialDeployState,
  isDeployLabComplete,
  runDeployEvent,
  type DeployLabEvent,
  type DeployLabState,
} from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import "./styles.css";

interface DeployHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly DeployHistoryEntry[] = [
  { lines: ["Deploy sandbox v1", "固定 Pages workflow、release record 與四個 deployment scenario 已準備好。"] },
];

function scenarioFor(scenarioId: DeployScenarioId | null): DeployScenarioFixture | undefined {
  return scenarioId ? deployScenarioFixtures.find((scenario) => scenario.id === scenarioId) : undefined;
}

function statusTone(state: DeployLabState): TopicStatusTone {
  if (state.phase === "completed" && isDeployLabComplete(state)) return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: DeployLabState, stepId: DeployStageId): boolean {
  return state.completedStageIds.includes(stepId);
}

export function deployLabProgress(state: DeployLabState): number {
  const scenarioProgress = (state.completedScenarioIds.length / deployScenarioFixtures.length) * 80;
  return Math.round(scenarioProgress + (state.regressionVerified ? 20 : 0));
}

function eventForStep(stepId: DeployStageId): DeployLabEvent {
  return { type: stepId };
}

function eventForCommand(rawCommand: string): DeployLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  const step = deployLessonSteps.find((candidate) => candidate.command.replace(/\s+/g, " ") === command);
  return step ? eventForStep(step.id) : null;
}

function scenarioOutcomeLabel(scenario: DeployScenarioFixture): string {
  if (scenario.finalRecord === "verified") return "LIVE 200";
  if (scenario.finalRecord === "blocked") return "PUBLISH BLOCKED";
  return "ROLLBACK READY";
}

function stateValue(value: string | number | null): string {
  return value === null ? "—" : String(value);
}

export function DeployLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<DeployLabState>(createInitialDeployState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly DeployHistoryEntry[]>(INITIAL_HISTORY);
  const scenario = scenarioFor(state.selectedScenarioId);
  const completed = isDeployLabComplete(state);
  const currentStep = useMemo(
    () => deployLessonSteps.find((step) => step.id === state.activeStageId) ?? deployLessonSteps.find((step) => !stepDone(state, step.id)),
    [state],
  );

  function dispatch(event: DeployLabEvent, rawCommand?: string) {
    const result = runDeployEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        command: rawCommand ?? (event.type === "select-scenario" ? event.scenarioId : deployLessonSteps.find((step) => step.id === event.type)?.command),
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (!completed && isDeployLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const deployEvent = eventForCommand(rawCommand);
    if (deployEvent) {
      dispatch(deployEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: command not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    dispatch({ type: "reset" });
    setCommand("");
    setHistory([{ lines: ["Deploy Lab 已重設；保留 scenario audit，從固定 Pages workflow 重新開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / DEPLOY"
      title={<>讓 publish、probe 與 rollback<br /><em>都留下證據</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${deployScenarioFixtures.length} SCENARIOS · ${state.regressionVerified ? "REPLAY OK" : "REPLAY PENDING"}`}
      progress={deployLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastFeedback} />

      {completed ? (
        <TopicCompletionCard
          title="四個 Deploy scenarios 與 replay 都完成了。"
          description="你已驗證 main release、artifact provenance、Pages publish、live probe、release record 與 rollback；Deploy Lab 完成。"
          onReset={reset}
        />
      ) : null}

      <section className="deploy-scenario-panel" aria-labelledby="deploy-scenario-title">
        <div className="deploy-panel-heading">
          <div><p className="kicker">FIXED RELEASES</p><h2 id="deploy-scenario-title">先選擇一條可重跑的 deployment flow</h2></div>
          <span>{deployScenarioFixtures.length} required outcomes</span>
        </div>
        <div className="deploy-scenario-list" role="group" aria-label="Required deployment scenarios">
          {deployScenarioFixtures.map((item, index) => {
            const selected = state.selectedScenarioId === item.id;
            const done = state.completedScenarioIds.includes(item.id);
            return (
              <button
                className={`deploy-scenario ${selected ? "active" : ""} ${done ? "done" : ""}`}
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => dispatch({ type: "select-scenario", scenarioId: item.id })}
              >
                <span className="deploy-scenario-index" aria-hidden="true">{done ? "✓" : `0${index + 1}`}</span>
                <span className="deploy-scenario-copy"><b>{item.title}</b><small>{item.learningPoint}</small></span>
                <i>{scenarioOutcomeLabel(item)}</i>
              </button>
            );
          })}
        </div>
      </section>

      <section className="deploy-workbench-panel" aria-labelledby="deploy-workbench-title">
        <div className="deploy-panel-heading deploy-workbench-heading">
          <div><p className="kicker">RELEASE WORKBENCH</p><h2 id="deploy-workbench-title">每個 stage 都留下 delivery evidence</h2></div>
          <span>{scenario ? `${state.completedStageIds.length} / ${deployLessonSteps.length} stages` : "waiting for fixture"}</span>
        </div>
        <div className="deploy-workbench-grid">
          <section className="deploy-context-panel" aria-labelledby="deploy-context-title">
            <div className="deploy-file-header">
              <div><p className="kicker">PAGES WORKFLOW FIXTURE</p><h3 id="deploy-context-title">固定 deployment workflow</h3></div>
              <span>{deployFixture.pagesBranch}</span>
            </div>
            <div className="deploy-file-card" aria-label="Deploy workflow fixture">
              <header><span>{deployWorkflowFixture.path}</span><b>fixture only</b></header>
              {deployWorkflowFixture.lines.map((line, index) => (
                <div className="deploy-code-line" key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><code>{line}</code></div>
              ))}
            </div>
            <div className="deploy-terminal-output" role="log" aria-live="polite" aria-label="Deployment command output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form deploy-command-form" onSubmit={submit}>
              <label htmlFor="deploy-command">❯</label>
              <input
                id="deploy-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 deployment stage command…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="deploy-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="deploy-command-help" className="sr-only">可輸入教材中的 deployment command，或使用右側 action buttons。</p>
          </section>

          <aside className="deploy-control-panel" aria-label="Deploy Lab controls">
            <div className="deploy-panel-heading">
              <div><p className="kicker">STAGE CONTROL</p><h3>從 main release 走到 rollback</h3></div>
              <span className="deploy-lab-meta">fixture only<br />no Pages API</span>
            </div>
            <div className="deploy-action-list">
              {deployLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`deploy-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.command)}
                    aria-label={`${step.title}：${step.command}`}
                  >
                    <span className="deploy-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="deploy-action-copy"><b>{step.title}</b><code>{step.command}</code></span>
                    <span className="deploy-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="deploy-current-hint">{scenario && currentStep ? `目前任務：${currentStep.title}。可先觀察 blocked／failed evidence，再確認 Pages pointer 與 rollback。` : "先選一個 scenario，才能開始 inspect deploy workflow。"}</p>
          </aside>
        </div>
      </section>

      <section className="deploy-state-section" aria-labelledby="deploy-state-title">
        <div className="deploy-panel-heading"><div><p className="kicker">LIVE RELEASE STATE</p><h2 id="deploy-state-title">目前的 artifact／Pages 線索</h2></div><span>只顯示 simulator，不連線 Pages</span></div>
        <div className="deploy-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>SCENARIO</small><b>{state.selectedScenarioId ?? "—"}</b></div>
          <div><small>SOURCE</small><b>{state.releaseSource ?? "—"}</b></div>
          <div><small>CANDIDATE</small><b>{state.candidateVersion ?? "—"}</b></div>
          <div><small>WORKFLOW</small><b>{state.workflowState}</b></div>
          <div><small>CI</small><b>{state.ciState}</b></div>
          <div><small>ARTIFACT</small><b>{state.artifactState}</b></div>
          <div><small>BASE PATH</small><b>{state.basePathState}</b></div>
          <div><small>PUBLISH</small><b>{state.publishState}</b></div>
          <div><small>PAGES BRANCH</small><b>{state.pagesBranchVersion}</b></div>
          <div><small>DEPLOYMENT</small><b>{state.deploymentState}</b></div>
          <div><small>LIVE STATUS</small><b>{stateValue(state.liveStatus)}</b></div>
          <div><small>RECORD</small><b>{state.releaseRecord}</b></div>
          <div><small>ROLLBACK</small><b>{state.rollbackVersion ?? "—"}</b></div>
          <div><small>SCENARIOS</small><b>{state.completedScenarioIds.length} / {deployScenarioFixtures.length}</b></div>
          <div><small>REPLAY</small><b>{state.regressionVerified ? "verified" : "pending"}</b></div>
          <div className="deploy-state-wide"><small>LIVE URL</small><b>{state.liveUrl ?? "—"}</b></div>
          <div className="deploy-state-wide"><small>BASELINE / REPLAY</small><b>{stateValue(state.regressionBaselineSignature)} / {stateValue(state.regressionReplaySignature)}</b></div>
        </div>
      </section>

      <section className="deploy-evidence-section" aria-labelledby="deploy-evidence-title">
        <div className="deploy-panel-heading"><div><p className="kicker">OBSERVABLE CONTRACT</p><h2 id="deploy-evidence-title">每個 stage 都有 success／failure evidence</h2></div><span>不以顏色代替結果</span></div>
        <div className="deploy-evidence-table" role="table" aria-label="Deployment stage evidence">
          {deployStageFixtures.map((fixture) => (
            <div className="deploy-evidence-row" key={fixture.id} role="row">
              <code role="cell">{deployLessonSteps.find((step) => step.id === fixture.id)?.command ?? fixture.id}</code>
              <span role="cell">{fixture.boundary}</span>
              <small role="cell">{fixture.successEvidence}</small>
              <small className="deploy-failure-evidence" role="cell">{fixture.failureEvidence}</small>
            </div>
          ))}
        </div>
      </section>
    </TopicLabShell>
  );
}
