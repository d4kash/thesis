import { canMarkLiteratureNoteVerified } from "@/lib/literature-readiness";
import { escapeMarkdownInlineText as text } from "@/lib/markdown";
import type { LiteratureUse, ThesisProject } from "@/lib/thesis-types";

const GROUPS: Array<{ use: LiteratureUse; heading: string }> = [
  { use: "background", heading: "Background and definitions" },
  { use: "method", heading: "Methods and approaches" },
  { use: "comparison", heading: "Comparison with earlier work" },
  { use: "limitation", heading: "Limitations and open questions" },
];

function idCounts(records: Array<{ id: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) counts.set(record.id, (counts.get(record.id) ?? 0) + 1);
  return counts;
}

/** Assemble researcher notes locally; recorded verification is never an independent fact check. */
export function buildLiteratureWorkingDraft(project: ThesisProject): { body: string; claimIds: string[] } {
  const notes = project.literatureNotes ?? [];
  const noteCounts = idCounts(notes);
  const sourceCounts = idCounts(project.sources);
  const sourceById = new Map(project.sources.map((source) => [source.id, source]));
  const included = notes.filter((note) => note.status === "verified"
    && noteCounts.get(note.id) === 1
    && sourceCounts.get(note.sourceId) === 1
    && GROUPS.some((group) => group.use === note.use)
    && canMarkLiteratureNoteVerified(note, project.sources));
  const claimIds = new Set<string>();
  const groups = GROUPS.map((group) => {
    const groupNotes = included.filter((note) => note.use === group.use);
    const paragraphs = groupNotes.map((note) => {
      // Eligibility above requires exactly one complete, checked literature source.
      const source = sourceById.get(note.sourceId)!;
      claimIds.add(note.id);
      claimIds.add(source.id);
      return `Own-words note (${text(note.id)}): ${text(note.claim)}\nSource record: ${text(source.id)} — ${text(source.label)}\nOriginal record locator: ${text(source.locator)}\nRe-check location: ${text(note.locator)}\nResearcher check date: ${text(source.checkedOn)}`;
    });
    return `${group.heading}\n\n${paragraphs.length > 0
      ? paragraphs.join("\n\n")
      : `[NEEDS INPUT] Add a checked own-words note for ${group.heading.toLowerCase()}, or explain with your supervisor why it is not needed.`}`;
  });

  return {
    body: [
      "Source-linked literature working draft — assembled from your own notes, not independently verified. This tool does not invent citations, rewrite source text, or establish that sources agree or prove a research gap. Record identifiers are not finished bibliography entries.",
      `Notes included: ${included.length}. Notes awaiting re-check: ${notes.length - included.length}.`,
      "Edit wording and source locations in the literature evidence matrix. Re-check edited notes and sources before marking them verified again; this draft updates automatically. Excluded notes remain in the matrix, not in this assembled section.",
      ...groups,
      "[NEEDS INPUT] Write your own comparison of the checked sources, including disagreements, limitations, and relevance to your research question. Do not claim a novel gap from missing notes alone. Confirm access/permission and the required citation style before formal use.",
    ].join("\n\n"),
    claimIds: [...claimIds],
  };
}
