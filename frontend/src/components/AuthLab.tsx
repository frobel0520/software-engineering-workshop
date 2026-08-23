import { useMemo, useState } from "react";
import { authDemoSteps, authQuestions, demoConfig } from "../content/auth";
import { isCorrectAuthAnswer, nextDemoStep } from "../auth/simulator";

const options = ["Tenant ID", "Client ID", "Client secret Value", "Redirect URI", "Logout URI", "Authority URL", "OpenID Metadata URL"];

export function AuthLab({ onComplete }: { onComplete: () => void }) {
  const [questionStep, setQuestionStep] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [demoStep, setDemoStep] = useState(0);
  const configured = questionStep >= authQuestions.length;
  const demoComplete = demoStep >= authDemoSteps.length;
  const question = authQuestions[Math.min(questionStep, authQuestions.length - 1)];
  const correct = isCorrectAuthAnswer(questionStep, selected);
  const authority = useMemo(() => `https://login.microsoftonline.com/${demoConfig.tenantId}/v2.0`, []);
  const metadata = `${authority}/.well-known/openid-configuration`;

  function confirmAnswer() {
    if (!correct) return;
    setQuestionStep((value) => value + 1);
    setSelected(undefined);
  }

  function advanceDemo() {
    const next = nextDemoStep(demoStep);
    setDemoStep(next);
    if (next === authDemoSteps.length) onComplete();
  }

  function reset() {
    setQuestionStep(0);
    setSelected(undefined);
    setDemoStep(0);
  }

  const progress = configured ? 50 + (demoStep / authDemoSteps.length) * 50 : (questionStep / authQuestions.length) * 50;

  return (
    <div className="page auth-lab-page course-lab-shell">
      <header className="lab-header">
        <div><h1>組出一條<br /><em>可信任的登入路徑</em></h1></div>
        <div className="lab-progress"><span>{demoComplete ? "完成" : configured ? `DEMO ${demoStep + 1} / ${authDemoSteps.length}` : `CONFIG ${questionStep + 1} / ${authQuestions.length}`}</span><div><i style={{ width: `${progress}%` }} /></div></div>
      </header>

      <div className="auth-lab-grid">
        <section className="auth-request">
          <dl>
            <div><dt>tenant_id</dt><dd>{demoConfig.tenantId}</dd></div>
            <div><dt>client_id</dt><dd>{demoConfig.clientId}</dd></div>
            <div><dt>client_secret</dt><dd>{demoConfig.secret}</dd></div>
            <div><dt>redirect_uri</dt><dd>{demoConfig.redirectUri}</dd></div>
            <div><dt>logout_uri</dt><dd>{demoConfig.logoutUri}</dd></div>
            <div><dt>authority</dt><dd>{authority}</dd></div>
            <div><dt>metadata</dt><dd>{metadata}</dd></div>
          </dl>
        </section>

        <section className="auth-challenge">
          {!configured ? <>
            <h2>{question.prompt}</h2>
            <div className="auth-options">{options.map((option) => <button className={selected === option ? "selected" : ""} onClick={() => setSelected(option)} key={option}>{option}</button>)}</div>
            {selected && !correct ? <p className="auth-feedback error">欄位不符。</p> : <p className="auth-feedback">{correct ? "正確。" : "選擇一個欄位。"}</p>}
            <button className="button primary" disabled={!correct} onClick={confirmAnswer}>確認 <span>→</span></button>
          </> : !demoComplete ? <>
            <p className="kicker">OIDC AUTH CODE + PKCE</p>
            <div className="demo-step-number">{String(demoStep + 1).padStart(2, "0")}</div>
            <p className="demo-actor">{authDemoSteps[demoStep].actor}</p>
            <h2>{authDemoSteps[demoStep].title}</h2>
            <code className="demo-detail">{authDemoSteps[demoStep].detail}</code>
            <button className="button primary" onClick={advanceDemo}>{demoStep === authDemoSteps.length - 1 ? "完成 Demo" : "下一步"} <span>→</span></button>
          </> : <>
            <span className="auth-check">✓</span><h2>登入路徑完成</h2>
            <p className="demo-summary">App session 與 Entra session 分開存在；下一個 App 可重用 Entra session，形成 SSO。</p>
            <button className="button primary" onClick={reset}>重新操作</button>
          </>}
        </section>
      </div>
    </div>
  );
}
