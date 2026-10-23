import { hasTopic } from "@/lib/topic-starter";
import type { ThesisProject } from "@/lib/thesis-types";

export const DEFAULT_DISSERTATION_PAGE_TARGET = 300;

export type RoadmapStatus = "ready" | "needs-brief" | "needs-sources" | "needs-data" | "needs-review";

export interface DissertationRoadmapItem {
  id: string;
  heading: string;
  pageBudget: number;
  purpose: string;
  status: RoadmapStatus;
  nextStep: string;
}

export interface OriginalityCheckpoint {
  id: string;
  label: string;
  summary: string;
  status: "ready" | "needs-attention" | "manual-check";
  nextStep: string;
}

export interface DissertationRoadmap {
  pageTarget: number;
  items: DissertationRoadmapItem[];
  originalityChecks: OriginalityCheckpoint[];
}

interface BlueprintItem {
  id: string;
  heading: string;
  proportion: number;
  purpose: string;
}

const ROADMAP_BLUEPRINT: BlueprintItem[] = [
  {
    id: "preliminaries",
    heading: "Preliminary pages",
    proportion: 4,
    purpose: "Title page, declaration, acknowledgements, abstract, lists, and other pages required by the university template.",
  },
  {
    id: "introduction",
    heading: "Chapter 1 — Introduction",
    proportion: 7,
    purpose: "Problem context, focused question, scope, objectives, significance, and chapter map.",
  },
  {
    id: "literature-review",
    heading: "Chapter 2 — Literature review",
    proportion: 18,
    purpose: "Compare prior studies by context, method, evidence, and stated limitations; build a cited synthesis rather than a sequence of summaries.",
  },
  {
    id: "methodology",
    heading: "Chapter 3 — Methodology",
    proportion: 12,
    purpose: "Research design, sampling or selection logic, instruments, protocol, ethics, and analysis plan.",
  },
  {
    id: "results",
    heading: "Chapter 4 — Results and analysis",
    proportion: 18,
    purpose: "Only verified tables, figures, observations, and analyses from the approved study.",
  },
  {
    id: "discussion",
    heading: "Chapter 5 — Discussion",
    proportion: 12,
    purpose: "Interpret verified results against cited literature, boundaries, implications, and unanswered questions.",
  },
  {
    id: "conclusion",
    heading: "Chapter 6 — Conclusion and recommendations",
    proportion: 6,
    purpose: "Answer the research question within the study's limits; state recommendations only when the evidence supports them.",
  },
  {
    id: "references",
    heading: "References",
    proportion: 6,
    purpose: "A consistent, traceable bibliography in the citation style required by the department.",
  },
  {
    id: "appendices",
    heading: "Appendices",
    proportion: 17,
    purpose: "Only approved instruments, consent materials, codebooks, extended tables, protocols, or other real supporting documents.",
  },
];

function clampPageTarget(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DISSERTATION_PAGE_TARGET;
  return Math.min(600, Math.max(80, Math.round(value)));
}

function allocatePages(pageTarget: number): number[] {
  const preliminary = ROADMAP_BLUEPRINT.map((item, index) => {
    const raw = (pageTarget * item.proportion) / 100;
    return { index, pages: Math.floor(raw), fraction: raw % 1 };
  });
  let remaining = pageTarget - preliminary.reduce((total, item) => total + item.pages, 0);

  for (const item of [...preliminary].sort((left, right) => right.fraction - left.fraction || left.index - right.index)) {
    if (remaining === 0) break;
    preliminary[item.index]!.pages += 1;
    remaining -= 1;
  }

  return preliminary.map((item) => item.pages);
}

function hasUsableResearchNote(project: ThesisProject): boolean {
  return project.priorResearch.some((record) => [
    record.context,
    record.researchQuestion,
    record.methodology,
    record.findings,
    record.limitations,
  ].some((value) => value.trim().length >= 12));
}

function hasTraceablePriorResearch(project: ThesisProject): boolean {
  return project.priorResearch.some((record) => record.citation.trim().length >= 8 && [
    record.context,
    record.researchQuestion,
    record.methodology,
    record.findings,
    record.limitations,
  ].some((value) => value.trim().length >= 12));
}

