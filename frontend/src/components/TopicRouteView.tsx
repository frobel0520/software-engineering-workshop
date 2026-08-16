import type { RouteDefinition } from "../routes/registry";
import { getTopicViewModule } from "../topics/registry";

export interface TopicRouteViewProps {
  route: RouteDefinition;
  completed: boolean;
  onOpenLab: () => void;
  onComplete: () => void;
}

export function TopicRouteView({ route, completed, onOpenLab, onComplete }: TopicRouteViewProps) {
  const topicModule = getTopicViewModule(route.topicId);
  if (!topicModule) return null;

  if (route.kind === "lesson") {
    const Lesson = topicModule.lesson;
    return <Lesson completed={completed} onOpenLab={onOpenLab} />;
  }

  if (route.kind === "lab") {
    const Lab = topicModule.lab;
    return <Lab onComplete={onComplete} />;
  }

  return null;
}
