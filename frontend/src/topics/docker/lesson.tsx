import { TopicLessonShell } from "../../components/TopicShell";
import type { LessonOrientation } from "../types";
import { dockerLesson, dockerLessonSteps } from "./content";

export function DockerLesson({ completed, onOpenLab, orientation }: { completed: boolean; onOpenLab: () => void; orientation: LessonOrientation }) {
  return (
    <TopicLessonShell
      eyebrow="TOPIC 17 / DELIVERY"
      moduleNumber="17"
      title={<>把靜態 artifact 放進<br /><em>可重複的執行環境</em></>}
      description="從 Dockerfile 與 build context 到 image、container、host port 與 cleanup，理解一個 static site 如何被固定成可觀察的 runtime fixture。"
      orientation={orientation}
      completed={completed}
    >
      <section className="lesson-list" aria-label="Docker 基礎教材">
        {dockerLesson.sections.map((section, index) => {
          const step = dockerLessonSteps.find((candidate) => candidate.sectionId === section.id);
          return (
            <article className="lesson-card" key={section.id}>
              <div className="lesson-index"><span>{String(index + 1).padStart(2, "0")}</span><small>DOCKER</small></div>
              <div className="lesson-copy">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {step ? <code><span>$</span> {step.command}</code> : null}
              </div>
              <aside><small>記住這句</small><p>{step?.takeaway ?? "每個 runtime 結果都要連回一個清楚的 boundary。"}</p></aside>
            </article>
          );
        })}
      </section>

      <section className="lab-cta">
        <div><p className="kicker">DOCKER BASICS LAB</p><h2>讓 image、container 與 port 都留下證據。</h2><p>{dockerLesson.objectives.length} 個學習目標 · deterministic fixture，不啟動真實 Docker</p></div>
        <button className="button light" type="button" onClick={onOpenLab}>進入 DOCKER Lab <span>→</span></button>
      </section>
    </TopicLessonShell>
  );
}
