import { describe, expect, it } from "vitest";
import {
  postgresqlFailureFixtures,
  postgresqlLabHappyPath,
  postgresqlLabInitialState,
} from "./content";
import {
  createInitialPostgreSqlState,
  isPostgreSqlLabComplete,
  postgresqlSimulator,
  resetPostgreSqlLab,
  runPostgreSqlEvent,
  runPostgreSqlEvents,
} from "./simulator";

describe("PostgreSQL deterministic simulator", () => {
  it("starts before the psql session check", () => {
    expect(createInitialPostgreSqlState()).toEqual(postgresqlLabInitialState);
    expect(createInitialPostgreSqlState().session).toBeNull();
    expect(createInitialPostgreSqlState().plan).toBeNull();
    expect(createInitialPostgreSqlState().transactionStatus).toBe("idle");
  });

  it("completes the PostgreSQL workflow", () => {
    const result = runPostgreSqlEvents(postgresqlLabHappyPath);

    expect(result.accepted).toBe(true);
    expect(result.state.phase).toBe("completed");
    expect(result.state.completedStepIds).toHaveLength(7);
    expect(result.state.session?.database).toBe("workshop");
    expect(result.state.schemaReady).toBe(true);
    expect(result.state.returnedId).toBe(104);
    expect(result.state.jsonbMatchCount).toBe(2);
    expect(result.state.indexCreated).toBe(true);
    expect(result.state.plan?.operation).toBe("bitmap-index-scan");
    expect(result.state.transactionStatus).toBe("committed");
    expect(result.state.result?.id).toBe("commit-transaction");
    expect(isPostgreSqlLabComplete(result.state)).toBe(true);
  });

  it("blocks contract and commit checks until their prerequisites are complete", () => {
    const contract = runPostgreSqlEvent(createInitialPostgreSqlState(), { type: "define-contract" });
    const commit = runPostgreSqlEvent(createInitialPostgreSqlState(), { type: "commit-transaction" });

    expect(contract.accepted).toBe(false);
    expect(contract.state.phase).toBe("blocked");
    expect(contract.state.lastMessage).toContain("確認 psql session");
    expect(commit.accepted).toBe(false);
    expect(commit.state.lastMessage).toContain("EXPLAIN");
  });

  it("requires the GIN index before reading the indexed query plan", () => {
    const beforeIndex = runPostgreSqlEvents(postgresqlLabHappyPath.slice(0, 4)).state;
    const explain = runPostgreSqlEvent(beforeIndex, { type: "explain-query" });

    expect(explain.accepted).toBe(false);
    expect(explain.state.indexCreated).toBe(false);
    expect(explain.state.lastMessage).toContain("GIN index");
  });

  it("documents the main out-of-order failure fixtures", () => {
    expect(postgresqlFailureFixtures.map((fixture) => fixture.event)).toEqual([
      "define-contract",
      "insert-returning",
      "explain-query",
      "commit-transaction",
    ]);
  });

  it("resets and remains deterministic", () => {
    const first = runPostgreSqlEvents(postgresqlLabHappyPath);
    const second = runPostgreSqlEvents(postgresqlLabHappyPath);

    expect(first.state).toEqual(second.state);
    expect(first.results).toEqual(second.results);
    expect(resetPostgreSqlLab()).toEqual(createInitialPostgreSqlState());
    expect(postgresqlSimulator.reset()).toEqual(createInitialPostgreSqlState());
  });
});
