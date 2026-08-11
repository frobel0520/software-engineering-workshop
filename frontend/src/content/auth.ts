export const authFields = [
  ["Tenant ID", "哪一個目錄", "登入政策與帳號邊界"],
  ["Client ID", "哪一個應用程式", "公開識別碼，不是密碼"],
  ["Client secret Value", "應用程式的憑證", "只供機密用戶端保存"],
  ["Redirect URI", "登入完成回哪裡", "必須與註冊值相符"],
  ["Logout URI", "登出流程使用哪個 URI", "區分 post-logout redirect 與 front-channel URL"],
  ["Authority URL", "向誰要求登入", "由雲端主機與 tenant 組成"],
  ["OpenID Metadata URL", "協定端點在哪裡", "提供 issuer、endpoints、jwks_uri"],
] as const;

export const demoConfig = {
  tenantId: "12345678-1234-1234-1234-123456789012",
  clientId: "87654321-4321-4321-4321-210987654321",
  secret: "[SAMPLE_SECRET_VALUE_DO_NOT_USE]",
  redirectUri: "https://app.example.invalid/auth/callback",
  logoutUri: "https://app.example.invalid/signed-out",
} as const;

export const authQuestions = [
  { prompt: "限制哪一個目錄的帳號？", answer: "Tenant ID" },
  { prompt: "登入請求代表哪一個 App？", answer: "Client ID" },
  { prompt: "後端如何證明 App 身分？", answer: "Client secret Value" },
  { prompt: "登入完成後回到哪個 endpoint？", answer: "Redirect URI" },
  { prompt: "post-logout redirect 應設定在哪個欄位？", answer: "Logout URI" },
  { prompt: "SDK 的信任起點是哪個 URL？", answer: "Authority URL" },
  { prompt: "哪個 URL 公布 endpoints 與 signing keys？", answer: "OpenID Metadata URL" },
] as const;

export const authDemoSteps = [
  { actor: "APP", title: "建立登入請求", detail: "client_id · redirect_uri · scope · state · nonce · code_challenge" },
  { actor: "ENTRA", title: "驗證使用者", detail: "登入、MFA、Conditional Access；建立 Entra session" },
  { actor: "BROWSER", title: "帶回 authorization code", detail: "redirect_uri?code=…&state=…" },
  { actor: "SERVER", title: "交換 Token", detail: "code · redirect_uri · code_verifier · client_secret" },
  { actor: "APP", title: "建立 App session", detail: "驗證 ID token；Access token 只交給 API" },
] as const;
