import { TopicLessonShell } from "../../components/TopicShell";
import { unitLesson, unitLessonSteps } from "./content";
import type { LessonOrientation } from "../types";

export function UnitLesson({
  completed,
  onOpenLab,
  orientation,
}: {
  completed: boolean;
  onOpenLab: () => void;
  orientation: LessonOrientation;
}) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 13 / QUALITY"
      moduleNumber="13"
      title={<>讓錯誤在最小範圍內被看見<br /><em>再用測試鎖住行為</em></>}
      description="從 unit boundary、Arrange／Act／Assert 開始，走過 red、green、edge case 與 regression suite。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="單元測試教材">
        {unitLesson.sections.map((section, sectionIndex) => {
          const step = unitLessonSteps[sectionIndex];
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(sectionIndex + 1).padStart(2, "0")}</span><small>UNIT</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>→</span> {step.code}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "先選定可觀察的行為，再讓測試保護它。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">UNIT TESTING LAB</p><h2>把 red → green → regression 跑成一條快速回饋。</h2><p>{unitLesson.objectives.length} 個學習目標 · 固定 order-total fixture，不執行真實程式碼</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 Unit Testing Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
