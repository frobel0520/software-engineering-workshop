import { TopicLessonShell } from "../../components/TopicShell";
import { schemaLesson, schemaLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function SchemaLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 11 / DATA"
      moduleNumber="11"
      title={<>先畫出關係<br /><em>再決定資料形狀</em></>}
      description="從 projects 與 tasks 的實體邊界開始，補上 primary key、foreign key、nullable 與完整性檢查。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="Schema 教材">
        {schemaLesson.sections.map((section, index) => {
          const step = schemaLessonSteps[index];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>SCHEMA</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "資料模型的完成條件是規則可被檢查。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">SCHEMA DESIGN LAB</p><h2>把需求整理成可靠的資料模型。</h2><p>{schemaLesson.objectives.length} 個學習目標 · 固定 projects／tasks fixture，不連線真實資料庫</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Schema Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
