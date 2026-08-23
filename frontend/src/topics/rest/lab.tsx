import { useMemo, useState } from "react";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "../../components/TopicShell";
import {
  findRestCodeFile,
  findRestCodeLine,
  findRestScenario,
  isRestScenarioId,
  restCodeFiles,
  restScenarios,
  restTraceStages,
  type RestCodeFileId,
  type RestLabEvent,
  type RestLabState,
  type RestScenarioId,
  type RestTraceStageId,
} from "./content";
import { createInitialRestState, isRestLabComplete, isRestStageUnlocked, runRestEvent } from "./simulator";

type RestCodeMode = "annotated" | "source";

const SCENARIO_PROGRESS_WEIGHT = 0.7;
const STAGE_PROGRESS_WEIGHT = 0.3;
const PERCENT_SCALE = 100;

function stageIndex(stageId: RestTraceStageId): number {
  return restTraceStages.findIndex((stage) => stage.id === stageId);
}

function statusTone(state: RestLabState): TopicStatusTone {
  if (state.phase === "completed") return "success";
  if (state.phase === "error") return "error";
  return "neutral";
}

function relatedLine(fileId: RestCodeFileId, stageId: RestTraceStageId): string | undefined {
  const file = findRestCodeFile(fileId);
  const line = file.lines.find((candidate) => candidate.stages.includes(stageId));
  return line?.id;
}

function requiredRelatedLine(fileId: RestCodeFileId, stageId: RestTraceStageId): string {
  const lineId = relatedLine(fileId, stageId);
  if (!lineId) {
    throw new Error(`No REST code line maps to ${fileId} at stage ${stageId}.`);
  }
  return lineId;
}

function firstLineId(fileId: RestCodeFileId): string {
  const firstLine = findRestCodeFile(fileId).lines[0];
  if (!firstLine) {
    throw new Error(`REST code file ${fileId} has no code lines.`);
  }
  return firstLine.id;
}

export function lineForFileSelection(fileId: RestCodeFileId, stageId: RestTraceStageId): string {
  return relatedLine(fileId, stageId) ?? firstLineId(fileId);
}

export function restLabProgress(state: RestLabState): number {
  const scenarioWeight = state.completedScenarioIds.length / restScenarios.length;
  const stageWeight = state.learnedStageIds.length / restTraceStages.length;
  return Math.round((scenarioWeight * SCENARIO_PROGRESS_WEIGHT + stageWeight * STAGE_PROGRESS_WEIGHT) * PERCENT_SCALE);
}

