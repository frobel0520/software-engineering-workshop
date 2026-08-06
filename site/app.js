const topics = [
  { id: "git", phase: "foundations", title: "Git", note: "版本控制", detail: "用 commit、branch、merge 管理變更。" },
  { id: "remote", phase: "foundations", title: "GitHub / GitLab", note: "協作平台", detail: "用遠端 repository、Pull Request 與 Issue 協作。" },
  { id: "cli", phase: "foundations", title: "命令列", note: "工作流入口", detail: "用 shell 組合可重複、可分享的操作。" },
  { id: "ide", phase: "foundations", title: "IDE／除錯器", note: "快速定位", detail: "設定 breakpoint、讀 stack trace、縮小問題範圍。" },
  { id: "package", phase: "foundations", title: "套件管理", note: "依賴管理", detail: "理解 lockfile、版本範圍與可重現安裝。" },
  { id: "env", phase: "foundations", title: "環境變數", note: "設定與秘密", detail: "區分程式碼、設定值與不能進 Git 的秘密。" },
  { id: "rest", phase: "web", title: "REST API", note: "服務邊界", detail: "用 HTTP method、status code 與 schema 設計契約。" },
  { id: "auth", phase: "web", title: "身分驗證與授權", note: "安全邊界", detail: "分清楚 authentication、authorization 與 session。" },
  { id: "sql", phase: "data", title: "SQL", note: "查詢語言", detail: "從 SELECT 到 JOIN，讀懂資料庫真正做了什麼。" },
  { id: "schema", phase: "data", title: "資料庫設計", note: "資料模型", detail: "設計表、關係、約束與可演進的 schema。" },
  { id: "index", phase: "data", title: "索引與交易", note: "效能與一致性", detail: "知道何時加 index，以及 transaction 保護什麼。" },
  { id: "nosql", phase: "data", title: "NoSQL 基礎", note: "另一種取捨", detail: "比較文件、key-value 與關聯式資料的使用情境。" },
  { id: "unit", phase: "quality", title: "單元測試", note: "快速回饋", detail: "用小而精準的測試鎖住函式行為。" },
  { id: "integration", phase: "quality", title: "整合測試", note: "模組契約", detail: "驗證模組與外部依賴接起來後仍能工作。" },
  { id: "logs", phase: "quality", title: "日誌", note: "留下線索", detail: "讓問題可搜尋、可關聯、可追蹤。" },
  { id: "docker", phase: "delivery", title: "Docker 基礎", note: "環境一致", detail: "把執行環境一起打包，減少『我的電腦可以』。" },
  { id: "cicd", phase: "delivery", title: "CI/CD", note: "自動檢查", detail: "每次變更自動測試、建置，降低交付風險。" },
  { id: "deploy", phase: "delivery", title: "部署", note: "送到使用者手上", detail: "理解環境、版本、回滾與最小可觀測性。" },
  { id: "build", phase: "foundations", title: "建置工具", note: "把原始碼變成產品", detail: "理解 build、bundle、artifact 與開發／正式環境差異。" },
];

const phases = [
  { id: "foundations", number: "01", title: "開發基本功", description: "工具與可重複流程", accent: "#16c6ad", topics: ["git", "remote", "cli", "ide", "package", "env", "build"] },
  { id: "web", number: "02", title: "Web 與 API", description: "請求、契約與權限", accent: "#4f83cc", topics: ["rest", "auth"] },
  { id: "data", number: "03", title: "資料庫", description: "資料關係與取捨", accent: "#8a79d8", topics: ["sql", "schema", "index", "nosql"] },
  { id: "quality", number: "04", title: "品質與可觀測性", description: "測試、日誌與線索", accent: "#ff716b", topics: ["unit", "integration", "logs"] },
  { id: "delivery", number: "05", title: "交付與部署", description: "從 commit 到上線", accent: "#ee9b4b", topics: ["docker", "cicd", "deploy"] },
];

