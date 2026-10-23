import type {
  DraftSection,
  EvidenceSource,
  QualityIssue,
  QualityReport,
  ThesisProject,
} from "@/lib/thesis-types";
import { hasTopic } from "@/lib/topic-starter";

const unsupportedOutcomePattern = /\b(outperforms|proves|demonstrates|improves|causes)\b/i;
const unresolvedMarkerPattern = /\[NEEDS (SOURCE|DATA)\]/i;
const outcomeClaimSections = new Set(["results-status", "discussion", "conclusion"]);

function isUsableVerifiedSource(source: EvidenceSource | undefined): boolean {
  return source?.status === "verified" && source.label.trim().length >= 5 && source.note.trim().length >= 12;
}

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
  const objectiveIds = new Set(project.objectives.map((objective) => objective.id));
  const sourceIds = new Set<string>();
  const priorResearchIds = new Set<string>();
  const resultIds = new Set<string>();
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));

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
          "Verified source lacks a usable record",
          `${source.id} is marked verified but does not yet contain enough identifying or relevance information.`,
          "Record a complete citation or stable source description, plus the evidence or claim it supports.",
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

    const hasResearchDetail = [record.context, record.researchQuestion, record.methodology, record.findings, record.limitations]
      .some((value) => value.trim().length >= 12);
    if (record.status === "verified" && (record.citation.trim().length < 8 || !hasResearchDetail)) {
      issues.push(
        issue(
          `thin-verified-prior-research-${record.id}`,
          "warning",
          "Verified prior work lacks a usable trace",
          `${record.id} is marked verified but does not include a stable citation and a usable research note.`,
          "Record the citation or stable source location, then add at least one context, method, finding, or limitation note from the original work.",
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
          "Record the full source, access date, license, and relevance check before citing it.",
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

    if (result.verification === "verified" && (result.label.trim().length < 5 || result.note.trim().length < 12)) {
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
    const hasVerifiedEvidence = linkedSources.some(isUsableVerifiedSource);

    if (result.sourceIds.length === 0 || !hasVerifiedEvidence) {
      issues.push(
        issue(
          `result-traceability-${result.id}`,
          "critical",
          "Verified result has no verified evidence link",
          `${result.id} is marked verified but does not link to a usable verified source record.`,
          "Link the result to a verified source, dataset, or approved result record with identifying and relevance information.",
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
      const hasVerifiedResult = project.results.some((result) => result.verification === "verified");
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
    verifiedSourceCount: project.sources.filter((source) => source.status === "verified").length,
    priorResearchCount: project.priorResearch.length,
    verifiedPriorResearchCount: project.priorResearch.filter((record) => record.status === "verified").length,
    resultCount: project.results.length,
    verifiedResultCount: project.results.filter((result) => result.verification === "verified").length,
  };
}
