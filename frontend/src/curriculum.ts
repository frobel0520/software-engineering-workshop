import rawCurriculumData from "@shared/curriculum.json";
import type { TrackKind } from "./topics/types";
import type { Curriculum, Topic, TopicStatus, Track } from "./types";

const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isTrackKind(value: unknown): value is TrackKind {
  return value === "core" || value === "extension";
}

function isTopicStatus(value: unknown): value is TopicStatus {
  return value === "ready" || value === "planned";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(value: Record<string, unknown>, field: string, path: string): string {
  const fieldValue = value[field];
  if (typeof fieldValue !== "string" || fieldValue.trim() === "") {
    throw new Error(`Invalid curriculum ${path}.${field}: expected a non-empty string.`);
  }
  return fieldValue;
}

function requiredIdentifier(value: Record<string, unknown>, field: string, path: string): string {
  const identifier = requiredString(value, field, path);
  if (!IDENTIFIER_PATTERN.test(identifier)) {
    throw new Error(`Invalid curriculum ${path}.${field}: expected a lowercase identifier.`);
  }
  return identifier;
}

function parseTopic(value: unknown, path: string): Topic {
  if (!isRecord(value)) {
    throw new Error(`Invalid curriculum ${path}: expected an object.`);
  }

  const status = value.status;
  if (!isTopicStatus(status)) {
    throw new Error(`Invalid curriculum ${path}.status: expected ready or planned.`);
  }

  return {
    id: requiredIdentifier(value, "id", path),
    title: requiredString(value, "title", path),
    summary: requiredString(value, "summary", path),
    status,
  };
}

function parseTrack(value: unknown, path: string): Track {
  if (!isRecord(value)) {
    throw new Error(`Invalid curriculum ${path}: expected an object.`);
  }

  const kind = value.kind;
  if (!isTrackKind(kind)) {
    throw new Error(`Invalid curriculum ${path}.kind: expected core or extension.`);
  }

  if (!Array.isArray(value.topics) || value.topics.length === 0) {
    throw new Error(`Invalid curriculum ${path}.topics: expected a non-empty array.`);
  }

  return {
    id: requiredIdentifier(value, "id", path),
    title: requiredString(value, "title", path),
    description: requiredString(value, "description", path),
    kind,
    topics: value.topics.map((topic, index) => parseTopic(topic, `${path}.topics[${index}]`)),
  };
}

export function loadCurriculum(value: unknown): Curriculum {
  if (!isRecord(value)) {
    throw new Error("Invalid curriculum: expected an object.");
  }

  if (typeof value.version !== "number" || !Number.isInteger(value.version) || value.version < 1) {
    throw new Error("Invalid curriculum.version: expected a positive integer.");
  }

  if (!Array.isArray(value.tracks) || value.tracks.length === 0) {
    throw new Error("Invalid curriculum.tracks: expected a non-empty array.");
  }

  const tracks = value.tracks.map((track, index) => parseTrack(track, `tracks[${index}]`));
  const trackIds = tracks.map((track) => track.id);
  const topicIds = tracks.flatMap((track) => track.topics.map((topic) => topic.id));

  if (new Set(trackIds).size !== trackIds.length) {
    throw new Error("Invalid curriculum: track ids must be unique.");
  }

  if (new Set(topicIds).size !== topicIds.length) {
    throw new Error("Invalid curriculum: topic ids must be unique.");
  }

  return { version: value.version, tracks };
}

export const curriculum: Curriculum = loadCurriculum(rawCurriculumData);
