import { useMemo, useState } from "react";
import "./styles.css";
import {
  indexLabHappyPath,
  indexLessonSteps,
  type IndexLabEvent,
  type IndexLabState,
  type IndexQueryPlan,
  type IndexStepId,
  type IndexValue,
} from "./content";
import { createInitialIndexState, isIndexLabComplete, runIndexEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface IndexHistoryEntry {
  action?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly IndexHistoryEntry[] = [];

function eventForStep(stepId: IndexStepId): IndexLabEvent {
  return indexLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function statusTone(state: IndexLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: IndexLabState, stepId: IndexStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

function planLabel(plan: IndexQueryPlan | null): string {
  if (!plan) return "—";
  return plan.operation === "table-scan" ? "TABLE SCAN" : "INDEX SEARCH";
}

export function indexLabProgress(state: IndexLabState): number {
  return Math.round((state.completedStepIds.length / indexLessonSteps.length) * 100);
}

function renderCell(value: IndexValue): string {
  return String(value);
}

export function IndexLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<IndexLabState>(createInitialIndexState);
  const [history, setHistory] = useState<readonly IndexHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isIndexLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => indexLessonSteps.find((step) => !stepDone(state, step.id)) ?? indexLessonSteps[indexLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: IndexLabEvent) {
    if (completed) return;
    const result = runIndexEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        action: indexLessonSteps.find((step) => step.id === event.type)?.code,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isIndexLabComplete(result.state)) onComplete?.();
  }

  function reset() {
    setState(createInitialIndexState());
    setHistory([{ lines: ["已重設。從查詢計畫開始。"] }]);
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>讓查詢走更短的路<br /><em>也讓寫入保持一致</em></>}
      progressLabel={completedCount + " / " + indexLessonSteps.length + " CHECKS"}
      progress={indexLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="效能與一致性都通過檢查。"
          description="你已比較 table scan 與 index search，也完成 rollback 與 commit；Index + Transaction Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="index-lab-grid">
          <section className="index-workspace-panel" aria-label="Index and transaction workbench">
            <div className="index-workspace-top">
              <span className="index-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-index-transactions</b>
              <span className="index-phase">{state.phase}</span>
            </div>
            <div className="index-query-toolbar"><span>query.plan</span></div>
            <div className="index-query-card">
              <small>CURRENT CHECK</small>
              <code>{currentStep?.code ?? "-- choose a check"}</code>
            </div>
            <div className="index-plan-card">
              <div><small>PLAN</small><strong>{planLabel(state.plan)}</strong></div>
              <div><small>DETAIL</small><code>{state.plan?.detail ?? "run a step to inspect plan"}</code></div>
              <div><small>ROWS EXAMINED</small><b>{state.plan?.rowsExamined ?? "—"}</b></div>
            </div>
            <div className="index-history" role="log" aria-live="polite" aria-label="Index and transaction output">
              {history.map((entry, entryIndex) => (
                <div
                  className={"index-history-entry" + (entry.accepted === false ? " error" : "")}
                  key={String(entryIndex) + "-" + (entry.action ?? "system")}
                >
                  {entry.action ? <p><span>›</span> {entry.action}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
          </section>

          <aside className="index-control-panel" aria-label="Index and transaction controls">
            <div className="index-panel-heading">
              <div><h2>從 plan 走到 transaction</h2></div>
              <span className="index-lab-meta">relational</span>
            </div>
            <div className="index-action-list">
              {indexLessonSteps.map((step, stepIndex) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={"index-action" + (done ? " done" : "")}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id))}
                    aria-label={step.title + "：" + step.code}
                  >
                    <span className="index-action-index" aria-hidden="true">{done ? "✓" : String(stepIndex + 1).padStart(2, "0")}</span>
                    <span className="index-action-copy"><b>{step.title}</b><code>{step.code}</code></span>
                    <span className="index-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="index-current-hint">目前檢查：{currentStep?.title ?? "完成"}。可以故意跳步，觀察為什麼要先量測，再改變資料邊界。</p>
          </aside>
        </div>
      )}

      <section className="index-result-section" aria-labelledby="index-result-title">
        <div className="section-heading"><div><h2 id="index-result-title">目前的資料線索</h2></div></div>
        <div className="index-result-panel">
          {state.result ? (
            <>
              <div className="index-result-meta"><span>{state.result.caption}</span><b>{state.result.rows.length} rows</b></div>
              <div className="index-table-wrap">
                <table>
                  <thead><tr>{state.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{state.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={String(rowIndex) + "-" + String(columnIndex)}>{renderCell(value)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </>
          ) : <p className="index-empty-result">尚未執行 check；先從原始查詢計畫開始。</p>}
        </div>
        <div className="index-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>TRANSACTION</small><b>{state.transactionStatus}</b></div>
          <div className="index-state-wide"><small>LAST CHECK</small><b>{state.lastCode ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
