import { type FormEvent, useMemo, useState } from "react";
import {
  sqlLabHappyPath,
  sqlLessonSteps,
  type SqlLabEvent,
  type SqlLabState,
  type SqlStepId,
  type SqlValue,
} from "./content";
import { createInitialSqlState, isSqlLabComplete, runSqlEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface SqlHistoryEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly SqlHistoryEntry[] = [];

function eventForStep(stepId: SqlStepId): SqlLabEvent {
  return sqlLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function eventForCommand(rawCommand: string): SqlLabEvent | null {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  const step = sqlLessonSteps.find((candidate) => candidate.query === command);
  return step ? { type: step.id } : null;
}

function statusTone(state: SqlLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: SqlLabState, stepId: SqlStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

export function sqlLabProgress(state: SqlLabState): number {
  return Math.round((state.completedStepIds.length / sqlLessonSteps.length) * 100);
}

function renderCell(value: SqlValue): string {
  return String(value);
}

export function SqlLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<SqlLabState>(createInitialSqlState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly SqlHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isSqlLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => sqlLessonSteps.find((step) => !stepDone(state, step.id)) ?? sqlLessonSteps[sqlLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: SqlLabEvent, rawCommand?: string) {
    if (completed) return;
    const result = runSqlEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        command: rawCommand ?? sqlLessonSteps.find((step) => step.id === event.type)?.query,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isSqlLabComplete(result.state)) onComplete?.();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawCommand = command.trim();
    if (!rawCommand || completed) return;
    const sqlEvent = eventForCommand(rawCommand);
    if (sqlEvent) {
      dispatch(sqlEvent, rawCommand);
    } else {
      setHistory((items) => [...items, { command: rawCommand, lines: [`${rawCommand}: query not found`], accepted: false }]);
    }
    setCommand("");
  }

  function reset() {
    setState(createInitialSqlState());
    setCommand("");
    setHistory([{ lines: ["已重設。從 PRAGMA table_info(orders) 開始。"] }]);
  }

  return (
    <TopicLabShell
      className="course-lab-shell"
      showMeta={false}
      title={<>讓資料庫回答一個<br /><em>精準問題</em></>}
      progressLabel={`${completedCount} / ${sqlLessonSteps.length} STEPS`}
      progress={sqlLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="查詢已回答問題。"
          description="你已完成 schema、SELECT、WHERE、GROUP BY 與 ORDER BY；SQL Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="sql-lab-grid">
          <section className="sql-workspace-panel" aria-label="SQL query workspace">
            <div className="sql-workspace-top">
              <span className="sql-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-sql-lab</b>
              <span className="sql-phase">{state.phase}</span>
            </div>
            <div className="sql-query-toolbar">
              <span>orders.sql</span>
              <small>SQLite · read only</small>
            </div>
            <div className="sql-editor" role="region" aria-label="Current SQL query">
              <div className="sql-code-line"><span>01</span><code>{sqlLessonSteps.find((step) => step.id === state.selectedStepId)?.query ?? "-- choose a query"}</code></div>
              <div className="sql-code-line"><span>02</span><code>{state.result ? `-- ${state.result.caption}` : "-- execute a step to see rows"}</code></div>
            </div>
            <div className="sql-terminal-output" role="log" aria-live="polite" aria-label="SQL query output">
              {history.map((entry, index) => (
                <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                  {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
            <form className="terminal-form sql-command-form" onSubmit={submit}>
              <label htmlFor="sql-command">❯</label>
              <input
                id="sql-command"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="輸入 SQL query…"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="sql-command-help"
              />
              <button type="submit" disabled={!command.trim()}>執行</button>
            </form>
            <p id="sql-command-help" className="sr-only">可輸入右側 action buttons 顯示的 SQL query，或直接點擊 action。</p>
          </section>

          <aside className="sql-control-panel" aria-label="SQL query controls">
            <div className="sql-panel-heading">
              <div><h2>從 rows 走到答案</h2></div>
              <span className="sql-lab-meta">SQLite</span>
            </div>
            <div className="sql-action-list">
              {sqlLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`sql-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id), step.query)}
                    aria-label={`${step.title}：${step.query}`}
                  >
                    <span className="sql-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="sql-action-copy"><b>{step.title}</b><code>{step.query}</code></span>
                    <span className="sql-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="sql-current-hint">目前任務：{currentStep.title}。可以故意點錯順序，觀察為什麼要先確認資料形狀。</p>
          </aside>
        </div>
      )}

      <section className="sql-result-section" aria-labelledby="sql-result-title">
        <div className="section-heading"><div><h2 id="sql-result-title">目前的資料線索</h2></div></div>
        <div className="sql-result-panel">
          {state.result ? (
            <>
              <div className="sql-result-meta"><span>{state.result.caption}</span><b>{state.result.rows.length} rows</b></div>
              <div className="sql-table-wrap">
                <table>
                  <thead><tr>{state.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>
                    {state.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}>{renderCell(value)}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            </>
          ) : <p className="sql-empty-result">尚未執行 query；先從 schema 開始。</p>}
        </div>
        <div className="sql-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>ROWS</small><b>{state.result?.rows.length ?? 0}</b></div>
          <div className="sql-state-wide"><small>LAST QUERY</small><b>{state.lastQuery ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
