"use client";

import { useMemo, useState } from "react";
import { canMarkLiteratureNoteVerified, reviseLiteratureEvidenceNote } from "@/lib/literature-readiness";
import type { LiteratureEvidenceNote, LiteratureEvidenceStatus, LiteratureUse, ThesisProject } from "@/lib/thesis-types";

interface LiteratureEvidenceMatrixProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

const useLabels: Record<LiteratureUse, string> = {
  background: "Background or definition",
  method: "Method or approach",
  comparison: "Comparison with earlier work",
  limitation: "Limitation or open question",
};

function nextId(ids: string[]): string {
  const highest = ids.reduce((current, id) => {
    const match = id.match(/^LIT-(\d+)$/);
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);

  return `LIT-${String(highest + 1).padStart(2, "0")}`;
}

export function LiteratureEvidenceMatrix({ project, onChange }: LiteratureEvidenceMatrixProps) {
  const [sourceId, setSourceId] = useState("");
  const [claim, setClaim] = useState("");
  const [locator, setLocator] = useState("");
  const [use, setUse] = useState<LiteratureUse>("background");
  const [status, setStatus] = useState<LiteratureEvidenceStatus>("reviewed");
  const [message, setMessage] = useState("");
  const notes = project.literatureNotes ?? [];
  const literatureSources = useMemo(
    () => project.sources.filter((source) => source.kind === "literature-map"),
    [project.sources],
  );
  const sourceById = useMemo(
    () => new Map(project.sources.map((source) => [source.id, source])),
    [project.sources],
  );

  function addNote() {
    const source = sourceById.get(sourceId);
    const cleanClaim = claim.trim();
    const cleanLocator = locator.trim();

    if (!source || source.kind !== "literature-map") {
      setMessage("Choose a source classified as Literature source in the evidence ledger first.");
      return;
    }

    if (!cleanClaim || !cleanLocator) {
      setMessage("Add a short evidence note in your own words and where you can re-check it.");
      return;
    }

    const note = {
      id: nextId(notes.map((entry) => entry.id)),
      sourceId,
      claim: cleanClaim,
      locator: cleanLocator,
      use,
      status,
    };

    if (status === "verified" && !canMarkLiteratureNoteVerified(note, project.sources)) {
      setMessage("A verified literature note needs a useful own-words explanation, a specific re-check location, and a complete verified literature source record.");
      return;
    }

    onChange({
      ...project,
      literatureNotes: [
        ...notes,
        note,
      ],
    });
    setSourceId("");
    setClaim("");
    setLocator("");
    setUse("background");
    setStatus("reviewed");
    setMessage("Evidence note added. It remains editable and linked to its source record.");
  }

  function updateStatus(id: string, nextStatus: LiteratureEvidenceStatus) {
    const note = notes.find((entry) => entry.id === id);
    const nextNote = note ? { ...note, status: nextStatus } : undefined;

    if (nextStatus === "verified" && (!nextNote || !canMarkLiteratureNoteVerified(nextNote, project.sources))) {
      setMessage("A verified literature note needs a useful own-words explanation, a specific re-check location, and a complete verified literature source record.");
      return;
    }

    onChange({
      ...project,
      literatureNotes: notes.map((entry) => entry.id === id ? { ...entry, status: nextStatus } : entry),
    });
    setMessage(`${id} marked ${nextStatus}.`);
  }

  function updateNote(
    id: string,
    changes: Partial<Pick<LiteratureEvidenceNote, "claim" | "locator" | "use">>,
  ) {
    let returnedToReviewed = false;
    const literatureNotes = notes.map((note) => {
      if (note.id !== id) return note;
      const revisedNote = reviseLiteratureEvidenceNote(note, changes, project.sources);
      returnedToReviewed ||= note.status === "verified" && revisedNote.status === "reviewed";
      return revisedNote;
    });

    onChange({ ...project, literatureNotes });
    setMessage(returnedToReviewed
      ? `${id} returned to reviewed after an edit. Re-check the original source and note before marking it verified again.`
      : `${id} updated.`);
  }

  function removeNote(id: string) {
    onChange({ ...project, literatureNotes: notes.filter((note) => note.id !== id) });
    setMessage(`${id} removed from the literature evidence matrix.`);
  }

  return (
    <section className="panel literature-evidence-matrix" id="literature-evidence-matrix" aria-labelledby="literature-evidence-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">LITERATURE EVIDENCE MATRIX</p>
          <h2 id="literature-evidence-heading">Link each literature note to a source</h2>
        </div>
        <span className="status-pill">Local only</span>
      </div>
      <p className="field-note">For every point you may use in a literature review, keep a short own-words note and the place to check it again.</p>
      <p className="literature-evidence-matrix__boundary">Do not paste long excerpts or try to change wording to avoid attribution. A paraphrase still needs a citation to the original source.</p>
      <p className="literature-evidence-matrix__boundary">Only records classified as Literature source can support a verified literature note. Keep datasets, fieldwork, and policy records in the evidence and result workflow.</p>
      <p className="literature-evidence-matrix__boundary">If its source later becomes incomplete or no longer verified, a verified note returns to reviewed until you check it again.</p>
      <p className="literature-evidence-matrix__boundary">Editing a verified note also returns it to reviewed, so you can re-check the revised wording and locator against the original source.</p>
      {project.sources.length === 0 ? <p className="literature-evidence-matrix__empty-help">First add a source record in the evidence ledger above. Then return here to link the literature point to it.</p> : null}
      {project.sources.length > 0 && literatureSources.length === 0 ? <p className="literature-evidence-matrix__empty-help">Add a source record classified as Literature source in the evidence ledger before adding a literature note.</p> : null}

      <div className="literature-evidence-matrix__form">
        <h3>Add a source-linked note</h3>
        <label>
          Source record
          <select onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
            <option value="">Choose a literature source from the evidence ledger</option>
            {literatureSources.map((source) => (
              <option key={source.id} value={source.id}>{source.id} · {source.label} ({source.status})</option>
            ))}
          </select>
        </label>
        <label>
          What does this source support? Write a short paraphrase in your own words.
          <textarea onChange={(event) => setClaim(event.target.value)} rows={3} value={claim} />
        </label>
        <label>
          Where can you check it again? Add a specific page, section, table, figure, or dataset-field marker.
          <input onChange={(event) => setLocator(event.target.value)} value={locator} />
          <small>Use a concrete marker such as “p. 12”, “Section 2.1”, “Table 3”, or “Dataset field: confidence”.</small>
        </label>
        <label>
          How might you use it?
          <select onChange={(event) => setUse(event.target.value as LiteratureUse)} value={use}>
            {Object.entries(useLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          Check status
          <select onChange={(event) => setStatus(event.target.value as LiteratureEvidenceStatus)} value={status}>
            <option value="reviewed">Reviewed note</option>
            <option value="verified">Verified note — source and locator checked</option>
          </select>
        </label>
        <button className="button button--compact" onClick={addNote} type="button">Add evidence note</button>
      </div>

      <ul className="literature-evidence-matrix__list" aria-label="Literature evidence notes">
        {notes.length === 0 ? (
          <li className="ledger-empty">No source-linked literature notes yet. Add one after checking a source.</li>
        ) : notes.map((note) => {
          const source = sourceById.get(note.sourceId);
          return (
            <li key={note.id}>
              <div>
                <strong>{note.id} · {note.status} · {useLabels[note.use]}</strong>
                <span>{source ? `${source.id} · ${source.label}` : `${note.sourceId} · source record missing`}</span>
                <small>Own-words note: {note.claim}</small>
                <small>Re-check at: {note.locator}</small>
                <details className="record-editor">
                  <summary>Edit {note.id} own-words note</summary>
                  <p className="record-editor__note">Editing a verified note returns it to reviewed until you re-check the revised note against the original source.</p>
                  <div className="record-editor__fields">
                    <label>
                      Own-words note
                      <textarea aria-label={`Edit ${note.id} own-words note`} onChange={(event) => updateNote(note.id, { claim: event.target.value })} rows={3} value={note.claim} />
                    </label>
                    <label>
                      Re-check location
                      <input aria-label={`Edit ${note.id} locator`} onChange={(event) => updateNote(note.id, { locator: event.target.value })} value={note.locator} />
                    </label>
                    <label>
                      How might you use it?
                      <select aria-label={`Edit ${note.id} use`} onChange={(event) => updateNote(note.id, { use: event.target.value as LiteratureUse })} value={note.use}>
                        {Object.entries(useLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                </details>
                <label className="ledger-inline-control">
                  Status
                  <select aria-label={`${note.id} status`} onChange={(event) => updateStatus(note.id, event.target.value as LiteratureEvidenceStatus)} value={note.status}>
                    <option value="reviewed">Reviewed</option>
                    <option value="verified">Verified</option>
                  </select>
                </label>
              </div>
              <button aria-label={`Remove ${note.id}`} className="text-button" onClick={() => removeNote(note.id)} type="button">Remove</button>
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
