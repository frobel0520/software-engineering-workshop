import type { LessonDefinition } from "../types";

export type PostgreSqlStepId =
  | "inspect-session"
  | "define-contract"
  | "insert-returning"
  | "read-jsonb"
  | "explain-query"
  | "commit-transaction";

export interface PostgreSqlLessonStep {
  id: PostgreSqlStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export type PostgreSqlValue = string | number;

export interface PostgreSqlSession {
  database: string;
  user: string;
  serverVersion: string;
}

export interface PostgreSqlEventRecord {
  id: number;
  occurredAt: string;
  kind: "signup" | "purchase" | "support";
  source: "web" | "mobile";
}

export interface PostgreSqlQueryPlan {
  operation: "seq-scan" | "bitmap-index-scan";
  detail: string;
  rowsExamined: number;
}

export interface PostgreSqlLabResult {
  id: PostgreSqlStepId;
  columns: readonly string[];
  rows: readonly (readonly PostgreSqlValue[])[];
  caption: string;
}

export type PostgreSqlLabPhase = "initial" | "active" | "blocked" | "completed";
export type PostgreSqlTransactionStatus = "idle" | "committed";
export type PostgreSqlLabEventType = PostgreSqlStepId | "reset";

export interface PostgreSqlLabEvent {
  type: PostgreSqlLabEventType;
}

export interface PostgreSqlLabState {
  phase: PostgreSqlLabPhase;
  selectedStepId: PostgreSqlStepId;
  completedStepIds: readonly PostgreSqlStepId[];
  session: PostgreSqlSession | null;
  schemaReady: boolean;
  returnedId: number | null;
  jsonbMatchCount: number;
  plan: PostgreSqlQueryPlan | null;
  transactionStatus: PostgreSqlTransactionStatus;
  result: PostgreSqlLabResult | null;
  lastCode: string | null;
  lastMessage: string;
  canReset: true;
}

export const postgresqlLesson: LessonDefinition = {
  title: "從 psql 連線到可驗證的寫入",
  orientation: {
    what: "PostgreSQL 是具備強型別、constraint、JSONB 與完整交易支援的關聯式資料庫。",
    why: "理解 PostgreSQL 的資料型別與回傳行為，能讓應用程式在資料庫邊界保持清楚、可驗證且不靠猜測。",
    when: "需要可靠的關聯式資料、半結構化 JSON、可追蹤的寫入結果或明確的交易邊界時使用。",
    how: "先用 psql 確認 session 與 schema，再執行帶 RETURNING 的寫入、JSONB 條件查詢與 EXPLAIN，最後提交交易。",
  },
  objectives: [
    "用 psql 指令確認目前 database、user 與可用資料表。",
    "選擇 timestamptz、jsonb、identity 與 constraint 表達資料契約。",
    "用 INSERT ... RETURNING 取得資料庫剛建立的 row。",
    "讀懂 JSONB 條件與 PostgreSQL EXPLAIN，再用 transaction 提交完整寫入。",
  ],
  sections: [
    {
      id: "connect-and-inspect",
      title: "先確認 psql session",
      body: "同一段 SQL 在不同 database、user 或 server version 下可能有不同結果。先用 psql 看清楚 session，再開始操作資料。",
    },
    {
      id: "model-with-types",
      title: "把資料契約寫進 PostgreSQL",
      body: "timestamptz 保存時間語意，jsonb 保存可查詢的半結構化內容，identity 與 constraint 則把必要規則交給資料庫。",
    },
    {
      id: "return-and-query",
      title: "寫入後立即取得可用結果",
      body: "INSERT ... RETURNING 讓應用程式直接拿到新 row 的 id；JSONB operators 則能在不拆表的情況下查詢 payload 內容。",
    },
    {
      id: "explain-and-commit",
      title: "用 EXPLAIN 和交易驗證行為",
      body: "EXPLAIN 顯示 PostgreSQL 選擇的 plan，transaction 則把多個寫入包成可提交的單位；兩者都要以可觀察結果驗證。",
    },
  ],
};

export const postgresqlLessonSteps: readonly PostgreSqlLessonStep[] = [
  {
    id: "inspect-session",
    title: "確認 psql session",
    code: "\\conninfo\n\\dt events",
    explanation: "先確認連到哪個 database、使用哪個 user，以及 events table 是否存在。",
    takeaway: "資料庫操作的第一個邊界是 session，不是 SQL 關鍵字。",
  },
  {
    id: "define-contract",
    title: "建立 PostgreSQL data contract",
    code: "CREATE TABLE events (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, occurred_at timestamptz NOT NULL, payload jsonb NOT NULL);",
    explanation: "identity、timestamptz、jsonb 與 NOT NULL 把資料契約固定在 PostgreSQL schema。",
    takeaway: "把可驗證的規則放在資料庫邊界，應用程式才不用獨自防守。",
  },
  {
    id: "insert-returning",
    title: "INSERT 後 RETURNING",
    code: "INSERT INTO events (occurred_at, payload) VALUES ('2026-08-22T09:20:00Z'::timestamptz, '{\"kind\":\"signup\"}'::jsonb) RETURNING id, occurred_at, payload;",
    explanation: "寫入成功後直接回傳新 row 的 id、時間與 payload，避免再用不可靠的時間或排序猜測剛建立的資料。",
    takeaway: "RETURNING 是 PostgreSQL 寫入與應用程式資料流之間的清楚契約。",
  },
  {
    id: "read-jsonb",
    title: "查詢 JSONB payload",
    code: "SELECT payload->>'kind' FROM events WHERE payload @> '{\"kind\":\"signup\"}';",
    explanation: "->> 取出文字值，@> 判斷 JSONB 是否包含指定結構；查詢的是資料形狀，不是原始字串。",
    takeaway: "JSONB 仍然需要明確的查詢語意與可驗證的 fixture。",
  },
  {
    id: "explain-query",
    title: "讀懂 PostgreSQL EXPLAIN",
    code: "EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM events WHERE payload @> '{\"kind\":\"signup\"}';",
    explanation: "EXPLAIN 顯示 PostgreSQL 實際採用的 plan 與 buffer 線索，讓效能討論不只停在猜測。",
    takeaway: "先看 plan 和 rows，再決定是否需要調整索引或查詢。",
  },
  {
    id: "commit-transaction",
    title: "提交完整 transaction",
    code: "BEGIN; INSERT INTO events (occurred_at, payload) VALUES ('2026-08-22T09:25:00Z'::timestamptz, '{\"kind\":\"purchase\"}'::jsonb); UPDATE events SET payload = jsonb_set(payload, '{processed}', 'true'::jsonb) WHERE id = 104; COMMIT;",
    explanation: "events 的新增與更新都成功後才 COMMIT；任何一步失敗都不應留下半套結果。",
    takeaway: "transaction boundary 是資料一致性的最後一道明確防線。",
  },
] as const;

export const postgresqlSession: PostgreSqlSession = {
  database: "workshop",
  user: "student",
  serverVersion: "PostgreSQL 16.4",
};

export const postgresqlEvents: readonly PostgreSqlEventRecord[] = [
  { id: 101, occurredAt: "2026-08-22T08:30:00Z", kind: "signup", source: "web" },
  { id: 102, occurredAt: "2026-08-22T08:42:00Z", kind: "purchase", source: "mobile" },
  { id: 103, occurredAt: "2026-08-22T09:05:00Z", kind: "signup", source: "mobile" },
] as const;

export const postgresqlPlans: Readonly<Record<"before-index" | "after-index", PostgreSqlQueryPlan>> = {
  "before-index": {
    operation: "seq-scan",
    detail: "Seq Scan on events · Filter: (payload @> '{\"kind\": \"signup\"}')",
    rowsExamined: postgresqlEvents.length,
  },
  "after-index": {
    operation: "bitmap-index-scan",
    detail: "Bitmap Index Scan using idx_events_payload_gin · Recheck Cond: payload @> ...",
    rowsExamined: 2,
  },
};

export const postgresqlResults: Readonly<Record<PostgreSqlStepId, PostgreSqlLabResult>> = {
  "inspect-session": {
    id: "inspect-session",
    columns: ["database", "user", "server_version"],
    rows: [[postgresqlSession.database, postgresqlSession.user, postgresqlSession.serverVersion]],
    caption: "psql session · connected",
  },
  "define-contract": {
    id: "define-contract",
    columns: ["column", "type", "constraint"],
    rows: [
      ["id", "bigint identity", "PRIMARY KEY"],
      ["occurred_at", "timestamptz", "NOT NULL"],
      ["payload", "jsonb", "NOT NULL"],
    ],
    caption: "events schema · contract ready",
  },
  "insert-returning": {
    id: "insert-returning",
    columns: ["id", "occurred_at", "payload"],
    rows: [[104, "2026-08-22T09:20:00Z", "{\"kind\":\"signup\"}"]],
    caption: "INSERT ... RETURNING · 1 row",
  },
  "read-jsonb": {
    id: "read-jsonb",
    columns: ["kind", "source"],
    rows: [["signup", "web"], ["signup", "mobile"]],
    caption: "JSONB containment · 2 matches",
  },
  "explain-query": {
    id: "explain-query",
    columns: ["node", "detail", "rows"],
    rows: [["Bitmap Index Scan", postgresqlPlans["after-index"].detail, postgresqlPlans["after-index"].rowsExamined]],
    caption: "EXPLAIN · bitmap index scan",
  },
  "commit-transaction": {
    id: "commit-transaction",
    columns: ["statement", "status", "visible"],
    rows: [["BEGIN", "opened", "pending"], ["COMMIT", "committed", "yes"]],
    caption: "transaction · committed",
  },
};

export const postgresqlLabInitialState: PostgreSqlLabState = {
  phase: "initial",
  selectedStepId: "inspect-session",
  completedStepIds: [],
  session: null,
  schemaReady: false,
  returnedId: null,
  jsonbMatchCount: 0,
  plan: null,
  transactionStatus: "idle",
  result: null,
  lastCode: null,
  lastMessage: "先確認 psql session，再逐步驗證 PostgreSQL 的資料契約與寫入行為。",
  canReset: true,
};

export const postgresqlLabHappyPath: readonly PostgreSqlLabEvent[] = postgresqlLessonSteps.map((step) => ({ type: step.id }));

export interface PostgreSqlFailureFixture {
  event: PostgreSqlStepId;
  message: string;
}

export const postgresqlFailureFixtures: readonly PostgreSqlFailureFixture[] = [
  { event: "define-contract", message: "請先確認 psql session，再建立資料契約。" },
  { event: "insert-returning", message: "請先建立 events schema，RETURNING 才有明確的資料邊界。" },
  { event: "commit-transaction", message: "請先讀完 EXPLAIN plan，再提交完整 transaction。" },
] as const;
