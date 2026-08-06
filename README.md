# Software Engineering Workshop

給自己的軟體工程基礎練習場，部署目標是 GitHub Pages。

目前第一版包含：

- 五條學習路線與 19 個主題：開發基本功、Web 與 API、資料庫、品質與可觀測性、交付與部署。
- 瀏覽器本機進度保存與主題搜尋。
- Git 互動 Lab：branch → commit → merge。
- 純靜態 HTML/CSS/JavaScript，不需要後端或資料庫。

## 本機預覽

直接用瀏覽器開啟 `site/index.html`，或使用任何靜態檔案伺服器提供 `site/` 資料夾。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 會在 push 到 `main` 時自動把 `site/` 發布到 GitHub Pages。第一次使用時，GitHub Actions 會自動啟用 Pages deployment。
