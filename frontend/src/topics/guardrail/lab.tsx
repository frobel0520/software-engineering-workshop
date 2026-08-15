import { useState } from "react";
import {
  guardrailScenarios,
  guardrailValidators,
  type GuardrailStage,
  type ValidatorId,
} from "./content";
import { createInitialGuardrailState, isGuardrailComplete, runGuardrailEvent, type GuardrailEvent, type GuardrailState } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback } from "../../components/TopicShell";

const STAGES: readonly { id: GuardrailStage; label: string; hint: string }[] = [
  { id: "input", label: "INPUT", hint: "請求進入模型前" },
  { id: "output", label: "OUTPUT", hint: "模型結果交付前" },
  { id: "tool", label: "TOOL", hint: "外部副作用發生前" },
];

export function guardrailLabProgress(state: GuardrailState): number {
  return Math.round((state.completedScenarioIds.length / 3) * 100);
}

export function GuardrailLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState(createInitialGuardrailState);
  const [feedback, setFeedback] = useState({ accepted: true, message: state.lastMessage });
  const completed = isGuardrailComplete(state);
  const activeValidators = guardrailValidators.filter((validator) => validator.stage === state.stage);
  const activeScenarios = guardrailScenarios.filter((scenario) => scenario.stage === state.stage);

  function apply(event: GuardrailEvent) {
    const result = runGuardrailEvent(state, event);
    setState(result.state);
    setFeedback({ accepted: result.accepted, message: result.output.join(" ") });
    if (result.accepted && isGuardrailComplete(result.state)) onComplete?.();
  }

  function submitScenario(id: (typeof guardrailScenarios)[number]["id"]) {
    const scenario = guardrailScenarios.find((item) => item.id === id);
    if (!scenario) return;
    const inputResult = runGuardrailEvent(state, { type: "setInput", text: scenario.input });
    const result = runGuardrailEvent(inputResult.state, { type: "submitScenario", id });
    setState(result.state);
    setFeedback({ accepted: result.accepted, message: result.output.join(" ") });
    if (result.accepted && isGuardrailComplete(result.state)) onComplete?.();
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / GUARDRAILS"
      title={<>讓每一次呼叫<br /><em>先通過一道防線</em></>}
      progressLabel={`${state.completedScenarioIds.length} / 3 SCENARIOS`}
      progress={guardrailLabProgress(state)}
      onReset={() => apply({ type: "reset" })}
    >
      {completed ? (
        <TopicCompletionCard
          title="三個關鍵情境都完成了。"
          description="你已看過安全放行、可修正的輸入風險，以及工具副作用攔截；每個結果都有固定規則與 latency。"
          onReset={() => apply({ type: "reset" })}
        />
      ) : (
        <div className="guardrail-lab-grid">
          <section className="guardrail-control-panel" aria-labelledby="guardrail-controls-title">
            <div className="guardrail-panel-heading">
              <div>
                <p className="kicker">PIPELINE CONTROL</p>
                <h2 id="guardrail-controls-title">選擇檢查掛載點</h2>
              </div>
              <span className="guardrail-stage-label">{state.stage.toUpperCase()}</span>
            </div>

            <div className="guardrail-stage-picker" aria-label="選擇 guardrail stage">
              {STAGES.map((stage) => (
                <button
                  className={`guardrail-stage-button ${state.stage === stage.id ? "active" : ""}`}
                  key={stage.id}
                  type="button"
                  onClick={() => apply({ type: "selectStage", stage: stage.id })}
                  aria-pressed={state.stage === stage.id}
                >
                  <b>{stage.label}</b><span>{stage.hint}</span>
                </button>
              ))}
            </div>

            <div className="guardrail-section-heading">
              <p className="kicker">VALIDATORS</p>
              <span>可複選</span>
            </div>
            <div className="guardrail-validator-list">
              {activeValidators.map((validator) => {
                const enabled = state.enabledValidators.includes(validator.id);
                return (
                  <label className={`guardrail-validator ${enabled ? "enabled" : ""}`} key={validator.id}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => apply({ type: "toggleValidator", id: validator.id as ValidatorId })}
                    />
                    <span><b>{validator.label}</b><small>{validator.purpose}</small></span>
                    <i>{validator.latencyMs}ms</i>
                  </label>
                );
              })}
            </div>

            <div className="guardrail-section-heading scenario-heading">
              <p className="kicker">FIXED SCENARIOS</p>
              <span>不呼叫真實模型</span>
            </div>
            <div className="guardrail-scenario-list">
              {activeScenarios.map((scenario) => (
                <button className="guardrail-scenario" key={scenario.id} type="button" onClick={() => submitScenario(scenario.id)}>
                  <span><b>{scenario.title}</b><small>{scenario.input}</small></span>
                  <i>{scenario.expectedAction}</i>
                </button>
              ))}
            </div>
          </section>

          <aside className="guardrail-result-panel" aria-labelledby="guardrail-result-title">
            <p className="kicker">EVALUATION TRACE</p>
            <h2 id="guardrail-result-title">每一層都留下理由</h2>
            <TopicStatusFeedback
              tone={!feedback.accepted ? "error" : completed ? "success" : "neutral"}
              message={feedback.message}
            />
            <div className="guardrail-result-list" aria-live="polite">
              {state.results.length ? state.results.map((result) => (
                <div className={`guardrail-result ${result.triggered ? "triggered" : ""}`} key={result.validatorId}>
                  <span>{result.triggered ? "!" : "✓"}</span>
                  <div><b>{result.validatorId}</b><small>{result.message}</small></div>
                  <i>{result.latencyMs}ms</i>
                </div>
              )) : <p className="guardrail-empty">送出一個固定情境後，這裡會顯示 validator 結果與成本。</p>}
            </div>
            <p className="guardrail-result-note">目前 outcome：<b>{state.outcome}</b> · session phase：<b>{state.phase}</b></p>
          </aside>
        </div>
      )}
    </TopicLabShell>
  );
}
