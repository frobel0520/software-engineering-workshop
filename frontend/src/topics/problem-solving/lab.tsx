import { useMemo, useState } from "react";
import "./styles.css";
import {
  problemSolvingIncident,
  problemSolvingLessonSteps,
  type ProblemSolvingLabEvent,
  type ProblemSolvingLabEventType,
  type ProblemSolvingLabState,
} from "./content";
import {
  createInitialProblemSolvingState,
  isProblemSolvingLabComplete,
  runProblemSolvingEvent,
} from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface ProblemSolvingHistoryEntry {
  action?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly ProblemSolvingHistoryEntry[] = [
  { lines: ["PROBLEM SOLVING workbench v0", "固定 orders + payment fixture 已載入。"] },
];

function statusTone(state: ProblemSolvingLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: ProblemSolvingLabState, stepId: ProblemSolvingLabEventType): boolean {
  return stepId !== "reset" && state.completedStepIds.includes(stepId);
}

function stepTitle(stepId: ProblemSolvingLabEventType): string | undefined {
  return problemSolvingLessonSteps.find((step) => step.id === stepId)?.title;
}

export function problemSolvingLabProgress(state: ProblemSolvingLabState): number {
  return Math.round((state.completedStepIds.length / problemSolvingLessonSteps.length) * 100);
}

export function ProblemSolvingLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<ProblemSolvingLabState>(createInitialProblemSolvingState);
  const [history, setHistory] = useState<readonly ProblemSolvingHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isProblemSolvingLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => problemSolvingLessonSteps.find((step) => !state.completedStepIds.includes(step.id)) ?? problemSolvingLessonSteps[problemSolvingLessonSteps.length - 1],
    [state.completedStepIds],
  );

  function dispatch(event: ProblemSolvingLabEvent) {
    const result = runProblemSolvingEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        action: stepTitle(event.type),
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isProblemSolvingLabComplete(result.state)) onComplete?.();
  }

  function reset() {
    setState(createInitialProblemSolvingState());
    setHistory([{ lines: ["Problem Solving Lab 已重設；從問題陳述開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / PROBLEM SOLVING"
      title={<>從症狀走到<br /><em>可驗證的修復</em></>}
      progressLabel={`${completedCount} / ${problemSolvingLessonSteps.length} CHECKS`}
      progress={problemSolvingLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="問題處理閉環完成。"
          description="你已完成定義、重現、蒐證、假設、錯誤邊界、修復、驗證與預防復發。"
          onReset={reset}
        />
      ) : (
        <div className="problem-solving-lab-grid">
          <section className="problem-solving-case-panel" aria-labelledby="problem-solving-case-title">
            <div className="problem-solving-window-top">
              <span className="problem-solving-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>incident/problem-solving</b>
              <span className="problem-solving-phase">{state.phase}</span>
            </div>
            <div className="problem-solving-case-card">
              <small>ACTIVE INCIDENT</small>
              <h2 id="problem-solving-case-title">{problemSolvingIncident.title}</h2>
              <p>{problemSolvingIncident.summary}</p>
              <code>{problemSolvingIncident.request}</code>
            </div>
            <dl className="problem-solving-facts">
              <div><dt>REPRODUCTION</dt><dd>{state.reproduction}</dd></div>
              <div><dt>BASELINE</dt><dd>{state.comparison}</dd></div>
              <div><dt>HYPOTHESIS</dt><dd>{state.hypothesis}</dd></div>
              <div><dt>BOUNDARY</dt><dd>{state.errorBoundary}</dd></div>
            </dl>
            <div className="problem-solving-history" role="log" aria-live="polite" aria-label="Problem-solving evidence log">
              {history.map((entry, entryIndex) => (
                <div
                  className={`problem-solving-history-entry${entry.accepted === false ? " error" : ""}`}
                  key={`${entryIndex}-${entry.action ?? "system"}`}
                >
                  {entry.action ? <p><span>›</span> {entry.action}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={`${entryIndex}-${lineIndex}`}>{line}</small>)}
                </div>
              ))}
            </div>
          </section>

          <aside className="problem-solving-control-panel" aria-labelledby="problem-solving-actions-title">
            <div className="problem-solving-panel-heading">
              <div><p className="kicker">METHOD CONTROL</p><h2 id="problem-solving-actions-title">沿著證據縮小範圍</h2></div>
              <span className="problem-solving-lab-meta">fixture only<br />no external service</span>
            </div>
            <div className="problem-solving-action-list">
              {problemSolvingLessonSteps.map((step, stepIndex) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`problem-solving-action${done ? " done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch({ type: step.id })}
                    aria-label={`${step.title}：${step.method}`}
                  >
                    <span className="problem-solving-action-index" aria-hidden="true">{done ? "✓" : String(stepIndex + 1).padStart(2, "0")}</span>
                    <span className="problem-solving-action-copy"><b>{step.title}</b><small>{step.method}</small></span>
                    <span className="problem-solving-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="problem-solving-current-hint">目前檢查：{currentStep?.title ?? "完成"}。可以故意跳步，觀察為什麼證據與假設要按順序建立。</p>
          </aside>
        </div>
      )}

      <section className="problem-solving-result-section" aria-labelledby="problem-solving-result-title">
        <div className="section-heading"><div><p className="kicker">OBSERVABLE RESULT</p><h2 id="problem-solving-result-title">目前的問題線索</h2></div><p>只顯示 deterministic fixture 結果，不連線真實服務。</p></div>
        <div className="problem-solving-result-panel">
          {state.lastResult ? (
            <>
              <div className="problem-solving-result-meta"><span>{state.lastResult.title}</span><b>{state.lastResult.observations.length} observations</b></div>
              <dl className="problem-solving-observation-list">
                {state.lastResult.observations.map((observation) => <div key={observation.label}><dt>{observation.label}</dt><dd>{observation.value}</dd></div>)}
              </dl>
              <p className="problem-solving-result-takeaway">{state.lastResult.takeaway}</p>
            </>
          ) : <p className="problem-solving-empty-result">尚未執行 check；先寫出問題陳述。</p>}
        </div>
        <div className="problem-solving-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>FIX APPLIED</small><b>{state.fixApplied ? "yes" : "no"}</b></div>
          <div><small>VERIFY</small><b>{state.verification}</b></div>
          <div><small>PREVENTION</small><b>{state.prevention}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
