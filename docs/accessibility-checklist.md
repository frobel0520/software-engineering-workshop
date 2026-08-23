# Accessibility Checklist

> 適用範圍：App shell、課程地圖、所有 Lesson、所有 Lab 與 Extension topics
> 對應 task：`CORE-007`
> 狀態：Contract ready；完整 accessibility audit pending

本清單是每個 ready topic 在 integration／release 前的共用驗收契約。它不取代瀏覽器與輔助技術的實測；每個 topic PR 應指出已驗證的 route、操作流程與例外。

## 最近驗證紀錄

### 2026-08-16：頁面流通 smoke test

- 6 個 Track 頁面均可返回課程地圖。
- 7 個已開放 Lesson 均可進入對應 Lab，再返回課程地圖。
- 7 個已開放 Lab 均可返回課程地圖。
- planned 與未知 topic route 會回到課程地圖；瀏覽器 Console 無錯誤。

這次只確認 route reachability 與離開路徑，不宣稱已完成鍵盤、200% zoom、窄 viewport、讀屏工具或 reduced-motion 的完整驗收。

### 2026-08-16：Git topic release review completed

- Git Lesson → Git Lab、Lab error feedback、Lab reset、Lab → 課程地圖已完成瀏覽器 smoke check。
- Desktop 1280px 無水平溢出；Git Lab 的 native controls、`aria-live`／`role="alert"` 狀態回饋與 `progressbar` 語意已確認。
- 375px 下 Git Lesson／Git Lab 無水平溢出，mobile menu 可開關，Git Lab 的 reset、terminal input 與 17 個 workflow controls 可見；640px 等效 200% zoom viewport 也無水平溢出。
- `styles.css` 已確認含 `max-width: 720px` responsive rules 與 `prefers-reduced-motion` rules。
- 手動驗收已通過：使用實體鍵盤確認 `Tab`／`Enter`／`Space` 可操作 Lesson／Lab controls，terminal submit、reset、錯誤回饋與返回課程地圖流程可完成；reduced-motion 偏好下內容與操作仍完整。`GIT-REVIEW` 已通過。

### 2026-08-23：M6 delivery topic browser smoke

- CI/CD Lesson → Lab route 與 Deploy Lesson → Lab route 可達；兩個 Lab 的 native buttons、command input、`aria-live` feedback、progressbar 與 reset 都存在。
- CI/CD 已驗證 green pipeline 與 test failure；failure state 保留 `lint`／`build: not-run`、required check failed 與 merge gate blocked。
- Deploy 已驗證 green release、artifact blocked、probe failure → rollback、release record、Pages pointer 與 reset/replay completion。
- CI/CD、Deploy 在 390×844 viewport 下 document width 為 375，mobile menu 可開關，command input 可取得 focus；兩個 topic styles 都含 `prefers-reduced-motion` rule。
- M6 full regression：83 test files / 265 tests、TypeScript lint、GitHub Pages base-path build 與 `git diff --check` 通過。完整 release 結論見 [`release-audit.md`](./release-audit.md)。

## 1. Keyboard 與焦點

- [ ] 所有互動控制項都能以 `Tab`、`Shift+Tab`、`Enter` 或 `Space` 操作。
- [ ] 焦點指示清楚可見，不只依賴顏色或 hover。
- [ ] mobile menu 開啟後，焦點能進入 menu；關閉後回到 menu button。
- [ ] route 切換後，焦點移到新頁面的主要標題或內容起點。
- [ ] Lab reset、submit、選項與錯誤回饋不需要拖曳或精準滑鼠操作。
- [ ] 沒有 keyboard trap；使用者可以離開每一個 dialog、menu 或互動區。

## 2. 語意與讀屏資訊

- [ ] 頁面有唯一且有意義的 `h1`，標題階層沒有跳級。
- [ ] 導航使用 `nav`，主要內容使用 `main`，補充資訊使用適當的 landmark。
- [ ] button、link、input 使用原生語意，不以可點擊 `div` 取代。
- [ ] icon-only control 有可理解的 accessible name。
- [ ] Lab 的目前步驟、完成狀態與錯誤訊息能被讀屏工具理解。
- [ ] 裝飾圖示與背景圖不會重複朗讀；必要資訊不只存在圖示或顏色中。

## 3. Live region 與狀態回饋

- [ ] Lab 成功、失敗、reset 與完成狀態有可讀文字。
- [ ] 動態訊息使用適當的 `aria-live`，不會每次 render 重複朗讀整個區塊。
- [ ] 錯誤訊息說明「發生什麼事」與「下一步怎麼做」。
- [ ] disabled control 有可理解的原因，不讓使用者只看到不能按。
- [ ] 非同步或長時間操作有開始、完成與失敗回饋；Phase 1 simulator 不假裝正在呼叫真實服務。

## 4. 視覺、響應式與動作

- [ ] 文字與背景達到可讀對比；資訊不只用紅／綠／顏色區分。
- [ ] 放大至 200% 或較窄 viewport 時，主要 Lesson／Lab 仍可操作。
- [ ] mobile menu、表格、terminal、錯誤訊息不會水平溢出或被裁切。
- [ ] `prefers-reduced-motion` 下不依賴動畫傳達必要資訊。
- [ ] focus、hover、active、disabled、error、success 狀態均有可辨識差異。

## 5. Topic Lab 特別檢查

每個 ready topic PR 都要記錄：

| 項目 | 驗收內容 | 結果／備註 |
| --- | --- | --- |
| Lesson route | 鍵盤進入、標題焦點、內容順序 | |
| Lab route | 初始狀態、操作中、錯誤、完成、reset | |
| Keyboard path | 從第一個控制項到完成條件的完整路徑 | |
| Live feedback | 成功／失敗／完成是否只朗讀必要訊息 | |
| Mobile | 窄 viewport 下仍能完成 Lab | |
| Reduced motion | 關閉動畫後資訊與操作仍完整 | |

## 6. 驗證層級

- PR review：檢查語意 HTML、focus path、錯誤文字與 topic-specific 例外。
- Automated checks：保留 simulator、completion、route 與 progress tests；必要時補 accessibility assertion。
- Manual browser check：鍵盤、窄 viewport、200% zoom、reduced motion。
- Release audit：`RELEASE-004` 彙整 19 個 Core topics 與所有已開放 Extension topics 的結果。

## 7. 完成定義

CORE-007 完成後，新增 topic 的 Ready／Done 模板必須引用本清單；任何未通過項目都要列出原因、替代驗收或後續 issue，不得以「視覺上正常」代替可及性驗收。
