import type { PriorResearchRecord } from "@/lib/thesis-types";
import { hasUsableResearcherCheckDate } from "@/lib/result-readiness";

export const PRIOR_RESEARCH_CITATION_MINIMUM_LENGTH = 8;
export const PRIOR_RESEARCH_NOTE_MINIMUM_LENGTH = 12;

export function hasUsablePriorResearchDetail(record: PriorResearchRecord): boolean {
  return [record.context, record.researchQuestion, record.methodology, record.findings, record.limitations]
    .some((value) => value.trim().length >= PRIOR_RESEARCH_NOTE_MINIMUM_LENGTH);
}

export function canMarkPriorResearchVerified(record: PriorResearchRecord): boolean {
  return record.title.trim().length > 0
    && record.citation.trim().length >= PRIOR_RESEARCH_CITATION_MINIMUM_LENGTH
    && hasUsableResearcherCheckDate(record.checkedOn)
    && hasUsablePriorResearchDetail(record);
}

export function isUsableVerifiedPriorResearch(record: PriorResearchRecord): boolean {
  return record.status === "verified" && canMarkPriorResearchVerified(record);
}

export function normalizePriorResearchVerification(record: PriorResearchRecord): PriorResearchRecord {
  if (record.status === "verified" && !isUsableVerifiedPriorResearch(record)) {
    return { ...record, status: "reviewed" };
  }

  return record;
}

export function revisePriorResearchRecord(
  record: PriorResearchRecord,
  changes: Partial<Pick<
    PriorResearchRecord,
    "title" | "citation" | "checkedOn" | "context" | "researchQuestion" | "methodology" | "findings" | "limitations"
  >>,
): PriorResearchRecord {
  const revisedRecord = { ...record, ...changes };
  const hasRevision = Object.values(changes).some((value) => value !== undefined);

  if (record.status === "verified" && hasRevision) {
    return { ...revisedRecord, status: "reviewed" };
  }

  return normalizePriorResearchVerification(revisedRecord);
}
