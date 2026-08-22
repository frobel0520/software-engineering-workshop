import { useState } from "react";
import {
  TopicCompletionCard,
  TopicLabShell,
  TopicStatusFeedback,
  type TopicStatusTone,
} from "../../components/TopicShell";
import {
  logsFixtureRedactedFields,
  logsRequiredScenarioIds,
  logsSafeContextKeys,
  logsScenarios,
  type LogsEvent,
  type LogsScenarioFixture,
  type LogsScenarioId,
} from "./content";
import {
  createInitialLogsState,
  isLogsLabComplete,
  runLogsEvent,
  type LogsLabEvent,
  type LogsLabState,
} from "./simulator";
import "./styles.css";

function scenarioFor(scenarioId: LogsScenarioId | null): LogsScenarioFixture | undefined {
  return scenarioId ? logsScenarios.find((scenario) => scenario.id === scenarioId) : undefined;
}

function eventIdFor(scenarioId: LogsScenarioId, sequence: number): string {
  return `${scenarioId}:${sequence}`;
}

function statusTone(state: LogsLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked" || state.lastFeedback === "redaction-failed") return "error";
  return "neutral";
}

function checkLabel(status: LogsLabState["correlationCheck"]): string {
  if (status === "passed") return "PASSED";
  if (status === "failed") return "FAILED";
  return "PENDING";
}

function outcomeLabel(outcome: LogsScenarioFixture["expected"]["outcome"]): string {
  if (outcome === "success") return "SUCCESS";
  if (outcome === "rejected") return "REJECTED";
  return "FAILED";
}

function safeRequestSummary(scenario: LogsScenarioFixture): string {
  return JSON.stringify(
    {
      method: scenario.request.method,
      route: scenario.request.route,
      payload: scenario.request.payload,
      sensitiveFields: logsFixtureRedactedFields,
    },
    null,
    2,
  );
}

function contextSummary(event: LogsEvent): string {
  return Object.entries(event.context)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" · ");
}

export function logsLabProgress(state: LogsLabState): number {
  return Math.round((state.completedScenarioIds.length / logsRequiredScenarioIds.length) * 100);
}

