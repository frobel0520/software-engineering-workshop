export interface ProgressRepository {
  read(topicId: string): boolean;
  markComplete(topicId: string): void;
  clear(topicId: string): void;
}

export const PROTECTED_COMPLETION_KEYS = {
  git: "se-workshop-git-complete",
  auth: "se-workshop-auth-complete",
} as const;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const topicIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isProtectedTopicId(topicId: string): topicId is keyof typeof PROTECTED_COMPLETION_KEYS {
  return topicId === "git" || topicId === "auth";
}

export function completionKeyFor(topicId: string): string {
  const normalizedTopicId = topicId.trim();
  if (!topicIdPattern.test(normalizedTopicId)) {
    throw new Error(`Invalid topic id: ${topicId}`);
  }

  if (isProtectedTopicId(normalizedTopicId)) {
    return PROTECTED_COMPLETION_KEYS[normalizedTopicId];
  }

  return `se-workshop-${normalizedTopicId}-complete`;
}

export function createLocalStorageProgressRepository(
  storage: StorageLike = window.localStorage,
): ProgressRepository {
  return {
    read(topicId) {
      return storage.getItem(completionKeyFor(topicId)) === "true";
    },
    markComplete(topicId) {
      storage.setItem(completionKeyFor(topicId), "true");
    },
    clear(topicId) {
      storage.removeItem(completionKeyFor(topicId));
    },
  };
}
