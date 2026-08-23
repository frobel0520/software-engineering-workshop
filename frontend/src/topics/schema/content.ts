import type { LessonDefinition } from "../types";

export type SchemaStepId = "identify-entities" | "define-keys" | "link-project-task" | "mark-nullable" | "validate-integrity";
export type SchemaTableId = "projects" | "tasks";
export type SchemaColumnKey = "PK" | "FK" | null;
export type SchemaValue = string | number | null;

export interface SchemaColumn {
  name: string;
  type: "INTEGER" | "TEXT";
  key: SchemaColumnKey;
  required: boolean;
  references?: string;
}

export interface SchemaTable {
  id: SchemaTableId;
  purpose: string;
  columns: readonly SchemaColumn[];
}

export interface SchemaRelation {
  from: string;
  to: string;
  cardinality: string;
}

export interface SchemaProject {
  id: number;
  name: string;
}

export interface SchemaTask {
  id: number;
  projectId: number;
  title: string;
  assignee: string | null;
  completedAt: string | null;
}

export interface SchemaLessonStep {
  id: SchemaStepId;
  title: string;
  code: string;
  explanation: string;
  takeaway: string;
}

export interface SchemaResult {
  id: SchemaStepId;
  columns: readonly string[];
  rows: readonly (readonly SchemaValue[])[];
  caption: string;
}

export type SchemaLabPhase = "initial" | "active" | "blocked" | "completed";
export type SchemaLabEventType = SchemaStepId | "reset";

export interface SchemaLabEvent {
  type: SchemaLabEventType;
}

export interface SchemaLabState {
  phase: SchemaLabPhase;
  selectedStepId: SchemaStepId;
  completedStepIds: readonly SchemaStepId[];
  result: SchemaResult | null;
  lastCode: string | null;
  lastMessage: string;
  canReset: true;
}

export const schemaLesson: LessonDefinition = {
  title: "先畫出關係，再決定資料形狀",
  orientation: {
    what: "資料庫 schema 是資料模型的契約；它描述有哪些實體、欄位、主鍵、外鍵與完整性規則。",
    why: "把規則寫在資料形狀裡，能減少重複、孤兒資料與每個服務各自猜欄位的風險。",
    when: "新增功能、拆分資料表、設計 API model、寫 migration，或需要檢查資料關係時使用。",
    how: "先找出實體，再選穩定主鍵，連接外鍵，標記 required／nullable，最後用測試資料驗證完整性。",
  },
  objectives: [
    "把需求拆成 projects 與 tasks 兩個清楚的資料實體。",
    "為每張表選擇能穩定識別 row 的 primary key。",
    "用 foreign key 表達 task 屬於哪一個 project。",
    "用 required 與 nullable 規則保護資料完整性。",
  ],
  sections: [
    {
      id: "identify-entities",
      title: "先分清楚每一種實體",
      body: "Project 與 task 有不同生命週期與責任，應該各自成為一張表；把兩種東西塞在同一列，會讓欄位重複且難以維護。",
    },
    {
      id: "define-keys",
      title: "每張表都要有穩定的識別",
      body: "Primary key 讓每一筆 row 能被唯一找到。它不是畫面上的排序號碼，而是其他資料可以可靠指向的身份。",
    },
    {
      id: "link-entities",
      title: "用外鍵表達資料關係",
      body: "tasks.project_id 指向 projects.id，形成多個 task 屬於一個 project 的關係；關係要落在欄位上，而不是只寫在文件裡。",
    },
    {
      id: "protect-integrity",
      title: "最後決定 required 與 nullable",
      body: "title 與 project_id 是建立 task 必須有的資料；assignee 與 completed_at 可以暫時沒有值。最後用測試資料檢查主鍵唯一、外鍵存在與 required 欄位不為空。",
    },
  ],
};

export const schemaLessonSteps: readonly SchemaLessonStep[] = [
  {
    id: "identify-entities",
    title: "拆出 projects 與 tasks",
    code: "projects(id, name)  +  tasks(id, project_id, title, ...)",
    explanation: "把可獨立描述的 project 與 task 分成兩張表，讓每張表只負責一種實體。",
    takeaway: "一張表先回答一種 row 是什麼，避免把不同生命週期混在一起。",
  },
  {
    id: "define-keys",
    title: "設定兩張表的 primary key",
    code: "projects.id PRIMARY KEY  ·  tasks.id PRIMARY KEY",
    explanation: "兩張表都用 id 唯一識別自己的 row，之後的關係才有穩定的目標。",
    takeaway: "先讓每個 row 有唯一身份，再談其他資料如何指向它。",
  },
  {
    id: "link-project-task",
    title: "連接 project 與 task",
    code: "tasks.project_id REFERENCES projects(id)",
    explanation: "tasks.project_id 是 foreign key，限制它只能指向已存在的 projects.id。",
    takeaway: "關係必須成為可檢查的 constraint，而不是只靠程式碼記住。",
  },
  {
    id: "mark-nullable",
    title: "標記 required 與 nullable",
    code: "title NOT NULL  ·  assignee NULL  ·  completed_at NULL",
    explanation: "建立 task 時 title 與 project_id 必須存在；尚未分派或尚未完成的 task 可以保留 NULL。",
    takeaway: "nullable 不是隨便放空，而是把『目前未知』和『必須存在』分清楚。",
  },
  {
    id: "validate-integrity",
    title: "驗證資料完整性",
    code: "CHECK PK unique · FK exists · required fields present",
    explanation: "用測試資料驗證 primary key 沒重複、foreign key 沒有 orphan、required 欄位沒有空值。",
    takeaway: "schema 的完成條件是規則可被檢查，不是圖畫得漂亮。",
  },
] as const;

