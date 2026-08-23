import type { ProgressRepository } from "../progress/repository";

export function createMemoryProgressRepository(
  completedTopicIds: readonly string[] = [],
): ProgressRepository {
  const completed = new Set(completedTopicIds);

  return {
    read: (topicId) => completed.has(topicId),
    markComplete: (topicId) => completed.add(topicId),
    clear: (topicId) => completed.delete(topicId),
  };
}
