import { describe, expect, it } from "vitest";
import {
  completionKeyFor,
  createLocalStorageProgressRepository,
  PROTECTED_COMPLETION_KEYS,
} from "./repository";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("ProgressRepository", () => {
  it("reads, marks and clears topic completion", () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageProgressRepository(storage);

    expect(repository.read("guardrail")).toBe(false);

    repository.markComplete("guardrail");
    expect(storage.getItem("se-workshop-guardrail-complete")).toBe("true");
    expect(repository.read("guardrail")).toBe(true);

    repository.clear("guardrail");
    expect(repository.read("guardrail")).toBe(false);
  });

  it("keeps the existing Git and Auth completion keys stable", () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageProgressRepository(storage);

    storage.setItem(PROTECTED_COMPLETION_KEYS.git, "true");
    storage.setItem(PROTECTED_COMPLETION_KEYS.auth, "true");

    expect(completionKeyFor("git")).toBe("se-workshop-git-complete");
    expect(completionKeyFor("auth")).toBe("se-workshop-auth-complete");
    expect(repository.read("git")).toBe(true);
    expect(repository.read("auth")).toBe(true);

    repository.markComplete("git");
    repository.markComplete("auth");
    expect(storage.getItem(PROTECTED_COMPLETION_KEYS.git)).toBe("true");
    expect(storage.getItem(PROTECTED_COMPLETION_KEYS.auth)).toBe("true");
  });

  it("rejects invalid topic ids before touching storage", () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageProgressRepository(storage);

    expect(() => repository.read("../auth")).toThrow("Invalid topic id");
    expect(() => repository.markComplete(" ")).toThrow("Invalid topic id");
    expect(storage.getItem("se-workshop-auth-complete")).toBe(null);
  });
});
