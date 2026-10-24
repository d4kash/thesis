import { isUsableVerifiedSource } from "@/lib/result-readiness";
import type { EvidenceSource, LiteratureEvidenceNote } from "@/lib/thesis-types";

export const LITERATURE_NOTE_MINIMUM_LENGTH = 12;
export const LITERATURE_LOCATOR_MINIMUM_LENGTH = 3;

const SPECIFIC_RECHECK_LOCATION_PATTERN = /(?:\b(?:page|p|pp|section|sec|chapter|ch|table|tab|figure|fig|appendix|dataset|field|record|row|column|sheet|cell|paragraph|para|abstract|method|methodology|result|results|discussion|introduction|conclusion|supplement|supplementary)\.?(?=\s|$|[\d,:;#(])|\b\d+(?:\.\d+)*\b)/i;

export function hasUsableLiteratureLocator(locator: string): boolean {
  const value = locator.trim();
  return value.length >= LITERATURE_LOCATOR_MINIMUM_LENGTH
    && SPECIFIC_RECHECK_LOCATION_PATTERN.test(value);
}

export function hasUsableLiteratureNote(note: LiteratureEvidenceNote): boolean {
  return note.claim.trim().length >= LITERATURE_NOTE_MINIMUM_LENGTH
    && hasUsableLiteratureLocator(note.locator);
}

export function canMarkLiteratureNoteVerified(
  note: LiteratureEvidenceNote,
  sources: EvidenceSource[],
): boolean {
  const source = sources.find((entry) => entry.id === note.sourceId);

  return hasUsableLiteratureNote(note)
    && source?.kind === "literature-map"
    && isUsableVerifiedSource(source);
}

export function normalizeLiteratureVerification(
  note: LiteratureEvidenceNote,
  sources: EvidenceSource[],
): LiteratureEvidenceNote {
  if (note.status === "verified" && !canMarkLiteratureNoteVerified(note, sources)) {
    return { ...note, status: "reviewed" };
  }

  return note;
}