function statusForItem(id: string, project: ThesisProject): Pick<DissertationRoadmapItem, "status" | "nextStep"> {
  const topicReady = hasTopic(project) && project.researchQuestion.trim().length > 0 && project.scope.trim().length > 0;
  const sourceReady = hasTraceablePriorResearch(project);
  const designReady = project.objectives.length > 0 && project.methods.length > 0;
  const resultReady = project.results.some((result) => result.verification === "verified");

  switch (id) {
    case "introduction":
      return topicReady
        ? { status: "ready", nextStep: "Refine the problem statement and chapter map with your supervisor." }
        : { status: "needs-brief", nextStep: "Complete the topic, research question, and scope before expanding this chapter." };
    case "literature-review":
      return sourceReady
        ? { status: "ready", nextStep: "Group sources by theme, method, setting, and unresolved question before drafting synthesis." }
        : { status: "needs-sources", nextStep: "Add traceable prior research and your checked notes; never fill this chapter from titles alone." };
    case "methodology":
      return designReady
        ? { status: "ready", nextStep: "Document approvals, instruments, and the exact analysis process before collecting data." }
        : { status: "needs-brief", nextStep: "Map clear objectives to an auditable method and obtain required approvals." };
    case "results":
      return resultReady
        ? { status: "ready", nextStep: "Keep every table, figure, and result linked to a verified source or analysis record." }
        : { status: "needs-data", nextStep: "NEEDS DATA — do not draft findings until verified results are available." };
    case "discussion":
      return resultReady
        ? { status: "ready", nextStep: "Interpret only verified results and cite the prior research being compared." }
        : { status: "needs-data", nextStep: "NEEDS DATA — prepare discussion questions, but do not write outcome claims." };
    case "conclusion":
      return resultReady
        ? { status: "ready", nextStep: "State only conclusions that follow from the documented evidence and study limits." }
        : { status: "needs-data", nextStep: "NEEDS DATA — keep this as a conclusion plan until results are verified." };
    case "references":
      return project.priorResearch.length > 0 || project.sources.length > 0
        ? { status: "ready", nextStep: "Verify author, year, title, publisher or journal, DOI/URL, and the required citation style." }
        : { status: "needs-sources", nextStep: "Add stable sources before creating a bibliography." };
    case "appendices":
      return { status: "needs-review", nextStep: "Add only documents actually approved or used in the study; never add filler to reach a page target." };
    default:
      return { status: "needs-review", nextStep: "Use the department's current thesis template and page requirements." };
  }
}

function buildOriginalityChecks(project: ThesisProject): OriginalityCheckpoint[] {
  const citedPriorWork = project.priorResearch.filter((record) => record.citation.trim().length >= 8).length;
  const recordsWithNotes = project.priorResearch.filter((record) => [
    record.context,
    record.researchQuestion,
    record.methodology,
    record.findings,
    record.limitations,
  ].some((value) => value.trim().length >= 12)).length;
  const verifiedResults = project.results.filter((result) => result.verification === "verified").length;

  return [
    {
      id: "source-trace",
      label: "Keep a trace for each prior work",
      summary: `${citedPriorWork}/${project.priorResearch.length} prior-research record(s) currently have a citation or stable source location.`,
      status: citedPriorWork === project.priorResearch.length && project.priorResearch.length > 0 ? "ready" : "needs-attention",
      nextStep: "Add the original URL, DOI, repository record, or full citation before relying on a source idea.",
    },
    {
      id: "research-notes",
      label: "Write from checked notes, not copied passages",
      summary: `${recordsWithNotes}/${project.priorResearch.length} prior-research record(s) include a usable note about context, method, finding, or limitation.`,
      status: recordsWithNotes > 0 ? "ready" : "needs-attention",
      nextStep: "Read the original, close it, write your understanding from notes, then reopen it to verify and cite the idea.",
    },
    {
      id: "result-boundary",
      label: "Separate literature from your own results",
      summary: verifiedResults > 0
        ? `${verifiedResults} verified result record(s) are available for evidence-led discussion.`
        : "No verified results are recorded, so results, discussion, and conclusion remain planning sections.",
      status: verifiedResults > 0 ? "ready" : "manual-check",
      nextStep: "Do not turn planned methods or another author's findings into your own results.",
    },
    {
      id: "similarity-review",
      label: "Run the institution's required similarity review",
      summary: "This workspace cannot certify a thesis as plagiarism-free or make copied writing original.",
      status: "manual-check",
      nextStep: "Use your university-approved checker, review every match, quote or cite legitimate reuse, and rewrite only from your own understanding.",
    },
  ];
}

export function buildDissertationRoadmap(project: ThesisProject, requestedPageTarget = DEFAULT_DISSERTATION_PAGE_TARGET): DissertationRoadmap {
  const pageTarget = clampPageTarget(requestedPageTarget);
  const pages = allocatePages(pageTarget);

  return {
    pageTarget,
    items: ROADMAP_BLUEPRINT.map((blueprint, index) => ({
      ...blueprint,
      pageBudget: pages[index] ?? 0,
      ...statusForItem(blueprint.id, project),
    })),
    originalityChecks: buildOriginalityChecks(project),
  };
}

export function buildDissertationRoadmapMarkdown(roadmap: DissertationRoadmap): string {
  const plan = roadmap.items.map((item) => `- ${item.heading}: ~${item.pageBudget} pages — ${item.nextStep}`).join("\n");
  const checks = roadmap.originalityChecks.map((check) => `- ${check.label}: ${check.summary} Next: ${check.nextStep}`).join("\n");

  return `## ${roadmap.pageTarget}-page dissertation roadmap\n\nThis is a planning budget, not generated thesis content. Do not add filler, unverified claims, or copied text to reach a page count.\n\n${plan}\n\n### Originality and citation readiness\n\n${checks}`;
}
