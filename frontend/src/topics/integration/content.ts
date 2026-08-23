import type { LessonDefinition } from "../types";

export type IntegrationStepId =
  | "define-boundary"
  | "load-fixture"
  | "trace-success"
  | "read-contract-error"
  | "propagate-dependency-failure"
  | "run-regression";

export type IntegrationScenarioId =
  | "create-order-success"
  | "response-contract-error"
  | "repository-unavailable";

export type IntegrationBoundaryId = "client" | "service" | "repository" | "response";

export interface IntegrationOrderItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface IntegrationCreateOrderInput {
  items: readonly IntegrationOrderItem[];
  discount: number;
}

export interface IntegrationOrderResponse {
  orderId?: string;
  total: number;
  status: "created";
}

export type IntegrationRepositoryResult =
  | {
      kind: "success";
      response: IntegrationOrderResponse;
    }
  | {
      kind: "dependency-unavailable";
      errorCode: "dependency-unavailable";
      message: string;
    };

export type IntegrationExpectedOutcome =
  | {
      kind: "success";
      statusCode: 201;
      response: {
        orderId: string;
        total: number;
        status: "created";
      };
      sideEffect: "order-created";
      failureBoundary: null;
    }
  | {
      kind: "contract-error";
      statusCode: null;
      errorCode: "response-contract-error";
      sideEffect: "none";
      failureBoundary: "response";
    }
  | {
      kind: "dependency-unavailable";
      statusCode: null;
      errorCode: "dependency-unavailable";
      sideEffect: "none";
      failureBoundary: "repository";
    };

export interface IntegrationBoundaryFixture {
  id: IntegrationBoundaryId;
  module: string;
  responsibility: string;
  inputContract: string;
  outputContract: string;
  externalBoundary: boolean;
  failureConsequence: string;
}

export interface IntegrationTraceObservation {
  boundary: IntegrationBoundaryId;
  input: string;
  output: string;
  evidence: string;
}

export interface IntegrationScenarioFixture {
  id: IntegrationScenarioId;
  title: string;
  summary: string;
  input: IntegrationCreateOrderInput;
  repositoryResult: IntegrationRepositoryResult;
  expected: IntegrationExpectedOutcome;
  trace: readonly IntegrationTraceObservation[];
}

