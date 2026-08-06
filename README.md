# Software Engineering Workshop

一個可以動手操作、也可以逐章擴充的軟體工程教材站。

目前只完成第一個主題：**Git**。其餘 18 個主題保留在課程路線圖，尚未假裝成已完成內容。

## Git 單元

- 三段短教材：版本、暫存區、分支與合併。
- 指令式 Git Lab：親自輸入 `git status`、`git add`、`git commit`、`git switch` 與 `git merge`。
- 確定性的瀏覽器模擬引擎，不會動到使用者電腦上的真實 repository。
- 進度保存在瀏覽器；完成 Lab 後才會標記 Git 主題完成。

## 本機啟動

```bash
cd frontend
npm install
npm run dev
```

開啟 http://localhost:5173。

## 驗證

```bash
cd frontend
npm test
npm run build
```

CI 會執行測試、TypeScript 型別檢查與正式建置。GitHub Pages workflow 會發布 `frontend/dist`。

## 架構

| 路徑 | 內容 |
| --- | --- |
| `shared/curriculum.json` | 19 個主題的唯一課程清單與完成狀態 |
| `frontend/src/content/` | 已完成教材內容 |
| `frontend/src/git/` | 可測試的 Git 模擬狀態機 |
| `frontend/src/components/` | 路線圖、教材與實驗場 UI |
| `.github/workflows/ci.yml` | 測試與正式建置 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 發布 |
