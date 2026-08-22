export type GitReleasePhase = "initial" | "local" | "published" | "review" | "blocked" | "merged";
export type GitProvider = "github" | "gitlab";

export function isGitProvider(value: string): value is GitProvider {
  return value === "github" || value === "gitlab";
}

export type RepositoryAccess = "none" | "forked" | "cloned";
export type WorkingTreeState = "clean" | "dirty" | "staged";
export type RemoteBaseState = "unknown" | "fetched" | "pulled" | "rebased";
export type PipelineState = "not-started" | "running" | "failed" | "passed";
export type ReviewState = "none" | "open" | "merged";

export type GitReleaseStepId =
  | "fork"
  | "clone"
  | "checkout"
  | "stash"
  | "stash-pop"
  | "diff"
  | "add"
  | "commit"
  | "fetch"
  | "pull"
  | "rebase"
  | "cherry-pick"
  | "push"
  | "open-review"
  | "pipeline"
  | "resolve-conflict"
  | "merge";

export interface GitReleaseState {
  phase: GitReleasePhase;
  provider: GitProvider;
  repositoryAccess: RepositoryAccess;
  localBranch: "none" | "dev" | "feature/profile";
  targetBranch: "dev" | "main";
  workingTree: WorkingTreeState;
  remoteBase: RemoteBaseState;
  localCommitCount: number;
  remoteBranch: "absent" | "published";
  review: ReviewState;
  pipeline: PipelineState;
  pipelineJobs: readonly ("checkout" | "install" | "test" | "lint" | "build")[];
  stashCount: number;
  selectedCommit: string | null;
  conflict: boolean;
  completedStepIds: readonly GitReleaseStepId[];
  lastCommand: string | null;
  lastMessage: string;
  complete: boolean;
  canReset: true;
}

export interface GitReleaseEvent {
  type: GitReleaseStepId | "set-provider";
  provider?: GitProvider;
}

export interface GitReleaseCommandResult {
  state: GitReleaseState;
  output: readonly string[];
  accepted: boolean;
}

export const GIT_RELEASE_STEPS: readonly { id: GitReleaseStepId; command: string; hint: string }[] = [
  { id: "fork", command: "Fork repository", hint: "沒有原 repository 寫入權限，先建立自己的 hosted copy。" },
  { id: "clone", command: "git clone <your-url>", hint: "把 fork 的 repository 複製到本機，建立 origin。" },
  { id: "checkout", command: "git checkout -b feature/profile", hint: "從 dev 切出功能分支；現代替代寫法是 git switch -c。" },
  { id: "stash", command: "git stash", hint: "先暫存一個尚未完成的修改，練習安全切換工作。" },
  { id: "stash-pop", command: "git stash pop", hint: "回到功能工作，恢復剛才暫存的修改。" },
  { id: "diff", command: "git diff", hint: "提交前檢查這次到底改了什麼。" },
  { id: "add", command: "git add src/profile.ts", hint: "把 profile 變更放入下一個 commit 的 staging area。" },
  { id: "commit", command: 'git commit -m "add profile page"', hint: "留下第一個可 review 的本地快照。" },
  { id: "fetch", command: "git fetch origin", hint: "先取得遠端最新參照，不直接改工作目錄。" },
  { id: "pull", command: "git pull --rebase origin dev", hint: "示範 pull 如何取得並整合遠端基線。" },
  { id: "rebase", command: "git rebase origin/dev", hint: "把自己的 commit 接到最新基線後面。" },
  { id: "cherry-pick", command: "git cherry-pick a1b2c3d", hint: "把一個 hotfix commit 移植到目前功能分支。" },
  { id: "push", command: "git push -u origin feature/profile", hint: "把本地 branch 發布到 hosted repository。" },
  { id: "open-review", command: "Open PR / MR", hint: "建立 source branch 到 target branch 的 review context。" },
  { id: "pipeline", command: "Run pipeline", hint: "觀察 runner 如何執行 checkout、install、test、lint、build。" },
  { id: "resolve-conflict", command: "Resolve conflict", hint: "先處理 pipeline 暴露的衝突，再重新執行檢查。" },
  { id: "merge", command: "Merge PR / MR", hint: "required checks 通過後，將功能整合進 dev。" },
];

export const GIT_RELEASE_PIPELINE_JOBS: readonly GitReleaseState["pipelineJobs"][number][] = [
  "checkout",
  "install",
  "test",
  "lint",
  "build",
];

