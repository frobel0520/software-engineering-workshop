# BUILD-01：建置工具驗收

## 教學邊界

本主題只用固定 fixture，不執行真實部署、不修改 GitHub Pages，也不把 `dist/` 當成 source。學習重點是 TypeScript gate、Vite production bundle、公開 base path、artifact 檢查與 preview。

本專案的 build script 是 `tsc -b && vite build`。TypeScript 的 `tsc -b` 會依 build mode 處理專案建置；Vite 的 `vite build` 會產出可由 static hosting 服務的 bundle。參考：[TypeScript Build Mode](https://www.typescriptlang.org/docs/handbook/project-references#build-mode-for-typescript) 與 [Vite Building for Production](https://vite.dev/guide/build.html)。

## Happy path

```text
cat package.json
  → npm run lint
  → VITE_BASE=/software-engineering-workshop/ npm run build
  → ls dist
  → npm run preview
  → BUILD complete
```

## 必須看見的狀態

- `lint` 是 TypeScript gate；先擋住 source 層的型別錯誤。
- `build` 產出 `dist/index.html` 與 hashed assets。
- `VITE_BASE=/software-engineering-workshop/` 對應 GitHub Pages project site 的 nested path。
- `preview` 服務 `dist/`，不是 dev server，也不是 production server。
- `dist/` 是可發布 artifact，不應被當成手寫 source。

## 失敗情境

- 尚未檢查 script 就執行 `npm run lint`：阻擋並提示先確認 build 契約。
- 尚未通過 TypeScript gate 就執行 build：阻擋並提示先完成 gate。
- 尚未產生 dist 就檢查或 preview：阻擋並提示先完成 production build。

## 完成條件

所有 5 個步驟完成，`typecheckState === "passed"`、`bundleState === "created"`、`artifactState === "verified"`、`previewState === "running"`，並將 `build` 標記為 Core ready。
