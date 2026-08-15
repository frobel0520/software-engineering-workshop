import {
  remoteLabInitialState,
  type RemoteLabEvent,
  type RemoteLabState,
} from "./content";

export interface RemoteCommandResult {
  state: RemoteLabState;
  output: readonly string[];
  accepted: boolean;
}

export interface RemoteRunResult {
  state: RemoteLabState;
  results: readonly RemoteCommandResult[];
  accepted: boolean;
}

export function createInitialRemoteState(): RemoteLabState {
  return { ...remoteLabInitialState };
}

export function resetRemoteLab(): RemoteLabState {
  return createInitialRemoteState();
}

export function isRemoteLabComplete(state: RemoteLabState): boolean {
  return (
    state.phase === "completed" &&
    state.localCommitCount > 0 &&
    state.syncState === "rebased" &&
    state.remoteBranch === "published" &&
    state.pullRequest === "merged" &&
    state.checks === "passed"
  );
}

function accepted(
  current: RemoteLabState,
  changes: Partial<RemoteLabState>,
  message: string,
  output: readonly string[] = [message],
): RemoteCommandResult {
  return {
    state: { ...current, ...changes, phase: "active", lastMessage: message },
    output,
    accepted: true,
  };
}

function blocked(current: RemoteLabState, message: string): RemoteCommandResult {
  return {
    state: { ...current, phase: "blocked", lastMessage: message },
    output: [message],
    accepted: false,
  };
}

export function runRemoteEvent(current: RemoteLabState, event: RemoteLabEvent): RemoteCommandResult {
  if (event.type === "reset") {
    return { state: resetRemoteLab(), output: ["Lab 已重設，可以重新開始。"], accepted: true };
  }

  if (current.phase === "completed") {
    return blocked(current, "Lab 已完成；如要重練，請先 reset。");
  }

  switch (event.type) {
    case "inspect":
      return accepted(current, {}, `目前在 ${current.localBranch}；遠端為 ${current.remoteName}。`);
    case "branch":
      if (current.localBranch !== "dev") {
        return blocked(current, "功能分支已建立；下一步請先提交變更。");
      }
      return accepted(current, { localBranch: "feature/remote-work", workingTree: "dirty" }, "已切換到 feature/remote-work，準備提交變更。");
    case "commit":
      if (current.localBranch !== "feature/remote-work" || current.workingTree !== "dirty") {
        return blocked(current, "請先在 feature/remote-work 建立工作變更，再建立 commit。");
      }
      return accepted(current, { workingTree: "clean", localCommitCount: current.localCommitCount + 1 }, "已建立本地 commit；接著更新遠端 dev 的參照。");
    case "fetch":
      if (current.localBranch !== "feature/remote-work") {
        return blocked(current, "請先從 dev 切出 feature/remote-work，再 fetch 遠端基線。");
      }
      return accepted(current, { localBaseRef: "origin/dev", syncState: "fetched" }, "已更新 origin/dev；目前工作目錄沒有被 fetch 直接改動。");
    case "rebase":
      if (current.syncState !== "fetched") {
        return blocked(current, "請先執行 git fetch origin dev，再 rebase origin/dev。");
      }
      if (current.localCommitCount === 0) {
        return blocked(current, "目前沒有可整理的本地 commit；請先建立功能變更。");
      }
      return accepted(current, { syncState: "rebased", localBaseRef: "origin/dev" }, "已將功能 commit 對齊最新 origin/dev。");
    case "push":
      if (current.syncState !== "rebased") {
        return blocked(current, "請先 rebase origin/dev；未確認基線前不可發布分支。");
      }
      return accepted(current, { remoteBranch: "published" }, "已發布 feature/remote-work，現在可以開 PR。");
    case "open-pr":
      if (current.remoteBranch !== "published") {
        return blocked(current, "請先 push 功能分支，PR 才有可供 review 的遠端來源。");
      }
      return accepted(current, { pullRequest: "open", checks: "pending" }, "PR 已開啟；等待 CI checks 與 review。");
    case "checks-pass":
      if (current.pullRequest !== "open") {
        return blocked(current, "請先開啟 PR，再等待 CI checks 結果。");
      }
      return accepted(current, { checks: "passed" }, "CI checks 已通過；現在符合 merge 條件。");
    case "merge":
      if (current.pullRequest !== "open" || current.checks !== "passed") {
        return blocked(current, "PR 必須已開啟且 CI checks 通過，才能 merge 至 dev。");
      }
      return {
        state: { ...current, phase: "completed", pullRequest: "merged", lastMessage: "PR 已合併至 dev；REMOTE Lab 完成。" },
        output: ["PR 已合併至 dev；REMOTE Lab 完成。"],
        accepted: true,
      };
  }
}

export function runRemoteEvents(
  events: readonly RemoteLabEvent[],
  initialState: RemoteLabState = createInitialRemoteState(),
): RemoteRunResult {
  let state = { ...initialState };
  const results: RemoteCommandResult[] = [];

  for (const event of events) {
    const result = runRemoteEvent(state, event);
    results.push(result);
    state = result.state;
  }

  return { state, results, accepted: results.every((result) => result.accepted) };
}
