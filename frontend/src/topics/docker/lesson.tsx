import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";
import { dockerLesson, dockerLessonSteps } from "./content";

export function DockerLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      className="course-lesson-page"
      showMeta={false}
      moduleNumber="17"
      title={<>把靜態 artifact 放進<br /><em>可重複的執行環境</em></>}
      description="從 Dockerfile 與 build context 到 image、container、host port 與 cleanup，理解一個 static site 如何成為可觀察的 runtime。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="Docker 基礎教材">
        {dockerLesson.sections.map((section, index) => {
          const step = dockerLessonSteps.find((candidate) => candidate.sectionId === section.id);
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><p>{step?.takeaway ?? "每個 runtime 結果都要連回一個清楚的 boundary。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><h2>讓 image、container 與 port 都留下證據。</h2></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 DOCKER Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
