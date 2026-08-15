import type { ReactNode } from "react";

export interface TopicLessonShellProps {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  moduleNumber?: string;
  completed: boolean;
  children: ReactNode;
}

export function TopicLessonShell({
  eyebrow,
  title,
  description,
  moduleNumber = "01",
  completed,
  children,
}: TopicLessonShellProps) {
  return (
    <div className="page lesson-page topic-lesson-shell">
      <header className="lesson-hero">
        <div>
          <p className="kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className={`module-status ${completed ? "done" : ""}`} aria-label={completed ? "主題已完成" : "主題學習中"}>
          <span aria-hidden="true">{completed ? "✓" : moduleNumber}</span>
          <div><small>MODULE STATUS</small><b>{completed ? "已完成" : "學習中"}</b></div>
        </div>
      </header>
      <section className="topic-lesson-content">{children}</section>
    </div>
  );
}

export interface TopicLabShellProps {
  eyebrow: string;
  title: ReactNode;
  progressLabel: string;
  progress: number;
  onReset: () => void;
  children: ReactNode;
}

export function TopicLabShell({
  eyebrow,
  title,
  progressLabel,
  progress,
  onReset,
  children,
}: TopicLabShellProps) {
  const boundedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="page lab-page topic-lab-shell">
      <header className="lab-header">
        <div><p className="kicker">{eyebrow}</p><h1>{title}</h1></div>
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
