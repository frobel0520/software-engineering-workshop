import type { LessonDefinition } from "../types";

export type IndexStepId =
  | "inspect-plan"
  | "create-index"
  | "verify-plan"
  | "rollback-batch"
  | "commit-batch";

export interface IndexLessonStep {
  id: IndexStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export type IndexValue = string | number;

export interface IndexQueryPlan {
  id: "before-index" | "after-index";
  operation: "table-scan" | "index-search";
  detail: string;
  rowsExamined: number;
}

export interface IndexOrder {
  id: number;
  customerId: number;
  status: "paid" | "pending";
  amount: number;
}

export interface IndexAccount {
  name: string;
  balance: number;
}

export interface IndexLabResult {
  id: IndexStepId;
  columns: readonly string[];
  rows: readonly (readonly IndexValue[])[];
  caption: string;
}

export type IndexLabPhase = "initial" | "active" | "blocked" | "completed";
export type IndexTransactionStatus = "idle" | "rolled-back" | "committed";
export type IndexLabEventType = IndexStepId | "reset";

export interface IndexLabEvent {
  type: IndexLabEventType;
}

export interface IndexLabState {
  phase: IndexLabPhase;
  selectedStepId: IndexStepId;
  completedStepIds: readonly IndexStepId[];
  indexCreated: boolean;
  plan: IndexQueryPlan | null;
  transactionStatus: IndexTransactionStatus;
  result: IndexLabResult | null;
  lastCode: string | null;
  lastMessage: string;
  canReset: true;
}

export const indexLesson: LessonDefinition = {
  title: "讓查詢走更短的路，也讓寫入保持一致",
  orientation: {
    what: "索引是資料表之外的查找結構；交易則把多個寫入步驟包成一個可提交或撤回的單位。",
    why: "索引可以減少查詢需要檢查的資料列，交易則避免只完成一半的更新，讓效能與一致性都有可驗證的依據。",
    when: "欄位經常出現在 WHERE 或 JOIN 條件，或一次操作需要同時更新多筆相互依賴的資料時使用。",
    how: "先看查詢計畫，再建立符合查詢形狀的索引；寫入則先 BEGIN，驗證整批結果後選擇 COMMIT 或 ROLLBACK。",
  },
  objectives: [
    "分辨 table scan 與 index search 需要檢查的資料量差異。",
    "為常用的 customer_id 查詢建立精準索引，並驗證查詢計畫已改變。",
    "用 BEGIN、UPDATE 與 ROLLBACK 保護一筆不完整的轉帳。",
    "用 COMMIT 提交一筆完整轉帳，理解交易的 all-or-nothing 行為。",
  ],
  sections: [
    {
      id: "read-path",
      title: "先看查詢走哪條路",
      body: "同一個 WHERE 條件可能讓資料庫逐列掃描整張表，也可能透過索引直接找到候選 rows。先看計畫，才知道優化是否真的發生。",
    },
    {
      id: "target-index",
      title: "索引要對準查詢形狀",
      body: "索引不是越多越好；本課只為 customer_id 建立索引，讓最常用的客戶訂單查詢有一條明確的 lookup path。",
    },
    {
      id: "atomic-write",
      title: "交易把多步寫入綁在一起",
      body: "轉帳同時改變兩個帳戶。BEGIN 後先暫存變更，發現條件不完整就 ROLLBACK，確定兩邊都正確才 COMMIT。",
    },
    {
      id: "consistency-check",
      title: "提交前驗證，提交後可追蹤",
      body: "完成條件不是按下按鈕，而是能說明查詢少掃了哪些 rows，以及交易最後為什麼被撤回或提交。",
    },
  ],
};

export const indexLessonSteps: readonly IndexLessonStep[] = [
  {
    id: "inspect-plan",
    title: "看見 table scan",
    code: "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;",
    explanation: "沒有索引時，orders 會逐列檢查，先記下目前的查詢成本。",
    takeaway: "優化前先量測，否則無法證明索引帶來了什麼改變。",
  },
  {
    id: "create-index",
    title: "建立 customer_id 索引",
    code: "CREATE INDEX idx_orders_customer_id ON orders(customer_id);",
    explanation: "索引欄位要對準查詢條件；這個索引讓 customer_id 的 lookup 有獨立結構可走。",
    takeaway: "索引服務的是查詢形狀，不是資料表的裝飾品。",
  },
  {
    id: "verify-plan",
    title: "確認改走 index search",
    code: "EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42;",
    explanation: "再次查看相同查詢，確認計畫從 table scan 變成使用 idx_orders_customer_id。",
    takeaway: "建立索引後一定要重看計畫，索引存在不代表查詢一定會採用。",
  },
  {
    id: "rollback-batch",
    title: "撤回不完整的轉帳",
    code: "BEGIN; UPDATE accounts ...; UPDATE accounts ...; ROLLBACK;",
    explanation: "第一筆帳戶已扣款，但第二筆資料驗證失敗；ROLLBACK 讓兩邊回到交易開始前。",
    takeaway: "交易的安全出口是 all-or-nothing，而不是留下半套寫入。",
  },
  {
    id: "commit-batch",
    title: "提交完整的轉帳",
    code: "BEGIN; UPDATE accounts ...; UPDATE accounts ...; COMMIT;",
    explanation: "兩筆更新都通過驗證後才 COMMIT，新的餘額才會成為可見的結果。",
    takeaway: "COMMIT 是明確的邊界：驗證完成，才把暫存變更正式寫入。",
  },
] as const;

export const indexOrders: readonly IndexOrder[] = [
  { id: 201, customerId: 42, status: "paid", amount: 1200 },
  { id: 202, customerId: 17, status: "paid", amount: 800 },
  { id: 203, customerId: 9, status: "pending", amount: 450 },
  { id: 204, customerId: 42, status: "paid", amount: 650 },
  { id: 205, customerId: 31, status: "paid", amount: 980 },
  { id: 206, customerId: 17, status: "pending", amount: 300 },
] as const;

export const indexAccounts: readonly IndexAccount[] = [
  { name: "Ada", balance: 3000 },
  { name: "Lin", balance: 1800 },
] as const;

export const indexQueryPlans: Readonly<Record<IndexQueryPlan["id"], IndexQueryPlan>> = {
  "before-index": {
    id: "before-index",
    operation: "table-scan",
    detail: "SCAN orders",
    rowsExamined: indexOrders.length,
  },
  "after-index": {
    id: "after-index",
    operation: "index-search",
    detail: "SEARCH orders USING INDEX idx_orders_customer_id (customer_id=?)",
    rowsExamined: indexOrders.filter((order) => order.customerId === 42).length,
  },
};

export const indexResults: Readonly<Record<IndexStepId, IndexLabResult>> = {
  "inspect-plan": {
    id: "inspect-plan",
    columns: ["operation", "detail", "rows_examined"],
    rows: [[
      indexQueryPlans["before-index"].operation,
      indexQueryPlans["before-index"].detail,
      indexQueryPlans["before-index"].rowsExamined,
    ]],
    caption: "before index · table scan",
  },
  "create-index": {
    id: "create-index",
    columns: ["index", "columns", "status"],
    rows: [["idx_orders_customer_id", "customer_id", "created"]],
    caption: "index catalog · 1 index",
  },
  "verify-plan": {
    id: "verify-plan",
    columns: ["operation", "detail", "rows_examined"],
    rows: [[
      indexQueryPlans["after-index"].operation,
      indexQueryPlans["after-index"].detail,
      indexQueryPlans["after-index"].rowsExamined,
    ]],
    caption: "after index · index search",
  },
  "rollback-batch": {
    id: "rollback-batch",
    columns: ["account", "balance", "transaction"],
    rows: indexAccounts.map((account) => [account.name, account.balance, "rolled back"]),
    caption: "transfer attempt · rolled back",
  },
  "commit-batch": {
    id: "commit-batch",
    columns: ["account", "balance", "transaction"],
    rows: [["Ada", 2800, "committed"], ["Lin", 2000, "committed"]],
    caption: "transfer · committed",
  },
};

export const indexLabInitialState: IndexLabState = {
  phase: "initial",
  selectedStepId: "inspect-plan",
  completedStepIds: [],
  indexCreated: false,
  plan: null,
  transactionStatus: "idle",
  result: null,
  lastCode: null,
  lastMessage: "先看查詢計畫，再驗證索引與交易的差異。",
  canReset: true,
};

export const indexLabHappyPath: readonly IndexLabEvent[] = indexLessonSteps.map((step) => ({ type: step.id }));

export interface IndexFailureFixture {
  event: IndexStepId;
  message: string;
}

export const indexFailureFixtures: readonly IndexFailureFixture[] = [
  { event: "create-index", message: "請先查看原始查詢計畫，再決定要優化哪個欄位。" },
  { event: "verify-plan", message: "請先建立 idx_orders_customer_id，再重新查看查詢計畫。" },
  { event: "commit-batch", message: "請先撤回不完整的轉帳，確認交易邊界後再提交完整寫入。" },
] as const;
