import { useMemo, useState } from "react";
import "./styles.css";
import {
  schemaLabHappyPath,
  schemaLessonSteps,
  schemaTables,
  type SchemaLabEvent,
  type SchemaLabState,
  type SchemaStepId,
  type SchemaValue,
} from "./content";
import { createInitialSchemaState, isSchemaLabComplete, runSchemaEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";

interface SchemaHistoryEntry {
  action?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const INITIAL_HISTORY: readonly SchemaHistoryEntry[] = [
  { lines: ["SCHEMA workbench v1", "固定 projects + tasks fixture 已載入。"] },
];

function eventForStep(stepId: SchemaStepId): SchemaLabEvent {
  return schemaLabHappyPath.find((event) => event.type === stepId) ?? { type: stepId };
}

function statusTone(state: SchemaLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "blocked") return "error";
  return "neutral";
}

function stepDone(state: SchemaLabState, stepId: SchemaStepId): boolean {
  return state.completedStepIds.includes(stepId);
}

export function schemaLabProgress(state: SchemaLabState): number {
  return Math.round((state.completedStepIds.length / schemaLessonSteps.length) * 100);
}

function renderCell(value: SchemaValue): string {
  return value === null ? "NULL" : String(value);
}

export function SchemaLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<SchemaLabState>(createInitialSchemaState);
  const [history, setHistory] = useState<readonly SchemaHistoryEntry[]>(INITIAL_HISTORY);
  const completed = isSchemaLabComplete(state);
  const completedCount = state.completedStepIds.length;
  const currentStep = useMemo(
    () => schemaLessonSteps.find((step) => !stepDone(state, step.id)) ?? schemaLessonSteps[schemaLessonSteps.length - 1],
    [state],
  );

  function dispatch(event: SchemaLabEvent) {
    if (completed) return;
    const result = runSchemaEvent(state, event);
    setState(result.state);
    setHistory((items) => [
      ...items,
      {
        action: schemaLessonSteps.find((step) => step.id === event.type)?.code,
        lines: result.output,
        accepted: result.accepted,
      },
    ]);
    if (result.accepted && isSchemaLabComplete(result.state)) onComplete?.();
  }

  function reset() {
    setState(createInitialSchemaState());
    setHistory([{ lines: ["SCHEMA Lab 已重設。從實體邊界開始。"] }]);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / SCHEMA"
      title={<>先畫出關係<br /><em>再決定資料形狀</em></>}
      progressLabel={`${completedCount} / ${schemaLessonSteps.length} DECISIONS`}
      progress={schemaLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="資料模型通過檢查。"
          description="你已完成實體、primary key、foreign key、nullable 與 integrity check；SCHEMA Lab 完成。"
          onReset={reset}
        />
      ) : (
        <div className="schema-lab-grid">
          <section className="schema-canvas-panel" aria-label="Schema design canvas fixture">
            <div className="schema-workspace-top">
              <span className="schema-window-dots" aria-hidden="true"><i /><i /><i /></span>
              <b>workshop-schema-design</b>
              <span className="schema-phase">{state.phase}</span>
            </div>
            <div className="schema-canvas-toolbar"><span>schema.canvas</span><small>fixture only · no migration</small></div>
            <div className="schema-table-stack">
              {schemaTables.map((table) => (
                <article className={`schema-table-card schema-table-${table.id}`} key={table.id}>
                  <header><strong>{table.id}</strong><small>{table.purpose}</small></header>
                  <div className="schema-field-list">
                    {table.columns.map((column) => (
                      <div className="schema-field-row" key={column.name}>
                        <span className={`schema-key-chip ${column.key ? "has-key" : ""}`}>{column.key ?? "·"}</span>
                        <code>{column.name}</code>
                        <small>{column.type} · {column.required ? "NOT NULL" : "NULL"}</small>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="schema-relation-line" aria-label="Project task relationship">
              <span>tasks.project_id</span><i aria-hidden="true">→</i><span>projects.id</span><small>many → one</small>
            </div>
            <div className="schema-history" role="log" aria-live="polite" aria-label="Schema design output">
              {history.map((entry, index) => (
                <div className={`schema-history-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.action ?? "system"}`}>
                  {entry.action ? <p><span>›</span> {entry.action}</p> : null}
                  {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                </div>
              ))}
            </div>
          </section>

          <aside className="schema-control-panel" aria-label="Schema design controls">
            <div className="schema-panel-heading">
              <div><p className="kicker">DESIGN CONTROL</p><h2>從需求走到 constraint</h2></div>
              <span className="schema-lab-meta">relational<br />fixture only</span>
            </div>
            <div className="schema-action-list">
              {schemaLessonSteps.map((step, index) => {
                const done = stepDone(state, step.id);
                return (
                  <button
                    className={`schema-action ${done ? "done" : ""}`}
                    key={step.id}
                    type="button"
                    disabled={completed || done}
                    onClick={() => dispatch(eventForStep(step.id))}
                    aria-label={`${step.title}：${step.code}`}
                  >
                    <span className="schema-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="schema-action-copy"><b>{step.title}</b><code>{step.code}</code></span>
                    <span className="schema-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
            <p className="schema-current-hint">目前決策：{currentStep.title}。可以故意點錯順序，觀察 constraint 為什麼要逐層建立。</p>
          </aside>
        </div>
      )}

      <section className="schema-result-section" aria-labelledby="schema-result-title">
        <div className="section-heading"><div><p className="kicker">MODEL CHECK RESULT</p><h2 id="schema-result-title">目前的模型線索</h2></div><p>只顯示 simulator 結果，不建立真實資料表。</p></div>
        <div className="schema-result-panel">
          {state.result ? (
            <>
              <div className="schema-result-meta"><span>{state.result.caption}</span><b>{state.result.rows.length} rows</b></div>
              <div className="schema-table-wrap">
                <table>
                  <thead><tr>{state.result.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                  <tbody>{state.result.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={`${rowIndex}-${columnIndex}`}>{renderCell(value)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            </>
          ) : <p className="schema-empty-result">尚未做出 model decision；先從實體邊界開始。</p>}
        </div>
        <div className="schema-state-grid">
          <div><small>PHASE</small><b>{state.phase}</b></div>
          <div><small>ROWS</small><b>{state.result?.rows.length ?? 0}</b></div>
          <div className="schema-state-wide"><small>LAST DECISION</small><b>{state.lastCode ?? "—"}</b></div>
        </div>
      </section>
    </TopicLabShell>
  );
}
