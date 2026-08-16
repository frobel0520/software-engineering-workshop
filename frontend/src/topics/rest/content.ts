import type { LessonDefinition } from "../types";

export type RestTraceStageId =
  | "browser"
  | "cors"
  | "routing"
  | "validation"
  | "dependency"
  | "database"
  | "response";

export interface RestTraceStage {
  id: RestTraceStageId;
  label: string;
  actor: string;
  summary: string;
  fileId: RestCodeFileId;
}

export type RestCodeFileId = "api.ts" | "database.py" | "models.py" | "main.py";

export interface RestCodeLine {
  id: string;
  code: string;
  explanation: string;
  timing: string;
  connection: string;
  consequence: string;
  stages: readonly RestTraceStageId[];
}

export interface RestCodeFile {
  id: RestCodeFileId;
  path: string;
  language: "TypeScript" | "Python";
  role: string;
  lines: readonly RestCodeLine[];
}

export type RestScenarioId = "create-success" | "read-success" | "not-found" | "validation-error";

export interface RestItem {
  id: number;
  name: string;
  price: number;
}

export interface RestScenario {
  id: RestScenarioId;
  label: string;
  method: "GET" | "POST";
  url: string;
  requestBody: string;
  responseBody: string;
  status: string;
  sql: string;
  terminalStageId: RestTraceStageId;
  tone: "success" | "error";
}

export type RestLabPhase = "initial" | "tracing" | "error" | "completed";

export interface RestLabState {
  selectedScenarioId: RestScenarioId;
  requestStarted: boolean;
  activeStageId: RestTraceStageId;
  currentVisitedStageIds: readonly RestTraceStageId[];
  learnedStageIds: readonly RestTraceStageId[];
  completedScenarioIds: readonly RestScenarioId[];
  databaseItems: readonly RestItem[];
  responseReady: boolean;
  phase: RestLabPhase;
  lastMessage: string;
}

export type RestLabEvent =
  | { type: "select-scenario"; scenarioId: RestScenarioId }
  | { type: "start-request" }
  | { type: "inspect-stage"; stageId: RestTraceStageId }
  | { type: "next-stage" }
  | { type: "reset" };

export const restLesson: LessonDefinition = {
  title: "FastAPI request lifecycle",
  objectives: [
    "追蹤前端 fetch 如何形成 HTTP request。",
    "理解 FastAPI routing、dependency injection 與 Pydantic validation 的執行順序。",
    "理解 Session、ORM 與 database engine 各自負責什麼。",
    "看懂 response model 如何把資料轉成安全的 JSON response。",
  ],
  sections: [
    { id: "client", title: "前端不是直接呼叫 Python", body: "React 透過 HTTP 傳送 method、URL、headers 與 JSON body；FastAPI 接到的是一個 request。" },
    { id: "framework", title: "FastAPI 負責協調", body: "FastAPI 比對 route、解析參數、執行 dependencies、驗證資料，再呼叫 path operation。" },
    { id: "database", title: "FastAPI 不直接執行 SQL", body: "Path operation 使用注入的 Session，ORM 透過 engine 與資料庫溝通。" },
    { id: "response", title: "回傳前還有一道契約", body: "Response model 驗證與過濾輸出，FastAPI 再序列化成 JSON。" },
  ],
};

export const restTraceStages: readonly RestTraceStage[] = [
  { id: "browser", label: "01", actor: "React", summary: "fetch 組成 HTTP request", fileId: "api.ts" },
  { id: "cors", label: "02", actor: "CORS", summary: "瀏覽器確認 origin 是否被允許", fileId: "main.py" },
  { id: "routing", label: "03", actor: "Router", summary: "FastAPI 比對 method 與 path", fileId: "main.py" },
  { id: "validation", label: "04", actor: "Pydantic", summary: "JSON body 轉成有型別的資料", fileId: "models.py" },
  { id: "dependency", label: "05", actor: "Depends", summary: "建立這次 request 使用的 Session", fileId: "database.py" },
  { id: "database", label: "06", actor: "SQLModel", summary: "ORM 將物件操作轉成 SQL", fileId: "main.py" },
  { id: "response", label: "07", actor: "Response", summary: "輸出經過 model 過濾後成為 JSON", fileId: "main.py" },
];

