import { TopicLessonShell } from "../../components/TopicShell";
import { buildLesson, buildLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function BuildLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 07 / FOUNDATIONS"
      moduleNumber="07"
      title={<>把 source 變成<br /><em>可以交付的產品</em></>}
      description="從 TypeScript gate、Vite production bundle 到 dist preview，理解 source、artifact、base path 與靜態部署的關係。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="建置工具教材">
        {buildLesson.sections.map((section, index) => {
          const step = buildLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>BUILD</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "Build 的終點不是指令成功，而是 artifact 能被正確服務。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">BUILD TOOLING LAB</p><h2>把 artifact 交到正確位置。</h2><p>{buildLesson.objectives.length} 個學習目標 · 不執行真實部署</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 BUILD Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