export interface IntegrationLessonStep {
  id: IntegrationStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export type IntegrationResultValue = string | number;

export interface IntegrationLessonResult {
  id: IntegrationStepId;
  columns: readonly string[];
  rows: readonly (readonly IntegrationResultValue[])[];
  caption: string;
}

export interface IntegrationFailureFixture {
  scenarioId: Exclude<IntegrationScenarioId, "create-order-success">;
  boundary: Exclude<IntegrationBoundaryId, "client" | "service">;
  message: string;
  evidence: string;
}

export const integrationLesson: LessonDefinition = {
  title: "讓模組契約在一起工作時被驗證",
  orientation: {
    what: "整合測試驗證多個模組透過公開契約協作時，輸入、輸出與錯誤是否仍然一致。",
    why: "單一函式都通過，不代表 adapter、service 與 repository 接在一起時真的能完成一條可用流程。",
    when: "需要確認模組組合、資料 mapping、依賴邊界或錯誤傳遞，而不必啟動整個 production 系統時使用。",
    how: "保留要驗證的真實模組，只在外部依賴邊界使用 deterministic fixture，沿著 success 與 failure scenario 觀察契約。",
  },
  objectives: [
    "分辨 unit boundary 與 checkoutClient、orderService、orderRepository 之間的整合 boundary。",
    "用固定 order input 與 repository outcome 建立可重跑的 integration fixture。",
    "追蹤成功流程如何跨過 client、service、repository 與 response 四個 boundary。",
    "從 response-contract-error 與 dependency-unavailable 判斷失敗位置和未發生的副作用。",
    "理解整合測試、unit test 與 E2E test 各自保護的範圍，不用一層測試取代其他層。",
  ],
  sections: [
    {
      id: "boundary",
      title: "先畫出一起工作的 boundary",
      body: "整合測試不是把所有程式都塞進一個案例，而是選出需要一起驗證的真實模組；本課固定 checkoutClient、orderService、orderRepository 與 response boundary。",
    },
    {
      id: "fixture",
      title: "準備小而完整的 fixture",
      body: "固定的 order input、repository response 與 dependency outcome 讓每次執行都有相同證據，不需要呼叫真實資料庫或服務。",
    },
    {
      id: "success",
      title: "沿著 success trace 看協作",
      body: "成功案例要看見資料如何從 client mapping 經過 service，再由 repository 回傳 orderId、total 與 status，最後形成 201 response。",
    },
    {
      id: "contract-failure",
      title: "讓 response contract error 停在邊界",
      body: "repository 回傳缺少 orderId 的 response 時，consumer 必須在 response boundary 報錯，不能用預設值把 producer／consumer 漂移藏起來。",
    },
    {
      id: "dependency-failure",
      title: "保留 dependency failure 的證據",
      body: "repository 回傳 dependency-unavailable 時，service 要把錯誤傳出去並保持 side effect 為 none，不可假裝 order 已建立。",
    },
    {
      id: "regression",
      title: "用三個 scenario 固定回歸",
      body: "最後重跑 success、contract failure 與 dependency failure，確認修正一個 adapter contract 後，其他可觀察行為仍然一致。",
    },
  ],
};

export const integrationLessonSteps: readonly IntegrationLessonStep[] = [
  {
    id: "define-boundary",
    title: "選定整合 boundary",
    code: "checkoutClient → orderService → orderRepository → orderResponse",
    explanation: "這條路徑保留多個真實模組，並只把 repository 的外部結果固定成 fixture；純粹的 subtotal 計算仍可由 unit test 保護。",
    takeaway: "先決定哪些模組要一起工作，整合測試才不會變成沒有邊界的 E2E。",
  },
  {
    id: "load-fixture",
    title: "載入固定 order fixture",
    code: 'const input = { items: [{ sku: "book", quantity: 2, unitPrice: 50 }], discount: 10 };',
    explanation: "subtotal 固定為 100，discount 固定為 10；同一個 input 能讓成功與兩個 failure scenarios 只改變必要的 dependency outcome。",
    takeaway: "小 fixture 要能直接推導 expected result，也要能隔離每一種失敗原因。",
  },
  {
    id: "trace-success",
    title: "追蹤成功協作",
    code: '201 { orderId: "ord-001", total: 90, status: "created" }',
    explanation: "client mapping、service rule、repository result 與 response validation 都通過後，才可以宣告訂單建立；orderId 必須來自固定 repository response。",
    takeaway: "整合通過代表 boundary 之間的資料契約真的接得起來。",
  },
  {
    id: "read-contract-error",
    title: "讀懂 response contract error",
    code: "response.orderId === undefined → response-contract-error",
    explanation: "response 缺少必要的 orderId 時，在 response boundary 停止；不得使用 unknown 或其他預設值繼續產生成功結果。",
    takeaway: "契約漂移要在邊界被看見，而不是被 fallback 靜默修飾。",
  },
  {
    id: "propagate-dependency-failure",
    title: "傳遞 repository failure",
    code: "orderRepository → dependency-unavailable → sideEffect: none",
    explanation: "repository 的固定失敗要保留 error code，service 不得生成 orderId，也不得把未寫入的資料報成 order-created。",
    takeaway: "錯誤傳遞同樣是整合契約；沒有副作用也是需要驗證的結果。",
  },
  {
    id: "run-regression",
    title: "重跑完整 regression",
    code: "success + response-contract-error + repository-unavailable",
    explanation: "三個 scenario 必須在同一組 fixture 規則下重跑，確認 success、錯誤位置與 side effect 都與第一次相同。",
    takeaway: "回歸不是只看綠燈，而是確認每條可觀察路徑都沒有被改壞。",
  },
] as const;

export const integrationBoundaryFixtures: readonly IntegrationBoundaryFixture[] = [
  {
    id: "client",
    module: "checkoutClient",
    responsibility: "把 checkout input mapping 成 CreateOrderRequest。",
    inputContract: "items[] + discount",
    outputContract: "CreateOrderRequest",
    externalBoundary: false,
    failureConsequence: "遺漏 item 或 discount 時，service 收到的 request 不完整。",
  },
  {
    id: "service",
    module: "orderService",
    responsibility: "套用訂單規則並協調 repository，不直接讀取 UI state。",
    inputContract: "CreateOrderRequest",
    outputContract: "OrderDraft 或 typed error",
    externalBoundary: false,
    failureConsequence: "service 若吞掉 error，response 可能錯誤地宣告成功。",
  },
  {
    id: "repository",
    module: "orderRepository",
    responsibility: "把 OrderDraft 交給可控制的 persistence boundary。",
    inputContract: "OrderDraft",
    outputContract: "OrderResponse 或 dependency-unavailable",
    externalBoundary: true,
    failureConsequence: "dependency failure 不可被轉成假的 orderId 或 created status。",
  },
  {
    id: "response",
    module: "orderResponse",
    responsibility: "驗證 consumer 需要的 orderId、total 與 status。",
    inputContract: "OrderResponse",
    outputContract: "201 response 或 response-contract-error",
    externalBoundary: false,
    failureConsequence: "必要欄位缺失時要在 response boundary 停止，不可套用隱藏預設值。",
  },
] as const;

export const integrationCreateOrderInput: IntegrationCreateOrderInput = {
  items: [{ sku: "book", quantity: 2, unitPrice: 50 }],
  discount: 10,
};

export const integrationSuccessfulResponse: IntegrationOrderResponse = {
  orderId: "ord-001",
  total: 90,
  status: "created",
};

export const integrationScenarios: readonly IntegrationScenarioFixture[] = [
  {
    id: "create-order-success",
    title: "建立訂單 · 201",
    summary: "完整 checkout flow 產生固定 orderId 與 total。",
    input: integrationCreateOrderInput,
    repositoryResult: { kind: "success", response: integrationSuccessfulResponse },
    expected: {
      kind: "success",
      statusCode: 201,
      response: { orderId: "ord-001", total: 90, status: "created" },
      sideEffect: "order-created",
      failureBoundary: null,
    },
    trace: [
      { boundary: "client", input: "items[book × 2] + discount 10", output: "CreateOrderRequest", evidence: "all request fields preserved" },
      { boundary: "service", input: "CreateOrderRequest", output: "OrderDraft total 90", evidence: "subtotal 100 - discount 10" },
      { boundary: "repository", input: "OrderDraft", output: "ord-001 / created", evidence: "deterministic repository success" },
      { boundary: "response", input: "OrderResponse", output: "201 Created", evidence: "orderId, total and status present" },
    ],
  },
  {
    id: "response-contract-error",
    title: "response 契約錯誤 · 停在 response boundary",
    summary: "repository response 缺少 orderId，consumer 必須拒絕不完整資料。",
    input: integrationCreateOrderInput,
    repositoryResult: { kind: "success", response: { total: 90, status: "created" } },
    expected: {
      kind: "contract-error",
      statusCode: null,
      errorCode: "response-contract-error",
      sideEffect: "none",
      failureBoundary: "response",
    },
    trace: [
      { boundary: "client", input: "items[book × 2] + discount 10", output: "CreateOrderRequest", evidence: "request mapping passed" },
      { boundary: "service", input: "CreateOrderRequest", output: "OrderDraft total 90", evidence: "service completed without error" },
      { boundary: "repository", input: "OrderDraft", output: "total 90 / created", evidence: "producer omitted orderId" },
      { boundary: "response", input: "missing orderId", output: "contract-error", evidence: "consumer rejected incomplete response" },
    ],
  },
  {
    id: "repository-unavailable",
    title: "repository unavailable · 不建立訂單",
    summary: "repository 固定回傳 dependency failure，service 保留錯誤與零副作用。",
    input: integrationCreateOrderInput,
    repositoryResult: {
      kind: "dependency-unavailable",
      errorCode: "dependency-unavailable",
      message: "order repository fixture is unavailable",
    },
    expected: {
      kind: "dependency-unavailable",
      statusCode: null,
      errorCode: "dependency-unavailable",
      sideEffect: "none",
      failureBoundary: "repository",
    },
    trace: [
      { boundary: "client", input: "items[book × 2] + discount 10", output: "CreateOrderRequest", evidence: "request mapping passed" },
      { boundary: "service", input: "CreateOrderRequest", output: "OrderDraft total 90", evidence: "service prepared repository call" },
      { boundary: "repository", input: "OrderDraft", output: "dependency-unavailable", evidence: "fixed dependency error preserved" },
    ],
  },
] as const;

export const integrationRequiredScenarioIds: readonly IntegrationScenarioId[] = integrationScenarios.map((scenario) => scenario.id);

export function isIntegrationScenarioId(value: string): value is IntegrationScenarioId {
  return integrationRequiredScenarioIds.includes(value as IntegrationScenarioId);
}

export function findIntegrationScenario(scenarioId: string): IntegrationScenarioFixture {
  const scenario = integrationScenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) {
    throw new Error(`Unknown integration scenario fixture: ${scenarioId}`);
  }
  return scenario;
}

