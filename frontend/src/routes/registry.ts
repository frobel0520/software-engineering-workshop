export type RouteKind = "map" | "track" | "lesson" | "lab";

export interface RouteDefinition {
  path: string;
  kind: RouteKind;
  trackId?: string;
  topicId?: string;
}

const TOPIC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ROUTE_REGISTRY: readonly RouteDefinition[] = [
  { path: "/map", kind: "map" },
  { path: "/git", kind: "lesson", topicId: "git" },
  { path: "/lab", kind: "lab", topicId: "git" },
  { path: "/auth", kind: "lesson", topicId: "auth" },
  { path: "/auth-lab", kind: "lab", topicId: "auth" },
];

const MAP_ROUTE = ROUTE_REGISTRY[0];

function normalizePath(hashOrPath: string): string {
  const withoutHash = hashOrPath.trim().replace(/^#/, "");
  const withLeadingSlash = withoutHash.startsWith("/") ? withoutHash : `/${withoutHash}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/map";
}

function assertTopicId(topicId: string): string {
  const normalizedTopicId = topicId.trim();
  if (!TOPIC_ID_PATTERN.test(normalizedTopicId)) {
    throw new Error(`Invalid topic id: ${topicId}`);
  }
  return normalizedTopicId;
}

export function trackPath(trackId: string): string {
  return `/track/${assertTopicId(trackId)}`;
}

export function parseRoute(hashOrPath: string): RouteDefinition {
  const path = normalizePath(hashOrPath);
  const registeredRoute = ROUTE_REGISTRY.find((route) => route.path === path);
  if (registeredRoute) return registeredRoute;

  const trackMatch = path.match(/^\/track\/(.+)$/);
  if (trackMatch && TOPIC_ID_PATTERN.test(trackMatch[1])) {
    return { path, kind: "track", trackId: trackMatch[1] };
  }

  const labMatch = path.match(/^\/(.+)-lab$/);
  if (labMatch && TOPIC_ID_PATTERN.test(labMatch[1])) {
    return { path, kind: "lab", topicId: labMatch[1] };
  }

  const lessonMatch = path.match(/^\/(.+)$/);
  if (lessonMatch && TOPIC_ID_PATTERN.test(lessonMatch[1])) {
    return { path, kind: "lesson", topicId: lessonMatch[1] };
  }

  return MAP_ROUTE;
}

export function topicPath(topicId: string, kind: Exclude<RouteKind, "map" | "track">): string {
  const normalizedTopicId = assertTopicId(topicId);

  if (normalizedTopicId === "git") return kind === "lab" ? "/lab" : "/git";
  if (normalizedTopicId === "auth") return kind === "lab" ? "/auth-lab" : "/auth";
  return kind === "lab" ? `/${normalizedTopicId}-lab` : `/${normalizedTopicId}`;
}
