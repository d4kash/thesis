import type { DraftSection, QualityReport, ThesisProject } from "@/lib/thesis-types";
import { buildDissertationRoadmap } from "@/lib/dissertation-roadmap";
import { canMarkLiteratureNoteVerified } from "@/lib/literature-readiness";
import { isUsableVerifiedPriorResearch } from "@/lib/prior-research-readiness";
import { canMarkResultVerified, isUsableVerifiedCitationSource, isUsableVerifiedSource } from "@/lib/result-readiness";
import { escapeMarkdownInlineText } from "@/lib/markdown";

function listedRecords(records: string[], emptyMessage: string): string {
  return records.length > 0 ? records.join("\n") : emptyMessage;
}

function markdownValue(value: string | null | undefined, fallback: string): string {
  return escapeMarkdownInlineText(value) || fallback;
}

function verificationLabel(recordedStatus: string, traceable: boolean): string {
  if (recordedStatus !== "verified") return recordedStatus.toUpperCase();
  return traceable ? "VERIFIED AND TRACEABLE" : "VERIFICATION INCOMPLETE";
}

function sourceVerificationLabel(source: ThesisProject["sources"][number]): string {
  const traceable = isUsableVerifiedSource(source);

  if (source.kind === "field-note" && source.status === "verified" && traceable) {
    return "VERIFIED INTERNAL RECORD";
  }

  return verificationLabel(source.status, traceable);
}