export function RestLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState<RestLabState>(createInitialRestState);
  const [selectedFileId, setSelectedFileId] = useState<RestCodeFileId>("api.ts");
  const [selectedLineId, setSelectedLineId] = useState("api-6");
  const [fileSelectionNotice, setFileSelectionNotice] = useState<string | null>(null);
  const [codeMode, setCodeMode] = useState<RestCodeMode>("annotated");
  const scenario = findRestScenario(state.selectedScenarioId);
  const selectedFile = findRestCodeFile(selectedFileId);
  const selectedLine = findRestCodeLine(selectedLineId);
  const terminalIndex = stageIndex(scenario.terminalStageId);
  const currentIndex = stageIndex(state.activeStageId);
  const completed = isRestLabComplete(state);
  const activeLineIds = useMemo(
    () => selectedFile.lines.filter((line) => line.stages.includes(state.activeStageId)).map((line) => line.id),
    [selectedFile, state.activeStageId],
  );

  function dispatch(event: RestLabEvent) {
    const result = runRestEvent(state, event);
    if (!isRestLabComplete(state) && isRestLabComplete(result.state)) onComplete?.();
    setState(result.state);
    if (event.type === "start-request" || event.type === "inspect-stage" || event.type === "next-stage") {
      const nextStage = restTraceStages.find((stage) => stage.id === result.state.activeStageId);
      if (!nextStage) {
        throw new Error(`Unknown REST trace stage: ${result.state.activeStageId}`);
      }
      setSelectedFileId(nextStage.fileId);
      setSelectedLineId(requiredRelatedLine(nextStage.fileId, nextStage.id));
      setFileSelectionNotice(null);
    }
  }

  function reset() {
    setState(createInitialRestState());
    setSelectedFileId("api.ts");
    setSelectedLineId("api-6");
    setFileSelectionNotice(null);
    setCodeMode("annotated");
  }

  function selectScenario(scenarioId: RestScenarioId) {
    dispatch({ type: "select-scenario", scenarioId });
    setSelectedFileId("api.ts");
    setSelectedLineId(scenarioId === "create-success" || scenarioId === "validation-error" ? "api-6" : "api-15");
    setFileSelectionNotice(null);
  }

  function changeFile(fileId: RestCodeFileId) {
    const mappedLineId = relatedLine(fileId, state.activeStageId);
    setSelectedFileId(fileId);
    setSelectedLineId(lineForFileSelection(fileId, state.activeStageId));
    setFileSelectionNotice(mappedLineId ? null : `目前 ${state.activeStageId} stage 沒有 ${fileId} 的對應執行行，先顯示檔案第一行。`);
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / FASTAPI REQUEST"
      title={<>追蹤一次 request<br /><em>讀懂整個 full stack</em></>}
      progressLabel={`${state.completedScenarioIds.length} / ${restScenarios.length} REQUESTS`}
      progress={restLabProgress(state)}
      onReset={reset}
    >
      <TopicStatusFeedback tone={statusTone(state)} message={state.lastMessage} />

      {completed ? (
        <TopicCompletionCard
          title="你已走完整個 FastAPI request lifecycle。"
          description="四個 request 情境已完成：你看過 frontend fetch、routing、validation、dependency、SQL 與 response model 如何共同完成 API 契約。"
          onReset={reset}
        />
      ) : null}

      <section className="rest-request-bar" aria-label="Request controls">
        <label>
          <span>SCENARIO</span>
          <select
            value={state.selectedScenarioId}
            onChange={(event) => {
              if (isRestScenarioId(event.target.value)) {
                selectScenario(event.target.value);
              }
            }}
          >
            {restScenarios.map((option) => <option key={option.id} value={option.id}>{state.completedScenarioIds.includes(option.id) ? "✓ " : ""}{option.label}</option>)}
          </select>
        </label>
        <div className="rest-request-target"><span className={`rest-method ${scenario.method.toLowerCase()}`}>{scenario.method}</span><code>{scenario.url}</code></div>
        <button className="button primary" type="button" onClick={() => dispatch({ type: "start-request" })}>{state.requestStarted ? "重新送出" : "送出 request"}</button>
        <button className="button secondary" type="button" disabled={!state.requestStarted || currentIndex >= terminalIndex} onClick={() => dispatch({ type: "next-stage" })}>下一站 →</button>
      </section>

      <section className="rest-scenario-progress" aria-label="Required request scenarios">
        {restScenarios.map((item) => <div className={state.completedScenarioIds.includes(item.id) ? "done" : ""} key={item.id}><span>{state.completedScenarioIds.includes(item.id) ? "✓" : "○"}</span><b>{item.method}</b><small>{new URL(item.url).pathname}</small><em>{item.status.split(" ")[0]}</em></div>)}
      </section>

      <section className="rest-trace" aria-label="Request lifecycle">
        {restTraceStages.map((stage, index) => {
          const isBlocked = index > terminalIndex;
          const isVisited = state.currentVisitedStageIds.includes(stage.id);
          const isLocked = state.requestStarted && !isRestStageUnlocked(state, stage.id);
          return (
            <button
              className={`${state.activeStageId === stage.id ? "active" : ""} ${isVisited ? "visited" : ""}`}
              type="button"
              key={stage.id}
              disabled={!state.requestStarted || isBlocked || isLocked}
              onClick={() => dispatch({ type: "inspect-stage", stageId: stage.id })}
            >
              <span>{stage.label}</span><b>{stage.actor}</b><small>{isBlocked ? "此 request 不執行" : stage.summary}</small>
            </button>
          );
        })}
      </section>

      <div className="rest-workbench">
        <section className="rest-code-panel" aria-label="Full stack source code">
          <header className="rest-code-toolbar">
            <div className="rest-file-tabs" role="tablist" aria-label="程式檔案">
              {restCodeFiles.map((file) => (
                <button key={file.id} type="button" role="tab" aria-selected={selectedFileId === file.id} className={selectedFileId === file.id ? "active" : ""} onClick={() => changeFile(file.id)}>{file.id}</button>
              ))}
            </div>
            <div className="rest-mode-switch" aria-label="Code display mode">
              <button type="button" className={codeMode === "annotated" ? "active" : ""} onClick={() => setCodeMode("annotated")}>學習模式</button>
              <button type="button" className={codeMode === "source" ? "active" : ""} onClick={() => setCodeMode("source")}>原始碼</button>
            </div>
          </header>
          <div className="rest-code-meta"><span>{selectedFile.path}</span><small>{selectedFile.language} · {selectedFile.role}</small></div>
          {fileSelectionNotice ? <p className="rest-code-notice" role="status">{fileSelectionNotice}</p> : null}
          <div className="rest-code-lines" role="listbox" aria-label={`${selectedFile.id} 逐行程式碼`}>
            {selectedFile.lines.map((line, index) => {
              const isRelated = activeLineIds.includes(line.id);
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedLineId === line.id}
                  className={`${selectedLineId === line.id ? "selected" : ""} ${isRelated ? "related" : ""}`}
                  key={line.id}
                  onClick={() => setSelectedLineId(line.id)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span><code>{line.code}</code>{codeMode === "annotated" ? <small>{line.explanation}</small> : null}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rest-explanation-panel" aria-live="polite">
          <div className="rest-explanation-heading"><span>LINE NOTE</span><b>{selectedFile.id} / {selectedLine.id}</b></div>
          <code>{selectedLine.code}</code>
          <h2>{selectedLine.explanation}</h2>
          <dl>
            <div><dt>何時執行</dt><dd>{selectedLine.timing}</dd></div>
            <div><dt>如何連接</dt><dd>{selectedLine.connection}</dd></div>
            <div><dt>刪除或寫錯</dt><dd>{selectedLine.consequence}</dd></div>
          </dl>
        </aside>
      </div>

      <section className="rest-io-grid" aria-label="Request database and response state">
        <article><header><span>REQUEST BODY</span><b>{scenario.method === "POST" ? "application/json" : "none"}</b></header><pre>{scenario.requestBody}</pre></article>
        <article><header><span>SQL 示意（非實際 log）</span><b>{state.databaseItems.length} rows · SQLite fixture</b></header><pre>{state.requestStarted && (currentIndex >= stageIndex("database") || scenario.terminalStageId === "validation") ? scenario.sql : "— waiting for database stage —"}</pre></article>
        <article className={state.responseReady ? "ready" : ""}><header><span>HTTP RESPONSE</span><b>{state.responseReady ? scenario.status : "Pending"}</b></header><pre>{state.responseReady ? scenario.responseBody : "— follow the request to see the response —"}</pre></article>
      </section>
    </TopicLabShell>
  );
}
