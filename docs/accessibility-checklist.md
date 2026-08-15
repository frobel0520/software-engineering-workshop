# Accessibility Checklist

> 適用範圍：App shell、課程地圖、所有 Lesson、所有 Lab 與 Extension topics
> 對應 task：`CORE-007`
> 狀態：Draft

本清單是每個 ready topic 在 integration／release 前的共用驗收契約。它不取代瀏覽器與輔助技術的實測；每個 topic PR 應指出已驗證的 route、操作流程與例外。

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
