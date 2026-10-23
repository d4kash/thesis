import type { PriorResearchRecord, ThesisProject } from "@/lib/thesis-types";

const STOP_WORDS = new Set([
  "about", "across", "after", "against", "among", "and", "are", "as", "at", "before", "by",
  "can", "could", "does", "for", "from", "how", "in", "into", "is", "it", "of", "on", "or",
  "research", "study", "than", "that", "the", "their", "this", "to", "using", "what", "which", "with",
]);
const UNTITLED_TOPIC = "Untitled research plan";
const PLACEHOLDER_BRIEF_VALUES = new Set([
  "Choose a discipline",
  "What focused question will this project investigate?",
  "Define what the project will cover, what it will not cover, and what evidence it needs.",
]);

export interface ResearchMatch {
  record: PriorResearchRecord;
  matchedTerms: string[];
  relevance: number;
}

export interface CandidateGap {
  recordId: string;
  text: string;
}

export interface ResearchLandscape {
  topicTerms: string[];
  matches: ResearchMatch[];
  candidateGaps: CandidateGap[];
  prompts: string[];
  verifiedMatchCount: number;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function termsFromProject(project: ThesisProject): string[] {
  const counts = new Map<string, number>();
  const title = project.title.trim();

  if (title.length === 0 || title === UNTITLED_TOPIC) return [];

  const text = [title, project.discipline, project.researchQuestion, project.scope]
    .map((value) => value.trim())
    .filter((value) => !PLACEHOLDER_BRIEF_VALUES.has(value))
    .join(" ");

  for (const word of tokenize(text)) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10)
    .map(([word]) => word);
}

function recordText(record: PriorResearchRecord): string {
  return [
    record.title,
    record.citation,
    record.context,
    record.researchQuestion,
    record.methodology,
    record.findings,
    record.limitations,
  ].join(" ");
}

export function buildResearchLandscape(project: ThesisProject): ResearchLandscape {
  const topicTerms = termsFromProject(project);
  const matches = project.priorResearch
    .map((record) => {
      const recordTerms = new Set(tokenize(recordText(record)));
      const matchedTerms = topicTerms.filter((term) => recordTerms.has(term));
      return {
        record,
        matchedTerms,
        relevance: topicTerms.length === 0 ? 0 : Math.round((matchedTerms.length / topicTerms.length) * 100),
      };
    })
    .sort((a, b) => b.relevance - a.relevance || a.record.title.localeCompare(b.record.title));

  const matchedRecords = matches.filter((match) => match.matchedTerms.length > 0);
  const candidateGaps = matchedRecords
    .filter((match) => match.record.limitations.trim().length > 0)
    .slice(0, 5)
    .map((match) => ({ recordId: match.record.id, text: match.record.limitations.trim() }));
  const verifiedMatchCount = matchedRecords.filter((match) => match.record.status === "verified").length;
  const prompts = unique([
    matchedRecords.length > 0
      ? "Compare the matched records' context, method, and stated limitation before treating their findings as directly comparable."
      : "Add prior-research records with a context, method, or research-question note before making literature-synthesis claims.",
    candidateGaps.length > 0
      ? "Treat every stated limitation as a candidate gap; re-check its original thesis before presenting it as a research gap."
      : "Record limitations or unresolved questions from each prior work to make the gap-analysis trail auditable.",
    verifiedMatchCount > 0
      ? "Use verified records to anchor citations, then distinguish their reported findings from the planned study's questions."
      : "No verified topic match is available yet, so keep this as a planning map rather than a literature review.",
  ]);

  return { topicTerms, matches, candidateGaps, prompts, verifiedMatchCount };
}