export const restDatabaseFixture: readonly RestItem[] = [
  { id: 1, name: "Notebook", price: 180 },
  { id: 2, name: "Mouse", price: 650 },
];

export const restScenarios: readonly RestScenario[] = [
  {
    id: "create-success",
    label: "建立商品 · 201",
    method: "POST",
    url: "http://localhost:8000/items",
    requestBody: '{\n  "name": "Keyboard",\n  "price": 1200\n}',
    responseBody: '{\n  "id": 3,\n  "name": "Keyboard",\n  "price": 1200\n}',
    status: "201 Created",
    sql: "INSERT INTO item (name, price) VALUES ('Keyboard', 1200);",
    terminalStageId: "response",
    tone: "success",
  },
  {
    id: "read-success",
    label: "讀取商品 · 200",
    method: "GET",
    url: "http://localhost:8000/items/1",
    requestBody: "— GET request 沒有 body —",
    responseBody: '{\n  "id": 1,\n  "name": "Notebook",\n  "price": 180\n}',
    status: "200 OK",
    sql: "SELECT id, name, price FROM item WHERE id = 1;",
    terminalStageId: "response",
    tone: "success",
  },
  {
    id: "not-found",
    label: "找不到商品 · 404",
    method: "GET",
    url: "http://localhost:8000/items/99",
    requestBody: "— GET request 沒有 body —",
    responseBody: '{\n  "detail": "Item not found"\n}',
    status: "404 Not Found",
    sql: "SELECT id, name, price FROM item WHERE id = 99;",
    terminalStageId: "response",
    tone: "error",
  },
  {
    id: "validation-error",
    label: "驗證失敗 · 422",
    method: "POST",
    url: "http://localhost:8000/items",
    requestBody: '{\n  "name": "Keyboard",\n  "price": -1\n}',
    responseBody: '{\n  "detail": [{\n    "loc": ["body", "price"],\n    "msg": "Input should be greater than 0"\n  }]\n}',
    status: "422 Unprocessable Entity",
    sql: "— validation 失敗，沒有執行 SQL —",
    terminalStageId: "validation",
    tone: "error",
  },
];

export const restRequiredScenarioIds: readonly RestScenarioId[] = restScenarios.map((scenario) => scenario.id);

export function findRestScenario(scenarioId: RestScenarioId): RestScenario {
  return restScenarios.find((scenario) => scenario.id === scenarioId) ?? restScenarios[0];
}

