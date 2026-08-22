import { useMemo, useState } from "react";
import "./styles.css";
import {
  postgresqlLabHappyPath,
  postgresqlLessonSteps,
  type PostgreSqlLabEvent,
  type PostgreSqlLabState,
  type PostgreSqlQueryPlan,
  type PostgreSqlStepId,
  type PostgreSqlValue,
} from "./content";
import { createInitialPostgreSqlState, isPostgreSqlLabComplete, runPostgreSqlEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface PostgreSqlHistoryEntry {
  action?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly PostgreSqlHistoryEntry[] = [
  { lines: ["POSTGRESQL workbench v1", "固定 events fixture 與 psql session 已準備好。"] },
];

function eventForStep(stepId: PostgreSqlStepId): PostgreSqlLabEvent {
  return postgresqlLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function statusTone(state: PostgreSqlLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: PostgreSqlLabState, stepId: PostgreSqlStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function planLabel(plan: PostgreSqlQueryPlan | null): string {
  if (!plan) return "—";
  return plan.operation === "seq-scan" ? "SEQ SCAN" : "BITMAP INDEX SCAN";
}

export function postgresqlLabProgress(state: PostgreSqlLabState): number {
  return Math.round((state.completedStepIds.length / postgresqlLessonSteps.length) * 100);
}

function renderCell(value: PostgreSqlValue): string {
  return String(value);
}

export function PostgreSqlLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<PostgreSqlLabState>(createInitialPostgreSqlState);
  const [history, setHistory] = useState<readonly PostgreSqlHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isPostgreSqlLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => postgresqlLessonSteps.find((step) => !stepDone(state, step.id)) ?? postgresqlLessonSteps[postgresqlLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: PostgreSqlLabEvent) {
    if (completed) return;
    const result = runPostgreSqlEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        action: postgresqlLessonSteps.find((step) => step.id === event.type)?.code,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isPostgreSqlLabComplete(result.state)) onComplete?.();
  }

  function reset() {
    setState(createInitialPostgreSqlState());
    setHistory([{ lines: ["PostgreSQL Lab 已重設。從 psql session 開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / POSTGRESQL"
      title={<>從 psql 連線到<br /><em>可驗證的寫入</em></>}
      progressLabel={completedCount + " / " + postgresqlLessonSteps.length + " CHECKS"}
      progress={postgresqlLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="PostgreSQL workflow 通過檢查。"
          description="你已完成 session、data contract、RETURNING、JSONB、EXPLAIN 與 transaction commit；PostgreSQL Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="postgresql-lab-grid">
          <section className="postgresql-workspace-panel" aria-label="PostgreSQL workbench fixture">
            <div className="postgresql-workspace-top">
              <span className="postgresql-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-postgresql</b>
              <span className="postgresql-phase">{state.phase}</span>
            </div>
            <div className="postgresql-query-toolbar"><span>psql session</span><small>fixture only · no database</small></div>
            <div className="postgresql-query-card">
              <small>CURRENT CHECK</small>
              <code>{currentStep?.code ?? "-- choose a check"}</code>
            </div>
            <div className="postgresql-plan-card">
              <div><small>DATABASE</small><strong>{state.session?.database ?? "—"}</strong></div>
              <div><small>PLAN</small><strong>{planLabel(state.plan)}</strong></div>
              <div><small>TRANSACTION</small><b>{state.transactionStatus}</b></div>
            </div>
            <div className="postgresql-history" role="log" aria-live="polite" aria-label="PostgreSQL output">
              {history.map((entry, entryIndex) => (
                <div
                  className={"postgresql-history-entry" + (entry.accepted === false ? " error" : "")}
                  key={String(entryIndex) + "-" + (entry.action ?? "system")}
                >
                  {entry.action ? <p><span>›</span> {entry.action}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
          </section>

          <aside className="postgresql-control-panel" aria-label="PostgreSQL controls">
            <div className="postgresql-panel-heading">
              <div><p className="kicker">CHECK CONTROL</p><h2>從 session 走到 commit</h2></div>
              <span className="postgresql-lab-meta">PostgreSQL 16<br />fixture only</span>
            </div>
            <div className="postgresql-action-list">
              {postgresqlLessonSteps.map((step, stepIndex) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={"postgresql-action" + (done ? " done" : "")}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id))}
                    aria-label={step.title + "：" + step.code}
                  >
                    <span className="postgresql-action-index" aria-hidden="true">{done ? "✓" : String(stepIndex + 1).padStart(2, "0")}</span>
                    <span className="postgresql-action-copy"><b>{step.title}</b><code>{step.code}</code></span>
                    <span className="postgresql-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="postgresql-current-hint">目前檢查：{currentStep?.title ?? "完成"}。可以故意跳步，觀察 PostgreSQL 邊界為什麼要逐層確認。</p>
          </aside>
        </div>
      )}

      <section className="postgresql-result-section" aria-labelledby="postgresql-result-title">
        <div className="section-heading"><div><p className="kicker">OBSERVABLE RESULT</p><h2 id="postgresql-result-title">目前的資料線索</h2></div><p>只顯示 simulator 結果，不連線真實 PostgreSQL。</p></div>
        <div className="postgresql-result-panel">
          {state.result ? (
            <>
              <div className="postgresql-result-meta"><span>{state.result.caption}</span><b>{state.result.rows.length} rows</b></div>
              <div className="postgresql-table-wrap">
                <table>
                  <thead><tr>{state.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{state.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={String(rowIndex) + "-" + String(columnIndex)}>{renderCell(value)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </>
          ) : <p className="postgresql-empty-result">尚未執行 check；先從 psql session 開始。</p>}
        </div>
        <div className="postgresql-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>JSONB MATCHES</small><b>{state.jsonbMatchCount}</b></div>
          <div className="postgresql-state-wide"><small>LAST CHECK</small><b>{state.lastCode ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
