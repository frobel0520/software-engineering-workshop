import { cliLesson, cliLessonSteps } from "./content";
import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";

export function CliLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="foundation-lesson-page"
      showMeta={false}
      moduleNumber="03"
      title={<>在工作目錄中<br /><em>讀懂命令列</em></>}
      description="先確認 cwd，再用命令列讀取檔案、搜尋線索與執行檢查。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="命令列教材">
        {cliLesson.sections.map((section, index) => {
          const step = cliLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "先讀懂輸出，再決定下一個命令。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>把命令列流程走一遍。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 CLI Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
