import { hasTopic } from "@/lib/topic-starter";
import type { ThesisProject } from "@/lib/thesis-types";

const DEFAULT_QUESTION = "What focused question will this project investigate?";
const DEFAULT_SCOPE = "Define what the project will cover, what it will not cover, and what evidence it needs.";

export interface WritingStarter {
  paragraph: string;
  topic: string;
}

export interface PhraseGroup {
  id: string;
  label: string;
  useWhen: string;
  options: string[];
}

export const WRITING_PHRASE_GROUPS: PhraseGroup[] = [
  {
    id: "purpose",
    label: "Introduce your purpose",
    useWhen: "you are explaining what you plan to study",
    options: ["This study explores …", "This research examines …", "The project focuses on …"],
  },
  {
    id: "source",
    label: "Refer to a source",
    useWhen: "you have read the source and will cite it",
    options: ["The author reports …", "The study describes …", "According to [Author, Year], …"],
  },
  {
    id: "evidence",
    label: "Describe evidence carefully",
    useWhen: "the source or your verified data supports a cautious statement",
    options: ["The available evidence suggests …", "The recorded data is consistent with …", "This pattern needs further verification."],
  },
  {
    id: "limitation",
    label: "State a limitation",
    useWhen: "you need to explain what the study cannot establish",
    options: ["One limitation is …", "The study is limited by …", "This may not apply beyond …"],
  },
];

function isMissing(value: string, placeholder: string): boolean {
  return value.trim().length === 0 || value.trim() === placeholder;
}

function endSentence(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

export function buildStudentWritingStarter(project: ThesisProject): WritingStarter | null {
  if (!hasTopic(project)) return null;

  const topic = project.title.trim();
  const question = project.researchQuestion.trim();
  const scope = project.scope.trim();
  const questionSentence = isMissing(question, DEFAULT_QUESTION)
    ? "The exact research question will be refined after the setting, people or material, and time period are chosen."
    : `It asks: ${endSentence(question)}`;
  const scopeSentence = isMissing(scope, DEFAULT_SCOPE)
    ? "Before drawing conclusions, the project will set clear boundaries for what it includes and leaves out."
    : `Its planned boundary is: ${endSentence(scope)}`;

  return {
    topic,
    paragraph: `This study explores ${topic}. ${questionSentence} ${scopeSentence} This is an editable starting paragraph: it describes a plan, not a result or a claim that needs a source.`,
  };
}