export function createInitialGitReleaseState(): GitReleaseState {
  return {
    phase: "initial",
    provider: "github",
    repositoryAccess: "none",
    localBranch: "none",
    targetBranch: "dev",
    workingTree: "clean",
    remoteBase: "unknown",
    localCommitCount: 0,
    remoteBranch: "absent",
    review: "none",
    pipeline: "not-started",
    pipelineJobs: [],
    stashCount: 0,
    selectedCommit: null,
    conflict: false,
    completedStepIds: [],
    lastCommand: null,
    lastMessage: "準備從 fork／clone 開始一次可 review 的 cowork workflow。",
    complete: false,
    canReset: true,
  };
}

function withCompletedStep(state: GitReleaseState, step: GitReleaseStepId): GitReleaseState {
  return state.completedStepIds.includes(step)
    ? state
    : { ...state, completedStepIds: [...state.completedStepIds, step] };
}

function blocked(current: GitReleaseState, message: string): GitReleaseCommandResult {
  return {
    state: current,
    accepted: false,
    output: ["操作被阻擋。", message],
  };
}

export function nextGitReleaseStep(state: GitReleaseState): GitReleaseStepId | null {
  return GIT_RELEASE_STEPS.find((step) => !state.completedStepIds.includes(step.id))?.id ?? null;
}

function accepted(state: GitReleaseState, output: readonly string[]): GitReleaseCommandResult {
  return { state, accepted: true, output };
}

export function isGitReleaseComplete(state: GitReleaseState): boolean {
  return state.complete && GIT_RELEASE_STEPS.every((step) => state.completedStepIds.includes(step.id));
}

export function gitReleaseProgress(state: GitReleaseState): number {
  return Math.round((state.completedStepIds.length / GIT_RELEASE_STEPS.length) * 100);
}

