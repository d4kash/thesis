import { hasMethodDataAndEthicsPlan } from "@/lib/method-readiness";
import type { EvidenceSource, ResearchMethod, ResultLedgerItem } from "@/lib/thesis-types";

export const RESULT_LABEL_MINIMUM_LENGTH = 5;
export const RESULT_NOTE_MINIMUM_LENGTH = 12;
const SOURCE_LABEL_MINIMUM_LENGTH = 5;
const SOURCE_NOTE_MINIMUM_LENGTH = 12;
export const SOURCE_LOCATOR_MINIMUM_LENGTH = 8;
const ISO_CHECK_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function hasUsableSourceLocator(source: EvidenceSource | undefined): boolean {
  return (source?.locator?.trim().length ?? 0) >= SOURCE_LOCATOR_MINIMUM_LENGTH;
}

export function hasUsableResearcherCheckDate(value: string | undefined): boolean {
  const cleanValue = value?.trim() ?? "";
  if (!ISO_CHECK_DATE_PATTERN.test(cleanValue)) return false;

  const date = new Date(`${cleanValue}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === cleanValue;
}

export function hasUsableSourceCheckDate(source: EvidenceSource | undefined): boolean {
  return hasUsableResearcherCheckDate(source?.checkedOn);
}

export function isUsableVerifiedSource(source: EvidenceSource | undefined): boolean {
  return source?.status === "verified"
    && source.label.trim().length >= SOURCE_LABEL_MINIMUM_LENGTH
    && hasUsableSourceLocator(source)
    && hasUsableSourceCheckDate(source)
    && source.note.trim().length >= SOURCE_NOTE_MINIMUM_LENGTH;
}

export function normalizeSourceVerification(source: EvidenceSource): EvidenceSource {
  if (source.status === "verified" && !isUsableVerifiedSource(source)) {
    return { ...source, status: "reviewed" };
  }

  return source;
}

export function isUsableVerifiedDirectEvidence(source: EvidenceSource | undefined): boolean {
  return isUsableVerifiedSource(source) && source?.kind !== "literature-map";
}

export function isUsableVerifiedCitationSource(source: EvidenceSource | undefined): boolean {
  return isUsableVerifiedSource(source) && source?.kind !== "field-note";
}

export function hasUsableResultRecord(result: ResultLedgerItem): boolean {
  return result.label.trim().length >= RESULT_LABEL_MINIMUM_LENGTH
    && result.note.trim().length >= RESULT_NOTE_MINIMUM_LENGTH;
}

export function canMarkResultVerified(
  result: ResultLedgerItem,
  sources: EvidenceSource[],
  methods: ResearchMethod[],
): boolean {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const methodById = new Map(methods.map((method) => [method.id, method]));

  return hasUsableResultRecord(result)
    && result.sourceIds.some((id) => isUsableVerifiedDirectEvidence(sourceById.get(id)))
    && result.methodIds.some((id) => hasMethodDataAndEthicsPlan(methodById.get(id)));
}

export function normalizeResultVerification(
  result: ResultLedgerItem,
  sources: EvidenceSource[],
  methods: ResearchMethod[],
): ResultLedgerItem {
  if (result.verification === "verified" && !canMarkResultVerified(result, sources, methods)) {
    return { ...result, verification: "unverified" };
  }

  return result;
}
