export interface CommitNode {
  id: string;
  message: string;
  branch: "main" | "feature/avatar";
}

export interface GitState {
  step: number;
  branch: "main" | "feature/avatar";
  workingFile: string | null;
  stagedFile: string | null;
  commits: CommitNode[];
  complete: boolean;
}

export interface CommandResult {
  state: GitState;
  output: string[];
  accepted: boolean;
}

export const LAB_STEPS = [
  { command: "git status", hint: "先確認目前在哪個分支、有哪些變更。" },
  { command: "git add app.js", hint: "把 app.js 的目前版本放進暫存區。" },
  { command: 'git commit -m "add profile page"', hint: "替這組完整變更建立一個快照。" },
  { command: "git switch -c feature/avatar", hint: "從目前位置建立並切換到功能分支。" },
  { command: "git add avatar.css", hint: "新分支已出現 avatar.css 變更，把它加入暫存區。" },
  { command: 'git commit -m "style avatar"', hint: "提交頭像樣式，讓功能分支留下清楚歷史。" },
  { command: "git switch main", hint: "回到 main，準備合併已完成的工作。" },
  { command: "git merge feature/avatar", hint: "把功能分支的歷史合回 main。" },
] as const;

export function initialGitState(): GitState {
  return {
    step: 0,
    branch: "main",
    workingFile: "app.js",
    stagedFile: null,
    commits: [{ id: "A1", message: "initial commit", branch: "main" }],
    complete: false,
  };
}

function normalize(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

function matchesCommit(command: string, message: string): boolean {
  const pattern = new RegExp(`^git commit -m ["']${message}["']$`);
  return pattern.test(command);
}

export function runGitCommand(current: GitState, rawCommand: string): CommandResult {
  const command = normalize(rawCommand);
  const state: GitState = {
    ...current,
    commits: current.commits.map((commit) => ({ ...commit })),
  };

  if (command === "git status") {
    const fileLine = state.stagedFile
      ? `changes to be committed: ${state.stagedFile}`
      : state.workingFile
        ? `changes not staged: ${state.workingFile}`
        : "nothing to commit, working tree clean";
    if (state.step === 0) state.step = 1;
    return { state, accepted: true, output: [`On branch ${state.branch}`, fileLine] };
  }

  if (state.step === 1 && command === "git add app.js") {
    state.stagedFile = "app.js";
    state.workingFile = null;
    state.step = 2;
    return { state, accepted: true, output: ["app.js 已加入暫存區。", "下一個 commit 只會包含已暫存的內容。"] };
  }

  if (state.step === 2 && matchesCommit(command, "add profile page")) {
    state.commits.push({ id: "B2", message: "add profile page", branch: "main" });
    state.stagedFile = null;
    state.step = 3;
    return { state, accepted: true, output: ["[main B2] add profile page", "1 file changed"] };
  }

  if (state.step === 3 && command === "git switch -c feature/avatar") {
    state.branch = "feature/avatar";
    state.workingFile = "avatar.css";
    state.step = 4;
    return { state, accepted: true, output: ["Switched to a new branch 'feature/avatar'", "模擬器已建立 avatar.css 的工作目錄變更。"] };
  }

  if (state.step === 4 && command === "git add avatar.css") {
    state.stagedFile = "avatar.css";
    state.workingFile = null;
    state.step = 5;
    return { state, accepted: true, output: ["avatar.css 已加入暫存區。"] };
  }

  if (state.step === 5 && matchesCommit(command, "style avatar")) {
    state.commits.push({ id: "C3", message: "style avatar", branch: "feature/avatar" });
    state.stagedFile = null;
    state.step = 6;
    return { state, accepted: true, output: ["[feature/avatar C3] style avatar", "1 file changed"] };
  }

  if (state.step === 6 && command === "git switch main") {
    state.branch = "main";
    state.step = 7;
    return { state, accepted: true, output: ["Switched to branch 'main'"] };
  }

  if (state.step === 7 && command === "git merge feature/avatar") {
    state.commits.push({ id: "M4", message: "merge feature/avatar", branch: "main" });
    state.step = 8;
    state.complete = true;
    return { state, accepted: true, output: ["Merge made by the 'ort' strategy.", "avatar.css | 18 ++++++++++++++++++", "Git Lab 完成。"] };
  }

  const expected = LAB_STEPS[Math.min(state.step, LAB_STEPS.length - 1)].command;
  return {
    state: current,
    accepted: false,
    output: [`這個指令現在不會完成任務。`, `下一步提示：${expected}`],
  };
}
