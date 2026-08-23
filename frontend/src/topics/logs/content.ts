import type { LessonDefinition } from "../types";

export type LogsStepId =
  | "responsibility"
  | "event-schema"
  | "severity"
  | "correlation"
  | "redaction"
  | "evidence"
  | "regression";

export type LogsScenarioId = "request-success" | "validation-rejected" | "dependency-timeout";
export type LogsLevel = "debug" | "info" | "warn" | "error";
export type LogsOutcome = "started" | "success" | "rejected" | "failed";
export type LogsSource = "api" | "validation" | "dependency";
export type LogsEventName =
  | "request.received"
  | "request.completed"
  | "request.validation_rejected"
  | "dependency.timeout";

export type LogsSensitiveField = "authorization" | "password" | "accessToken" | "cookie" | "email";
export type LogsContextValue = string | number | boolean;
export type LogsLessonValue = string | number | boolean;

export interface LogsEvent {
  sequence: number;
  timestamp: string;
  level: LogsLevel;
  event: LogsEventName;
  message: string;
  source: LogsSource;
  correlationId: string;
  context: Readonly<Record<string, LogsContextValue>>;
  outcome: LogsOutcome;
  redactedFields: readonly LogsSensitiveField[];
}

export interface LogsRequestFixture {
  method: "POST";
  route: "/orders";
  authorization: string;
  password: string;
  accessToken: string;
  cookie: string;
  email: string;
  payload: {
    sku: "book";
    quantity: 1;
    amount?: number;
  };
}

export interface LogsExpectedOutcome {
  terminalEvent: Exclude<LogsEventName, "request.received">;
  terminalSource: LogsSource;
  level: Exclude<LogsLevel, "debug">;
  statusCode: 201 | 400 | 503;
  outcome: Exclude<LogsOutcome, "started">;
  correlationId: string;
  redactedFields: readonly LogsSensitiveField[];
}

export interface LogsScenarioFixture {
  id: LogsScenarioId;
  title: string;
  summary: string;
  request: LogsRequestFixture;
  events: readonly LogsEvent[];
  expected: LogsExpectedOutcome;
}

