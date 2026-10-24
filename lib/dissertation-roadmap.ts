import { hasTopic } from "@/lib/topic-starter";
import type { EvidenceSource, LiteratureEvidenceNote, ThesisProject } from "@/lib/thesis-types";
import { hasUsableLiteratureNote } from "@/lib/literature-readiness";
import { hasMethodDataAndEthicsPlan } from "@/lib/method-readiness";
import { isUsableVerifiedDirectEvidence, isUsableVerifiedSource } from "@/lib/result-readiness";

export const DEFAULT_DISSERTATION_PAGE_TARGET = 300;

export type RoadmapStatus = "ready" | "needs-brief" | "needs-sources" | "needs-data" | "needs-review";
export type ChapterEvidenceStatus = "tracked" | "needs-source" | "needs-data" | "needs-input" | "not-applicable";

export interface ChapterEvidencePlan {
  status: ChapterEvidenceStatus;
  summary: string;
  recordIds: string[];
}

export interface DissertationRoadmapItem {
  id: string;
  heading: string;
  pageBudget: number;
  purpose: string;
  status: RoadmapStatus;
  nextStep: string;
  evidence: ChapterEvidencePlan;
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

interface RoadmapEvidenceContext {
  verifiedLiteratureNotes: LiteratureEvidenceNote[];
  verifiedMethodNotes: LiteratureEvidenceNote[];
  verifiedComparisonNotes: LiteratureEvidenceNote[];
  verifiedResults: ThesisProject["results"];
  verifiedSources: EvidenceSource[];
  methodPlanCount: number;
}

function buildEvidenceContext(project: ThesisProject): RoadmapEvidenceContext {
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));
  const methodById = new Map(project.methods.map((method) => [method.id, method]));
  const verifiedLiteratureNotes = (project.literatureNotes ?? []).filter((note) =>
    note.status === "verified"
      && hasUsableLiteratureNote(note)
      && isUsableVerifiedSource(sourceById.get(note.sourceId)),
  );
  const verifiedSources = project.sources.filter(isUsableVerifiedSource);
  const verifiedResults = project.results.filter((result) =>
    result.verification === "verified"
      && result.sourceIds.some((sourceId) => isUsableVerifiedDirectEvidence(sourceById.get(sourceId)))
      && result.methodIds.some((methodId) => hasMethodDataAndEthicsPlan(methodById.get(methodId))),
  );

  return {
    verifiedLiteratureNotes,
    verifiedMethodNotes: verifiedLiteratureNotes.filter((note) => note.use === "method"),
    verifiedComparisonNotes: verifiedLiteratureNotes.filter((note) => note.use === "comparison" || note.use === "limitation"),
    verifiedResults,
    verifiedSources,
    methodPlanCount: project.methods.filter(hasMethodDataAndEthicsPlan).length,
  };
}

function linkedRecordIds(...collections: Array<Array<{ id: string }>>): string[] {
  return [...new Set(collections.flatMap((collection) => collection.map((record) => record.id)))];
}

