import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";
import { cicdLesson, cicdLessonSteps } from "./content";

export function CicdLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 18 / DELIVERY"
      moduleNumber="18"
      title={<>讓每次變更都經過<br /><em>同一條檢查線</em></>}
      description="從 workflow trigger、checkout、npm ci 到 test、lint、build 與 required check，理解 CI/CD 如何把可合併與 blocked 變成可觀察結論。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="CI/CD 教材">
        {cicdLesson.sections.map((section, index) => {
          const steps = cicdLessonSteps.filter((candidate) => candidate.sectionId === section.id);
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>CI/CD</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {steps.map((step) => <code key={step.id}><span>$</span> {step.command}</code>)}
              </div>
              <aside><small>記住這句</small><p>{steps[0]?.takeaway ?? "Pipeline 的結論要連回 trigger、gate 與 required check evidence。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">CI/CD PIPELINE LAB</p><h2>讓每個 gate 都留下結果。</h2><p>{cicdLesson.objectives.length} 個學習目標 · deterministic workflow，不連接真實 Actions</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 CI/CD Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
