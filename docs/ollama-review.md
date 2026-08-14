# 本機 Ollama AI review

GitHub Actions 只負責測試、lint 與 build。AI review 在本機執行，不需要 AWS，也不會把原始碼送到第三方 API。

## 第一次設定

1. 安裝並啟動 Ollama。
2. 下載 reviewer model：

   ```powershell
   ollama pull qwen2.5-coder:14b
   ```

3. 確認 Ollama API 可用：

   ```powershell
   Invoke-RestMethod http://127.0.0.1:11434/api/tags
   ```

## 執行 review

在 feature branch 上，先更新遠端分支，再執行：

```powershell
git fetch origin
cd frontend
npm run review
```

reviewer 會優先比較 `origin/dev`，找不到時使用 `origin/main`。也可以指定比較基準：

```powershell
$env:REVIEW_BASE = "origin/main"
npm run review
```

預設模型是 `qwen2.5-coder:14b`。需要更換模型時：

```powershell
$env:OLLAMA_MODEL = "你的 Ollama model tag"
npm run review
```

AI review 是 advisory feedback；是否能合併仍由 GitHub Actions 的 test、lint、build 決定。