export function LogsLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<LogsLabState>(createInitialLogsState);
  const scenario = scenarioFor(state.selectedScenarioId);
  const completed = isLogsLabComplete(state);
  const visibleEvents = scenario?.events.filter((event) =>
    state.visibleEventIds.includes(eventIdFor(scenario.id, event.sequence)),
  ) ?? [];

  function dispatch(event: LogsLabEvent) {
    const result = runLogsEvent(state, event);
    if (!isLogsLabComplete(state) && isLogsLabComplete(result.state)) onComplete?.();
    setState(result.state);
  }

  function selectScenario(scenarioId: LogsScenarioId) {
    dispatch({ type: "select-scenario", scenarioId });
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / STRUCTURED LOGGING"
      title={<>讓每一筆 event 都能回到 request<br /><em>沿著 timeline 找到安全證據</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${logsRequiredScenarioIds.length} SCENARIOS`}
      progress={logsLabProgress(state)}
      onReset={() => dispatch({ type: "reset" })}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="三個 Logs scenarios 都完成了。"
          description="你已重跑 success、validation rejection 與 dependency timeout；每條 request timeline 都保留了 correlation、redaction 與 terminal evidence。"
          onReset={() => dispatch({ type: "reset" })}
        />
      ) : null}

      {!completed ? (
        <>
          <section className="logs-scenario-panel" aria-labelledby="logs-scenario-title">
            <div className="logs-panel-heading">
              <div>
                <p className="kicker">FIXED SCENARIOS</p>
                <h2 id="logs-scenario-title">先載入一條可重跑的 request timeline</h2>
              </div>
              <span>{logsRequiredScenarioIds.length} required outcomes</span>
            </div>
            <div className="logs-scenario-list" role="group" aria-label="Required Logs scenarios">
              {logsScenarios.map((item, index) => {
                const selected = state.selectedScenarioId === item.id;
                const done = state.completedScenarioIds.includes(item.id);
                return (
                  <button
                    className={`logs-scenario ${selected ? "active" : ""} ${done ? "done" : ""}`}
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectScenario(item.id)}
                  >
                    <span className="logs-scenario-index" aria-hidden="true">{done ? "✓" : `0${index + 1}`}</span>
                    <span className="logs-scenario-copy"><b>{item.title}</b><small>{item.summary}</small></span>
                    <i>{item.expected.statusCode} · {outcomeLabel(item.expected.outcome)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="logs-workbench-panel" aria-labelledby="logs-workbench-title">
            <div className="logs-panel-heading logs-workbench-heading">
              <div>
                <p className="kicker">REQUEST TIMELINE</p>
                <h2 id="logs-workbench-title">逐筆 inspect，再驗證三層 evidence</h2>
              </div>
              <span>{scenario ? `${state.activeEventIndex} / ${scenario.events.length} events` : "waiting for fixture"}</span>
            </div>

            <div className="logs-workbench-grid">
              <section className="logs-timeline-panel" aria-labelledby="logs-timeline-title">
                <div className="logs-subheading">
                  <div><p className="kicker">EVENT STREAM</p><h3 id="logs-timeline-title">固定 schema 的事件流</h3></div>
                  <span>{scenario ? scenario.expected.correlationId : "no correlation"}</span>
                </div>
                <div className="logs-event-list" role="list" aria-label="Logs event timeline">
                  {scenario ? scenario.events.map((event) => {
                    const visible = state.visibleEventIds.includes(eventIdFor(scenario.id, event.sequence));
                    const next = state.activeEventIndex + 1 === event.sequence;
                    return (
                      <article className={`logs-event-row ${visible ? "visible" : ""} ${next ? "next" : ""}`} key={event.sequence} role="listitem">
                        <button
                          className="logs-event-button"
                          type="button"
                          disabled={completed || visible}
                          onClick={() => dispatch({ type: "inspect-event", sequence: event.sequence })}
                          aria-label={`Inspect sequence ${event.sequence}: ${event.event}`}
                        >
                          <span className="logs-event-sequence" aria-hidden="true">{String(event.sequence).padStart(2, "0")}</span>
                          <span className="logs-event-copy"><b>{event.event}</b><small>{event.timestamp} · {event.source}</small></span>
                          <span className={`logs-level ${event.level}`}>{event.level}</span>
                          <span className="logs-event-action" aria-hidden="true">{visible ? "✓" : "→"}</span>
                        </button>
                        {visible ? (
                          <div className="logs-event-evidence" aria-label={`Evidence for sequence ${event.sequence}`}>
                            <p>{event.message}</p>
                            <dl>
                              <div><dt>CONTEXT</dt><dd>{contextSummary(event)}</dd></div>
                              <div><dt>CORRELATION</dt><dd>{event.correlationId}</dd></div>
                              <div><dt>OUTCOME</dt><dd>{event.outcome}</dd></div>
                              <div><dt>REDACTED</dt><dd>{event.redactedFields.join(" · ")}</dd></div>
                            </dl>
                          </div>
                        ) : null}
                      </article>
                    );
                  }) : (
                    <p className="logs-empty">選擇一個 scenario，才能開始 inspect 固定 event sequence。</p>
                  )}
                </div>
              </section>

              <aside className="logs-state-panel" aria-label="Logs Lab state">
                <div className="logs-state-heading"><p className="kicker">SESSION STATE</p><span>{scenario ? scenario.id : "no fixture"}</span></div>
                <div className="logs-state-grid">
                  <div><small>PHASE</small><b>{state.phase}</b></div>
                  <div><small>EVENTS</small><b>{scenario ? `${state.activeEventIndex} / ${scenario.events.length}` : "—"}</b></div>
                  <div><small>CORRELATION</small><b className={state.correlationCheck}>{checkLabel(state.correlationCheck)}</b></div>
                  <div><small>REDACTION</small><b className={state.redactionCheck}>{checkLabel(state.redactionCheck)}</b></div>
                  <div><small>TERMINAL</small><b>{state.terminalOutcome ?? "—"}</b></div>
                  <div><small>COMPLETED</small><b>{state.completedScenarioIds.length} / {logsRequiredScenarioIds.length}</b></div>
                </div>
                <div className="logs-check-list">
                  <p className="kicker">EVIDENCE CHECKS</p>
                  <button className={`logs-check ${state.correlationCheck}`} type="button" onClick={() => dispatch({ type: "verify-correlation" })}>
                    <span aria-hidden="true">{state.correlationCheck === "passed" ? "✓" : "01"}</span>
                    <b>Correlation ID</b><small>same request · same id</small>
                  </button>
                  <button className={`logs-check ${state.redactionCheck}`} type="button" onClick={() => dispatch({ type: "verify-redaction" })}>
                    <span aria-hidden="true">{state.redactionCheck === "passed" ? "✓" : "02"}</span>
                    <b>Safe redaction</b><small>allowlist · no raw secrets</small>
                  </button>
                  <button className={`logs-check ${state.terminalOutcome ? "passed" : "pending"}`} type="button" onClick={() => dispatch({
                    type: "verify-terminal",
                    level: scenario?.expected.level,
                    source: scenario?.expected.terminalSource,
                    statusCode: scenario?.expected.statusCode,
                    outcome: scenario?.expected.outcome,
                  })}>
                    <span aria-hidden="true">{state.terminalOutcome ? "✓" : "03"}</span>
                    <b>Terminal outcome</b><small>level · status · outcome</small>
                  </button>
                </div>
              </aside>
            </div>
          </section>

          <section className="logs-fixture-grid" aria-label="Logs fixture contract">
            <article>
              <header><span>SAFE REQUEST FIXTURE</span><b>{scenario ? "loaded" : "waiting"}</b></header>
              <pre>{scenario ? safeRequestSummary(scenario) : "先選 scenario"}</pre>
              <p>authorization 與 email 只作為 redaction fixture，不會渲染 raw value。</p>
            </article>
            <article>
              <header><span>EXPECTED TERMINAL</span><b>{scenario ? scenario.expected.level : "—"}</b></header>
              {scenario ? (
                <dl className="logs-contract-list">
                  <div><dt>EVENT</dt><dd>{scenario.expected.terminalEvent}</dd></div>
                  <div><dt>SOURCE</dt><dd>{scenario.expected.terminalSource}</dd></div>
                  <div><dt>STATUS</dt><dd>{scenario.expected.statusCode}</dd></div>
                  <div><dt>OUTCOME</dt><dd>{scenario.expected.outcome}</dd></div>
                </dl>
              ) : <p>每條 scenario 都有固定的 terminal evidence contract。</p>}
            </article>
            <article>
              <header><span>SAFE CONTEXT ALLOWLIST</span><b>{logsSafeContextKeys.length} keys</b></header>
              <ul className="logs-allowlist">
                {logsSafeContextKeys.map((key) => <li key={key}><span>✓</span>{key}</li>)}
              </ul>
              <p>只保留可診斷的 context；敏感欄位記在 redactedFields，不進輸出。</p>
            </article>
          </section>
        </>
      ) : null}
    </TopicLabShell>
  );
}
