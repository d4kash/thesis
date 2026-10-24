import type { DraftSection, QualityReport, ThesisProject } from "@/lib/thesis-types";
import { buildDissertationRoadmap } from "@/lib/dissertation-roadmap";
import { canMarkLiteratureNoteVerified } from "@/lib/literature-readiness";
import { isUsableVerifiedPriorResearch } from "@/lib/prior-research-readiness";
import { canMarkResultVerified, isUsableVerifiedSource } from "@/lib/result-readiness";

function listedRecords(records: string[], emptyMessage: string): string {
  return records.length > 0 ? records.join("\n") : emptyMessage;
}

function verificationLabel(recordedStatus: string, traceable: boolean): string {
  if (recordedStatus !== "verified") return recordedStatus.toUpperCase();
  return traceable ? "VERIFIED AND TRACEABLE" : "VERIFICATION INCOMPLETE";
}

export function buildDraftMarkdown(
  project: ThesisProject,
  draft: DraftSection[],
  review: QualityReport,
): string {
  const status = review.canExportAsDraft ? "PASSED STRUCTURAL REVIEW" : "REVIEW REQUIRED";
  const sections = draft.map((section) => `## ${section.heading}\n\n${section.body}`).join("\n\n");

  return `# ${project.title}\n\n> ${project.demoLabel}\n> ${status}\n> This output is a topic-led research-planning draft. It is not a submitted thesis and contains no claimed findings.\n> Prior-research records are comparison notes until their original sources have been verified.\n\n${sections}\n\n## Quality review\n\nScore: ${review.score}/100\n\n${review.issues.length === 0 ? "No issues detected." : review.issues.map((entry) => `- **${entry.severity.toUpperCase()}** — ${entry.title}: ${entry.fix}`).join("\n")}`;
}

