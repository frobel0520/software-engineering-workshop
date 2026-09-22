import type { SimulatorDefinition } from "../../topics/types";
import {
  cliCommandFixtures,
  cliLabInitialState,
  type CliLabState,
  type CliStream,
  type CliStepId,
} from "./content";

export interface CliCommandEvent {
  type: "command";
  command: string;
}

export interface CliResetEvent {
  type: "reset";
}

export type CliLabEvent = CliCommandEvent | CliResetEvent;

export interface CliCommandResult {
  state: CliLabState;
  accepted: boolean;
  stream: CliStream | null;
  output: string[];
}

const completionStepIds = cliCommandFixtures.map((fixture) => fixture.stepId);

function cloneState(state: CliLabState): CliLabState {
  return {
    ...state,
    files: state.files.map((file) => ({ ...file })),
    commandHistory: [...state.commandHistory],
    stdout: [...state.stdout],
    stderr: [...state.stderr],
    completedStepIds: [...state.completedStepIds],
  };
}

function normalize(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

function isComplete(state: CliLabState): boolean {
  return completionStepIds.every((stepId) => state.completedStepIds.includes(stepId));
}

function appendOutput(
  state: CliLabState,
  stream: CliStream,
  output: string,
  exitCode: number,
  message: string,
): CliCommandResult {
  if (stream === "stdout") state.stdout = [...state.stdout, output];
  if (stream === "stderr") state.stderr = [...state.stderr, output];
  state.lastStream = stream;
  state.exitCode = exitCode;
  state.lastMessage = message;
  state.phase = "failed";
  return { state, accepted: false, stream, output: [output] };
}

function appendSuccess(
  state: CliLabState,
  output: string,
  message: string,
  stepId?: CliStepId,
): CliCommandResult {
  if (stepId && !state.completedStepIds.includes(stepId)) {
    state.completedStepIds = [...state.completedStepIds, stepId];
  }
  state.stdout = [...state.stdout, output];
  state.lastStream = "stdout";
  state.exitCode = 0;
  state.lastMessage = message;
  state.phase = isComplete(state) ? "completed" : "active";
  return { state, accepted: true, stream: "stdout", output: [output] };
}

function fileNameForCurrentDirectory(state: CliLabState): string[] {
  const prefix = state.cwd === "/workspace/project/src" ? "src/" : "";
  return state.files
    .filter((file) => {
      if (prefix === "src/") return file.path.startsWith(prefix) && !file.path.slice(prefix.length).includes("/");
      return !file.path.includes("/");
    })
    .map((file) => file.path.slice(prefix.length));
}

function runKnownCommand(state: CliLabState, command: string): CliCommandResult | null {
  if (command === "pwd") {
    return appendSuccess(state, state.cwd, "目前 cwd 已確認。", "context");
  }

  if (command === "cd src") {
    if (state.cwd !== "/workspace/project") {
      return appendOutput(state, "stderr", "cd: src: no such directory from the current path", 1, "目前已在 src；不需要重複切換目錄。");
    }
    state.cwd = "/workspace/project/src";
    return appendSuccess(state, "現在位於 /workspace/project/src", "已進入來源目錄。", "navigate");
  }

  if (command.startsWith("cd ")) {
    return appendOutput(state, "stderr", `cd: ${command.slice(3)}: no such directory`, 1, "目錄不存在；錯誤路徑不會改變目前 cwd。");
  }

  if (command === "ls") {
    const names = fileNameForCurrentDirectory(state);
    const output = names.join("  ");
    return appendSuccess(
      state,
      output,
      state.cwd === "/workspace/project/src" ? "已確認來源目錄內有 app.ts。" : "已列出 project root 的檔案。",
      state.cwd === "/workspace/project/src" ? "inspect" : undefined,
    );
  }

  if (command.startsWith("cat ")) {
    const requestedPath = command.slice(4);
    const file = state.files.find((candidate) => {
      if (state.cwd === "/workspace/project/src") return candidate.path === `src/${requestedPath}`;
      return candidate.path === requestedPath;
    });
    if (!file) {
      return appendOutput(state, "stderr", `cat: ${requestedPath}: file not found`, 1, "檔案不存在；先用 ls 確認目前目錄的內容。");
    }
    return appendSuccess(state, file.content, `已讀取 ${requestedPath}。`);
  }

  if (command.startsWith("grep ")) {
    const match = /^grep (.+) (.+)$/.exec(command);
    if (!match) {
      return appendOutput(state, "stderr", "grep: missing pattern or file", 2, "grep 需要 pattern 與檔名兩個參數。");
    }
    const [, pattern, requestedPath] = match;
    const file = state.files.find((candidate) => {
      if (state.cwd === "/workspace/project/src") return candidate.path === `src/${requestedPath}`;
      return candidate.path === requestedPath;
    });
    if (!file) {
      return appendOutput(state, "stderr", `grep: ${requestedPath}: file not found`, 2, "相對路徑依賴 cwd；先進入 src 再搜尋 app.ts。");
    }
    const line = file.content.split("\n").find((content) => content.includes(pattern));
    if (!line) {
      return appendOutput(state, "stderr", `grep: ${pattern}: no matches`, 1, "搜尋完成但沒有找到符合的線索。");
    }
    const lineNumber = file.content.split("\n").indexOf(line) + 1;
    return appendSuccess(state, `${requestedPath}:${lineNumber}: ${line.split("// ")[1] ?? line}`, "已找到 TODO 線索。", "search");
  }

  if (command === "npm test") {
    if (state.cwd !== "/workspace/project/src") {
      return appendOutput(state, "stderr", "npm test: blocked until the source directory is selected", 1, "先完成 pwd 與 cd src，再執行檢查。");
    }
    return appendSuccess(state, "Tests: 3 passed", "檢查通過，CLI Lab 已完成。", "verify");
  }

  return null;
}

export function createCliLabState(): CliLabState {
  return cloneState(cliLabInitialState);
}

export function runCliCommand(current: CliLabState, rawCommand: string): CliCommandResult {
  const command = normalize(rawCommand);
  if (!command) {
    return { state: current, accepted: false, stream: null, output: [] };
  }

  const state = cloneState(current);
  state.commandHistory = [...state.commandHistory, command];
  const knownResult = runKnownCommand(state, command);
  if (knownResult) return knownResult;

  return appendOutput(state, "stderr", `${command}: command not found`, 127, "命令不存在；請確認拼字或回到教材中的指令。");
}

export const cliSimulator: SimulatorDefinition<CliLabState, CliLabEvent> = {
  createInitialState: createCliLabState,
  reduce: (state, event) => event.type === "reset" ? createCliLabState() : runCliCommand(state, event.command).state,
  reset: createCliLabState,
};

export function cliLabIsComplete(state: CliLabState): boolean {
  return isComplete(state);
}

export function cliCommand(command: string): CliCommandEvent {
  return { type: "command", command };
}
