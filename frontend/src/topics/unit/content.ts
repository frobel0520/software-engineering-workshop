import type { LessonDefinition } from "../types";

export type UnitStepId =
  | "identify-boundary"
  | "arrange-fixture"
  | "run-red"
  | "fix-green"
  | "cover-edge"
  | "run-regression";

export interface UnitLessonStep {
  id: UnitStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export type UnitValue = string | number;
export type UnitLabPhase = "initial" | "active" | "blocked" | "completed";
export type UnitSuiteStatus = "idle" | "red" | "green";
export type UnitImplementationStatus = "buggy" | "fixed";
export type UnitLabEventType = UnitStepId | "reset";

export interface UnitLabEvent {
  type: UnitLabEventType;
}

export interface UnitTestCase {
  id: "standard-order" | "empty-cart" | "discount-floor";
  title: string;
  input: string;
  expected: number;
  actualBeforeFix: number;
  actualAfterFix: number;
}

export function unitBeforeFixTotal(subtotal: number, discount: number): number {
  void discount;
  return subtotal;
}

export interface UnitLabResult {
  id: UnitStepId;
  columns: readonly string[];
  rows: readonly (readonly UnitValue[])[];
  caption: string;
}

export interface UnitLabState {
  phase: UnitLabPhase;
  selectedStepId: UnitStepId;
  completedStepIds: readonly UnitStepId[];
  boundary: "unknown" | "pure-function";
  suiteStatus: UnitSuiteStatus;
  implementationStatus: UnitImplementationStatus;
  passedTests: number;
  totalTests: number;
  result: UnitLabResult | null;
  lastCode: string | null;
  lastMessage: string;
  canReset: true;
}

export const unitLesson: LessonDefinition = {
  title: "讓錯誤在最小範圍內被看見",
  orientation: {
    what: "單元測試以隔離的最小行為為對象，檢查一個函式在明確輸入下是否產生預期結果。",
    why: "小而快的測試能在錯誤剛出現時提供線索，降低依賴整條 API 或畫面流程才發現問題的成本。",
    when: "商業規則、資料轉換或邊界條件可以被獨立呼叫時，先用單元測試固定它的可觀察行為。",
    how: "先選定 unit boundary，再 Arrange fixture、Act 一次、Assert 結果，沿著 red → green → edge → regression 收斂。",
  },
  objectives: [
    "分辨純函式的 unit boundary 與不應混入的 HTTP、資料庫副作用。",
    "用 Arrange、Act、Assert 建立可重複的測試 fixture。",
    "讀懂 red／green feedback，讓測試先揭露錯誤再驗證最小修復。",
    "為空集合與折扣超過小計等邊界條件補上回歸保護。",
  ],
  sections: [
    {
      id: "boundary",
      title: "先切出可隔離的 unit",
      body: "本課把 calculateOrderTotal 當成 unit；它只接收 items 與 discount，不在測試裡呼叫 HTTP、資料庫或瀏覽器。",
    },
    {
      id: "arrange",
      title: "Arrange 一個看得懂的 fixture",
      body: "輸入資料要小到能直接讀懂，expected value 也要由業務規則推導，而不是從實作細節複製答案。",
    },
    {
      id: "red",
      title: "先讓錯誤變成 red",
      body: "標準訂單的 expected total 是 140，但目前實作漏算 discount；測試失敗是線索，不是要被隱藏的噪音。",
    },
    {
      id: "green",
      title: "用最小修復回到 green",
      body: "修正計算規則後重新執行同一個案例，確認行為通過；不要因為測試失敗就直接改 expected value。",
    },
    {
      id: "edge",
      title: "補上邊界案例",
      body: "空購物車與 discount 大於 subtotal 都是容易被遺漏的輸入；測試要說清楚結果應為 0，而不是負數。",
    },
    {
      id: "regression",
      title: "跑完整回歸 suite",
      body: "最後一次執行要同時保護標準案例與邊界案例，讓未來重構仍能快速知道哪個 observable behavior 退回去了。",
    },
  ],
};

export const unitLessonSteps: readonly UnitLessonStep[] = [
  {
    id: "identify-boundary",
    title: "選定 unit boundary",
    code: "calculateOrderTotal(items, discount)",
    explanation: "只測量訂單總額這個純函式；外部 I/O 留在更高層測試，讓這裡的回饋保持快速且穩定。",
    takeaway: "先切對邊界，測試才是在保護行為，而不是在模擬整個系統。",
  },
  {
    id: "arrange-fixture",
    title: "Arrange 標準案例",
    code: "const order = { items: [100, 50], discount: 10 };",
    explanation: "fixture 的 subtotal 是 150，discount 是 10，因此測試預期 total 應為 140。",
    takeaway: "小 fixture 讓失敗訊息能直接指出哪個規則出了問題。",
  },
  {
    id: "run-red",
    title: "執行測試，看見 red",
    code: "expect(calculateOrderTotal(order)).toBe(140);",
    explanation: "buggy implementation 忽略 discount，actual 是 150；這個 red result 提供可驗證的修復目標。",
    takeaway: "失敗的測試是證據，先理解差異，再決定怎麼修。",
  },
  {
    id: "fix-green",
    title: "修復並回到 green",
    code: "return Math.max(0, subtotal - discount);",
    explanation: "最小修復同時計入 discount 並保護 total 不會低於 0，再重新執行標準案例。",
    takeaway: "Green 代表目前案例通過，不代表所有邊界都已被覆蓋。",
  },
  {
    id: "cover-edge",
    title: "加入邊界案例",
    code: "it.each([emptyCart, discountTooLarge])(\"keeps total safe\", ...);",
    explanation: "空購物車與超額 discount 都必須得到 0，讓規則在非典型輸入下仍然清楚。",
    takeaway: "邊界案例不是為了湊數，而是為了固定最容易回歸的決策。",
  },
  {
    id: "run-regression",
    title: "執行完整 regression suite",
    code: "npm test -- order-total.test.ts",
    explanation: "一次執行標準案例與兩個邊界案例，確認 3 個 observable behaviors 都保持 green。",
    takeaway: "回歸 suite 讓重構有安全網，也讓失敗能在最短路徑被定位。",
  },
] as const;

export const unitTestCases: readonly UnitTestCase[] = [
  {
    id: "standard-order",
    title: "standard order",
    input: "items [100, 50] · discount 10",
    expected: 140,
    actualBeforeFix: unitBeforeFixTotal(150, 10),
    actualAfterFix: 140,
  },
  {
    id: "empty-cart",
    title: "empty cart",
    input: "items [] · discount 0",
    expected: 0,
    actualBeforeFix: unitBeforeFixTotal(0, 0),
    actualAfterFix: 0,
  },
  {
    id: "discount-floor",
    title: "discount exceeds subtotal",
    input: "items [50] · discount 80",
    expected: 0,
    actualBeforeFix: unitBeforeFixTotal(50, 80),
    actualAfterFix: 0,
  },
] as const;

export const unitResults: Readonly<Record<UnitStepId, UnitLabResult>> = {
  "identify-boundary": {
    id: "identify-boundary",
    columns: ["unit", "input", "external I/O", "boundary"],
    rows: [["calculateOrderTotal", "items + discount", "none", "isolated"]],
    caption: "unit boundary · pure function",
  },
  "arrange-fixture": {
    id: "arrange-fixture",
    columns: ["case", "input", "expected"],
    rows: [[unitTestCases[0].title, unitTestCases[0].input, unitTestCases[0].expected]],
    caption: "Arrange · 1 fixture",
  },
  "run-red": {
    id: "run-red",
    columns: ["case", "expected", "actual", "status"],
    rows: [[unitTestCases[0].title, unitTestCases[0].expected, unitTestCases[0].actualBeforeFix, "FAIL · red"]],
    caption: "test runner · 1 failed",
  },
  "fix-green": {
    id: "fix-green",
    columns: ["case", "expected", "actual", "status"],
    rows: [[unitTestCases[0].title, unitTestCases[0].expected, unitTestCases[0].actualAfterFix, "PASS · green"]],
    caption: "test runner · 1 passed",
  },
  "cover-edge": {
    id: "cover-edge",
    columns: ["case", "expected", "actual", "status"],
    rows: unitTestCases.slice(1).map((testCase) => [testCase.title, testCase.expected, testCase.actualAfterFix, "PASS · edge"]),
    caption: "edge cases · 2 passed",
  },
  "run-regression": {
    id: "run-regression",
    columns: ["case", "expected", "actual", "status"],
    rows: unitTestCases.map((testCase) => [testCase.title, testCase.expected, testCase.actualAfterFix, "PASS"]),
    caption: "regression suite · 3 passed",
  },
};

export const unitLabInitialState: UnitLabState = {
  phase: "initial",
  selectedStepId: "identify-boundary",
  completedStepIds: [],
  boundary: "unknown",
  suiteStatus: "idle",
  implementationStatus: "buggy",
  passedTests: 0,
  totalTests: unitTestCases.length,
  result: null,
  lastCode: null,
  lastMessage: "先選定 unit boundary，再沿著 Arrange、Act、Assert 看見 red 與 green。",
  canReset: true,
};

export const unitLabHappyPath: readonly UnitLabEvent[] = unitLessonSteps.map((step) => ({ type: step.id }));

export interface UnitFailureFixture {
  event: UnitStepId;
  message: string;
}

export const unitFailureFixtures: readonly UnitFailureFixture[] = [
  { event: "arrange-fixture", message: "請先選定 calculateOrderTotal 的 unit boundary。" },
  { event: "run-red", message: "請先 Arrange 一個小而明確的標準案例。" },
  { event: "fix-green", message: "請先執行測試，讓 red result 提供修復證據。" },
] as const;
