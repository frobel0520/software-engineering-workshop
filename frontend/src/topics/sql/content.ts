import type { LessonDefinition } from "../types";

export type SqlStepId = "inspect-schema" | "select-columns" | "filter-paid" | "group-customers" | "order-total";

export interface SqlLessonStep {
  id: SqlStepId;
  title: string;
  query: string;
  explanation: string;
  takeaway: string;
}

export type SqlValue = string | number;

export interface SqlQueryResult {
  id: SqlStepId;
  columns: readonly string[];
  rows: readonly (readonly SqlValue[])[];
  caption: string;
}

export interface SqlTableColumn {
  name: string;
  type: string;
  role: string;
}

export interface SqlOrder {
  id: number;
  customer: string;
  status: "paid" | "pending" | "refunded";
  amount: number;
}

export type SqlLabPhase = "initial" | "active" | "blocked" | "completed";
export type SqlLabEventType = SqlStepId | "reset";

export interface SqlLabEvent {
  type: SqlLabEventType;
}

export interface SqlLabState {
  phase: SqlLabPhase;
  selectedStepId: SqlStepId;
  completedStepIds: readonly SqlStepId[];
  result: SqlQueryResult | null;
  lastQuery: string | null;
  lastMessage: string;
  canReset: true;
}

export const sqlLesson: LessonDefinition = {
  title: "讓資料庫回答一個精準問題",
  orientation: {
    what: "SQL 是描述資料問題的查詢語言；你用 SELECT、WHERE、GROUP BY 與 ORDER BY 表達想看哪些資料。",
    why: "把查詢寫成可重複的契約，能讓同一個問題在不同資料量與不同工具中得到可檢查的結果。",
    when: "需要讀取資料、篩選條件、統計群組、排序報表，或追查 API 背後到底查了什麼時使用。",
    how: "先確認資料表與欄位，再選欄位、過濾 rows、聚合群組，最後排序結果；每一步都用固定 fixture 驗證。",
  },
  objectives: [
    "看懂 SELECT 如何決定結果欄位與資料列。",
    "用 WHERE 在聚合前排除不符合條件的資料。",
    "用 GROUP BY 與 SUM 把多筆 orders 變成每位 customer 的統計。",
    "理解 ORDER BY 為什麼應該放在查詢流程的最後，並用結果驗證查詢。",
  ],
  sections: [
    {
      id: "inspect-shape",
      title: "先確認資料的形狀",
      body: "查詢前先知道 orders 有哪些欄位、每個欄位代表什麼，以及 status 的值域。SQL 不會替你猜欄位語意；schema 是查詢的起點。",
    },
    {
      id: "select-columns",
      title: "SELECT 決定你要看什麼",
      body: "SELECT 不是把整張資料表搬到畫面，而是宣告結果需要哪些欄位。只取需要的欄位，結果更容易閱讀，也讓資料邊界更清楚。",
    },
    {
      id: "filter-before-group",
      title: "WHERE 先縮小資料集合",
      body: "WHERE 會在 GROUP BY 前篩掉不符合條件的 rows。本課只統計 paid orders，因此 pending 與 refunded 不應混入 customer total。",
    },
    {
      id: "aggregate-and-order",
      title: "GROUP BY 統計，ORDER BY 呈現",
      body: "GROUP BY 把相同 customer 的 rows 放在同一組，SUM 算出每組金額；ORDER BY 再把已算好的 total_spend 由高到低排列。",
    },
  ],
};

