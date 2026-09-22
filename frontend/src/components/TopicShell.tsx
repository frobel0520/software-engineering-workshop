import type { ReactNode } from "react";
import type { LessonOrientation } from "../topics/types";

export function TopicOrientation({ orientation, showMeta = true }: { orientation: LessonOrientation; showMeta?: boolean }) {
  const cards = [
    ["What", orientation.what],
    ["Why", orientation.why],
    ["When", orientation.when],
    ["How", orientation.how],
  ] as const;

  return (
    <section className="lesson-orientation" aria-labelledby="lesson-orientation-title">
      <div className="section-heading">
        <div>
          {showMeta ? <p className="kicker">START HERE</p> : null}
          <h2 id="lesson-orientation-title">先回答四個問題</h2>
        </div>
        {showMeta ? <p>先知道它解決什麼問題，再進入操作與細節。</p> : null}
      </div>
      <div className="orientation-grid">
        {cards.map(([label, answer]) => (
          <article className="orientation-card" key={label}>
            <div><strong>{label}</strong></div>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface TopicLessonShellProps {
  eyebrow?: string;
  className?: string;
  showMeta?: boolean;
  title: ReactNode;
  description: ReactNode;
  orientation: LessonOrientation;
  moduleNumber?: string;
  completed: boolean;
  children: ReactNode;
}

export function TopicLessonShell({
  eyebrow,
  className,
  showMeta = true,
  title,
  description,
  orientation,
  moduleNumber = "01",
  completed,
  children,
}: TopicLessonShellProps) {
  return (
    <div className={`page lesson-page topic-lesson-shell${className ? ` ${className}` : ""}`}>
      <header className="lesson-hero">
        <div>
          {showMeta && eyebrow ? <p className="kicker">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className={`module-status ${completed ? "done" : ""}`} aria-label={completed ? "主題已完成" : "主題學習中"}>
          <span aria-hidden="true">{completed ? "✓" : moduleNumber}</span>
          <div>{showMeta ? <small>MODULE STATUS</small> : null}<b>{completed ? "已完成" : "學習中"}</b></div>
        </div>
      </header>
      <section className="topic-lesson-content">
        <TopicOrientation orientation={orientation} showMeta={showMeta} />
        {children}
      </section>
    </div>
  );
}

export interface TopicLabShellProps {
  eyebrow?: string;
  className?: string;
  showMeta?: boolean;
  title: ReactNode;
  progressLabel: string;
  progress: number;
  onReset: () => void;
  children: ReactNode;
}

export function TopicLabShell({
  eyebrow,
  className,
  showMeta = true,
  title,
  progressLabel,
  progress,
  onReset,
  children,
}: TopicLabShellProps) {
  const boundedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`page lab-page topic-lab-shell${className ? ` ${className}` : ""}`}>
      <header className="lab-header">
        <div>{showMeta && eyebrow ? <p className="kicker">{eyebrow}</p> : null}<h1>{title}</h1></div>
        <div className="lab-progress" role="progressbar" aria-label="Lab 進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedProgress}>
          <span>{progressLabel}</span>
          <div><i style={{ width: `${boundedProgress}%` }} /></div>
        </div>
      </header>
      <div className="topic-lab-actions">
        <button className="button secondary" type="button" onClick={onReset}>重設 Lab</button>
      </div>
      <section className="topic-lab-content">{children}</section>
    </div>
  );
}

export type TopicStatusTone = "neutral" | "error" | "success";

export function TopicStatusFeedback({ tone = "neutral", message }: { tone?: TopicStatusTone; message: string }) {
  return <p className={`topic-status-feedback ${tone}`} role={tone === "error" ? "alert" : undefined} aria-live="polite">{message}</p>;
}

export function TopicCompletionCard({ title, description, onReset }: { title: string; description: string; onReset?: () => void }) {
  return (
    <div className="topic-completion" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {onReset ? <button className="button primary" type="button" onClick={onReset}>再練一次</button> : null}
    </div>
  );
}
