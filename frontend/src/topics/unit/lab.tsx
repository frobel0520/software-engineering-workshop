import { useMemo, useState } from "react";
import "./styles.css";
import {
  unitLabHappyPath,
  unitLessonSteps,
  type UnitLabEvent,
  type UnitLabState,
  type UnitStepId,
  type UnitSuiteStatus,
  type UnitValue,
} from "./content";
import { createInitialUnitState, isUnitLabComplete, runUnitEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface UnitHistoryEntry {
  action?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly UnitHistoryEntry[] = [];

function eventForStep(stepId: UnitStepId): UnitLabEvent {
  return unitLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function statusTone(state: UnitLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: UnitLabState, stepId: UnitStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

export function unitLabProgress(state: UnitLabState): number {
  return Math.round((state.completedStepIds.length / unitLessonSteps.length) * 100);
}

function suiteLabel(status: UnitSuiteStatus): string {
  if (status === "red") return "RED";
  if (status === "green") return "GREEN";
  return "IDLE";
}

function renderCell(value: UnitValue): string {
  return String(value);
}

export function UnitLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<UnitLabState>(createInitialUnitState);
  const [history, setHistory] = useState<readonly UnitHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isUnitLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => unitLessonSteps.find((step) => !stepDone(state, step.id)) ?? unitLessonSteps[unitLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: UnitLabEvent) {
    if (completed) return;
    const result = runUnitEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        action: unitLessonSteps.find((step) => step.id === event.type)?.code,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isUnitLabComplete(result.state)) onComplete?.();
  }

  function reset() {
    setState(createInitialUnitState());
    setHistory([{ lines: ["已重設。從 unit boundary 開始。"] }]);
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>讓錯誤在最小範圍內被看見<br /><em>再用測試鎖住行為</em></>}
      progressLabel={completedCount + " / " + unitLessonSteps.length + " CHECKS"}
      progress={unitLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="Unit testing workflow 通過檢查。"
          description="你已切出 unit boundary、看見 red、修復到 green，並用兩個 edge cases 鎖住 3 個回歸行為。"
          onReset={reset}
        />
      ) : (
        <div className="unit-lab-grid">
          <section className="unit-test-panel" aria-label="Unit testing workbench">
            <div className="unit-workspace-top">
              <span className="unit-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-unit-tests</b>
              <span className="unit-phase">{state.phase}</span>
            </div>
            <div className="unit-test-toolbar"><span>test-runner</span></div>
            <div className="unit-test-case-card">
              <small>ACTIVE CHECK</small>
              <code>{currentStep?.code ?? "-- choose a check"}</code>
            </div>
            <div className="unit-suite-summary">
              <div><small>SUITE</small><strong>{suiteLabel(state.suiteStatus)}</strong></div>
              <div><small>ASSERTIONS</small><b>{state.passedTests} / {state.totalTests}</b></div>
              <div><small>IMPLEMENTATION</small><strong>{state.implementationStatus}</strong></div>
            </div>
            <div className="unit-history" role="log" aria-live="polite" aria-label="Unit testing output">
              {history.map((entry, entryIndex) => (
                <div
                  className={"unit-history-entry" + (entry.accepted === false ? " error" : "")}
                  key={String(entryIndex) + "-" + (entry.action ?? "system")}
                >
                  {entry.action ? <p><span>›</span> {entry.action}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
          </section>

          <aside className="unit-control-panel" aria-label="Unit testing controls">
            <div className="unit-panel-heading">
              <div><h2>從 boundary 走到 regression</h2></div>
              <span className="unit-lab-meta">pure function</span>
            </div>
            <div className="unit-action-list">
              {unitLessonSteps.map((step, stepIndex) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={"unit-action" + (done ? " done" : "")}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id))}
                    aria-label={step.title + "：" + step.code}
                  >
                    <span className="unit-action-index" aria-hidden="true">{done ? "✓" : String(stepIndex + 1).padStart(2, "0")}</span>
                    <span className="unit-action-copy"><b>{step.title}</b><code>{step.code}</code></span>
                    <span className="unit-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="unit-current-hint">目前檢查：{currentStep?.title ?? "完成"}。可以故意跳步，觀察測試為什麼需要先建立證據。</p>
          </aside>
        </div>
      )}

      <section className="unit-result-section" aria-labelledby="unit-result-title">
        <div className="section-heading"><div><h2 id="unit-result-title">目前的測試線索</h2></div></div>
        <div className="unit-result-panel">
          {state.result ? (
            <>
              <div className="unit-result-meta"><span>{state.result.caption}</span><b>{state.result.rows.length} rows</b></div>
              <div className="unit-table-wrap">
                <table>
                  <thead><tr>{state.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{state.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={String(rowIndex) + "-" + String(columnIndex)}>{renderCell(value)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </>
          ) : <p className="unit-empty-result">尚未執行 check；先選定 unit boundary。</p>}
        </div>
        <div className="unit-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>SUITE</small><b>{suiteLabel(state.suiteStatus)}</b></div>
          <div><small>BOUNDARY</small><b>{state.boundary}</b></div>
          <div><small>IMPLEMENTATION</small><b>{state.implementationStatus}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
