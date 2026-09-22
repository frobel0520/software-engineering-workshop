import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";
import { deployLesson, deployLessonSteps } from "./content";

export function DeployLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="course-lesson-page"
      showMeta={false}
      moduleNumber="19"
      title={<>把通過驗證的版本交付到<br /><em>可觀測的網站</em></>}
      description="從 main release、CI artifact 與 Pages base path，到 gh-pages publish、live probe、release record 與 rollback，理解部署如何留下完整的 evidence chain。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="部署教材">
        {deployLesson.sections.map((section, index) => {
          const step = deployLessonSteps.find((candidate) => candidate.sectionId === section.id);
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "每個部署結果都要連回一個清楚的 release boundary。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>讓 publish、probe 與 rollback 都留下證據。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 DEPLOY Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
