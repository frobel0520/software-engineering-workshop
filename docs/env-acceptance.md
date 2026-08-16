# ENV-01：環境變數驗收

## 教學邊界

本主題只用固定 fixture，不讀取使用者真實的 `.env`，也不把任何值送到外部服務。學習重點是設定來源、Vite mode、client bundle 公開邊界、fail-fast 驗證與 git 保護。

Vite 官方規則：`VITE_` 變數會在 bundling 後暴露到 client source，所有值會以字串注入；因此 `VITE_*` 不得放 API key、token 或密碼。參考：[Vite Env Variables and Modes](https://vite.dev/guide/env-and-mode)。

## Happy path

```text
cat .env.example
  → cp .env.example .env.local
  → npm run check-config
  → npm run check-exposure
  → git check-ignore .env.local
  → ENV complete
```

## 必須看見的狀態

- `.env.example` 是可提交的設定名稱範本。
- `.env.local` 是本地覆寫，修改後需要重啟 Vite。
- `VITE_API_BASE_URL`、`VITE_FEATURE_FLAG` 屬 client 可見設定。
- `DATABASE_PASSWORD` 屬 server-only，不能進 client bundle。
- `.env.local` 被 `.gitignore` 排除。

## 失敗情境

- 尚未載入 `.env.local` 就執行 `npm run check-config`：阻擋並提示先載入。
- 尚未通過 validate 就執行 `npm run check-exposure`：阻擋並提示先檢查必要 key。
- 尚未確認 bundle 邊界就執行 `git check-ignore .env.local`：阻擋並提示先完成公開邊界檢查。

## 完成條件

所有 5 個步驟完成，`configState === "valid"`、`exposureState === "verified"`、`localIgnored === true`，並將 `env` 標記為 Core ready。