export function buildDraftMarkdown(
  project: ThesisProject,
  draft: DraftSection[],
  review: QualityReport,
): string {
  const status = review.canExportAsDraft ? "PASSED STRUCTURAL REVIEW" : "REVIEW REQUIRED";
  const sections = draft.map((section) => `## ${escapeMarkdownInlineText(section.heading)}\n\n${section.body}`).join("\n\n");

  return `# ${markdownValue(project.title, "[NEEDS INPUT] Working title")}\n\n> ${markdownValue(project.demoLabel, "[NEEDS INPUT] Project label")}\n> ${status}\n> This output is a topic-led research-planning draft. It is not a submitted thesis and contains no claimed findings.\n> Prior-research records are comparison notes until their original sources have been verified.\n\n${sections}\n\n## Quality review\n\nScore: ${review.score}/100\n\n${review.issues.length === 0 ? "No issues detected." : review.issues.map((entry) => `- **${entry.severity.toUpperCase()}** — ${escapeMarkdownInlineText(entry.title)}: ${escapeMarkdownInlineText(entry.fix)}`).join("\n")}`;
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
      const citationReady = isUsableVerifiedCitationSource(source);
      const attributionCheck = source.kind === "field-note"
        ? traceable
          ? "Traceable internal fieldwork or analysis record. Keep it in the evidence ledger; do not add it as a formal bibliography entry unless the supervisor or institution specifically requires it."
          : source.status === "verified"
            ? "Verification is incomplete. Keep this as an internal fieldwork or analysis record until its original-record trace is complete; it is not a formal citation."
            : "Internal fieldwork or analysis record. Keep it in the evidence ledger; it is not a formal citation."
        : citationReady
          ? "Verified and traceable in the local ledger; supervisor should still check the original source and required citation style."
          : source.status === "verified"
            ? "Verification is incomplete. Do not use this as a formal citation until its original-record trace is complete."
            : "Not ready for formal citation until the researcher verifies the original source.";

      return `- ${markdownValue(source.id, "[NEEDS INPUT] Source identifier")} — ${sourceVerificationLabel(source)} ${escapeMarkdownInlineText(source.kind)}: ${markdownValue(source.label, "[NEEDS INPUT] Source title or citation")}\n  - Original record locator: ${markdownValue(source.locator, "[NEEDS INPUT] Add a DOI, stable URL, repository/archive record, or local record ID.")}\n  - Researcher check date: ${markdownValue(source.checkedOn, "[NEEDS INPUT] Record the date the original record was checked.")}\n  - Researcher note: ${markdownValue(source.note, "[NEEDS INPUT] Explain relevance and verification.")}\n  - Attribution check: ${attributionCheck}`;
    }),
    "- No source records yet. Do not add a bibliography from titles or memory.",
  );
  const literatureNotes = listedRecords(
    (project.literatureNotes ?? []).map((note) =>
      `- ${markdownValue(note.id, "[NEEDS INPUT] Literature-note identifier")} — ${verificationLabel(note.status, canMarkLiteratureNoteVerified(note, project.sources))} · source ${markdownValue(note.sourceId, "[NEEDS INPUT]")} · ${escapeMarkdownInlineText(note.use)}\n  - Locator: ${markdownValue(note.locator, "[NEEDS INPUT] Add a specific page, section, table, figure, or dataset-field marker.")}\n  - Researcher’s own-words note: ${markdownValue(note.claim, "[NEEDS INPUT] Record an own-words note after checking the original source.")}`,
    ),
    "- No literature evidence notes yet. Add only notes linked to a checked original source.",
  );
  const priorResearch = listedRecords(
    project.priorResearch.map((record) =>
      `- ${markdownValue(record.id, "[NEEDS INPUT] Prior-work identifier")} — ${verificationLabel(record.status, isUsableVerifiedPriorResearch(record))}: ${markdownValue(record.title, "[NEEDS INPUT] Prior-work title")}\n  - Citation or stable source location: ${markdownValue(record.citation, "[NEEDS INPUT]")}\n  - Access or permission note: ${markdownValue(record.accessNote, "[NEEDS INPUT] Record the public-access, licence, or permission basis before verification.")}\n  - Researcher check date: ${markdownValue(record.checkedOn, "[NEEDS INPUT] Record the date the original work was checked.")}\n  - Review boundary: Treat this as a comparison record until its original thesis or paper is verified.`,
    ),
    "- No prior-research records yet. Add original-record details before comparing earlier studies.",
  );
  const methodPlans = listedRecords(
    project.methods.map((method) =>
      `- ${markdownValue(method.id, "[NEEDS INPUT] Method identifier")} → ${method.objectiveIds.map(escapeMarkdownInlineText).join(", ") || "[NEEDS INPUT] Objective mapping"}: ${markdownValue(method.text, "[NEEDS INPUT] Proposed method")}\n  - Data, permissions, and ethics plan: ${markdownValue(method.dataAndEthicsPlan, "[NEEDS INPUT] Record planned safeguards before linking results.")}`,
    ),
    "- No methods have been added yet.",
  );
  const resultRecords = listedRecords(
    project.results.map((result) =>
      `- ${markdownValue(result.id, "[NEEDS INPUT] Result identifier")} — ${verificationLabel(result.verification, canMarkResultVerified(result, project.sources, project.methods))}: ${markdownValue(result.label, "[NEEDS INPUT] Result label")}\n  - Direct record links: ${result.sourceIds.map(escapeMarkdownInlineText).join(", ") || "none"}\n  - Planned method links: ${result.methodIds.map(escapeMarkdownInlineText).join(", ") || "none"}\n  - Researcher note: ${markdownValue(result.note, "[NEEDS INPUT] Explain the traceable record or analysis.")}`,
    ),
    "- No results recorded. This is appropriate for a planning-stage project; do not add findings before they exist and can be traced.",
  );
  const sectionMap = listedRecords(
    draft.map((section) => `- ${escapeMarkdownInlineText(section.heading)}: linked records ${section.claimIds.length > 0 ? section.claimIds.map(escapeMarkdownInlineText).join(", ") : "none required for this planning section"}.`),
    "- No draft sections were generated.",
  );
  const qualityIssues = listedRecords(
    review.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${escapeMarkdownInlineText(issue.title)}. Required action: ${escapeMarkdownInlineText(issue.fix)}`),
    "- No structural issues detected. This does not replace source, citation, ethics, or supervisor review.",
  );
  const originalityChecks = roadmap.originalityChecks.map(
    (check) => `- ${check.status.toUpperCase()}: ${check.label}. ${check.summary} Next: ${check.nextStep}`,
  ).join("\n");

  return `# Supervisor review packet: ${markdownValue(project.title, "[NEEDS INPUT] Working title")}

> ${markdownValue(project.demoLabel, "[NEEDS INPUT] Project label")}
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