export const integrationResults: Readonly<Record<IntegrationStepId, IntegrationLessonResult>> = {
  "define-boundary": {
    id: "define-boundary",
    columns: ["module", "boundary", "external I/O", "test purpose"],
    rows: integrationBoundaryFixtures.map((boundary) => [boundary.module, boundary.id, boundary.externalBoundary ? "fixture" : "in-process", boundary.responsibility]),
    caption: "4 module boundaries · 1 controlled external edge",
  },
  "load-fixture": {
    id: "load-fixture",
    columns: ["field", "value", "reason"],
    rows: [
      ["items", "book × 2 @ 50", "subtotal 100"],
      ["discount", 10, "expected total 90"],
      ["orderId", "ord-001", "deterministic repository response"],
    ],
    caption: "1 order input · fixed outcome",
  },
  "trace-success": {
    id: "trace-success",
    columns: ["boundary", "output", "evidence"],
    rows: integrationScenarios[0].trace.map((observation) => [observation.boundary, observation.output, observation.evidence]),
    caption: "success trace · 4 boundaries passed",
  },
  "read-contract-error": {
    id: "read-contract-error",
    columns: ["boundary", "missing evidence", "result"],
    rows: [["response", "orderId", "response-contract-error"]],
    caption: "contract failure · no order created",
  },
  "propagate-dependency-failure": {
    id: "propagate-dependency-failure",
    columns: ["boundary", "error code", "side effect"],
    rows: [["repository", "dependency-unavailable", "none"]],
    caption: "dependency failure · error preserved",
  },
  "run-regression": {
    id: "run-regression",
    columns: ["scenario", "expected outcome", "side effect"],
    rows: [
      ["create-order-success", "201 · ord-001", "order-created"],
      ["response-contract-error", "response boundary error", "none"],
      ["repository-unavailable", "dependency error", "none"],
    ],
    caption: "regression fixture · 3 scenarios stable",
  },
};

export const integrationFailureFixtures: readonly IntegrationFailureFixture[] = [
  {
    scenarioId: "response-contract-error",
    boundary: "response",
    message: "response 缺少 orderId；先檢查 producer／consumer contract，不要補上預設值。",
    evidence: "total 90 與 status created 存在，但 orderId 不存在。",
  },
  {
    scenarioId: "repository-unavailable",
    boundary: "repository",
    message: "repository 回傳 dependency-unavailable；保留錯誤並確認沒有建立 order。",
    evidence: "沒有 orderId、沒有 created response，side effect 維持 none。",
  },
] as const;