function evidenceForItem(id: string, project: ThesisProject, context: RoadmapEvidenceContext): ChapterEvidencePlan {
  const topicReady = hasTopic(project) && project.researchQuestion.trim().length > 0 && project.scope.trim().length > 0;

  switch (id) {
    case "preliminaries":
      return {
        status: "not-applicable",
        summary: "Use the current university template and declaration requirements; this planning map does not add evidence claims here.",
        recordIds: [],
      };
    case "introduction":
      return topicReady
        ? {
            status: "tracked",
            summary: "Ground this chapter in the student's project brief: topic, question, scope, objectives, and stated contribution—not in invented background claims.",
            recordIds: linkedRecordIds(project.objectives, project.methods),
          }
        : {
            status: "needs-input",
            summary: "NEEDS INPUT — add a usable topic, research question, and scope before deciding what this chapter can responsibly claim.",
            recordIds: [],
          };
    case "literature-review":
      return context.verifiedLiteratureNotes.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedLiteratureNotes.length} verified source-linked literature note(s) retain a checked source and locator for synthesis planning.`,
            recordIds: linkedRecordIds(context.verifiedLiteratureNotes),
          }
        : {
            status: "needs-source",
            summary: "NEEDS SOURCE — add verified source-linked literature notes before drafting a synthesis or claiming a research gap.",
            recordIds: [],
          };
    case "methodology":
      {
        const methodPlanSummary = project.methods.length === 0
          ? "No planned methods have been added yet."
          : `${context.methodPlanCount}/${project.methods.length} planned method(s) include a data, permissions, and ethics plan.`;

      return context.verifiedMethodNotes.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedMethodNotes.length} verified method note(s) can support the rationale for the planned design. ${methodPlanSummary} Approvals and instruments still need separate review.`,
            recordIds: linkedRecordIds(context.verifiedMethodNotes, project.methods),
          }
        : {
            status: "needs-source",
            summary: `NEEDS SOURCE — add a verified literature note marked “Method or approach” before using a source to justify the design. ${methodPlanSummary}`,
            recordIds: linkedRecordIds(project.methods),
          };
      }
    case "results":
      return context.verifiedResults.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedResults.length} verified result record(s) are linked to usable direct records and planned methods with documented safeguards. Add only the tables, figures, or analyses those records actually support.`,
            recordIds: linkedRecordIds(context.verifiedResults),
          }
        : {
            status: "needs-data",
            summary: "NEEDS DATA — no traceable verified results are available, so this remains an analysis plan rather than a findings chapter.",
            recordIds: [],
          };
    case "discussion":
      if (context.verifiedResults.length === 0) {
        return {
          status: "needs-data",
          summary: "NEEDS DATA — wait for traceable verified results before interpreting outcomes or implications.",
          recordIds: [],
        };
      }
      return context.verifiedComparisonNotes.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedResults.length} verified result record(s) and ${context.verifiedComparisonNotes.length} comparison or limitation note(s) are available for a bounded discussion plan.`,
            recordIds: linkedRecordIds(context.verifiedResults, context.verifiedComparisonNotes),
          }
        : {
            status: "needs-source",
            summary: "NEEDS SOURCE — results are available, but add verified comparison or limitation notes before relating them to earlier research.",
            recordIds: linkedRecordIds(context.verifiedResults),
          };
    case "conclusion":
      return context.verifiedResults.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedResults.length} verified result record(s) can bound the conclusion; keep recommendations within the evidence and study limits.`,
            recordIds: linkedRecordIds(context.verifiedResults),
          }
        : {
            status: "needs-data",
            summary: "NEEDS DATA — plan the conclusion structure, but do not state conclusions or recommendations as if results exist.",
            recordIds: [],
          };
    case "references":
      return context.verifiedSources.length > 0
        ? {
            status: "tracked",
            summary: `${context.verifiedSources.length} usable verified source record(s) can be checked against the department's citation style before adding them to a bibliography.`,
            recordIds: linkedRecordIds(context.verifiedSources),
          }
        : {
            status: "needs-source",
            summary: "NEEDS SOURCE — no usable verified source records are ready for formal bibliography checking.",
            recordIds: [],
          };
    case "appendices":
      return {
        status: "not-applicable",
        summary: "Add only materials actually approved or used in the study. Do not create appendices simply to reach the page target.",
        recordIds: [],
      };
    default:
      return {
        status: "needs-input",
        summary: "NEEDS INPUT — identify the records this section needs before writing it.",
        recordIds: [],
      };
  }
}