export function runGitReleaseEvent(current: GitReleaseState, event: GitReleaseEvent): GitReleaseCommandResult {
  if (event.type === "set-provider") {
    if (!event.provider || current.review !== "none") return blocked(current, "PR／MR 建立後不能切換 provider；請 reset 後重新選擇。");
    return accepted({ ...current, provider: event.provider, lastMessage: `目前使用 ${event.provider === "github" ? "GitHub PR" : "GitLab Merge Request"}。` }, [
      event.provider === "github" ? "GitHub PR 已選定。" : "GitLab Merge Request 已選定。",
      "兩者都會比較 source／target branch 並等待 pipeline checks。",
    ]);
  }

  if (current.complete) return blocked(current, "流程已完成；如要重練，請先 reset。 ");

  if (event.type === "resolve-conflict") {
    if (!current.conflict || current.pipeline !== "failed") return blocked(current, "目前沒有待處理的 pipeline conflict。");
    const state: GitReleaseState = {
      ...withCompletedStep(current, "resolve-conflict"),
      phase: "review",
      pipeline: "not-started",
      pipelineJobs: [],
      conflict: false,
      lastCommand: "Resolve conflict",
      lastMessage: "衝突已處理；請重新執行 pipeline，確認所有 jobs 都通過。",
    };
    return accepted(state, ["Conflict resolved。", "請重新執行 pipeline。"]);
  }

  const expected = nextGitReleaseStep(current);
  if (event.type !== expected) {
    return blocked(current, expected ? `目前應先完成：${GIT_RELEASE_STEPS.find((step) => step.id === expected)?.command}` : "目前沒有可執行的下一步。");
  }

  switch (event.type) {
    case "fork":
      return accepted({ ...withCompletedStep(current, "fork"), phase: "local", repositoryAccess: "forked", lastCommand: "Fork repository", lastMessage: "已建立自己的 hosted copy；接著 clone 這個 URL。" }, ["Fork completed。", "你現在可以對自己的 fork clone，但還沒有修改原 repository。"]);
    case "clone":
      if (current.repositoryAccess !== "forked") return blocked(current, "先 fork 或取得可讀取的 hosted repository，再執行 clone。");
      return accepted({ ...withCompletedStep(current, "clone"), phase: "local", repositoryAccess: "cloned", localBranch: "dev", lastCommand: "git clone <your-url>", lastMessage: "本地 repository 已建立，origin 指向你的 hosted copy。" }, ["Cloning into 'workshop'...", "origin 已設定；目前在 dev。"]);
    case "checkout":
      if (current.localBranch !== "dev") return blocked(current, "clone 完成後應先位於 dev，才能切出功能分支。");
      return accepted({ ...withCompletedStep(current, "checkout"), phase: "local", localBranch: "feature/profile", workingTree: "dirty", lastCommand: "git checkout -b feature/profile", lastMessage: "已切到 feature/profile；fixture 放入尚未完成的 profile 修改。" }, ["Switched to a new branch 'feature/profile'。", "現代替代寫法：git switch -c feature/profile。"]);
    case "stash":
      if (current.workingTree !== "dirty") return blocked(current, "目前沒有未提交修改可 stash。");
      return accepted({ ...withCompletedStep(current, "stash"), workingTree: "clean", stashCount: current.stashCount + 1, lastCommand: "git stash", lastMessage: "未完成修改已暫存，工作目錄回到 clean。" }, ["Saved working directory and index state。", "現在可以安全切換或處理其他工作。"]);
    case "stash-pop":
      if (current.stashCount < 1 || current.workingTree !== "clean") return blocked(current, "先有一筆 stash 且工作目錄必須是 clean，才能 stash pop。");
      return accepted({ ...withCompletedStep(current, "stash-pop"), workingTree: "dirty", stashCount: current.stashCount - 1, lastCommand: "git stash pop", lastMessage: "profile 修改已恢復，準備檢查差異。" }, ["On branch feature/profile。", "Changes restored from stash。"]);
    case "diff":
      if (current.workingTree !== "dirty") return blocked(current, "目前沒有未提交修改可檢查；先恢復 stash 內容。");
      return accepted({ ...withCompletedStep(current, "diff"), lastCommand: "git diff", lastMessage: "已檢查 profile diff，確認沒有把不相關修改帶進 commit。" }, ["diff -- src/profile.ts", "+ add profile card", "先看清楚，再決定要 add 哪些檔案。"]);
    case "add":
      if (current.workingTree !== "dirty") return blocked(current, "目前沒有 dirty 修改可加入 staging area。");
      return accepted({ ...withCompletedStep(current, "add"), workingTree: "staged", lastCommand: "git add src/profile.ts", lastMessage: "profile 變更已進入 staging area。" }, ["src/profile.ts 已加入暫存區。", "下一個 commit 只會包含 staged 內容。"]);
    case "commit":
      if (current.workingTree !== "staged") return blocked(current, "先用 git add 把要提交的檔案放進 staging area。");
      return accepted({ ...withCompletedStep(current, "commit"), workingTree: "clean", localCommitCount: 1, lastCommand: 'git commit -m "add profile page"', lastMessage: "本地已有可 review 的 commit；遠端仍然不知道這個變更。" }, ["[feature/profile a1b2c3d] add profile page", "1 file changed", "commit 只存在本地，尚未觸發遠端 pipeline。"]);
    case "fetch":
      if (current.workingTree !== "clean") return blocked(current, "先處理未提交修改，再 fetch 遠端基線。");
      return accepted({ ...withCompletedStep(current, "fetch"), remoteBase: "fetched", lastCommand: "git fetch origin", lastMessage: "origin/dev 已更新；目前工作目錄沒有被 fetch 改動。" }, ["origin/dev updated。", "fetch 只更新 remote-tracking ref。"]);
    case "pull":
      if (current.remoteBase !== "fetched") return blocked(current, "先 fetch，再用 pull --rebase 示範取得並整合遠端基線。");
      return accepted({ ...withCompletedStep(current, "pull"), remoteBase: "pulled", lastCommand: "git pull --rebase origin dev", lastMessage: "pull 已示範 fetch 加 rebase；現在可明確整理自己的 feature branch。" }, ["Already up to date with origin/dev。", "pull 會整合；fetch 本身不會。"]);
    case "rebase":
      if (current.remoteBase !== "pulled") return blocked(current, "先完成 pull --rebase，確認遠端基線，再整理 feature branch。");
      return accepted({ ...withCompletedStep(current, "rebase"), remoteBase: "rebased", lastCommand: "git rebase origin/dev", lastMessage: "feature/profile 已接到最新 origin/dev 後面。" }, ["Successfully rebased and updated refs/heads/feature/profile。", "這次整理的是自己的 branch。"]);
    case "cherry-pick":
      if (current.remoteBase !== "rebased") return blocked(current, "先完成 fetch、pull 與 rebase，再移植 hotfix commit。");
      return accepted({ ...withCompletedStep(current, "cherry-pick"), localCommitCount: current.localCommitCount + 1, selectedCommit: "a1b2c3d", lastCommand: "git cherry-pick a1b2c3d", lastMessage: "hotfix commit 已以新的 commit 套用到 feature/profile。" }, ["[feature/profile d4e5f6a] apply hotfix", "1 commit cherry-picked", "cherry-pick 只移植一個 commit，不會整條 branch merge。"]);
    case "push":
      if (current.remoteBase !== "rebased" || current.localCommitCount < 1) return blocked(current, "先完成本地 commit 與 rebase，再發布 feature branch。");
      return accepted({ ...withCompletedStep(current, "push"), phase: "published", remoteBranch: "published", lastCommand: "git push -u origin feature/profile", lastMessage: "遠端 feature/profile 已更新；平台現在可以建立 PR／MR。" }, ["Enumerating objects...", "feature/profile -> feature/profile", "upstream branch set to origin/feature/profile。"]);
    case "open-review":
      if (current.remoteBranch !== "published") return blocked(current, "先 push，讓 hosted platform 看得到 source branch，再建立 PR／MR。");
      return accepted({ ...withCompletedStep(current, "open-review"), phase: "review", review: "open", lastCommand: current.provider === "github" ? "Open PR" : "Open Merge Request", lastMessage: `${current.provider === "github" ? "PR" : "Merge Request"} 已建立，等待 review 與 pipeline checks。` }, [current.provider === "github" ? "Pull Request opened: feature/profile → dev" : "Merge Request opened: feature/profile → dev", "source／target branch、diff 與 required checks 已可追蹤。"]);
    case "pipeline":
      if (current.review !== "open") return blocked(current, "先建立 PR／MR，pipeline 才有 source／target context。");
      if (!current.completedStepIds.includes("resolve-conflict")) {
        return accepted({ ...current, phase: "blocked", pipeline: "failed", pipelineJobs: ["checkout", "install", "test"], conflict: true, lastCommand: "Run pipeline", lastMessage: "CI 在 test job 發現 fixture conflict；先處理 conflict 再重跑 pipeline。" }, ["Pipeline started。", "checkout ✓", "install ✓", "test ✕ conflict detected", "下一步：Resolve conflict。"]);
      }
      return accepted({ ...withCompletedStep(current, "pipeline"), phase: "review", pipeline: "passed", pipelineJobs: GIT_RELEASE_PIPELINE_JOBS, lastCommand: "Run pipeline", lastMessage: "所有 required jobs 通過；現在可以合併 PR／MR。" }, ["checkout ✓", "install ✓", "test ✓", "lint ✓", "build ✓", "Pipeline passed。"]);
    case "merge":
      if (current.pipeline !== "passed") return blocked(current, "pipeline 尚未通過；required checks 未完成前不能 merge。");
      return accepted({ ...withCompletedStep(current, "merge"), phase: "merged", review: "merged", complete: true, lastCommand: current.provider === "github" ? "Merge PR" : "Merge MR", lastMessage: "功能已安全合併至 dev；Git cowork workflow 完成。" }, ["Required checks passed。", `${current.provider === "github" ? "PR" : "Merge Request"} merged into dev。`, "Git Lab 完成。"]);
    default:
      return blocked(current, "目前沒有可執行的操作。");
  }
}

