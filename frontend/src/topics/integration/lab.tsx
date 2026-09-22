import { useState } from "react";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import {
  integrationBoundaryFixtures,
  integrationFailureFixtures,
  integrationRequiredScenarioIds,
  integrationScenarios,
  type IntegrationBoundaryId,
  type IntegrationScenarioFixture,
  type IntegrationScenarioId,
} from "./content";
import {
  createInitialIntegrationState,
  integrationStageIds,
  isIntegrationLabComplete,
  runIntegrationEvent,
  type IntegrationLabEvent,
  type IntegrationLabState,
  type IntegrationStageId,
} from "./simulator";

const STAGE_LABELS: Record<IntegrationStageId, string> = {
  input: "INPUT",
  client: "CLIENT",
  service: "SERVICE",
  repository: "REPOSITORY",
  response: "RESPONSE",
};

const STAGE_HINTS: Record<IntegrationStageId, string> = {
  input: "order input",
  client: "checkoutClient mapping",
  service: "orderService rule",
  repository: "orderRepository edge",
  response: "orderResponse contract",
};

const STAGE_MODULES: Record<IntegrationStageId, string> = {
  input: "checkout input",
  client: "checkoutClient",
  service: "orderService",
  repository: "orderRepository",
  response: "orderResponse",
};

function stageIndex(stageId: IntegrationStageId): number {
  return integrationStageIds.indexOf(stageId);
}

function terminalStageFor(scenario: IntegrationScenarioFixture): IntegrationStageId {
  return scenario.expected.failureBoundary ?? "response";
}

function nextStageFor(scenario: IntegrationScenarioFixture, stageId: IntegrationStageId): IntegrationStageId | null {
  const nextIndex = stageIndex(stageId) + 1;
  return nextIndex <= stageIndex(terminalStageFor(scenario)) ? integrationStageIds[nextIndex] : null;
}

function scenarioFor(scenarioId: IntegrationScenarioId | null): IntegrationScenarioFixture | undefined {
  return scenarioId ? integrationScenarios.find((scenario) => scenario.id === scenarioId) : undefined;
}

function inputSummary(scenario: IntegrationScenarioFixture): string {
  return scenario.input.items
    .map((item) => `${item.sku} × ${item.quantity} @ ${item.unitPrice}`)
    .join(" · ") + ` · discount ${scenario.input.discount}`;
}

function outcomeLabel(scenario: IntegrationScenarioFixture): string {
  if (scenario.expected.kind === "success") return "201 · order-created";
  if (scenario.expected.kind === "contract-error") return "response-contract-error";
  return "dependency-unavailable";
}

