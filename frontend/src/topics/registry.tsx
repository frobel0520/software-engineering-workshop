import type { ComponentType } from "react";
import { AuthLab } from "../components/AuthLab";
import { AuthLesson } from "../components/AuthLesson";
import { GitLab } from "../components/GitLab";
import { GitLesson } from "../components/GitLesson";
import { CliLab } from "../components/CliLab";
import { CliLesson } from "./cli/lesson";
import { IdeLab } from "../components/IdeLab";
import { IdeLesson } from "./ide/lesson";
import { PackageLab } from "./package/lab";
import { PackageLesson } from "./package/lesson";
import { RemoteLab } from "./remote/lab";
import { RemoteLesson } from "./remote/lesson";
import { GuardrailLab } from "./guardrail/lab";
import { GuardrailLesson } from "./guardrail/lesson";
import { RestLab } from "./rest/lab";
import { RestLesson } from "./rest/lesson";

export interface TopicLessonViewProps {
  completed: boolean;
  onOpenLab: () => void;
}

export interface TopicLabViewProps {
  onComplete: () => void;
}

export interface TopicViewModule {
  id: string;
  lesson: ComponentType<TopicLessonViewProps>;
  lab: ComponentType<TopicLabViewProps>;
}

export const TOPIC_MODULE_REGISTRY: Readonly<Record<string, TopicViewModule>> = {
  git: { id: "git", lesson: GitLesson, lab: GitLab },
  auth: { id: "auth", lesson: AuthLesson, lab: AuthLab },
  remote: { id: "remote", lesson: RemoteLesson, lab: RemoteLab },
  cli: { id: "cli", lesson: CliLesson, lab: CliLab },
  ide: { id: "ide", lesson: IdeLesson, lab: IdeLab },
  package: { id: "package", lesson: PackageLesson, lab: PackageLab },
  guardrail: { id: "guardrail", lesson: GuardrailLesson, lab: GuardrailLab },
  rest: { id: "rest", lesson: RestLesson, lab: RestLab },
};

export const TOPIC_MODULE_IDS: ReadonlySet<string> = new Set(Object.keys(TOPIC_MODULE_REGISTRY));

export function getTopicViewModule(topicId: string | undefined): TopicViewModule | undefined {
  return topicId ? TOPIC_MODULE_REGISTRY[topicId] : undefined;
}
