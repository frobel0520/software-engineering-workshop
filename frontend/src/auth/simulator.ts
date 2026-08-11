import { authDemoSteps, authQuestions } from "../content/auth";

export function isCorrectAuthAnswer(step: number, answer: string | undefined): boolean {
  return authQuestions[step]?.answer === answer;
}

export function nextDemoStep(step: number): number {
  return Math.min(step + 1, authDemoSteps.length);
}
