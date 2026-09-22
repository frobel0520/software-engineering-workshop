import type { SimulatorDefinition } from "../../topics/types";
import {
  ideCompletedVariables,
  ideFileFixture,
  ideInitialState,
  idePausedVariables,
  type IdeLabState,
  type IdeStream,
  type IdeStepId,
} from "./content";

export interface IdeCommandEvent {
  type: "command";
  command: string;
}

export interface IdeResetEvent {
  type: "reset";
}

export type IdeLabEvent = IdeCommandEvent | IdeResetEvent;

export interface IdeCommandResult {
  state: IdeLabState;
  accepted: boolean;
  stream: IdeStream | null;
  output: string[];
}

const completionStepIds: readonly IdeStepId[] = ["open", "breakpoint", "run", "inspect", "step", "continue"];

function cloneState(state: IdeLabState): IdeLabState {
  return {
    ...state,
    breakpointLines: [...state.breakpointLines],
    callStack: [...state.callStack],
    variables: { ...state.variables },
    output: [...state.output],
    completedStepIds: [...state.completedStepIds],
  };
}

function normalize(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

function isComplete(state: IdeLabState): boolean {
  return completionStepIds.every((stepId) => state.completedStepIds.includes(stepId));
}

function markStep(state: IdeLabState, stepId: IdeStepId) {
  if (!state.completedStepIds.includes(stepId)) {
    state.completedStepIds = [...state.completedStepIds, stepId];
  }
}

function appendSuccess(state: IdeLabState, output: string, message: string, stepId?: IdeStepId): IdeCommandResult {
  if (stepId) markStep(state, stepId);
  state.output = [...state.output, output];
  state.lastStream = "stdout";
  state.exitCode = 0;
  state.lastMessage = message;
  state.phase = isComplete(state) ? "completed" : state.phase === "paused" ? "paused" : "active";
  return { state, accepted: true, stream: "stdout", output: [output] };
}

function appendFailure(state: IdeLabState, output: string, message: string, exitCode: number): IdeCommandResult {
  state.output = [...state.output, output];
  state.lastStream = "stderr";
  state.exitCode = exitCode;
  state.lastMessage = message;
  state.phase = "failed";
  return { state, accepted: false, stream: "stderr", output: [output] };
}

function runKnownCommand(state: IdeLabState, command: string): IdeCommandResult | null {
  if (command.startsWith("open ")) {
    const path = command.slice(5);
    if (path !== ideFileFixture.path) {
      return appendFailure(state, `open: ${path}: file not found`, "檔案不存在；請開啟 src/order.ts。", 1);
    }
    state.selectedFile = ideFileFixture.path;
    return appendSuccess(state, `Opened ${ideFileFixture.path}`, "已開啟 order.ts。", "open");
  }

  if (command.startsWith("breakpoint ")) {
    const line = Number(command.slice("breakpoint ".length));
    if (!state.selectedFile) {
      return appendFailure(state, "breakpoint: no file is open", "先開啟 src/order.ts，再設定 breakpoint。", 2);
    }
    if (!Number.isInteger(line) || line < 1 || line > ideFileFixture.content.split("\n").length) {
      return appendFailure(state, `breakpoint: invalid line ${command.slice("breakpoint ".length)}`, "Breakpoint 必須落在 order.ts 的有效行號。", 1);
    }
    state.breakpointLines = [line];
    if (line !== 3) {
      return appendSuccess(state, `Breakpoint set at line ${line}`, "Breakpoint 已設定；happy path 需要第 3 行才能觀察 discounted。", undefined);
    }
    return appendSuccess(state, "Breakpoint set at line 3", "已在 discounted 計算前設定 breakpoint。", "breakpoint");
  }

  if (command === "run calculateTotal(10, 2, 3)") {
    if (state.selectedFile !== ideFileFixture.path) {
      return appendFailure(state, "run: no file is open", "先開啟 src/order.ts，再啟動 calculateTotal。", 2);
    }
    if (!state.breakpointLines.includes(3)) {
      return appendFailure(state, "run: no breakpoint at line 3", "先在第 3 行設定 breakpoint，再執行函式。", 2);
    }
    state.phase = "paused";
    state.currentLine = 3;
    state.callStack = ["calculateTotal"];
    state.variables = { ...idePausedVariables };
    return appendSuccess(state, "Paused at src/order.ts:3", "程式已在第 3 行 paused；現在可以 inspect variables。", "run");
  }

  if (command === "inspect variables") {
    if (state.phase !== "paused" || state.currentLine === null) {
      return appendFailure(state, "inspect: no active frame", "只有 paused state 才有可讀取的 active frame。", 2);
    }
    const variables = Object.entries(state.variables).map(([name, value]) => `${name}=${value}`).join(" ");
    markStep(state, "inspect");
    return appendSuccess(state, variables, "已讀取目前 frame 的 variables。");
  }

  if (command === "step over") {
    if (state.phase !== "paused" || state.currentLine === null) {
      return appendFailure(state, "step over: debugger is not paused", "先 run 並停在 breakpoint，才能逐行執行。", 2);
    }
    if (!state.completedStepIds.includes("inspect")) {
      return appendFailure(state, "step over: inspect the current frame first", "先 inspect variables，再執行下一行。", 2);
    }
    if (state.currentLine !== 3) {
      return appendFailure(state, `step over: no step from line ${state.currentLine}`, "目前已在 return 行；可直接 continue。", 2);
    }
    state.currentLine = 4;
    state.variables = { ...ideCompletedVariables };
    return appendSuccess(state, "Stepped to src/order.ts:4", "step over 已執行 discounted 計算。", "step");
  }

  if (command === "continue") {
    if (state.phase !== "paused" || state.currentLine === null) {
      return appendFailure(state, "continue: program has not started", "先 run calculateTotal，再 continue 到下一個 breakpoint 或結束。", 2);
    }
    if (!state.completedStepIds.includes("step")) {
      return appendFailure(state, "continue: step over the paused line first", "先完成 inspect 與 step over，再 continue。", 2);
    }
    state.phase = "completed";
    state.currentLine = null;
    state.callStack = [];
    return appendSuccess(state, "17", "固定函式已完成，debug 流程完成。", "continue");
  }

  return null;
}

export function createIdeLabState(): IdeLabState {
  return cloneState(ideInitialState);
}

export function runIdeCommand(current: IdeLabState, rawCommand: string): IdeCommandResult {
  const command = normalize(rawCommand);
  if (!command) return { state: current, accepted: false, stream: null, output: [] };

  const state = cloneState(current);
  const knownResult = runKnownCommand(state, command);
  if (knownResult) return knownResult;

  return appendFailure(state, `${command}: command not found`, "命令不存在；請使用教材中的 debugger 指令。", 127);
}

export const ideSimulator: SimulatorDefinition<IdeLabState, IdeLabEvent> = {
  createInitialState: createIdeLabState,
  reduce: (state, event) => event.type === "reset" ? createIdeLabState() : runIdeCommand(state, event.command).state,
  reset: createIdeLabState,
};

export function ideCommand(command: string): IdeCommandEvent {
  return { type: "command", command };
}

export function ideLabIsComplete(state: IdeLabState): boolean {
  return isComplete(state);
}
