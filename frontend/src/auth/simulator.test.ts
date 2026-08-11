import { describe, expect, it } from "vitest";
import { authDemoSteps, authQuestions } from "../content/auth";
import { isCorrectAuthAnswer, nextDemoStep } from "./simulator";

describe("auth simulator", () => {
  it("accepts only the configured field for each question", () => {
    authQuestions.forEach((question, index) => {
      expect(isCorrectAuthAnswer(index, question.answer)).toBe(true);
      expect(isCorrectAuthAnswer(index, "Client ID")).toBe(question.answer === "Client ID");
    });
  });

  it("stops after the final demo step", () => {
    expect(nextDemoStep(0)).toBe(1);
    expect(nextDemoStep(authDemoSteps.length)).toBe(authDemoSteps.length);
  });
});