export function buildSupervisorReviewMarkdown(
  project: ThesisProject,
  draft: DraftSection[],
  review: QualityReport,
): string {
  const roadmap = buildDissertationRoadmap(project);
  const status = review.canExportAsDraft ? "STRUCTURAL CHECKS PASSED — SUPERVISOR REVIEW STILL REQUIRED" : "STRUCTURAL REVIEW REQUIRED";
  const sourceRecords = listedRecords(
    project.sources.map((source) => {
      const traceable = isUsableVerifiedSource(source);
      const attributionCheck = traceable
        ? "Verified and traceable in the local ledger; supervisor should still check the original source and required citation style."
        : source.status === "verified"
          ? "Verification is incomplete. Do not use this as a formal citation until its original-record trace is complete."
          : "Not ready for formal citation until the researcher verifies the original source.";

      return `- ${source.id} — ${verificationLabel(source.status, traceable)} ${source.kind}: ${source.label || "[NEEDS INPUT] Source title or citation"}\n  - Original record locator: ${source.locator?.trim() || "[NEEDS INPUT] Add a DOI, stable URL, repository/archive record, or local record ID."}\n  - Researcher check date: ${source.checkedOn?.trim() || "[NEEDS INPUT] Record the date the original record was checked."}\n  - Researcher note: ${source.note || "[NEEDS INPUT] Explain relevance and verification."}\n  - Attribution check: ${attributionCheck}`;
    }),
    "- No source records yet. Do not add a bibliography from titles or memory.",
  );
  const literatureNotes = listedRecords(
    (project.literatureNotes ?? []).map((note) =>
      `- ${note.id} — ${verificationLabel(note.status, canMarkLiteratureNoteVerified(note, project.sources))} · source ${note.sourceId || "[NEEDS INPUT]"} · ${note.use}\n  - Locator: ${note.locator || "[NEEDS INPUT] Add a specific page, section, table, figure, or dataset-field marker."}\n  - Researcher’s own-words note: ${note.claim || "[NEEDS INPUT] Record an own-words note after checking the original source."}`,
    ),
    "- No literature evidence notes yet. Add only notes linked to a checked original source.",
  );
  const priorResearch = listedRecords(
    project.priorResearch.map((record) =>
      `- ${record.id} — ${verificationLabel(record.status, isUsableVerifiedPriorResearch(record))}: ${record.title || "[NEEDS INPUT] Prior-work title"}\n  - Citation or stable source location: ${record.citation || "[NEEDS INPUT]"}\n  - Researcher check date: ${record.checkedOn?.trim() || "[NEEDS INPUT] Record the date the original work was checked."}\n  - Review boundary: Treat this as a comparison record until its original thesis or paper is verified.`,
    ),
    "- No prior-research records yet. Add original-record details before comparing earlier studies.",
  );
  const methodPlans = listedRecords(
    project.methods.map((method) =>
      `- ${method.id} → ${method.objectiveIds.join(", ") || "[NEEDS INPUT] Objective mapping"}: ${method.text || "[NEEDS INPUT] Proposed method"}\n  - Data, permissions, and ethics plan: ${method.dataAndEthicsPlan?.trim() || "[NEEDS INPUT] Record planned safeguards before linking results."}`,
    ),
    "- No methods have been added yet.",
  );
  const resultRecords = listedRecords(
    project.results.map((result) =>
      `- ${result.id} — ${verificationLabel(result.verification, canMarkResultVerified(result, project.sources, project.methods))}: ${result.label || "[NEEDS INPUT] Result label"}\n  - Direct record links: ${result.sourceIds.join(", ") || "none"}\n  - Planned method links: ${result.methodIds.join(", ") || "none"}\n  - Researcher note: ${result.note || "[NEEDS INPUT] Explain the traceable record or analysis."}`,
    ),
    "- No results recorded. This is appropriate for a planning-stage project; do not add findings before they exist and can be traced.",
  );
  const sectionMap = listedRecords(
    draft.map((section) => `- ${section.heading}: linked records ${section.claimIds.length > 0 ? section.claimIds.join(", ") : "none required for this planning section"}.`),
    "- No draft sections were generated.",
  );
  const qualityIssues = listedRecords(
    review.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.title}. Required action: ${issue.fix}`),
    "- No structural issues detected. This does not replace source, citation, ethics, or supervisor review.",
  );
  const originalityChecks = roadmap.originalityChecks.map(
    (check) => `- ${check.status.toUpperCase()}: ${check.label}. ${check.summary} Next: ${check.nextStep}`,
  ).join("\n");

  return `# Supervisor review packet: ${project.title || "[NEEDS INPUT] Working title"}

> ${project.demoLabel}
> ${status}
> This editable packet lists only the project records already entered by the researcher and the current structural checks. It is not a thesis, a citation generator, an ethics approval, or an originality certificate.

## How to use this packet

1. Review the linked records and unresolved items with the supervisor.
2. Verify every final citation against the original source and the department's required style.
3. Keep findings, results, and recommendations out of the thesis until their direct records and methods are traceable.

## Citation and attribution trail

No citation is generated by this packet. A source record, link, or own-words note is not a finished reference entry and does not remove the need for attribution.

### Source records

${sourceRecords}

### Literature evidence notes

${literatureNotes}

### Prior-research comparison records

${priorResearch}

## Method, data, and result traceability

### Planned methods and safeguards

${methodPlans}

### Result ledger

${resultRecords}

## Draft section map

${sectionMap}

## Structural review

Score: ${review.score}/100

${qualityIssues}

## Originality-readiness checks

${originalityChecks}

## Supervisor editable review

### Decision

- [ ] Continue as a research plan
- [ ] Revise and resubmit for review
- [ ] Do not collect or analyse data until required approvals are confirmed
- Supervisor decision note: [SUPERVISOR NOTE]

### Required revisions

- Citation and attribution actions: [SUPERVISOR NOTE]
- Method, ethics, permissions, or data-protection actions: [SUPERVISOR NOTE]
- Evidence or result-traceability actions: [SUPERVISOR NOTE]
- Scope, feasibility, or chapter-plan actions: [SUPERVISOR NOTE]

### Review record

- Reviewer name/role: [SUPERVISOR NOTE]
- Review date: [SUPERVISOR NOTE]
- Next review milestone: [SUPERVISOR NOTE]

> Do not treat a completed checklist as institutional approval or a similarity-clearance result. Keep the final document under the applicable university rules and supervisor guidance.`;
}