function statusForItem(id: string, project: ThesisProject, context: RoadmapEvidenceContext): Pick<DissertationRoadmapItem, "status" | "nextStep"> {
  const topicReady = hasTopic(project) && project.researchQuestion.trim().length > 0 && project.scope.trim().length > 0;
  const sourceReady = context.verifiedLiteratureNotes.length > 0;
  const designReady = project.objectives.length > 0 && project.methods.length > 0;
  const resultReady = context.verifiedResults.length > 0;

  switch (id) {
    case "introduction":
      return topicReady
        ? { status: "ready", nextStep: "Refine the problem statement and chapter map with your supervisor." }
        : { status: "needs-brief", nextStep: "Complete the topic, research question, and scope before expanding this chapter." };
    case "literature-review":
      return sourceReady
        ? { status: "ready", nextStep: "Group sources by theme, method, setting, and unresolved question before drafting synthesis." }
        : { status: "needs-sources", nextStep: "Add verified source-linked literature notes; never fill this chapter from titles alone." };
    case "methodology":
      if (!designReady) {
        return { status: "needs-brief", nextStep: "Map clear objectives to an auditable method and obtain required approvals." };
      }
      return context.verifiedMethodNotes.length > 0
        ? { status: "ready", nextStep: "Document approvals, instruments, and the exact analysis process before collecting data." }
        : { status: "needs-sources", nextStep: "Add a verified method source note before using literature to justify the selected design." };
    case "results":
      return resultReady
        ? { status: "ready", nextStep: "Keep every table, figure, and result linked to a verified source or analysis record." }
        : { status: "needs-data", nextStep: "NEEDS DATA — do not draft findings until verified results are available." };
    case "discussion":
      if (!resultReady) {
        return { status: "needs-data", nextStep: "NEEDS DATA — prepare discussion questions, but do not write outcome claims." };
      }
      return context.verifiedComparisonNotes.length > 0
        ? { status: "ready", nextStep: "Interpret only verified results and cite the prior research being compared." }
        : { status: "needs-sources", nextStep: "Add verified comparison or limitation notes before relating results to earlier research." };
    case "conclusion":
      return resultReady
        ? { status: "ready", nextStep: "State only conclusions that follow from the documented evidence and study limits." }
        : { status: "needs-data", nextStep: "NEEDS DATA — keep this as a conclusion plan until results are verified." };
    case "references":
      return context.verifiedSources.length > 0
        ? { status: "ready", nextStep: "Verify author, year, title, publisher or journal, DOI/URL, and the required citation style." }
        : { status: "needs-sources", nextStep: "Add usable verified source records before creating a bibliography." };
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
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));
  const methodById = new Map(project.methods.map((method) => [method.id, method]));
  const verifiedResults = project.results.filter((result) =>
    result.verification === "verified"
      && result.sourceIds.some((sourceId) => isUsableVerifiedDirectEvidence(sourceById.get(sourceId)))
      && result.methodIds.some((methodId) => hasMethodDataAndEthicsPlan(methodById.get(methodId))),
  ).length;

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
  const evidenceContext = buildEvidenceContext(project);

  return {
    pageTarget,
    items: ROADMAP_BLUEPRINT.map((blueprint, index) => ({
      ...blueprint,
      pageBudget: pages[index] ?? 0,
      ...statusForItem(blueprint.id, project, evidenceContext),
      evidence: evidenceForItem(blueprint.id, project, evidenceContext),
    })),
    originalityChecks: buildOriginalityChecks(project),
  };
}

export function buildDissertationRoadmapMarkdown(roadmap: DissertationRoadmap): string {
  const plan = roadmap.items.map((item) => {
    const linkedRecords = item.evidence.recordIds.length > 0 ? ` Linked records: ${item.evidence.recordIds.join(", ")}.` : "";
    return `- ${item.heading}: ~${item.pageBudget} pages — ${item.nextStep}\n  Evidence plan: ${item.evidence.summary}${linkedRecords}`;
  }).join("\n");
  const checks = roadmap.originalityChecks.map((check) => `- ${check.label}: ${check.summary} Next: ${check.nextStep}`).join("\n");

  return `## ${roadmap.pageTarget}-page dissertation roadmap\n\nThis is a source-linked chapter plan, not generated thesis content. Do not add filler, unverified claims, or copied text to reach a page count.\n\n${plan}\n\n### Originality and citation readiness\n\n${checks}`;
}