export const restCodeFiles: readonly RestCodeFile[] = [
  {
    id: "api.ts",
    path: "frontend/src/api.ts",
    language: "TypeScript",
    role: "Browser client：建立 request 並處理 response。",
    lines: [
      { id: "api-1", code: "export interface ItemCreate {", explanation: "宣告前端送出商品時使用的資料形狀。", timing: "TypeScript 編譯時檢查。", connection: "它要和後端 ItemCreate schema 對齊。", consequence: "欄位漂移時，前端可能送出後端不接受的 JSON。", stages: ["browser"] },
      { id: "api-2", code: "  name: string;", explanation: "商品名稱在前端必須是字串。", timing: "開發者建立 payload 時。", connection: "會成為 JSON body 的 name。", consequence: "刪除後，前端型別不再提醒缺少 name。", stages: ["browser"] },
      { id: "api-3", code: "  price: number;", explanation: "商品價格在前端必須是數字。", timing: "開發者建立 payload 時。", connection: "後端會再用 Pydantic 驗證一次。", consequence: "只靠前端型別不足以保護 API。", stages: ["browser"] },
      { id: "api-4", code: "}", explanation: "結束 ItemCreate 型別範圍。", timing: "TypeScript 解析型別時。", connection: "後面的函式可以引用這個型別。", consequence: "缺少結尾會造成語法錯誤。", stages: ["browser"] },
      { id: "api-5", code: "export async function createItem(item: ItemCreate) {", explanation: "建立一個非同步函式，接收符合 ItemCreate 的物件。", timing: "UI 呼叫 createItem 時。", connection: "這是 React 與 FastAPI 之間的 client adapter。", consequence: "沒有 async 就不能直接 await fetch。", stages: ["browser"] },
      { id: "api-6", code: "  const response = await fetch(\"http://localhost:8000/items\", {", explanation: "瀏覽器向 FastAPI server 的 /items 發出 request，並等待 response。", timing: "使用者按下建立商品時。", connection: "不同 port 代表不同 origin，因此會牽涉 CORS。", consequence: "URL 或 port 錯誤會得到 network error。", stages: ["browser", "cors"] },
      { id: "api-7", code: "    method: \"POST\",", explanation: "指定 HTTP method 為 POST。", timing: "fetch 建立 request 時。", connection: "FastAPI router 會用 POST + /items 尋找 path operation。", consequence: "改成 GET 就不會命中 POST route。", stages: ["browser", "routing"] },
      { id: "api-8", code: "    headers: { \"Content-Type\": \"application/json\" },", explanation: "告訴後端 body 使用 JSON 格式。", timing: "request 送出前。", connection: "FastAPI 依 content type 解析 body。", consequence: "錯誤格式可能讓 body 無法被正確解析。", stages: ["browser", "validation"] },
      { id: "api-9", code: "    body: JSON.stringify(item),", explanation: "把 JavaScript object 序列化成 HTTP 可以傳送的 JSON 字串。", timing: "request 送出前。", connection: "Pydantic 會把這段 JSON 驗證成 ItemCreate。", consequence: "直接傳 object 不是有效的 fetch body。", stages: ["browser", "validation"] },
      { id: "api-10", code: "  });", explanation: "結束 fetch 設定並真正送出 request。", timing: "await 開始等待網路結果時。", connection: "控制權暫時交回瀏覽器 event loop。", consequence: "請求失敗時 fetch 可能拋出例外。", stages: ["browser"] },
      { id: "api-11", code: "  if (!response.ok) throw new Error(`HTTP ${response.status}`);", explanation: "將 4xx 或 5xx response 轉成前端可處理的錯誤。", timing: "收到 HTTP response 後。", connection: "422、404、500 都會走這個分支。", consequence: "若忽略 response.ok，錯誤 JSON 可能被當成成功資料。", stages: ["response"] },
      { id: "api-12", code: "  return response.json();", explanation: "讀取 response body，將 JSON 轉回 JavaScript object。", timing: "成功 response 抵達後。", connection: "資料來自 FastAPI 的 response serialization。", consequence: "少了它，呼叫端拿到的只是 Response 物件。", stages: ["response"] },
      { id: "api-13", code: "}", explanation: "結束 createItem 函式。", timing: "函式定義完成時。", connection: "UI 可以 import 並呼叫它。", consequence: "缺少結尾會造成語法錯誤。", stages: ["browser", "response"] },
      { id: "api-14", code: "export async function readItem(itemId: number) {", explanation: "宣告讀取單一商品的 client 函式，itemId 必須是數字。", timing: "UI 要顯示商品明細時。", connection: "itemId 會被放進 FastAPI route 的 path parameter。", consequence: "未限制型別時可能組出無效 URL。", stages: ["browser"] },
      { id: "api-15", code: "  const response = await fetch(`http://localhost:8000/items/${itemId}`);", explanation: "使用 GET 呼叫商品資源 URL；fetch 預設 method 就是 GET。", timing: "readItem 被呼叫時。", connection: "FastAPI 會把 URL 尾端解析成 item_id。", consequence: "路徑不符合 route 時會得到 404 route not found。", stages: ["browser", "cors", "routing"] },
      { id: "api-16", code: "  if (!response.ok) throw new Error(`HTTP ${response.status}`);", explanation: "把找不到商品等 HTTP error 交給前端錯誤流程。", timing: "GET response 抵達後。", connection: "資料庫查無 row 時，FastAPI route 會回傳 404。", consequence: "忽略它會把錯誤內容當作 Item。", stages: ["response"] },
      { id: "api-17", code: "  return response.json();", explanation: "把成功的 JSON response 解析成前端物件。", timing: "確認 response.ok 後。", connection: "內容已經過 ItemPublic response model。", consequence: "呼叫端只能拿到未解析的 Response。", stages: ["response"] },
      { id: "api-18", code: "}", explanation: "結束 readItem 函式範圍。", timing: "函式定義完成時。", connection: "UI 可以 import 並重用它。", consequence: "缺少結尾會造成語法錯誤。", stages: ["browser", "response"] },
    ],
  },
  {
    id: "database.py",
    path: "backend/database.py",
    language: "Python",
    role: "Database adapter：建立 engine，並管理每個 request 的 Session。",
    lines: [
      { id: "db-1", code: "from typing import Annotated", explanation: "匯入 Annotated，讓型別同時攜帶 FastAPI dependency metadata。", timing: "Python 載入 module 時。", connection: "稍後用來建立 SessionDep。", consequence: "沒有它就要在每個 route 重複 Depends 寫法。", stages: ["dependency"] },
      { id: "db-2", code: "from fastapi import Depends", explanation: "匯入 FastAPI 的 dependency 宣告工具。", timing: "Python 載入 module 時。", connection: "FastAPI 看到 Depends 後會先執行 get_session。", consequence: "route 不會自動取得 database session。", stages: ["dependency"] },
      { id: "db-3", code: "from sqlmodel import SQLModel, Session, create_engine", explanation: "匯入 metadata、ORM session 與 database engine 工具。", timing: "Python 載入 module 時。", connection: "SQLModel 底層透過 engine 與 SQLite 溝通。", consequence: "FastAPI 本身不提供 ORM 或 database driver。", stages: ["dependency", "database"] },
      { id: "db-3b", code: "from .models import Item", explanation: "匯入對應 item table 的 ORM model，供 workshop 建表與 seed 使用。", timing: "Python 載入 database module 時。", connection: "Item class 會把 table metadata 註冊到 SQLModel。", consequence: "未載入 table model 時，create_all 不知道要建立哪張表。", stages: ["database"] },
      { id: "db-4", code: "engine = create_engine(\"sqlite:///workshop.db\")", explanation: "建立可連到 workshop.db 的 database engine。", timing: "應用程式啟動並載入 module 時。", connection: "所有 Session 會透過這個 engine 發送 SQL。", consequence: "連線字串錯誤會讓 database 操作失敗。", stages: ["database"] },
      { id: "db-4b", code: "def create_db_and_tables():", explanation: "宣告 workshop 啟動時建立缺少資料表的 helper。", timing: "FastAPI lifespan 啟動階段呼叫。", connection: "正式專案通常改由 migration 管理 schema。", consequence: "全新 SQLite 檔沒有 table 時，第一個 query 會失敗。", stages: ["dependency", "database"] },
      { id: "db-4c", code: "    SQLModel.metadata.create_all(engine)", explanation: "依所有 table models 的 metadata 建立尚不存在的資料表。", timing: "server 開始接受 request 前。", connection: "engine 把 CREATE TABLE 送到 SQLite。", consequence: "它不會取代正式 migration，也不會安全修改既有 schema。", stages: ["database"] },
      { id: "db-4d", code: "    with Session(engine) as session:", explanation: "開啟短生命週期 Session，準備 workshop 的固定初始資料。", timing: "建表完成後、server 接受 request 前。", connection: "讓 GET 情境在全新 database 也有 deterministic rows。", consequence: "沒有 seed 時，全新 database 的 GET /items/1 只會得到 404。", stages: ["database"] },
      { id: "db-4e", code: "        if session.get(Item, 1) is None:", explanation: "只在 id=1 不存在時 seed，避免每次啟動都重複插入。", timing: "每次 application startup。", connection: "Session.get 以 primary key 查詢 Item。", consequence: "無條件 seed 會造成 primary-key conflict 或重複資料。", stages: ["database"] },
      { id: "db-4f", code: "            session.add_all([Item(id=1, name=\"Notebook\", price=180), Item(id=2, name=\"Mouse\", price=650)])", explanation: "加入兩筆與 browser simulator 相同的 deterministic fixture。", timing: "第一次啟動空 database 時。", connection: "這兩筆 row 支援 200 與 404 查詢對照。", consequence: "fixture 與 simulator 漂移會讓教材展示和實際程式結果不同。", stages: ["database"] },
      { id: "db-4g", code: "            session.commit()", explanation: "提交 seed transaction，讓兩筆 fixture 永久寫入 SQLite。", timing: "確認 database 尚未 seed 後。", connection: "後續每個 request 的 Session 都能查到它們。", consequence: "沒有 commit，Session 關閉後 seed 不會保存。", stages: ["database"] },
      { id: "db-5", code: "def get_session():", explanation: "宣告 FastAPI dependency，用來提供一個 request 專用 Session。", timing: "每次 route 需要 SessionDep 時。", connection: "FastAPI dependency system 負責呼叫它。", consequence: "自行在 route 建 Session 容易忘記關閉。", stages: ["dependency"] },
      { id: "db-6", code: "    with Session(engine) as session:", explanation: "從 engine 開啟 Session，並用 context manager 確保最後關閉。", timing: "path operation 執行前。", connection: "Session 追蹤 ORM objects 與 transaction。", consequence: "未關閉 Session 可能耗盡連線資源。", stages: ["dependency", "database"] },
      { id: "db-7", code: "        yield session", explanation: "把 Session 注入 route，並暫停 dependency；route 結束後才離開 with。", timing: "path operation 執行前到 response 建立期間。", connection: "create_item 的 session 參數會收到這個物件。", consequence: "改成 return 仍可提供值，但失去 yield 後的清理生命週期。", stages: ["dependency"] },
      { id: "db-8", code: "SessionDep = Annotated[Session, Depends(get_session)]", explanation: "建立可重用型別：需要 Session，也要求 FastAPI 透過 get_session 提供。", timing: "FastAPI 分析 route signature 時。", connection: "route 只寫 session: SessionDep 就能取得連線。", consequence: "拿掉 Depends 後，FastAPI 會把它誤解成一般參數。", stages: ["dependency", "routing"] },
    ],
  },
  {
    id: "models.py",
    path: "backend/models.py",
    language: "Python",
    role: "Data contracts：分開 database model、request schema 與 response schema。",
    lines: [
      { id: "model-1", code: "from sqlmodel import Field, SQLModel", explanation: "匯入 SQLModel base class 與欄位設定工具。", timing: "Python 載入 module 時。", connection: "同一套型別可產生 validation schema 與 ORM mapping。", consequence: "FastAPI 不會替你定義資料表。", stages: ["validation", "database"] },
      { id: "model-2", code: "class ItemBase(SQLModel):", explanation: "宣告 request、table 與 response 共用的商品欄位。", timing: "應用程式啟動時建立 class。", connection: "子類別會繼承 name 與 price。", consequence: "重複欄位容易讓 API schema 漂移。", stages: ["validation"] },
      { id: "model-3", code: "    name: str = Field(min_length=1, max_length=80)", explanation: "要求 name 是 1 到 80 字元的字串。", timing: "FastAPI 驗證 request body 時。", connection: "規則會出現在 JSON Schema 與 /docs。", consequence: "空字串或過長名稱會得到 422。", stages: ["validation"] },
      { id: "model-4", code: "    price: int = Field(gt=0)", explanation: "要求 price 是大於 0 的整數。", timing: "FastAPI 驗證 request body 時。", connection: "不合法資料會在進入 route 前被拒絕。", consequence: "沒有條件時可能寫入負數價格。", stages: ["validation"] },
      { id: "model-5", code: "class Item(ItemBase, table=True):", explanation: "宣告真正對應 database table 的 ORM model。", timing: "SQLModel 建立 metadata 時。", connection: "Session 會用它產生 INSERT 與 SELECT。", consequence: "沒有 table=True 就只是一個資料 schema。", stages: ["database"] },
      { id: "model-6", code: "    id: int | None = Field(default=None, primary_key=True)", explanation: "宣告 database primary key；新增前可以是 None，由 SQLite 產生。", timing: "寫入與讀取資料時。", connection: "commit 後 refresh 會取得資料庫生成的 id。", consequence: "沒有 primary key，ORM 無法穩定識別 row。", stages: ["database"] },
      { id: "model-7", code: "class ItemCreate(ItemBase):", explanation: "宣告建立商品時允許 client 傳入的 request schema。", timing: "FastAPI 建立 OpenAPI 與驗證 body 時。", connection: "不包含 id，避免 client 指定主鍵。", consequence: "直接用 table model 會混淆輸入與儲存責任。", stages: ["validation"] },
      { id: "model-8", code: "    pass", explanation: "表示目前不需要在 ItemBase 之外增加輸入欄位。", timing: "Python 建立 class 時。", connection: "仍會繼承 name 與 price。", consequence: "空 class body 沒有 pass 會造成語法錯誤。", stages: ["validation"] },
      { id: "model-9", code: "class ItemPublic(ItemBase):", explanation: "宣告 API 對外輸出的 response schema。", timing: "FastAPI 序列化 response 時。", connection: "它決定 client 最終能看到哪些欄位。", consequence: "直接回傳 database model 可能洩漏內部欄位。", stages: ["response"] },
      { id: "model-10", code: "    id: int", explanation: "公開資料必須包含 database 已產生的 id。", timing: "response validation 時。", connection: "refresh 後的 ORM object 應具備這個值。", consequence: "若缺少 id，FastAPI 會視為 server response 錯誤。", stages: ["response"] },
    ],
  },
  {
    id: "main.py",
    path: "backend/main.py",
    language: "Python",
    role: "FastAPI application：組合 middleware、route、validation、dependency 與 response。",
    lines: [
      { id: "main-0", code: "from contextlib import asynccontextmanager", explanation: "匯入建立 async lifespan context manager 的 decorator。", timing: "Python 載入 module 時。", connection: "FastAPI 會在接受 request 前後進出 lifespan。", consequence: "缺少生命週期管理時，啟動資源只能散落在 module scope。", stages: ["dependency"] },
      { id: "main-1", code: "from fastapi import FastAPI, HTTPException", explanation: "匯入 FastAPI application class 與可轉成 HTTP error response 的例外。", timing: "Python 載入 module 時。", connection: "app 註冊 routes；HTTPException 用於 404 等可預期錯誤。", consequence: "一般例外通常會變成 500，而不是清楚的 client error。", stages: ["routing", "response"] },
      { id: "main-2", code: "from fastapi.middleware.cors import CORSMiddleware", explanation: "匯入處理跨 origin request 的 middleware。", timing: "Python 載入 module 時。", connection: "允許 Vite frontend 呼叫不同 port 的 API。", consequence: "瀏覽器可能封鎖跨 origin response。", stages: ["cors"] },
      { id: "main-3", code: "from .database import SessionDep, create_db_and_tables", explanation: "匯入 Session dependency 與 workshop 建表 helper。", timing: "Python 載入 module 時。", connection: "route 取得 Session；lifespan 確保 SQLite table 已存在。", consequence: "缺少任一部分都可能讓 database request 失敗。", stages: ["dependency", "database"] },
      { id: "main-4", code: "from .models import Item, ItemCreate, ItemPublic", explanation: "匯入 database、request 與 response 三種資料模型。", timing: "Python 載入 module 時。", connection: "讓輸入、儲存與輸出契約保持分離。", consequence: "混用模型可能讓 client 控制或看到不該出現的欄位。", stages: ["validation", "database", "response"] },
      { id: "main-4b", code: "from sqlmodel import select", explanation: "匯入建立 SELECT statement 的 SQLModel helper。", timing: "Python 載入 module 時。", connection: "Session 會把 statement 交給 engine 執行。", consequence: "FastAPI 不會自己產生 database query。", stages: ["database"] },
      { id: "main-5a", code: "@asynccontextmanager", explanation: "把下一個 async generator 轉成 FastAPI 可使用的 lifespan context manager。", timing: "Python 建立 lifespan 函式時。", connection: "yield 前是 startup，yield 後是 shutdown。", consequence: "普通 async generator 不能直接作為 lifespan。", stages: ["dependency"] },
      { id: "main-5b", code: "async def lifespan(app: FastAPI):", explanation: "宣告應用程式生命週期；app 參數代表目前 FastAPI instance。", timing: "server startup 與 shutdown 各進入一次。", connection: "用來準備 request 需要的 database schema。", consequence: "長期資源初始化若放在每個 request 會浪費成本。", stages: ["dependency", "database"] },
      { id: "main-5c", code: "    create_db_and_tables()", explanation: "在 server 接受第一個 request 前建立 workshop SQLite tables。", timing: "lifespan startup 階段。", connection: "呼叫 database.py 中依 metadata 建表的 helper。", consequence: "全新環境可能得到 no such table 錯誤。", stages: ["database"] },
      { id: "main-5d", code: "    yield", explanation: "把控制權交給 FastAPI 開始服務 requests；離開時進入 shutdown。", timing: "startup 完成後、shutdown 開始前。", connection: "這行分隔資源建立與清理階段。", consequence: "lifespan context manager 必須 yield 一次。", stages: ["dependency"] },
      { id: "main-5", code: "app = FastAPI(title=\"Workshop API\", lifespan=lifespan)", explanation: "建立 ASGI application，並掛上啟動生命週期；title 會進入 OpenAPI schema。", timing: "server import main:app 時。", connection: "Uvicorn 會啟動 lifespan，再把 HTTP request 交給 app。", consequence: "entrypoint 找不到 app 或 lifespan 啟動失敗時 server 無法服務。", stages: ["routing", "dependency"] },
      { id: "main-6", code: "app.add_middleware(", explanation: "開始註冊會包住每個 request 的 CORS middleware。", timing: "應用程式啟動時。", connection: "middleware 在 route 前後處理 headers。", consequence: "設定不完整會造成跨 origin 問題。", stages: ["cors"] },
      { id: "main-7", code: "    CORSMiddleware,", explanation: "指定使用 Starlette 提供、FastAPI 重新匯出的 CORS middleware。", timing: "應用程式啟動時。", connection: "它會處理 preflight OPTIONS 與 response headers。", consequence: "少了它，frontend 與 backend 不同 origin 時可能無法通訊。", stages: ["cors"] },
      { id: "main-8", code: "    allow_origins=[\"http://localhost:5173\"],", explanation: "只允許本機 Vite frontend 的 origin。", timing: "middleware 判斷 request Origin 時。", connection: "protocol、host、port 必須全部相同。", consequence: "使用萬用 * 會限制帶 credentials 的請求。", stages: ["cors"] },
      { id: "main-8b", code: "    allow_methods=[\"GET\", \"POST\"],", explanation: "允許 workshop frontend 使用 GET 與 POST。", timing: "CORS preflight 檢查 Access-Control-Request-Method 時。", connection: "POST JSON request 通常會先送 OPTIONS preflight。", consequence: "未允許 POST 時，瀏覽器不會送出真正的 create request。", stages: ["cors"] },
      { id: "main-8c", code: "    allow_headers=[\"Content-Type\"],", explanation: "允許 frontend 在跨 origin request 使用 Content-Type header。", timing: "CORS preflight 檢查 requested headers 時。", connection: "fetch 用它宣告 JSON body。", consequence: "preflight 會拒絕 application/json request。", stages: ["cors", "validation"] },
      { id: "main-9", code: ")", explanation: "完成 middleware 設定。", timing: "應用程式啟動時。", connection: "之後進入 app 的 request 都套用此設定。", consequence: "括號未關閉會造成語法錯誤。", stages: ["cors"] },
      { id: "main-10", code: "@app.post(\"/items\", response_model=ItemPublic, status_code=201)", explanation: "註冊 POST /items，並宣告成功 status 與公開 response schema。", timing: "應用程式啟動時註冊；request 到達時用來比對。", connection: "OpenAPI /docs 也從這行產生 endpoint 契約。", consequence: "method 或 path 不同時，request 不會進入下方函式。", stages: ["routing", "response"] },
      { id: "main-11", code: "def create_item(item: ItemCreate, session: SessionDep):", explanation: "宣告 path operation；FastAPI 會驗證 item，並注入 session。", timing: "route 命中且 validation 成功後。", connection: "函式 signature 就是 request 與 dependency 契約。", consequence: "驗證失敗時這個函式完全不會執行。", stages: ["routing", "validation", "dependency"] },
      { id: "main-12", code: "    db_item = Item.model_validate(item)", explanation: "把已驗證的 input schema 轉成可寫入 table 的 ORM object。", timing: "進入 path operation 後。", connection: "明確跨越 request model 到 database model 的邊界。", consequence: "直接混用 model 會模糊哪些欄位可由 client 控制。", stages: ["database"] },
      { id: "main-13", code: "    session.add(db_item)", explanation: "將 ORM object 加入目前 Session；此時尚未永久寫入。", timing: "transaction 準備階段。", connection: "Session 開始追蹤這個新物件。", consequence: "沒有 add，commit 不會插入這筆商品。", stages: ["database"] },
      { id: "main-14", code: "    session.commit()", explanation: "提交 transaction，ORM 透過 engine 對 SQLite 執行 INSERT。", timing: "資料驗證與物件建立完成後。", connection: "這是資料真正持久化的時點。", consequence: "失敗時應 rollback；完整版本會加入錯誤情境。", stages: ["database"] },
      { id: "main-15", code: "    session.refresh(db_item)", explanation: "重新讀取該 row，取得 database 生成的 id 等欄位。", timing: "commit 成功後。", connection: "讓 db_item 與 database 的最新狀態同步。", consequence: "response 可能拿不到 database 產生的值。", stages: ["database", "response"] },
      { id: "main-16", code: "    return db_item", explanation: "把 ORM object 交回 FastAPI；ItemPublic 會驗證、過濾並序列化它。", timing: "path operation 最後。", connection: "client 最終只收到 response model 允許的 JSON 欄位。", consequence: "回傳不符合 ItemPublic 時會被視為 server error。", stages: ["response"] },
      { id: "main-17", code: "@app.get(\"/items/{item_id}\", response_model=ItemPublic)", explanation: "註冊帶有 path parameter 的 GET route，預設成功 status 是 200。", timing: "啟動時註冊；GET request 到達時比對。", connection: "OpenAPI 會把 item_id 與 ItemPublic 都記入契約。", consequence: "若 path 名稱與函式參數不同，FastAPI 無法正確注入值。", stages: ["routing", "response"] },
      { id: "main-18", code: "def read_item(item_id: int, session: SessionDep):", explanation: "要求 FastAPI 把 URL 值驗證成 int，並注入 database Session。", timing: "GET route 命中後。", connection: "path validation 與 dependency 都在函式執行前完成。", consequence: "例如 /items/abc 會在查詢前得到 422。", stages: ["routing", "validation", "dependency"] },
      { id: "main-19", code: "    item = session.exec(select(Item).where(Item.id == item_id)).first()", explanation: "建立 SELECT、透過 Session 執行，並取得第一個符合的 ORM object。", timing: "validation 與 dependency 成功後。", connection: "Session → engine → SQLite，再把 row 轉回 Item。", consequence: "沒有 where 條件可能讀到錯誤商品。", stages: ["database"] },
      { id: "main-20", code: "    if item is None:", explanation: "判斷 database 是否完全找不到對應 row。", timing: "SELECT 執行完成後。", connection: "把 database 的空結果轉成 HTTP 語意。", consequence: "忽略 None 會讓 response validation 失敗並形成 500。", stages: ["database", "response"] },
      { id: "main-21", code: "        raise HTTPException(status_code=404, detail=\"Item not found\")", explanation: "中止 route，要求 FastAPI 建立結構化的 404 JSON response。", timing: "查無商品時。", connection: "前端 response.ok 會變成 false。", consequence: "回傳 None 不等於清楚的 resource-not-found 契約。", stages: ["response"] },
      { id: "main-22", code: "    return item", explanation: "找到商品時交給 ItemPublic 驗證與 JSON serialization。", timing: "GET happy path 最後。", connection: "前端 readItem 會解析這個 JSON。", consequence: "輸出不符合 response model 時代表 server contract 壞掉。", stages: ["response"] },
    ],
  },
];

export function findRestCodeFile(fileId: RestCodeFileId): RestCodeFile {
  return restCodeFiles.find((file) => file.id === fileId) ?? restCodeFiles[0];
}

export function findRestCodeLine(lineId: string): RestCodeLine {
  return restCodeFiles.flatMap((file) => file.lines).find((line) => line.id === lineId) ?? restCodeFiles[0].lines[0];
}