const concepts = {
  foundations: [
    ["VERSION", "Git", "任何改變都要能回答：改了什麼、為什麼、如何回復。", "#16c6ad"],
    ["FLOW", "命令列", "把常做的事變成可以複製給未來自己的指令。", "#4f83cc"],
    ["CONTEXT", "環境與依賴", "讓新電腦也能用同一份設定跑出同一個結果。", "#8a79d8"],
    ["FEEDBACK", "IDE／除錯器", "快速從症狀走回真正的原因，而不是一直猜。", "#ff716b"],
  ],
  web: [["CONTRACT", "REST API", "用清楚的 HTTP 契約，讓前後端可以平行工作。", "#4f83cc"], ["BOUNDARY", "身分驗證與授權", "知道『你是誰』和『你能做什麼』是兩件事。", "#16c6ad"]],
  data: [["QUERY", "SQL", "先能讀懂資料，再用 ORM 抽象它。", "#8a79d8"], ["MODEL", "資料庫設計", "資料模型是產品規則的一部分，不只是儲存細節。", "#4f83cc"], ["TRADE-OFF", "索引與交易", "效能與一致性都要用真實場景衡量。", "#ff716b"], ["SCALE", "NoSQL 基礎", "不同資料形狀，對應不同的讀寫取捨。", "#ee9b4b"]],
  quality: [["UNIT", "單元測試", "小、快、針對一個行為。", "#ff716b"], ["SYSTEM", "整合測試", "確認模組之間的契約沒有斷裂。", "#4f83cc"], ["TRACE", "日誌", "每個錯誤都留下足夠的上下文。", "#16c6ad"]],
  delivery: [["PACKAGE", "Docker 基礎", "把執行環境變成可攜帶的 artifact。", "#ee9b4b"], ["CHECK", "CI/CD", "讓品質檢查跟著每次變更自動發生。", "#16c6ad"], ["RELEASE", "部署", "小批次、可觀測、可回滾地送到使用者手上。", "#4f83cc"]],
};

