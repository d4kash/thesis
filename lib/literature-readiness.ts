import { isUsableVerifiedSource } from "@/lib/result-readiness";
import type { EvidenceSource, LiteratureEvidenceNote } from "@/lib/thesis-types";

export const LITERATURE_NOTE_MINIMUM_LENGTH = 12;
export const LITERATURE_LOCATOR_MINIMUM_LENGTH = 2;

export function hasUsableLiteratureNote(note: LiteratureEvidenceNote): boolean {
  return note.claim.trim().length >= LITERATURE_NOTE_MINIMUM_LENGTH
    && note.locator.trim().length >= LITERATURE_LOCATOR_MINIMUM_LENGTH;
}

export function canMarkLiteratureNoteVerified(
  note: LiteratureEvidenceNote,
  sources: EvidenceSource[],
): boolean {
  const source = sources.find((entry) => entry.id === note.sourceId);

  return hasUsableLiteratureNote(note) && isUsableVerifiedSource(source);
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
