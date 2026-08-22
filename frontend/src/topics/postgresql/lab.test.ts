import { describe, expect, it } from "vitest";
import { postgresqlLabHappyPath } from "./content";
import { postgresqlLabProgress } from "./lab";
import { createInitialPostgreSqlState, runPostgreSqlEvents } from "./simulator";

describe("PostgreSQL lab progress", () => {
  it("starts empty and reaches 100 after the happy path", () => {
    expect(postgresqlLabProgress(createInitialPostgreSqlState())).toBe(0);
    expect(postgresqlLabProgress(runPostgreSqlEvents(postgresqlLabHappyPath).state)).toBe(100);
  });
});