export function runGitReleaseCommand(current: GitReleaseState, rawCommand: string): GitReleaseCommandResult {
  const command = rawCommand.trim().replace(/\s+/g, " ");
  const lower = command.toLowerCase();
  if (lower === "fork repository" || lower === "fork") return runGitReleaseEvent(current, { type: "fork" });
  if (lower.startsWith("git clone")) return runGitReleaseEvent(current, { type: "clone" });
  if (lower.startsWith("git checkout") || lower.startsWith("git switch")) return runGitReleaseEvent(current, { type: "checkout" });
  if (lower === "git stash") return runGitReleaseEvent(current, { type: "stash" });
  if (lower === "git stash pop" || lower === "git stash apply") return runGitReleaseEvent(current, { type: "stash-pop" });
  if (lower === "git diff") return runGitReleaseEvent(current, { type: "diff" });
  if (lower.startsWith("git add")) return runGitReleaseEvent(current, { type: "add" });
  if (lower.startsWith("git commit")) return runGitReleaseEvent(current, { type: "commit" });
  if (lower.startsWith("git fetch")) return runGitReleaseEvent(current, { type: "fetch" });
  if (lower.startsWith("git pull")) return runGitReleaseEvent(current, { type: "pull" });
  if (lower.startsWith("git rebase")) return runGitReleaseEvent(current, { type: "rebase" });
  if (lower.startsWith("git cherry-pick")) return runGitReleaseEvent(current, { type: "cherry-pick" });
  if (lower.startsWith("git push")) return runGitReleaseEvent(current, { type: "push" });
  if (lower === "open pr" || lower === "open mr" || lower === "open pr / mr") return runGitReleaseEvent(current, { type: "open-review" });
  if (lower === "run pipeline" || lower === "ci run") return runGitReleaseEvent(current, { type: "pipeline" });
  if (lower === "resolve conflict") return runGitReleaseEvent(current, { type: "resolve-conflict" });
  if (lower === "merge pr" || lower === "merge mr" || lower === "merge pr / mr") return runGitReleaseEvent(current, { type: "merge" });
  return blocked(current, "這個操作不在本次 Git release fixture；請先讀目前任務與下一步提示。");
}
