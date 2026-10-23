import { hasTopic } from "@/lib/topic-starter";
import type { SynopsisDetails, ThesisProject } from "@/lib/thesis-types";

const DEFAULT_RESEARCH_QUESTION = "What focused question will this project investigate?";
const DEFAULT_SCOPE = "Define what the project will cover, what it will not cover, and what evidence it needs.";
const DEFAULT_OBJECTIVE = "State one measurable research objective.";
const DEFAULT_METHOD = "Describe a method that can be audited and approved.";

export const EMPTY_SYNOPSIS_DETAILS: SynopsisDetails = {
  problemStatement: "",
  anticipatedContribution: "",
  ethicsAndPermissions: "",
};

export interface SynopsisSection {
  id: string;
  heading: string;
  value: string;
  guidance: string;
  isComplete: boolean;
}

export interface SynopsisPlan {
  completeCount: number;
  isReadyForSupervisorReview: boolean;
  sections: SynopsisSection[];
  totalCount: number;
}

function isMeaningful(value: string, minimumLength = 12): boolean {
  return value.trim().length >= minimumLength;
}

function isStarterObjective(project: ThesisProject): boolean {
  return project.objectives.length === 1 && project.objectives[0]?.text === DEFAULT_OBJECTIVE;
}

function isStarterMethod(project: ThesisProject): boolean {
  return project.methods.length === 1 && project.methods[0]?.text === DEFAULT_METHOD;
}

function needsInput(guidance: string): string {
  return `[NEEDS INPUT] ${guidance}`;
}

function list(items: string[]): string {
  return items.map((item) => `• ${item}`).join("\n");
}

export function getSynopsisDetails(project: ThesisProject): SynopsisDetails {
  return { ...EMPTY_SYNOPSIS_DETAILS, ...project.synopsis };
}

export function buildSynopsis(project: ThesisProject): SynopsisPlan {
  const details = getSynopsisDetails(project);
  const hasQuestion = isMeaningful(project.researchQuestion) && project.researchQuestion.trim() !== DEFAULT_RESEARCH_QUESTION;
  const hasScope = isMeaningful(project.scope) && project.scope.trim() !== DEFAULT_SCOPE;
  const hasObjectives = project.objectives.length > 0 && !isStarterObjective(project) && project.objectives.every((objective) => isMeaningful(objective.text));
  const hasMethods = project.methods.length > 0 && !isStarterMethod(project) && project.methods.every((method) => isMeaningful(method.text));
  const sections: SynopsisSection[] = [
    {
      id: "title",
      heading: "Working title",
      value: hasTopic(project) ? project.title.trim() : needsInput("Add a clear working title."),
      guidance: "Use a temporary title that names the topic and context. You can refine it after reading more sources.",
      isComplete: hasTopic(project),
    },
    {
      id: "problem",
      heading: "Research problem or background",
      value: isMeaningful(details.problemStatement) ? details.problemStatement.trim() : needsInput("Describe the specific problem, uncertainty, or context that needs study."),
      guidance: "State what needs to be understood or examined. Do not claim a result or cite a source you have not checked.",
      isComplete: isMeaningful(details.problemStatement),
    },
    {
      id: "question",
      heading: "Research question",
      value: hasQuestion ? project.researchQuestion.trim() : needsInput("Write the focused question the study will investigate."),
      guidance: "Write one question that can be answered with a realistic source, dataset, observation, or approved fieldwork plan.",
      isComplete: hasQuestion,
    },
    {
      id: "scope",
      heading: "Scope and boundaries",
      value: hasScope ? project.scope.trim() : needsInput("State the setting, people or material, time period, and limits."),
      guidance: "Explain what is inside and outside the study so the project stays manageable.",
      isComplete: hasScope,
    },
    {
      id: "objectives",
      heading: "Objectives",
      value: hasObjectives ? list(project.objectives.map((objective) => objective.text.trim())) : needsInput("Add measurable objectives after you have chosen a question and boundary."),
      guidance: "Each objective should describe work you will do, not a finding you promise to obtain.",
      isComplete: hasObjectives,
    },
    {
      id: "methods",
      heading: "Proposed methodology",
      value: hasMethods ? list(project.methods.map((method) => method.text.trim())) : needsInput("Describe a proposed method linked to each objective."),
      guidance: "Describe planned evidence collection or analysis. Mark it as proposed until it has been approved and carried out.",
      isComplete: hasMethods,
    },
    {
      id: "contribution",
      heading: "Anticipated contribution",
      value: isMeaningful(details.anticipatedContribution) ? details.anticipatedContribution.trim() : needsInput("Explain what the study may help clarify, without promising an outcome."),
      guidance: "Use cautious language such as “may help clarify” or “will examine”; a contribution is not a result.",
      isComplete: isMeaningful(details.anticipatedContribution),
    },
    {
      id: "ethics",
      heading: "Ethics, permissions, and data protection",
      value: isMeaningful(details.ethicsAndPermissions) ? details.ethicsAndPermissions.trim() : needsInput("Record needed permissions, consent, privacy steps, or why they are not expected."),
      guidance: "State planned safeguards only. Do not state that ethics approval or consent has been obtained unless it truly has.",
      isComplete: isMeaningful(details.ethicsAndPermissions),
    },
  ];
  const completeCount = sections.filter((section) => section.isComplete).length;

  return {
    completeCount,
    isReadyForSupervisorReview: completeCount === sections.length,
    sections,
    totalCount: sections.length,
  };
}

export function buildSynopsisMarkdown(project: ThesisProject): string {
  const synopsis = buildSynopsis(project);
  const title = hasTopic(project) ? project.title.trim() : "[NEEDS INPUT] Working title";
  const sections = synopsis.sections
    .map((section) => `## ${section.heading}\n\n${section.value}\n\n_Student prompt: ${section.guidance}_`)
    .join("\n\n");

  return `# Working synopsis: ${title}\n\n> This is an editable research-planning synopsis, not a completed study or submission-ready thesis.\n> It contains only the project details entered by the researcher. Missing items remain marked for completion.\n\n${sections}\n\n## Evidence boundary\n\nThis synopsis does not report findings, participant data, ethics approval, or verified citations. Add those only after they exist and can be traced.`;
}
