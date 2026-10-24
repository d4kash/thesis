import type { PriorResearchRecord } from "@/lib/thesis-types";

export const PRIOR_RESEARCH_CITATION_MINIMUM_LENGTH = 8;
export const PRIOR_RESEARCH_NOTE_MINIMUM_LENGTH = 12;

export function hasUsablePriorResearchDetail(record: PriorResearchRecord): boolean {
  return [record.context, record.researchQuestion, record.methodology, record.findings, record.limitations]
    .some((value) => value.trim().length >= PRIOR_RESEARCH_NOTE_MINIMUM_LENGTH);
}

export function canMarkPriorResearchVerified(record: PriorResearchRecord): boolean {
  return record.citation.trim().length >= PRIOR_RESEARCH_CITATION_MINIMUM_LENGTH
    && hasUsablePriorResearchDetail(record);
}

export function normalizePriorResearchVerification(record: PriorResearchRecord): PriorResearchRecord {
  if (record.status === "verified" && !canMarkPriorResearchVerified(record)) {
    return { ...record, status: "reviewed" };
  }

  return record;
}
