import { cliLesson, cliLessonSteps } from "./content";
import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";

export function CliLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 03 / FOUNDATIONS"
      moduleNumber="03"
      title={<>在固定工作目錄中<br /><em>讀懂命令列</em></>}
      description="先確認 cwd，再用固定 fixture 讀取檔案、搜尋線索與執行檢查；錯誤不會碰到真實檔案，reset 後可以重複練習。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="命令列教材">
        {cliLesson.sections.map((section, index) => {
          const step = cliLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>CLI</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "先讀懂輸出，再決定下一個命令。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">COMMAND LINE LAB</p><h2>把命令列流程走一遍。</h2><p>{cliLesson.objectives.length} 個學習目標 · 不碰真實 shell 或檔案系統</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 CLI Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
