import { FormEvent, useMemo, useState } from "react";
import { initialGitState, LAB_STEPS, runGitCommand, type GitState } from "../git/simulator";

interface TerminalEntry { command?: string; lines: string[]; accepted?: boolean }

export function GitLab({ onComplete }: { onComplete: () => void }) {
  const [git, setGit] = useState<GitState>(initialGitState);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<TerminalEntry[]>([
    { lines: ["Git Workshop sandbox v1", "Repository 已準備好。輸入第一個指令開始。"] },
  ]);
  const currentStep = LAB_STEPS[Math.min(git.step, LAB_STEPS.length - 1)];
  const progress = Math.round((git.step / LAB_STEPS.length) * 100);

  const branches = useMemo(() => ({
    main: git.commits.filter((commit) => commit.branch === "main"),
    feature: git.commits.filter((commit) => commit.branch === "feature/avatar"),
  }), [git.commits]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!command.trim() || git.complete) return;
    const result = runGitCommand(git, command);
    setGit(result.state);
    setHistory((items) => [...items, { command, lines: result.output, accepted: result.accepted }]);
    setCommand("");
    if (result.state.complete) onComplete();
  }

  function reset() {
    setGit(initialGitState());
    setCommand("");
    setHistory([{ lines: ["Sandbox 已重設。從 git status 重新開始。"] }]);
  }

  return (
    <div className="page lab-page">
      <header className="lab-header">
        <div><p className="kicker">INTERACTIVE LAB / GIT</p><h1>把一個功能<br /><em>安全合回 main</em></h1></div>
        <div className="lab-progress"><span>{git.complete ? "完成" : `${git.step} / ${LAB_STEPS.length}`}</span><div><i style={{ width: `${progress}%` }} /></div></div>
      </header>

      <div className="lab-layout">
        <section className="terminal-panel">
          <div className="terminal-top"><span className="terminal-dots"><i /><i /><i /></span><b>git-workshop — {git.branch}</b><button onClick={reset}>重設</button></div>
          <div className="terminal-output" aria-live="polite">
            {history.map((entry, index) => (
              <div className={`terminal-entry ${entry.accepted === false ? "error" : ""}`} key={`${index}-${entry.command ?? "system"}`}>
                {entry.command ? <p><span>❯</span> {entry.command}</p> : null}
                {entry.lines.map((line, lineIndex) => <small key={lineIndex}>{line}</small>)}
              </div>
            ))}
          </div>
          <form className="terminal-form" onSubmit={submit}>
            <label htmlFor="git-command">❯</label>
            <input
              id="git-command"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder={git.complete ? "Lab 已完成" : "輸入 Git 指令…"}
              autoComplete="off"
              spellCheck={false}
              disabled={git.complete}
            />
            <button disabled={!command.trim() || git.complete}>執行</button>
          </form>
        </section>

        <aside className="mission-panel">
          <p className="kicker">CURRENT MISSION</p>
          {git.complete ? (
            <div className="mission-complete"><span>✓</span><h2>合併完成</h2><p>你完成了一次可追溯的功能開發流程。</p><button className="button primary" onClick={reset}>再練一次</button></div>
          ) : (
            <>
              <span className="mission-number">{String(git.step + 1).padStart(2, "0")}</span>
              <h2>{currentStep.hint}</h2>
              <button className="command-chip" onClick={() => setCommand(currentStep.command)}><code>{currentStep.command}</code><span>填入</span></button>
              <p className="mission-note">提示只會填入指令，仍要由你執行。</p>
            </>
          )}

          <div className="repo-state">
            <div><small>BRANCH</small><b>{git.branch}</b></div>
            <div><small>WORKING</small><b>{git.workingFile ?? "clean"}</b></div>
            <div><small>STAGED</small><b>{git.stagedFile ?? "empty"}</b></div>
          </div>
        </aside>
      </div>

      <section className="history-panel">
        <div className="section-heading"><div><p className="kicker">LIVE HISTORY</p><h2>Commit graph</h2></div><p>指令成功後，分支指標與歷史會立即更新。</p></div>
        <div className="commit-graph">
          <div className="graph-row"><b>main</b><div className="graph-line main-line">{branches.main.map((commit) => <span className="commit-node" key={commit.id}><i>{commit.id}</i><small>{commit.message}</small></span>)}</div></div>
          <div className="graph-row"><b>feature/avatar</b><div className="graph-line feature-line">{branches.feature.length ? branches.feature.map((commit) => <span className="commit-node feature" key={commit.id}><i>{commit.id}</i><small>{commit.message}</small></span>) : <em>尚未建立</em>}</div></div>
        </div>
      </section>
    </div>
  );
}
