import { authFields, demoConfig } from "../content/auth";

export function AuthLesson({ completed, onOpenLab }: { completed: boolean; onOpenLab: () => void }) {
  return (
    <div className="page auth-page">
      <header className="lesson-hero auth-hero">
        <div>
          <p className="kicker">MODULE 02 / WEB & API</p>
          <h1>Auth：把信任<br /><em>接到正確的位置</em></h1>
          <p>Entra ID 是服務，OIDC 是協定，SSO 是結果。</p>
        </div>
        <div className="auth-hero-actions">
          <div className={`module-status ${completed ? "done" : ""}`}><span>{completed ? "✓" : "02"}</span><div><small>MODULE STATUS</small><b>{completed ? "已完成" : "學習中"}</b></div></div>
          <a className="button auth-deck-link" href={`${import.meta.env.BASE_URL}entra-oidc-sso-deck.html`}>開啟簡報 <span>→</span></a>
        </div>
      </header>

      <section className="auth-model" aria-label="OIDC 設定關係">
        <div className="auth-node"><small>DIRECTORY</small><strong>Tenant ID</strong><code>{demoConfig.tenantId}</code></div>
        <i>→</i>
        <div className="auth-node active"><small>APPLICATION</small><strong>Client ID</strong><code>{demoConfig.clientId}</code></div>
        <i>→</i>
        <div className="auth-node"><small>CALLBACK</small><strong>Redirect URI</strong><code>{demoConfig.redirectUri}</code></div>
      </section>

      <section className="auth-field-list">
        {authFields.map(([name, question, answer], index) => (
          <article key={name}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{name}</h2>
            <p>{question}</p>
            <b>{answer}</b>
          </article>
        ))}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">CONFIGURATION LAB</p><h2>把七個值放回登入流程。</h2></div>
        <button className="button light" onClick={onOpenLab}>進入 Auth Lab <span>→</span></button>
      </section>
    </div>
  );
}