const state = { completed: JSON.parse(localStorage.getItem("se-workshop-progress") || "[]"), activeView: "overview" };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function saveProgress() { localStorage.setItem("se-workshop-progress", JSON.stringify(state.completed)); }
function isComplete(id) { return state.completed.includes(id); }
function toggleTopic(id) { state.completed = isComplete(id) ? state.completed.filter((item) => item !== id) : [...state.completed, id]; saveProgress(); renderAll(); }
function renderProgress() {
  const percent = Math.round((state.completed.length / topics.length) * 100);
  $("#progressPercent").textContent = `${percent}%`;
  $("#progressFill").style.width = `${percent}%`;
  $("#progressMeta").textContent = `${state.completed.length} / ${topics.length} 個主題`;
  const next = topics.find((topic) => !isComplete(topic.id));
  $("#nextTopic").textContent = next ? `下一步：${next.title}` : "全部完成，準備做 Capstone";
  $("#streakText").textContent = state.completed.length ? `已完成 ${state.completed.length} 個主題` : "今天開始你的第一步";
  phases.forEach((phase) => { const done = phase.topics.filter(isComplete).length; const card = document.querySelector(`[data-phase="${phase.id}"]`); if (card) card.querySelector(".mini-progress i").style.width = `${(done / phase.topics.length) * 100}%`; });
}
function renderPhases() {
  $("#phaseGrid").innerHTML = phases.map((phase) => `<article class="phase-card" data-phase="${phase.id}" data-view="${phase.id}" style="--accent:${phase.accent}"><span class="phase-number">${phase.number} / ${String(phase.topics.length).padStart(2, "0")}</span><h3>${phase.title}</h3><p>${phase.description}</p><div class="mini-progress"><i></i></div></article>`).join("");
}
function renderTopics(filter = "") {
  const shown = topics.filter((topic) => `${topic.title} ${topic.note}`.toLowerCase().includes(filter.toLowerCase()));
  $("#topicList").innerHTML = shown.length ? shown.map((topic, index) => `<div class="topic-row ${isComplete(topic.id) ? "complete" : ""}" data-topic="${topic.id}"><span class="topic-check">✓</span><span class="topic-number">${String(topics.indexOf(topic) + 1).padStart(2, "0")}</span><div class="topic-info"><span class="topic-title">${topic.title}</span><span class="topic-note">${topic.note}</span></div></div>`).join("") : `<p class="topic-empty">找不到符合的主題。</p>`;
}
function renderConcepts() {
  Object.entries(concepts).forEach(([key, items]) => { const target = document.querySelector(`#${key}Concepts`); if (target) target.innerHTML = items.map(([label, title, copy, accent]) => `<article class="concept-card" style="--accent:${accent}"><span class="concept-label">${label}</span><h3>${title}</h3><p>${copy}</p></article>`).join(""); });
}
function renderChecklists() {
  const target = $("#foundationsChecklist");
  const foundationTopics = topics.filter((topic) => topic.phase === "foundations");
  target.innerHTML = foundationTopics.map((topic) => `<div class="check-row ${isComplete(topic.id) ? "done" : ""}"><button data-topic="${topic.id}" aria-label="標記 ${topic.title}">${isComplete(topic.id) ? "✓" : ""}</button><span>${topic.title}</span></div>`).join("");
}
function renderAll() { renderPhases(); renderTopics($("#topicSearch")?.value || ""); renderConcepts(); renderChecklists(); renderProgress(); bindDynamic(); }
function showView(view) { const nextView = view || "overview"; state.activeView = nextView; $$(".view").forEach((node) => node.classList.toggle("active", node.id === `view-${nextView}`)); $$(".nav-item").forEach((node) => node.classList.toggle("active", node.dataset.view === nextView)); const labels = { overview: "OVERVIEW", foundations: "FOUNDATIONS", web: "WEB & API", data: "DATA", quality: "QUALITY", delivery: "DELIVERY", "git-lab": "GIT LAB" }; $("#breadcrumbCurrent").textContent = labels[nextView] || "OVERVIEW"; window.scrollTo({ top: 0, behavior: "smooth" }); $(".sidebar").classList.remove("open"); }
function bindDynamic() { $$("[data-topic]").forEach((node) => node.addEventListener("click", (event) => { event.stopPropagation(); toggleTopic(node.dataset.topic); })); $$("[data-view]").forEach((node) => node.addEventListener("click", () => showView(node.dataset.view))); }

let labStep = 0;
function runLab(action) {
  const output = $("#commandOutput");
  if (action === "branch" && labStep === 0) { labStep = 1; $(".third").classList.remove("hidden"); output.innerHTML = `<span class="prompt">$</span> git switch -c <b>feature/login</b><br /><span class="prompt">↳</span> 已從 main 切出功能分支。`; $("[data-action=commit]").disabled = false; }
  else if (action === "commit" && labStep === 1) { labStep = 2; $(".fourth").classList.remove("hidden"); output.innerHTML = `<span class="prompt">$</span> git add . && git commit -m <b>"add login form"</b><br /><span class="prompt">↳</span> 變更已被記錄，可以安全合併。`; $("[data-action=merge]").disabled = false; }
  else if (action === "merge" && labStep === 2) { labStep = 3; $(".fifth").classList.remove("hidden"); output.innerHTML = `<span class="prompt">$</span> git switch main && git merge feature/login<br /><span class="prompt">↳</span> <b>合併完成。</b> main 現在包含登入頁。`; $("#labComplete").classList.remove("hidden"); $(".scenario-count").textContent = "03 / 03"; markLabTopic(); }
}
function markLabTopic() { if (!isComplete("git")) { state.completed.push("git"); saveProgress(); renderAll(); showToast("Git 主題已標記完成"); } }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 2400); }

renderAll();
$("#topicSearch").addEventListener("input", (event) => renderTopics(event.target.value));
$("#resetProgress").addEventListener("click", () => { if (window.confirm("確定要清除所有學習進度嗎？")) { state.completed = []; saveProgress(); renderAll(); showToast("進度已重設"); } });
$("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
$$(".lab-action").forEach((button) => button.addEventListener("click", () => runLab(button.dataset.action)));
