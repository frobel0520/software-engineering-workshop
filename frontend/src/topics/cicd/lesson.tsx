import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";
import { cicdLesson, cicdLessonSteps } from "./content";

export function CicdLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="course-lesson-page"
      showMeta={false}
      moduleNumber="18"
      title={<>讓每次變更都經過<br /><em>可重跑的檢查線</em></>}
      description="從 workflow trigger、source checkout 與 lockfile install，到 test／lint／build、required check 與 merge gate，理解一條 CI pipeline 如何留下可追蹤的 failure boundary。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="CI/CD 教材">
        {cicdLesson.sections.map((section, index) => {
          const step = cicdLessonSteps.find((candidate) => candidate.sectionId === section.id);
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "每個 pipeline 結果都要連回一個清楚的 gate boundary。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>讓 workflow、failure 與 merge gate 都留下證據。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 CI/CD Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
