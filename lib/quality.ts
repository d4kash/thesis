import type {
  DraftSection,
  QualityIssue,
  QualityReport,
  ThesisProject,
} from "@/lib/thesis-types";
import { canMarkLiteratureNoteVerified } from "@/lib/literature-readiness";
import { hasMethodDataAndEthicsPlan } from "@/lib/method-readiness";
import { canMarkPriorResearchVerified, isUsableVerifiedPriorResearch } from "@/lib/prior-research-readiness";
import {
  canMarkResultVerified,
  hasUsableResultRecord,
  isUsableVerifiedDirectEvidence,
  isUsableVerifiedSource,
} from "@/lib/result-readiness";
import { hasTopic } from "@/lib/topic-starter";

const unsupportedOutcomePattern = /\b(outperforms|proves|demonstrates|improves|causes)\b/i;
const unresolvedMarkerPattern = /\[NEEDS (SOURCE|DATA)\]/i;
const outcomeClaimSections = new Set(["results-status", "discussion", "conclusion"]);

function issue(
  id: string,
  severity: QualityIssue["severity"],
  title: string,
  detail: string,
  fix: string,
): QualityIssue {
  return { id, severity, title, detail, fix };
}

export function reviewProject(project: ThesisProject, draft: DraftSection[]): QualityReport {
  const issues: QualityIssue[] = [];
  const objectiveIds = new Set<string>();
  const methodIds = new Set<string>();
  const sourceIds = new Set<string>();
  const priorResearchIds = new Set<string>();
  const literatureNoteIds = new Set<string>();
  const resultIds = new Set<string>();
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));
  const methodById = new Map(project.methods.map((method) => [method.id, method]));
  const literatureNotes = project.literatureNotes ?? [];
  const isTraceableVerifiedResult = (result: ThesisProject["results"][number]) =>
    result.verification === "verified" && canMarkResultVerified(result, project.sources, project.methods);

  if (!hasTopic(project)) {
    issues.push(
      issue(
        "missing-topic",
        "critical",
        "Add a thesis topic before export",
        "This project does not yet have a usable topic or working title, so its draft would be generic rather than useful.",
        "Enter a topic or working title, then create or revise the starter outline before exporting.",
      ),
    );
  }

  for (const objective of project.objectives) {
    if (objectiveIds.has(objective.id)) {
      issues.push(
        issue(
          `duplicate-objective-${objective.id}`,
          "critical",
          "Duplicate objective identifier",
          `${objective.id} appears more than once in the research-design plan.`,
          "Give every research objective a unique stable identifier.",
        ),
      );
    }
    objectiveIds.add(objective.id);
  }

  for (const source of project.sources) {
    if (sourceIds.has(source.id)) {
      issues.push(
        issue(
          `duplicate-source-${source.id}`,
          "critical",
          "Duplicate source identifier",
          `${source.id} appears more than once in the evidence registry.`,
          "Give every evidence record a unique stable identifier.",
        ),
      );
    }
    sourceIds.add(source.id);

    if (source.status === "verified" && !isUsableVerifiedSource(source)) {
      issues.push(
        issue(
          `thin-verified-source-${source.id}`,
          "warning",
          "Verified source lacks a traceable original record",
          `${source.id} is marked verified but needs a meaningful title or citation, original-record locator, check date, and relevance note.`,
          "Add a DOI, stable URL, repository or archive record, or local record ID; record the date you checked it; then check it against the original source before using it.",
        ),
      );
    }
  }

  for (const record of project.priorResearch) {
    if (priorResearchIds.has(record.id)) {
      issues.push(
        issue(
          `duplicate-prior-research-${record.id}`,
          "critical",
          "Duplicate prior-research identifier",
          `${record.id} appears more than once in the prior-research library.`,
          "Give every prior-research record a unique stable identifier.",
        ),
      );
    }
    priorResearchIds.add(record.id);

    if (record.status === "verified" && !canMarkPriorResearchVerified(record)) {
      issues.push(
        issue(
          `thin-verified-prior-research-${record.id}`,
          "critical",
          "Verified prior work lacks a usable trace",
          `${record.id} is marked verified but does not include a usable title, stable citation, researcher check date, and usable research note.`,
          "Record the title, citation or stable source location, and the date you checked it, then add at least one context, method, finding, or limitation note from the original work.",
        ),
      );
    }

    if (record.status !== "verified") {
      issues.push(
        issue(
          `prior-research-status-${record.id}`,
          "info",
          "Prior work still needs verification",
          `${record.id} is marked ${record.status} and can guide search planning but not formal citation.`,
          "Verify the original thesis or publication, including bibliographic details and the notes recorded here.",
        ),
      );
    }
  }

  if (project.priorResearch.length === 0) {
    issues.push(
      issue(
        "no-prior-research",
        "info",
        "No prior-research library records",
        "The topic map can still frame a new project, but it cannot produce a source-grounded comparison yet.",
        "Add prior theses or research records with traceable notes before writing a comparative literature synthesis.",
      ),
    );
  }

  for (const method of project.methods) {
    if (methodIds.has(method.id)) {
      issues.push(
        issue(
          `duplicate-method-${method.id}`,
          "critical",
          "Duplicate method identifier",
          `${method.id} appears more than once in the research-design plan.`,
          "Give every method record a unique stable identifier.",
        ),
      );
    }
    methodIds.add(method.id);

    if (method.objectiveIds.length === 0 || method.objectiveIds.some((id) => !objectiveIds.has(id))) {
      issues.push(
        issue(
          `method-map-${method.id}`,
          "critical",
          "Method is not linked to a valid objective",
          `${method.id} needs an auditable objective mapping.`,
          "Link the method to one or more existing objective IDs.",
        ),
      );
    }
  }

  for (const source of project.sources) {
    if (source.status !== "verified") {
      issues.push(
        issue(
          `source-status-${source.id}`,
          "info",
          "Evidence source still needs verification",
          `${source.id} is marked ${source.status}.`,
          "Record the full source, original-record locator, date checked, access or licence details, and relevance check before citing it.",
        ),
      );
    }
  }

  if (project.sources.length === 0) {
    issues.push(
      issue(
        "no-sources",
        "warning",
        "No sources in the evidence ledger",
        "The draft can remain a planning scaffold, but it is not ready for literature writing.",
        "Add source records and verify them before using them in a literature review.",
      ),
    );
  }

  for (const note of literatureNotes) {
    if (literatureNoteIds.has(note.id)) {
      issues.push(
        issue(
          `duplicate-literature-note-${note.id}`,
          "critical",
          "Duplicate literature-note identifier",
          `${note.id} appears more than once in the literature evidence matrix.`,
          "Give every literature evidence note a unique stable identifier.",
        ),
      );
    }
    literatureNoteIds.add(note.id);

    const source = sourceById.get(note.sourceId);
    if (!source) {
      issues.push(
        issue(
          `literature-note-source-reference-${note.id}`,
          note.status === "verified" ? "critical" : "warning",
          "Literature note references an unknown source",
          `${note.id} points to ${note.sourceId}, which is not in the evidence ledger.`,
          "Add the source record or relink this note before using it in a literature claim.",
        ),
      );
    }

    if (note.status === "verified") {
      if (!canMarkLiteratureNoteVerified(note, project.sources)) {
        issues.push(
          issue(
            `literature-note-traceability-${note.id}`,
            "critical",
            "Verified literature note lacks a complete source trace",
            `${note.id} needs a usable verified source record, an own-words evidence note, and a page, section, table, or other locator.`,
            "Verify the original source, add a short paraphrase and locator, then mark the note verified.",
          ),
        );
      }
    }
  }

  for (const result of project.results) {
    if (resultIds.has(result.id)) {
      issues.push(
        issue(
          `duplicate-result-${result.id}`,
          "critical",
          "Duplicate result identifier",
          `${result.id} appears more than once in the result ledger.`,
          "Give every result record a unique stable identifier.",
        ),
      );
    }
    resultIds.add(result.id);

    if (result.verification === "verified" && !hasUsableResultRecord(result)) {
      issues.push(
        issue(
          `thin-verified-result-${result.id}`,
          "critical",
          "Verified result lacks a usable record",
          `${result.id} is marked verified but does not include a clear result label and supporting record note.`,
          "Add a concise result label and a note that identifies the underlying analysis or record before marking it verified.",
        ),
      );
    }

    const unknownSourceIds = result.sourceIds.filter((id) => !sourceById.has(id));
    if (unknownSourceIds.length > 0) {
      issues.push(
        issue(
          `result-source-reference-${result.id}`,
          result.verification === "verified" ? "critical" : "warning",
          "Result references unknown evidence",
          `${result.id} lists evidence record IDs that are not in the ledger: ${unknownSourceIds.join(", ")}.`,
          "Add the missing evidence record or remove its ID before relying on this result.",
        ),
      );
    }

    const unknownMethodIds = result.methodIds.filter((id) => !methodById.has(id));
    if (unknownMethodIds.length > 0) {
      issues.push(
        issue(
          `result-method-reference-${result.id}`,
          result.verification === "verified" ? "critical" : "warning",
          "Result references an unknown method",
          `${result.id} lists method IDs that are not in the research-design plan: ${unknownMethodIds.join(", ")}.`,
          "Add the missing planned method or relink this result before relying on it.",
        ),
      );
    }

    if (result.verification === "unverified") {
      issues.push(
        issue(
          `result-status-${result.id}`,
          "info",
          "Result still needs verification",
          `${result.id} is present in the result ledger but is not verified.`,
          "Keep this result out of outcome claims until its supporting record is verified.",
        ),
      );
      continue;
    }

    const linkedSources = result.sourceIds.map((id) => sourceById.get(id));
    const hasVerifiedDirectEvidence = linkedSources.some(isUsableVerifiedDirectEvidence);

    if (result.sourceIds.length === 0 || !hasVerifiedDirectEvidence) {
      issues.push(
        issue(
          `result-traceability-${result.id}`,
          "critical",
          "Verified result lacks a direct evidence record",
          `${result.id} is marked verified but does not link to a usable verified dataset, fieldwork, or policy record. Literature sources can support context or comparison, but not the student's own result.`,
          "Link the result to a verified direct record with identifying and relevance information, or keep it unverified until that record exists.",
        ),
      );
    }

    if (!result.methodIds.some((id) => methodById.has(id))) {
      issues.push(
        issue(
          `result-method-traceability-${result.id}`,
          "critical",
          "Verified result lacks a planned method link",
          `${result.id} is marked verified but does not identify the planned method that produced or analyzed the record.`,
          "Link the result to an existing method record, or keep it unverified until that method is documented.",
        ),
      );
    }

    const hasKnownMethod = result.methodIds.some((id) => methodById.has(id));
    const hasDocumentedMethodPlan = result.methodIds.some((id) => hasMethodDataAndEthicsPlan(methodById.get(id)));
    if (hasKnownMethod && !hasDocumentedMethodPlan) {
      issues.push(
        issue(
          `result-method-readiness-${result.id}`,
          "critical",
          "Verified result lacks a method safeguard plan",
          `${result.id} links to a planned method, but that method has no documented data, permissions, privacy, or ethics plan.`,
          "Record the method-specific data and safeguard plan, or keep the result unverified until the plan is documented.",
        ),
      );
    }
  }

  for (const section of draft) {
    if (unresolvedMarkerPattern.test(section.body)) {
      const resultLikeSection = ["results-status", "conclusion"].includes(section.id);
      issues.push(
        issue(
          `unresolved-${section.id}`,
          resultLikeSection ? "critical" : "warning",
          "Unresolved evidence marker in draft",
          `${section.heading} contains a [NEEDS SOURCE] or [NEEDS DATA] marker.`,
          "Replace the marker with a traceable record or revise the sentence as a planned activity.",
        ),
      );
    }

    if (outcomeClaimSections.has(section.id) && unsupportedOutcomePattern.test(section.body)) {
      const hasVerifiedResult = project.results.some(isTraceableVerifiedResult);
      if (!hasVerifiedResult) {
        issues.push(
          issue(
            `unsupported-outcome-${section.id}`,
            "critical",
            "Outcome language lacks verified results",
            `${section.heading} uses outcome language without a verified result ledger entry.`,
            "Use plan language or attach a verified result ID and its supporting record.",
          ),
        );
      }
    }
  }

  const criticalCount = issues.filter((entry) => entry.severity === "critical").length;
  const warningCount = issues.filter((entry) => entry.severity === "warning").length;
  const score = Math.max(0, 100 - criticalCount * 35 - warningCount * 12);

  return {
    issues,
    score,
    canExportAsDraft: criticalCount === 0,
    sourceCount: project.sources.length,
    verifiedSourceCount: project.sources.filter(isUsableVerifiedSource).length,
    priorResearchCount: project.priorResearch.length,
    verifiedPriorResearchCount: project.priorResearch.filter(isUsableVerifiedPriorResearch).length,
    literatureNoteCount: literatureNotes.length,
    verifiedLiteratureNoteCount: literatureNotes.filter((note) => canMarkLiteratureNoteVerified(note, project.sources)).length,
    resultCount: project.results.length,
    verifiedResultCount: project.results.filter(isTraceableVerifiedResult).length,
  };
}
