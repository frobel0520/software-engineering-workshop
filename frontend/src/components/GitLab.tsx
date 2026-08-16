import { type FormEvent, useState } from "react";
import {
  GIT_RELEASE_PIPELINE_JOBS,
  GIT_RELEASE_STEPS,
  createInitialGitReleaseState,
  gitReleaseProgress,
  isGitReleaseComplete,
  nextGitReleaseStep,
  runGitReleaseCommand,
  runGitReleaseEvent,
  type GitProvider,
  type GitReleaseEvent,
  type GitReleaseState,
} from "../git/release-simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback, type TopicStatusTone } from "./TopicShell";

interface TerminalEntry {
  command?: string;
  lines: readonly string[];
  accepted?: boolean;
}

const initialHistory: readonly TerminalEntry[] = [
  { lines: ["Git cowork sandbox v2", "固定 hosted repository 與 pipeline fixture 已準備好。"] },
];

function statusTone(state: GitReleaseState, accepted: boolean): TopicStatusTone {
  if (!accepted) return "error";
  if (state.complete) return "success";
  return "neutral";
}

export function GitLab({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState(createInitialGitReleaseState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<readonly TerminalEntry[]>(initialHistory);
  const [feedback, setFeedback] = useState({ accepted: true, message: state.lastMessage });
  const currentStep = nextGitReleaseStep(state);
  const completed = isGitReleaseComplete(state);

  function apply(result: ReturnType<typeof runGitReleaseCommand>) {
    setState(result.state);
    setFeedback({ accepted: result.accepted, message: result.output.join(" ") });
    setHistory((items) => [...items, { command: result.state.lastCommand ?? undefined, lines: result.output, accepted: result.accepted }]);
    if (result.accepted && isGitReleaseComplete(result.state)) onComplete();
  }

  function dispatch(event: GitReleaseEvent) {
    const result = runGitReleaseEvent(state, event);
    apply(result);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!command.trim() || completed) return;
    const submittedCommand = command;
    setCommand("");
    const result = runGitReleaseCommand(state, submittedCommand);
    setState(result.state);
    setFeedback({ accepted: result.accepted, message: result.output.join(" ") });
    setHistory((items) => [...items, { command: submittedCommand, lines: result.output, accepted: result.accepted }]);
    if (result.accepted && isGitReleaseComplete(result.state)) onComplete();
  }

  function reset() {
    const nextState = createInitialGitReleaseState();
    setState(nextState);
    setCommand("");
    setFeedback({ accepted: true, message: nextState.lastMessage });
    setHistory([{ lines: ["Sandbox 已重設。從 fork／clone 重新開始。"] }]);
  }

  const currentCommand = GIT_RELEASE_STEPS.find((step) => step.id === currentStep)?.command ?? "完成";

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / GIT COWORK"
      title={<>把一個功能<br /><em>送進 pipeline</em></>}
      progressLabel={completed ? "完成" : `${state.completedStepIds.length} / ${GIT_RELEASE_STEPS.length} STEPS`}
      progress={gitReleaseProgress(state)}
      onReset={reset}
    >
      {completed ? (
        <TopicCompletionCard
          title="功能已安全合併至 dev。"
          description="你已完成 fork／clone、local history、remote sync、PR／MR、pipeline 與 merge 的 cowork workflow。"
          onReset={reset}
        />
      ) : (
        <>
          <div className="lab-layout git-release-layout">
            <section className="terminal-panel" aria-label="Git 指令終端機">
              <div className="terminal-top"><span className="terminal-dots"><i /><i /><i /></span><b>git-cowork — {state.localBranch}</b><button type="button" onClick={reset}>重設</button></div>
              <div className="terminal-output" aria-live="polite">
                {history.map((entry, index) => (
                  <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                    {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                    {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
                  </div>
                ))}
              </div>
              <form className="terminal-form" onSubmit={submit}>
                <label htmlFor="git-command">❯</label>
                <input id="git-command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="輸入 Git 指令或 pipeline 操作…" autoComplete="off" spellCheck={false} />
                <button type="submit" disabled={!command.trim()}>執行</button>
              </form>
            </section>

            <aside className="mission-panel" aria-label="Git cowork 狀態">
              <p className="kicker">CURRENT MISSION</p>
              <label className="git-provider-picker" htmlFor="git-provider">練習平台
                <select id="git-provider" value={state.provider} onChange={(event) => dispatch({ type: "set-provider", provider: event.target.value as GitProvider })}>
                  <option value="github">GitHub · PR</option>
                  <option value="gitlab">GitLab · Merge Request</option>
                </select>
              </label>
              <span className="mission-number">{String(Math.min(state.completedStepIds.length + 1, GIT_RELEASE_STEPS.length)).padStart(2, "0")}</span>
              <h2>{GIT_RELEASE_STEPS.find((step) => step.id === currentStep)?.hint ?? "完成目前流程。"}</h2>
              <button className="command-chip" type="button" onClick={() => setCommand(currentCommand)}>
                <code>{currentCommand}</code><span>填入</span>
              </button>
              <p className="mission-note">提示只會填入指令，仍要由你執行；也可以故意輸入錯誤操作觀察阻擋原因。</p>
              <div className="repo-state">
                <div><small>REPOSITORY</small><b>{state.repositoryAccess}</b></div>
                <div><small>BRANCH</small><b>{state.localBranch}</b></div>
                <div><small>BASE</small><b>{state.remoteBase}</b></div>
                <div><small>REMOTE</small><b>{state.remoteBranch}</b></div>
                <div><small>REVIEW</small><b>{state.review}</b></div>
                <div><small>PIPELINE</small><b>{state.pipeline}</b></div>
              </div>
            </aside>
          </div>

          <div className="git-release-actions remote-action-panel">
            <div className="remote-panel-heading"><div><p className="kicker">WORKFLOW ACTIONS</p><h2>選擇一個操作，理解它改變哪一層</h2></div><span className="remote-lab-meta">{state.provider === "github" ? "PR" : "MERGE REQUEST"} · {state.targetBranch}</span></div>
            <div className="remote-action-list">
              {GIT_RELEASE_STEPS.map((step, index) => {
                const done = state.completedStepIds.includes(step.id);
                return (
                  <button className={`remote-action ${done ? "done" : ""}`} key={step.id} type="button" onClick={() => dispatch({ type: step.id })} aria-label={`${step.id}：${step.command}`}>
                    <span className="remote-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="remote-action-copy"><b>{step.id}</b><code>{step.command}</code></span>
                    <span className="remote-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="git-release-pipeline remote-context-panel">
            <div className="section-heading"><div><p className="kicker">PIPELINE JOBS</p><h2>push 之後 runner 執行什麼？</h2></div><p>每個 job 都是可讀的 fixture 結果，不連線真實 CI provider。</p></div>
            <div className="git-job-grid">
              {GIT_RELEASE_PIPELINE_JOBS.map((job) => <div key={job} className={state.pipelineJobs.includes(job) ? "passed" : "pending"}><span>{state.pipelineJobs.includes(job) ? "✓" : "○"}</span><b>{job}</b></div>)}
            </div>
            <TopicStatusFeedback tone={statusTone(state, feedback.accepted)} message={feedback.message} />
          </div>
        </>
      )}
    </TopicLabShell>
  );
}
