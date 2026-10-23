import type { ThesisProject } from "@/lib/thesis-types";

const UNTITLED_TOPIC = "Untitled research plan";
const DEFAULT_QUESTION = "What focused question will this project investigate?";
const DEFAULT_SCOPE = "Define what the project will cover, what it will not cover, and what evidence it needs.";
const meaningfulTopicCharacter = /[\p{L}\p{N}]/u;

function isPlaceholder(value: string, placeholder: string): boolean {
  return value.trim().length === 0 || value.trim() === placeholder;
}

function hasOnlyStarterObjective(project: ThesisProject): boolean {
  return project.objectives.length === 1 && project.objectives[0]?.text === "State one measurable research objective.";
}

function hasOnlyStarterMethod(project: ThesisProject): boolean {
  return project.methods.length === 1 && project.methods[0]?.text === "Describe a method that can be audited and approved.";
}

export function hasTopic(project: ThesisProject): boolean {
  const title = project.title.trim();
  return title.length > 0 && title !== UNTITLED_TOPIC && meaningfulTopicCharacter.test(title);
}

export function createTopicStarter(project: ThesisProject): ThesisProject {
  if (!hasTopic(project)) return project;

  const topic = project.title.trim();
  const discipline = project.discipline.trim() && project.discipline !== "Choose a discipline"
    ? project.discipline.trim()
    : "appropriate disciplinary";
  const researchQuestion = isPlaceholder(project.researchQuestion, DEFAULT_QUESTION)
    ? `How can ${topic} be investigated within a clearly defined context, and what evidence is needed to assess its mechanisms, outcomes, and limitations?`
    : project.researchQuestion;
  const scope = isPlaceholder(project.scope, DEFAULT_SCOPE)
    ? `A topic-led ${discipline} research plan for ${topic}. Before formal drafting, define the setting, population or corpus, time boundary, comparison logic, and evidence that will be in and out of scope.`
    : project.scope;
  const objectives = hasOnlyStarterObjective(project)
    ? [
        { id: "OBJ-01", text: `Define the concepts, setting, population or corpus, and boundary conditions for ${topic}.` },
        { id: "OBJ-02", text: "Compare prior research by question, context, methodology, reported evidence, and stated limitations." },
        { id: "OBJ-03", text: "Specify an evidence strategy and analysis criteria that can answer the refined research question." },
        { id: "OBJ-04", text: "Document ethical, data-quality, and transferability limits before interpreting any results." },
      ]
    : project.objectives;
  const methods = hasOnlyStarterMethod(project)
    ? [
        { id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Create a scope protocol that defines inclusion, exclusion, units of analysis, and key terms before searching or collecting data." },
        { id: "MTH-02", objectiveIds: ["OBJ-02"], text: "Build a source-linked comparison matrix from prior research records; retain original citations and distinguish reported findings from notes." },
        { id: "MTH-03", objectiveIds: ["OBJ-03"], text: "Select and pre-register an analysis approach that matches the evidence type, with traceable decision rules and uncertainty checks." },
        { id: "MTH-04", objectiveIds: ["OBJ-04"], text: "Record consent, provenance, bias, privacy, and generalizability limits before interpreting results or recommendations." },
      ]
    : project.methods;

  return {
    ...project,
    demoLabel: "Local topic-led plan • add verified research before use",
    researchQuestion,
    scope,
    objectives,
    methods,
  };
}
