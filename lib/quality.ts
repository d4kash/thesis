import type {
  DraftSection,
  QualityIssue,
  QualityReport,
  ThesisProject,
} from "@/lib/thesis-types";

const unsupportedOutcomePattern = /\b(outperforms|proves|demonstrates|improves|causes)\b/i;
const unresolvedMarkerPattern = /\[NEEDS (SOURCE|DATA)\]/i;

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

    if (["results-status", "conclusion"].includes(section.id) && unsupportedOutcomePattern.test(section.body)) {
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
  };
}
