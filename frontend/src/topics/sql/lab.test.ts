import { describe, expect, it } from "vitest";
import { sqlLabHappyPath } from "./content";
import { createInitialSqlState, runSqlEvents } from "./simulator";
import { sqlLabProgress } from "./lab";

describe("SQL lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(sqlLabProgress(createInitialSqlState())).toBe(0);
    expect(sqlLabProgress(runSqlEvents(sqlLabHappyPath).state)).toBe(100);
  });
});