export const schemaTables: readonly SchemaTable[] = [
  {
    id: "projects",
    purpose: "one row per project",
    columns: [
      { name: "id", type: "INTEGER", key: "PK", required: true },
      { name: "name", type: "TEXT", key: null, required: true },
    ],
  },
  {
    id: "tasks",
    purpose: "one row per task",
    columns: [
      { name: "id", type: "INTEGER", key: "PK", required: true },
      { name: "project_id", type: "INTEGER", key: "FK", required: true, references: "projects.id" },
      { name: "title", type: "TEXT", key: null, required: true },
      { name: "assignee", type: "TEXT", key: null, required: false },
      { name: "completed_at", type: "TEXT", key: null, required: false },
    ],
  },
] as const;

export const schemaRelations: readonly SchemaRelation[] = [
  { from: "tasks.project_id", to: "projects.id", cardinality: "many tasks → one project" },
] as const;

export const schemaProjects: readonly SchemaProject[] = [
  { id: 1, name: "SQL-01" },
  { id: 2, name: "Release" },
  { id: 3, name: "Observability" },
] as const;

export const schemaTasks: readonly SchemaTask[] = [
  { id: 101, projectId: 1, title: "Write SELECT lesson", assignee: "Ada", completedAt: "2026-08-17" },
  { id: 102, projectId: 1, title: "Test aggregate query", assignee: null, completedAt: null },
  { id: 103, projectId: 2, title: "Publish release", assignee: "Lin", completedAt: null },
  { id: 104, projectId: 3, title: "Add request logs", assignee: null, completedAt: null },
] as const;

export const schemaResults: Readonly<Record<SchemaStepId, SchemaResult>> = {
  "identify-entities": {
    id: "identify-entities",
    columns: ["table", "purpose"],
    rows: schemaTables.map((table) => [table.id, table.purpose]),
    caption: "2 entities · separate responsibilities",
  },
  "define-keys": {
    id: "define-keys",
    columns: ["table", "column", "constraint"],
    rows: [["projects", "id", "PRIMARY KEY"], ["tasks", "id", "PRIMARY KEY"]],
    caption: "2 primary keys · unique row identity",
  },
  "link-project-task": {
    id: "link-project-task",
    columns: ["from", "to", "cardinality"],
    rows: schemaRelations.map((relation) => [relation.from, relation.to, relation.cardinality]),
    caption: "1 foreign key · relationship connected",
  },
  "mark-nullable": {
    id: "mark-nullable",
    columns: ["column", "rule", "reason"],
    rows: [
      ["projects.name", "NOT NULL", "every project needs a label"],
      ["tasks.project_id", "NOT NULL", "every task has a project"],
      ["tasks.title", "NOT NULL", "every task needs a label"],
      ["tasks.assignee", "NULL", "assignment can come later"],
      ["tasks.completed_at", "NULL", "unfinished task has no date"],
    ],
    caption: "3 required · 2 nullable decisions",
  },
  "validate-integrity": {
    id: "validate-integrity",
    columns: ["check", "result", "evidence"],
    rows: [
      ["primary keys", "PASS", "7 unique ids across tables"],
      ["foreign keys", "PASS", "4 task project_id values resolve"],
      ["required fields", "PASS", "project.name, project_id and title are present"],
      ["nullable fields", "PASS", "NULL means not assigned / not finished"],
    ],
    caption: "4 integrity checks · all passed",
  },
};

export const schemaLabInitialState: SchemaLabState = {
  phase: "initial",
  selectedStepId: "identify-entities",
  completedStepIds: [],
  result: null,
  lastCode: null,
  lastMessage: "先拆出實體，再逐步補上 key、relationship 與 integrity rules。",
  canReset: true,
};

export const schemaLabHappyPath: readonly SchemaLabEvent[] = schemaLessonSteps.map((step) => ({ type: step.id }));

export interface SchemaFailureFixture {
  event: SchemaStepId;
  message: string;
}

export const schemaFailureFixtures: readonly SchemaFailureFixture[] = [
  { event: "define-keys", message: "請先拆出 projects 與 tasks，再為每張表設定 key。" },
  { event: "link-project-task", message: "請先為兩張表建立 primary key，foreign key 才有可指向的目標。" },
  { event: "validate-integrity", message: "請先標記 required 與 nullable，再檢查資料完整性。" },
] as const;
