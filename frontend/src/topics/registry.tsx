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
import { EnvLab } from "./env/lab";
import { EnvLesson } from "./env/lesson";
import { BuildLab } from "./build/lab";
import { BuildLesson } from "./build/lesson";
import { DockerLab } from "./docker/lab";
import { DockerLesson } from "./docker/lesson";
import { SqlLab } from "./sql/lab";
import { SqlLesson } from "./sql/lesson";
import { SchemaLab } from "./schema/lab";
import { SchemaLesson } from "./schema/lesson";
import { IndexLab } from "./index/lab";
import { IndexLesson } from "./index/lesson";
import { PostgreSqlLab } from "./postgresql/lab";
import { PostgreSqlLesson } from "./postgresql/lesson";
import { ProblemSolvingLab } from "./problem-solving/lab";
import { ProblemSolvingLesson } from "./problem-solving/lesson";
import { UnitLab } from "./unit/lab";
import { UnitLesson } from "./unit/lesson";
import { IntegrationLab } from "./integration/lab";
import { IntegrationLesson } from "./integration/lesson";
import { LogsLab } from "./logs/lab";
import { LogsLesson } from "./logs/lesson";
import { authOrientation } from "../content/auth";
import { gitOrientation } from "../content/git";
import { cliLesson } from "./cli/content";
import { ideLesson } from "./ide/content";
import { packageLesson } from "./package/content";
import { remoteLesson } from "./remote/content";
import { guardrailLesson } from "./guardrail/content";
import { restLesson } from "./rest/content";
import { envLesson } from "./env/content";
import { buildLesson } from "./build/content";
import { dockerLesson } from "./docker/content";
import { sqlLesson } from "./sql/content";
import { schemaLesson } from "./schema/content";
import { indexLesson } from "./index/content";
import { postgresqlLesson } from "./postgresql/content";
import { problemSolvingLesson } from "./problem-solving/content";
import { unitLesson } from "./unit/content";
import { integrationLesson } from "./integration/content";
import { logsLesson } from "./logs/content";
import type { LessonOrientation } from "./types";

export interface TopicLessonViewProps {
  completed: boolean;
  onOpenLab: () => void;
  orientation: LessonOrientation;
}

export interface TopicLabViewProps {
  onComplete: () => void;
}

export interface TopicViewModule {
  id: string;
  orientation: LessonOrientation;
  lesson: ComponentType<TopicLessonViewProps>;
  lab: ComponentType<TopicLabViewProps>;
}

export const TOPIC_MODULE_REGISTRY: Readonly<Record<string, TopicViewModule>> = {
  git: { id: "git", orientation: gitOrientation, lesson: GitLesson, lab: GitLab },
  auth: { id: "auth", orientation: authOrientation, lesson: AuthLesson, lab: AuthLab },
  remote: { id: "remote", orientation: remoteLesson.orientation, lesson: RemoteLesson, lab: RemoteLab },
  cli: { id: "cli", orientation: cliLesson.orientation, lesson: CliLesson, lab: CliLab },
  ide: { id: "ide", orientation: ideLesson.orientation, lesson: IdeLesson, lab: IdeLab },
  package: { id: "package", orientation: packageLesson.orientation, lesson: PackageLesson, lab: PackageLab },
  guardrail: { id: "guardrail", orientation: guardrailLesson.orientation, lesson: GuardrailLesson, lab: GuardrailLab },
  rest: { id: "rest", orientation: restLesson.orientation, lesson: RestLesson, lab: RestLab },
  env: { id: "env", orientation: envLesson.orientation, lesson: EnvLesson, lab: EnvLab },
  build: { id: "build", orientation: buildLesson.orientation, lesson: BuildLesson, lab: BuildLab },
  docker: { id: "docker", orientation: dockerLesson.orientation, lesson: DockerLesson, lab: DockerLab },
  sql: { id: "sql", orientation: sqlLesson.orientation, lesson: SqlLesson, lab: SqlLab },
  schema: { id: "schema", orientation: schemaLesson.orientation, lesson: SchemaLesson, lab: SchemaLab },
  index: { id: "index", orientation: indexLesson.orientation, lesson: IndexLesson, lab: IndexLab },
  postgresql: { id: "postgresql", orientation: postgresqlLesson.orientation, lesson: PostgreSqlLesson, lab: PostgreSqlLab },
  "problem-solving": { id: "problem-solving", orientation: problemSolvingLesson.orientation, lesson: ProblemSolvingLesson, lab: ProblemSolvingLab },
  unit: { id: "unit", orientation: unitLesson.orientation, lesson: UnitLesson, lab: UnitLab },
  integration: { id: "integration", orientation: integrationLesson.orientation, lesson: IntegrationLesson, lab: IntegrationLab },
  logs: { id: "logs", orientation: logsLesson.orientation, lesson: LogsLesson, lab: LogsLab },
};

export const TOPIC_MODULE_IDS: ReadonlySet<string> = new Set(Object.keys(TOPIC_MODULE_REGISTRY));

export function getTopicViewModule(topicId: string | undefined): TopicViewModule | undefined {
  return topicId ? TOPIC_MODULE_REGISTRY[topicId] : undefined;
}
