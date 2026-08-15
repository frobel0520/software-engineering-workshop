import { useState } from "react";
import {
  remoteLabHappyPath,
  type RemoteLabEvent,
  type RemoteLabEventType,
  type RemoteLabState,
} from "./content";
import { createInitialRemoteState, isRemoteLabComplete, runRemoteEvent } from "./simulator";
import { TopicCompletionCard, TopicLabShell, TopicStatusFeedback } from "../../components/TopicShell";

const REMOTE_ACTIONS: readonly { event: RemoteLabEventType; label: string; command: string }[] = [
  { event: "inspect", label: "檢查目前狀態", command: "git status" },
  { event: "branch", label: "建立功能分支", command: "git switch -c feature/remote-work" },
  { event: "commit", label: "建立本地 commit", command: 'git commit -m "add remote lesson"' },
  { event: "fetch", label: "更新遠端基線", command: "git fetch origin dev" },
  { event: "rebase", label: "對齊 origin/dev", command: "git rebase origin/dev" },
  { event: "push", label: "發布功能分支", command: "git push -u origin feature/remote-work" },
  { event: "open-pr", label: "開啟 Pull Request", command: "PR: feature/remote-work → dev" },
  { event: "checks-pass", label: "通過 CI checks", command: "CI checks pass" },
  { event: "merge", label: "合併至 dev", command: "Merge PR" },
];

const REQUIRED_STEPS = remoteLabHappyPath.filter((event) => event.type !== "inspect").map((event) => event.type);

function stepComplete(state: RemoteLabState, event: RemoteLabEventType): boolean {
  switch (event) {
    case "branch":
      return state.localBranch === "feature/remote-work";
    case "commit":
      return state.localCommitCount > 0;
    case "fetch":
      return state.syncState === "fetched" || state.syncState === "rebased";
    case "rebase":
      return state.syncState === "rebased";
    case "push":
      return state.remoteBranch === "published";
    case "open-pr":
      return state.pullRequest !== "none";
    case "checks-pass":
      return state.checks === "passed";
    case "merge":
      return state.pullRequest === "merged";
    default:
      return false;
  }
}

export function remoteLabProgress(state: RemoteLabState): number {
  const completedSteps = REQUIRED_STEPS.filter((event) => stepComplete(state, event)).length;
  return Math.round((completedSteps / REQUIRED_STEPS.length) * 100);
}

export function RemoteLab({ onComplete }: { onComplete?: () => void }) {
  const [state, setState] = useState(createInitialRemoteState);
  const [feedback, setFeedback] = useState({ accepted: true, message: state.lastMessage });
  const completed = isRemoteLabComplete(state);

  function dispatch(event: RemoteLabEvent) {
    const result = runRemoteEvent(state, event);
    setState(result.state);
    setFeedback({ accepted: result.accepted, message: result.output.join(" ") });
    if (result.accepted && isRemoteLabComplete(result.state)) onComplete?.();
  }

  return (
    <TopicLabShell
      eyebrow="INTERACTIVE LAB / REMOTE"
      title={<>把變更送上<br /><em>遠端協作流程</em></>}
      progressLabel={`${Math.round(remoteLabProgress(state) / 100 * REQUIRED_STEPS.length)} / ${REQUIRED_STEPS.length} STEPS`}
      progress={remoteLabProgress(state)}
      onReset={() => dispatch({ type: "reset" })}
    >
      {completed ? (
        <TopicCompletionCard
          title="PR 已安全合回 dev。"
          description="你已完成 branch → commit → fetch → rebase → push → PR → CI → merge 的完整遠端協作閉環。"
          onReset={() => dispatch({ type: "reset" })}
        />
      ) : (
        <div className="remote-lab-grid">
          <section className="remote-action-panel" aria-labelledby="remote-actions-title">
            <div className="remote-panel-heading">
              <div>
                <p className="kicker">MISSION CONTROL</p>
                <h2 id="remote-actions-title">依序完成協作檢查</h2>
              </div>
              <span className="remote-lab-meta">{state.localBranch} · {state.remoteName}</span>
            </div>
            <div className="remote-action-list">
              {REMOTE_ACTIONS.map((action, index) => {
                const done = stepComplete(state, action.event);
                return (
                  <button
                    className={`remote-action ${done ? "done" : ""}`}
                    key={action.event}
                    type="button"
                    onClick={() => dispatch({ type: action.event })}
                    aria-label={`${action.label}：${action.command}`}
                  >
                    <span className="remote-action-index" aria-hidden="true">{done ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <span className="remote-action-copy"><b>{action.label}</b><code>{action.command}</code></span>
                    <span className="remote-action-arrow" aria-hidden="true">→</span>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="remote-context-panel" aria-labelledby="remote-context-title">
            <p className="kicker">REMOTE CONTEXT</p>
            <h2 id="remote-context-title">目前的協作狀態</h2>
            <dl className="remote-context-list">
              <div><dt>BASE</dt><dd>{state.baseBranch}</dd></div>
              <div><dt>SYNC</dt><dd>{state.syncState}</dd></div>
              <div><dt>BRANCH</dt><dd>{state.remoteBranch}</dd></div>
              <div><dt>PR</dt><dd>{state.pullRequest}</dd></div>
              <div><dt>CHECKS</dt><dd>{state.checks}</dd></div>
            </dl>
            <TopicStatusFeedback tone={feedback.accepted ? "neutral" : "error"} message={feedback.message} />
            <p className="remote-context-hint">可以故意點錯順序，觀察 simulator 如何保留狀態並提示下一步。</p>
          </aside>
        </div>
      )}
    </TopicLabShell>
  );
}