export interface LogsLessonStep {
  id: LogsStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export interface LogsLessonResult {
  id: LogsStepId;
  columns: readonly string[];
  rows: readonly (readonly LogsLessonValue[])[];
  caption: string;
}

export type LogsFailureEvent =
  | "inspect-without-scenario"
  | "skip-event"
  | "correlation-mismatch"
  | "wrong-severity"
  | "raw-sensitive-value";

export interface LogsFailureFixture {
  event: LogsFailureEvent;
  message: string;
  evidence: string;
}

export const logsLesson: LessonDefinition = {
  title: "讓每一筆日誌留下可追蹤的線索",
  orientation: {
    what: "結構化日誌把執行中的事件、嚴重性與安全上下文留下來，讓人可以沿著同一個 request 找到發生了什麼。",
    why: "只有錯誤文字時，很難把正常事件、輸入問題與依賴逾時放進同一條時間線，也容易把秘密寫進輸出。",
    when: "需要理解 request timeline、failure evidence 或服務邊界發生什麼時，使用 logs；趨勢數值與跨服務路徑則交給 metrics 或 traces。",
    how: "先定義穩定 event schema，再選正確 level、保留 correlationId、限制 safe context，最後用 deterministic fixture 重跑。",
  },
  objectives: [
    "分辨 logs、metrics 與 traces 的責任邊界，不把一種訊號當成全部觀測工具。",
    "讀懂包含 level、event、source、correlationId 與 outcome 的結構化 log event。",
    "把正常完成、輸入被拒絕與依賴逾時分別記成 info、warn 與 error。",
    "用固定 correlationId 把同一個 request 的 events 串成可重現的時間線。",
    "在格式化前使用 safe context allowlist，移除 authorization、password、accessToken、cookie 與 email。",
    "從固定 log 證據判斷 terminal outcome，並在 reset 後重跑相同 regression flow。",
  ],
  sections: [
    {
      id: "responsibility",
      title: "先分清楚觀測訊號的責任",
      body: "Logs 記錄事件與上下文，metrics 聚合數值，traces 串起跨邊界的執行路徑；本課只用 log events 留下可讀、可搜尋的證據。",
    },
    {
      id: "event-schema",
      title: "讓 event 同時能搜尋與閱讀",
      body: "一筆 event 要有穩定的 level、event、source、correlationId 與 outcome，也要有能說明事實的 message；不能把重要資訊全藏在字串裡。",
    },
    {
      id: "severity",
      title: "依事件嚴重性選擇 level",
      body: "正常完成是 info，可預期的 validation rejection 是 warn，依賴逾時導致請求失敗才是 error；不要把所有非成功都升級成 error。",
    },
    {
      id: "correlation",
      title: "用 correlationId 串起 request timeline",
      body: "同一個 request 的 received 與 terminal events 必須共享固定 correlationId；這比依賴 message 文字或陣列位置更可靠。",
    },
    {
      id: "redaction",
      title: "在輸出前移除敏感欄位",
      body: "authorization、email、password、token 與 cookie 不得進入 message 或 context；先用 safe allowlist 建立 event，再交給畫面顯示。",
    },
    {
      id: "evidence",
      title: "從事件證據讀出 terminal outcome",
      body: "201 success、400 validation rejection 與 503 dependency timeout 各自留下不同的 source、level 與 context；log 描述發生什麼，不單獨宣稱根因。",
    },
    {
      id: "regression",
      title: "reset 後重跑相同 regression",
      body: "三個 scenarios 都要能在固定時間、固定 correlationId 與固定 redaction 結果下重跑，確保修正 mapping 後證據沒有漂移。",
    },
  ],
};

export const logsLessonSteps: readonly LogsLessonStep[] = [
  {
    id: "responsibility",
    title: "選定觀測訊號",
    code: "logs = events · metrics = aggregates · traces = request path",
    explanation: "Logs Lab 只驗證事件與上下文；它不把單筆 log 當成 metrics，也不假裝建立完整 distributed trace。",
    takeaway: "先知道訊號的責任，才不會用錯誤工具回答問題。",
  },
  {
    id: "event-schema",
    title: "建立結構化 event",
    code: 'const event = { level: "info", event: "request.completed", correlationId };',
    explanation: "固定欄位讓程式可以搜尋與驗證，message 則補充人類需要閱讀的事實；兩者不能互相取代。",
    takeaway: "穩定欄位保留機器可讀的契約，message 保留人的判斷線索。",
  },
  {
    id: "severity",
    title: "為事件選對 level",
    code: "success → info · validation rejection → warn · dependency timeout → error",
    explanation: "level 表達事件的嚴重性與處理方向；可預期輸入問題不應被記成系統 error，依賴逾時也不能偽裝成正常完成。",
    takeaway: "不要用顏色猜嚴重性，讓 level 與可觀察 outcome 對得上。",
  },
  {
    id: "correlation",
    title: "固定 request correlation",
    code: 'correlationId: "req-logs-001"',
    explanation: "同一 scenario 的每一筆 event 都使用同一個 correlationId；不同 scenario 使用不同固定值，reset 後仍維持相同 mapping。",
    takeaway: "先把事件連回同一個 request，再開始解讀時間線。",
  },
  {
    id: "redaction",
    title: "套用 safe context allowlist",
    code: "context = pick(input, [route, statusCode, dependency, timeoutMs])",
      explanation: "只把 route、statusCode、field、dependency 與 timeout 等安全欄位放入 context；所有宣告的敏感欄位在格式化前被移除並列入 redactedFields。",
    takeaway: "Redaction 是輸出邊界的責任，不是畫面遮罩的責任。",
  },
  {
    id: "evidence",
    title: "讀 terminal evidence",
    code: "statusCode + source + level + outcome → terminal evidence",
    explanation: "success 固定為 api／info／201，validation rejection 固定為 validation／warn／400，dependency timeout 固定為 dependency／error／503。",
    takeaway: "事件能證明發生了什麼；不要把觀測證據過早寫成根因。",
  },
  {
    id: "regression",
    title: "重跑固定 regression",
    code: "reset → request-success + validation-rejected + dependency-timeout",
    explanation: "三個 scenarios 依序重跑，確認 event sequence、correlationId、level、redaction 與 terminal outcome 都與第一次一致。",
    takeaway: "可重現的證據，才是可以被驗證的可觀測性契約。",
  },
] as const;

export const logsSensitiveFieldNames: readonly LogsSensitiveField[] = ["authorization", "password", "accessToken", "cookie", "email"] as const;

export const logsSafeContextKeys = [
  "route",
  "method",
  "statusCode",
  "field",
  "dependency",
  "timeoutMs",
  "durationMs",
  "reason",
] as const;

export const logsBaseRequest: LogsRequestFixture = {
  method: "POST",
  route: "/orders",
  authorization: "Bearer test-secret-001",
  password: "workshop-password-001",
  accessToken: "access-token-001",
  cookie: "session=workshop-session-001",
  email: "learner@example.test",
  payload: { sku: "book", quantity: 1, amount: 90 },
};

export const logsRequestFixtures: Readonly<Record<LogsScenarioId, LogsRequestFixture>> = {
  "request-success": logsBaseRequest,
  "validation-rejected": {
    ...logsBaseRequest,
    payload: { sku: "book", quantity: 1 },
  },
  "dependency-timeout": logsBaseRequest,
};

export const logsFixtureRedactedFields: readonly LogsSensitiveField[] = [...logsSensitiveFieldNames];

function requestReceivedEvent(correlationId: string, timestamp: string): LogsEvent {
  return {
    sequence: 1,
    timestamp,
    level: "debug",
    event: "request.received",
    message: "收到固定 POST /orders request；開始建立 request timeline。",
    source: "api",
    correlationId,
    context: { method: "POST", route: "/orders" },
    outcome: "started",
    redactedFields: logsFixtureRedactedFields,
  };
}

export const logsScenarios: readonly LogsScenarioFixture[] = [
  {
    id: "request-success",
    title: "request completed · 201",
    summary: "固定 request 正常完成，terminal event 為 info／success。",
    request: logsRequestFixtures["request-success"],
    events: [
      requestReceivedEvent("req-logs-001", "2026-08-22T09:00:00.000Z"),
      {
        sequence: 2,
        timestamp: "2026-08-22T09:00:00.042Z",
        level: "info",
        event: "request.completed",
        message: "request completed with status 201；正常流程已完成。",
        source: "api",
        correlationId: "req-logs-001",
        context: { statusCode: 201, durationMs: 42 },
        outcome: "success",
        redactedFields: logsFixtureRedactedFields,
      },
    ],
    expected: {
      terminalEvent: "request.completed",
      terminalSource: "api",
      level: "info",
      statusCode: 201,
      outcome: "success",
      correlationId: "req-logs-001",
      redactedFields: logsFixtureRedactedFields,
    },
  },
  {
    id: "validation-rejected",
    title: "validation rejected · 400",
    summary: "缺少 amount 時被 validation boundary 拒絕，terminal event 為 warn／rejected。",
    request: logsRequestFixtures["validation-rejected"],
    events: [
      requestReceivedEvent("req-logs-002", "2026-08-22T09:00:01.000Z"),
      {
        sequence: 2,
        timestamp: "2026-08-22T09:00:01.005Z",
        level: "warn",
        event: "request.validation_rejected",
        message: "request validation rejected；必要欄位 amount 缺失。",
        source: "validation",
        correlationId: "req-logs-002",
        context: { statusCode: 400, field: "amount" },
        outcome: "rejected",
        redactedFields: logsFixtureRedactedFields,
      },
    ],
    expected: {
      terminalEvent: "request.validation_rejected",
      terminalSource: "validation",
      level: "warn",
      statusCode: 400,
      outcome: "rejected",
      correlationId: "req-logs-002",
      redactedFields: logsFixtureRedactedFields,
    },
  },
  {
    id: "dependency-timeout",
    title: "dependency timeout · 503",
    summary: "payment-provider 固定逾時 3000ms，terminal event 為 error／failed。",
    request: logsRequestFixtures["dependency-timeout"],
    events: [
      requestReceivedEvent("req-logs-003", "2026-08-22T09:00:02.000Z"),
      {
        sequence: 2,
        timestamp: "2026-08-22T09:00:05.000Z",
        level: "error",
        event: "dependency.timeout",
        message: "payment-provider timeout；request failed without a success side effect。",
        source: "dependency",
        correlationId: "req-logs-003",
        context: { dependency: "payment-provider", timeoutMs: 3000, statusCode: 503 },
        outcome: "failed",
        redactedFields: logsFixtureRedactedFields,
      },
    ],
    expected: {
      terminalEvent: "dependency.timeout",
      terminalSource: "dependency",
      level: "error",
      statusCode: 503,
      outcome: "failed",
      correlationId: "req-logs-003",
      redactedFields: logsFixtureRedactedFields,
    },
  },
] as const;

export const logsRequiredScenarioIds: readonly LogsScenarioId[] = logsScenarios.map((scenario) => scenario.id);

export function isLogsScenarioId(value: string): value is LogsScenarioId {
  return logsRequiredScenarioIds.includes(value as LogsScenarioId);
}

export function findLogsScenario(scenarioId: string): LogsScenarioFixture {
  const scenario = logsScenarios.find((candidate) => candidate.id === scenarioId);
  if (!scenario) {
    throw new Error(`Unknown logs scenario fixture: ${scenarioId}`);
  }
  return scenario;
}

export const logsResults: Readonly<Record<LogsStepId, LogsLessonResult>> = {
  responsibility: {
    id: "responsibility",
    columns: ["signal", "records", "not responsible for"],
    rows: [
      ["logs", "events + safe context", "aggregated trend"],
      ["metrics", "aggregated numbers", "single request timeline"],
      ["traces", "cross-boundary path", "redacted event payload"],
    ],
    caption: "3 observability signals · 1 Logs Lab scope",
  },
  "event-schema": {
    id: "event-schema",
    columns: ["field", "purpose", "fixture rule"],
    rows: [
      ["level", "severity", "debug · info · warn · error"],
      ["event", "machine-readable name", "stable event naming"],
      ["correlationId", "request association", "fixed per scenario"],
      ["outcome", "terminal meaning", "started → success/rejected/failed"],
    ],
    caption: "structured event · stable fields",
  },
  severity: {
    id: "severity",
    columns: ["scenario", "level", "reason"],
    rows: [
      ["request-success", "info", "normal completion"],
      ["validation-rejected", "warn", "expected input problem"],
      ["dependency-timeout", "error", "request failed at dependency boundary"],
    ],
    caption: "3 scenarios · 3 severity decisions",
  },
  correlation: {
    id: "correlation",
    columns: ["scenario", "correlationId", "events"],
    rows: logsScenarios.map((scenario) => [scenario.id, scenario.expected.correlationId, scenario.events.length]),
    caption: "request timeline · same id per scenario",
  },
  redaction: {
    id: "redaction",
    columns: ["input field", "event output", "evidence"],
    rows: [
      ["authorization", "absent", "redactedFields includes authorization"],
      ["password", "absent", "redactedFields includes password"],
      ["accessToken", "absent", "redactedFields includes accessToken"],
      ["cookie", "absent", "redactedFields includes cookie"],
      ["email", "absent", "redactedFields includes email"],
      ["route", "safe context", "allowlisted for diagnosis"],
    ],
    caption: "safe context · raw sensitive values never emitted",
  },
  evidence: {
    id: "evidence",
    columns: ["scenario", "terminal event", "status / outcome"],
    rows: logsScenarios.map((scenario) => [
      scenario.id,
      scenario.expected.terminalEvent,
      `${scenario.expected.statusCode} · ${scenario.expected.outcome}`,
    ]),
    caption: "terminal evidence · event + status + outcome",
  },
  regression: {
    id: "regression",
    columns: ["scenario", "level", "correlationId", "redaction"],
    rows: logsScenarios.map((scenario) => [
      scenario.id,
      scenario.expected.level,
      scenario.expected.correlationId,
      "passed",
    ]),
    caption: "regression fixture · 3 scenarios stable",
  },
};

export const logsFailureFixtures: readonly LogsFailureFixture[] = [
  {
    event: "inspect-without-scenario",
    message: "尚未選擇 scenario；請先載入固定 Logs fixture，再開始 inspect。",
    evidence: "selectedScenarioId 仍然是 null，沒有可供檢查的 event sequence。",
  },
  {
    event: "skip-event",
    message: "請先檢查目前 sequence，再進入 terminal outcome；不要跳過 request.received。",
    evidence: "目前 event index 尚未完成，terminal event 不能被直接宣告有效。",
  },
  {
    event: "correlation-mismatch",
    message: "同一 scenario 的 correlationId 不一致；請回到 request timeline 檢查關聯。",
    evidence: "received 與 terminal events 必須共享同一個固定 correlationId。",
  },
  {
    event: "wrong-severity",
    message: "level 與 scenario outcome 不符；請依 fixture evidence 選擇 info、warn 或 error。",
    evidence: "validation-rejected 是 warn，dependency-timeout 是 error，request-success 是 info。",
  },
  {
    event: "raw-sensitive-value",
    message: "輸出包含敏感欄位；先套用 safe context allowlist，再重新格式化 event。",
    evidence: "authorization、password、accessToken、cookie 與 email 的 raw value 不得出現在 message、context 或 serialized output。",
  },
] as const;