function statusTone(state: IntegrationLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

export function integrationLabProgress(state: IntegrationLabState): number {
  return Math.round((state.completedScenarioIds.length / integrationRequiredScenarioIds.length) * 100);
}

interface EvidenceView {
  title: string;
  input: string;
  output: string;
  evidence: string;
  next: string;
}

function evidenceFor(scenario: IntegrationScenarioFixture, state: IntegrationLabState): EvidenceView {
  if (state.activeStageId === "input") {
    return {
      title: "checkout input 已準備",
      input: inputSummary(scenario),
      output: "CreateOrderRequest",
      evidence: "subtotal 100 - discount 10；三個 scenario 共用同一份 input。",
      next: "client boundary",
    };
  }

  const observation = scenario.trace.find((item) => item.boundary === state.activeStageId);
  const nextStage = nextStageFor(scenario, state.activeStageId);
  const failure = integrationFailureFixtures.find((item) => item.scenarioId === scenario.id);

  return {
    title: `${STAGE_MODULES[state.activeStageId]} 的 observable evidence`,
    input: observation?.input ?? "尚無 input",
    output: observation?.output ?? "尚無 output",
    evidence: state.response && state.response !== "success" && failure
      ? `${observation?.evidence ?? "尚無 failure outcome"} ${failure.evidence}`
      : observation?.evidence ?? "尚無 evidence",
    next: nextStage ? `${nextStage} boundary` : "terminal outcome",
  };
}

function expectedDetail(scenario: IntegrationScenarioFixture): string {
  if (scenario.expected.kind === "success") {
    return `201 · orderId ${scenario.expected.response.orderId} · total ${scenario.expected.response.total} · sideEffect order-created`;
  }
  return `${scenario.expected.errorCode} · failure boundary ${scenario.expected.failureBoundary} · sideEffect none`;
}

export function IntegrationLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<IntegrationLabState>(createInitialIntegrationState);
  const scenario = scenarioFor(state.selectedScenarioId);
  const completed = isIntegrationLabComplete(state);
  const evidence = scenario ? evidenceFor(scenario, state) : null;

  function dispatch(event: IntegrationLabEvent) {
    const result = runIntegrationEvent(state, event);
    if (!isIntegrationLabComplete(state) && isIntegrationLabComplete(result.state)) onComplete?.();
    setState(result.state);
  }

  function selectScenario(scenarioId: IntegrationScenarioId) {
    dispatch({ type: "select-scenario", scenarioId });
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>讓模組契約一起工作<br /><em>沿著 boundary 找到證據</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${integrationRequiredScenarioIds.length} SCENARIOS`}
      progress={integrationLabProgress(state)}
      onReset={() => dispatch({ type: "reset" })}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="三個 integration scenarios 都完成了。"
          description="你已重跑 success、response contract failure 與 dependency failure；每個 boundary、failure location 與 side effect 都留下可追蹤證據。"
          onReset={() => dispatch({ type: "reset" })}
        />
      ) : null}

      {!completed ? (
        <>
          <section className="integration-scenario-panel" aria-labelledby="integration-scenario-title">
            <div className="integration-panel-heading">
              <div>
                <h2 id="integration-scenario-title">先選一條可重跑的協作路徑</h2>
              </div>
              <span>{integrationRequiredScenarioIds.length} required outcomes</span>
            </div>
            <div className="integration-scenario-list" role="group" aria-label="Required integration scenarios">
              {integrationScenarios.map((item, index) => {
                const selected = state.selectedScenarioId === item.id;
                const done = state.completedScenarioIds.includes(item.id);
                return (
                  <button
                    className={`integration-scenario ${selected ? "active" : ""} ${done ? "done" : ""}`}
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectScenario(item.id)}
                  >
                    <span className="integration-scenario-index" aria-hidden="true">{done ? "✓" : `0${index + 1}`}</span>
                    <span className="integration-scenario-copy"><b>{item.title}</b><small>{item.summary}</small></span>
                    <i>{outcomeLabel(item)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="integration-trace-panel" aria-labelledby="integration-trace-title">
            <div className="integration-panel-heading integration-trace-heading">
              <div>
                <h2 id="integration-trace-title">每一步只前進一個可觀察邊界</h2>
              </div>
              <button className="button primary" type="button" onClick={() => dispatch({ type: "trace-next" })}>
                {scenario ? "下一個 boundary →" : "先選 scenario →"}
              </button>
            </div>

            <div className="integration-stage-track" role="group" aria-label="Integration trace stages">
              {integrationStageIds.map((stage, index) => {
                const visited = state.visitedBoundaryIds.includes(stage as IntegrationBoundaryId);
                const active = state.activeStageId === stage;
                const terminal = scenario ? terminalStageFor(scenario) === stage : false;
                return (
                  <button
                    className={`integration-stage ${active ? "active" : ""} ${visited ? "visited" : ""} ${terminal ? "terminal" : ""}`}
                    key={stage}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${STAGE_LABELS[stage]}：${STAGE_HINTS[stage]}`}
                    onClick={() => dispatch({ type: "inspect-stage", stageId: stage })}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{STAGE_LABELS[stage]}</b>
                    <small>{STAGE_HINTS[stage]}</small>
                  </button>
                );
              })}
            </div>

            <div className="integration-workbench">
              <section className="integration-evidence-panel" aria-labelledby="integration-evidence-title" aria-live="polite">
                <div className="integration-evidence-heading"><span>ACTIVE EVIDENCE</span><b>{scenario ? STAGE_LABELS[state.activeStageId] : "WAITING"}</b></div>
                {evidence ? (
                  <>
                    <h2 id="integration-evidence-title">{evidence.title}</h2>
                    <dl>
                      <div><dt>INPUT</dt><dd>{evidence.input}</dd></div>
                      <div><dt>OUTPUT</dt><dd>{evidence.output}</dd></div>
                      <div><dt>EVIDENCE</dt><dd>{evidence.evidence}</dd></div>
                      <div><dt>NEXT OBSERVATION</dt><dd>{evidence.next}</dd></div>
                    </dl>
                  </>
                ) : (
                  <p className="integration-empty">選擇一個 scenario，才能開始觀察 input、output 與 failure consequence。</p>
                )}
              </section>

              <aside className="integration-state-panel" aria-label="Integration Lab state">
                <div className="integration-state-heading"><span>{scenario ? scenario.id : "未選擇"}</span></div>
                <div className="integration-state-grid">
                  <div><small>PHASE</small><b>{state.phase}</b></div>
                  <div><small>RESPONSE</small><b>{state.response ?? "—"}</b></div>
                  <div><small>SIDE EFFECT</small><b>{state.sideEffects}</b></div>
                  <div><small>VISITED</small><b>{state.visitedBoundaryIds.length} / 4</b></div>
                </div>
                <div className="integration-boundary-list">
                  {state.visitedBoundaryIds.length ? state.visitedBoundaryIds.map((boundary) => (
                    <span key={boundary}>✓ {STAGE_MODULES[boundary]}</span>
                  )) : <small>尚未通過 boundary。</small>}
                </div>
                {state.response && state.response !== "success" ? (
                  <div className="integration-failure-note" role="note">
                    <b>Failure 保留</b>
                    <span>沒有產生 order-created；請檢查 {STAGE_MODULES[state.activeStageId]} 的 contract evidence。</span>
                  </div>
                ) : null}
              </aside>
            </div>
          </section>

          <section className="integration-fixture-grid" aria-label="Integration contract">
            <article>
              <header><span>CHECKOUT INPUT</span><b>{scenario ? "ready" : "waiting"}</b></header>
              <pre>{scenario ? JSON.stringify(scenario.input, null, 2) : "先選 scenario"}</pre>
            </article>
            <article>
              <header><span>EXPECTED OUTCOME</span><b>{scenario ? scenario.expected.kind : "—"}</b></header>
              <p>{scenario ? expectedDetail(scenario) : "每個 scenario 都有對應的 response、error 與 side effect。"}</p>
            </article>
            <article>
              <header><span>MODULE CONTRACTS</span><b>{integrationBoundaryFixtures.length} boundaries</b></header>
              <ul>{integrationBoundaryFixtures.map((boundary) => <li key={boundary.id}><b>{boundary.module}</b><span>{boundary.inputContract} → {boundary.outputContract}</span></li>)}</ul>
            </article>
          </section>
        </>
      ) : null}
    </TopicLabShell>
  );
}