export const sqlLessonSteps: readonly SqlLessonStep[] = [
  {
    id: "inspect-schema",
    title: "確認 orders schema",
    query: "PRAGMA table_info(orders);",
    explanation: "先讀 SQLite fixture 的欄位與型別，確認後面的 customer、status、amount 都真的存在。",
    takeaway: "查詢的第一個契約是資料形狀，不是憑印象猜欄位。",
  },
  {
    id: "select-columns",
    title: "選出需要的欄位",
    query: "SELECT id, customer, status, amount FROM orders;",
    explanation: "SELECT 明確列出輸出欄位；FROM 指定資料來源，結果會保留 orders 的每一筆 row。",
    takeaway: "先把問題寫成結果欄位，再決定要不要篩選。",
  },
  {
    id: "filter-paid",
    title: "只保留 paid orders",
    query: "SELECT id, customer, amount FROM orders WHERE status = 'paid';",
    explanation: "WHERE 逐筆判斷 status，只有 paid rows 會進入下一階段；其他狀態不會被 SUM 到。",
    takeaway: "過濾條件放在聚合前，統計才符合問題。",
  },
  {
    id: "group-customers",
    title: "按 customer 加總",
    query: "SELECT customer, SUM(amount) AS total_spend FROM orders WHERE status = 'paid' GROUP BY customer;",
    explanation: "GROUP BY 把相同 customer 的 paid rows 分組，SUM(amount) 對每組產生一個 total_spend。",
    takeaway: "GROUP BY 改變結果粒度：從一筆 order 變成一位 customer。",
  },
  {
    id: "order-total",
    title: "把最高消費放前面",
    query: "SELECT customer, SUM(amount) AS total_spend FROM orders WHERE status = 'paid' GROUP BY customer ORDER BY total_spend DESC;",
    explanation: "ORDER BY 使用聚合後的 total_spend 排序；DESC 讓最高總額出現在第一列。",
    takeaway: "先得到正確的統計，再排序結果，報表才回答真正的問題。",
  },
] as const;

export const sqlTableColumns: readonly SqlTableColumn[] = [
  { name: "id", type: "INTEGER", role: "primary key" },
  { name: "customer", type: "TEXT", role: "group key" },
  { name: "status", type: "TEXT", role: "filter condition" },
  { name: "amount", type: "INTEGER", role: "sum input" },
] as const;

export const sqlOrders: readonly SqlOrder[] = [
  { id: 101, customer: "Lin", status: "paid", amount: 1250 },
  { id: 102, customer: "Ada", status: "paid", amount: 1200 },
  { id: 103, customer: "Mina", status: "paid", amount: 650 },
  { id: 104, customer: "Ada", status: "paid", amount: 800 },
  { id: 105, customer: "Lin", status: "pending", amount: 450 },
  { id: 106, customer: "Mina", status: "refunded", amount: 900 },
] as const;

export const sqlQueryResults: Readonly<Record<SqlStepId, SqlQueryResult>> = {
  "inspect-schema": {
    id: "inspect-schema",
    columns: ["column", "type", "role"],
    rows: sqlTableColumns.map((column) => [column.name, column.type, column.role]),
    caption: "orders schema · 4 columns",
  },
  "select-columns": {
    id: "select-columns",
    columns: ["id", "customer", "status", "amount"],
    rows: sqlOrders.map((order) => [order.id, order.customer, order.status, order.amount]),
    caption: "orders · 6 rows",
  },
  "filter-paid": {
    id: "filter-paid",
    columns: ["id", "customer", "amount"],
    rows: sqlOrders.filter((order) => order.status === "paid").map((order) => [order.id, order.customer, order.amount]),
    caption: "paid orders · 4 rows",
  },
  "group-customers": {
    id: "group-customers",
    columns: ["customer", "total_spend"],
    rows: [["Lin", 1250], ["Ada", 2000], ["Mina", 650]],
    caption: "paid totals · 3 groups · unsorted",
  },
  "order-total": {
    id: "order-total",
    columns: ["customer", "total_spend"],
    rows: [["Ada", 2000], ["Lin", 1250], ["Mina", 650]],
    caption: "paid totals · ORDER BY total_spend DESC",
  },
};

export const sqlLabInitialState: SqlLabState = {
  phase: "initial",
  selectedStepId: "inspect-schema",
  completedStepIds: [],
  result: null,
  lastQuery: null,
  lastMessage: "先確認 orders schema，再逐步縮小與聚合資料。",
  canReset: true,
};

export const sqlLabHappyPath: readonly SqlLabEvent[] = sqlLessonSteps.map((step) => ({ type: step.id }));

export interface SqlFailureFixture {
  event: SqlStepId;
  message: string;
}

export const sqlFailureFixtures: readonly SqlFailureFixture[] = [
  { event: "select-columns", message: "請先確認 orders schema，再執行 SELECT。" },
  { event: "filter-paid", message: "請先選出 orders 欄位，確認資料列已進入查詢流程。" },
  { event: "order-total", message: "請先 GROUP BY customer 產生 total_spend，再排序聚合結果。" },
] as const;
