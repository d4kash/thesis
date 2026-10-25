"use client";

import { useState } from "react";
import {
  canMarkPriorResearchVerified,
  normalizePriorResearchVerification,
  revisePriorResearchRecord,
} from "@/lib/prior-research-readiness";
import type { EvidenceStatus, PriorResearchRecord, ThesisProject } from "@/lib/thesis-types";

interface PublicSourcePreview {
  url: string;
  host: string;
  title: string;
  description: string;
  authors: string[];
  published: string;
  doi: string;
  recordSuggestion: string;
}

interface PriorResearchLibraryProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

const verifiedPriorResearchRequirements = "A verified prior work needs a title, a citation, repository link, or stable source description, an access or permission note, a valid non-future date you checked the original work, and at least one usable checked research note.";

function nextId(ids: string[]): string {
  const highest = ids.reduce((current, id) => {
    const match = id.match(/^PRV-(\d+)$/);
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);

  return `PRV-${String(highest + 1).padStart(2, "0")}`;
}

export function PriorResearchLibrary({ project, onChange }: PriorResearchLibraryProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [preview, setPreview] = useState<PublicSourcePreview | null>(null);
  const [previewStatus, setPreviewStatus] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [title, setTitle] = useState("");
  const [citation, setCitation] = useState("");
  const [accessNote, setAccessNote] = useState("");
  const [checkedOn, setCheckedOn] = useState("");
  const [context, setContext] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [findings, setFindings] = useState("");
  const [limitations, setLimitations] = useState("");
  const [status, setStatus] = useState<EvidenceStatus>("reviewed");
  const [message, setMessage] = useState("");

  async function previewPublicSource() {
    const url = sourceUrl.trim();
    if (!url) {
      setPreviewStatus("Paste a public Shodhganga or RSC source link first.");
      return;
    }

    setIsPreviewing(true);
    setPreviewStatus("Checking the public record…");
    setPreview(null);

    try {
      const response = await fetch("/api/source-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const payload = await response.json() as { preview?: PublicSourcePreview; error?: string };

      if (!response.ok || !payload.preview) {
        setPreviewStatus(payload.error ?? "The source could not be previewed.");
        return;
      }

      setPreview(payload.preview);
      setPreviewStatus("Public record previewed. Read the original before recording notes.");
    } catch {
      setPreviewStatus("The source preview is unavailable right now. You can still add the title and stable link manually.");
    } finally {
      setIsPreviewing(false);
    }
  }

  function usePreviewInRecord() {
    if (!preview) return;
    setTitle((current) => current.trim() ? current : preview.title);
    setCitation((current) => current.trim() ? current : preview.recordSuggestion);
    setMessage("The public title and stable link were added to the form. Now write your checked notes before adding the record.");
  }

  function addRecord() {
    const cleanTitle = title.trim();
    const details = [context, researchQuestion, methodology, findings, limitations].map((item) => item.trim());

    if (!cleanTitle || !details.some((item) => item.length >= 12)) {
      setMessage("Add the previous thesis title and at least one usable context, question, method, finding, or limitation note.");
      return;
    }

    const record = {
      id: nextId(project.priorResearch.map((entry) => entry.id)),
      title: cleanTitle,
      citation: citation.trim(),
      accessNote: accessNote.trim(),
      checkedOn,
      context: context.trim(),
      researchQuestion: researchQuestion.trim(),
      methodology: methodology.trim(),
      findings: findings.trim(),
      limitations: limitations.trim(),
      status,
    };

    if (status === "verified" && !canMarkPriorResearchVerified(record)) {
      setMessage(verifiedPriorResearchRequirements);
      return;
    }

    onChange({
      ...project,
      priorResearch: [
        ...project.priorResearch,
        record,
      ],
    });
    setTitle("");
    setCitation("");
    setAccessNote("");
    setCheckedOn("");
    setContext("");
    setResearchQuestion("");
    setMethodology("");
    setFindings("");
    setLimitations("");
    setStatus("reviewed");
    setMessage("Prior-research record added. The topic map and draft have been refreshed.");
  }

  function updateStatus(id: string, nextStatus: EvidenceStatus) {
    const current = project.priorResearch.find((record) => record.id === id);
    if (!current) return;

    if (nextStatus === "verified" && !canMarkPriorResearchVerified({ ...current, status: nextStatus })) {
      setMessage(verifiedPriorResearchRequirements);
      return;
    }

    onChange({
      ...project,
      priorResearch: project.priorResearch.map((record) => (
        record.id === id ? normalizePriorResearchVerification({ ...record, status: nextStatus }) : record
      )),
    });
    setMessage(`${id} marked ${nextStatus}. Verify its original document before using it as a formal citation.`);
  }

  function updateRecord(
    id: string,
    changes: Partial<Pick<
      PriorResearchRecord,
      "title" | "citation" | "accessNote" | "checkedOn" | "context" | "researchQuestion" | "methodology" | "findings" | "limitations"
    >>,
  ) {
    let returnedToReviewed = false;
    onChange({
      ...project,
      priorResearch: project.priorResearch.map((record) => {
        if (record.id !== id) return record;
        const nextRecord = revisePriorResearchRecord(record, changes);
        returnedToReviewed ||= record.status === "verified" && nextRecord.status === "reviewed";
        return nextRecord;
      }),
    });

    if (returnedToReviewed) {
      setMessage(`${id} returned to reviewed after an edit. Re-check the original work and the revised notes before marking it verified again.`);
    }
  }

  function removeRecord(id: string) {
    onChange({ ...project, priorResearch: project.priorResearch.filter((record) => record.id !== id) });
    setMessage(`${id} removed from the local prior-research library.`);
  }

  return (
    <section className="panel prior-research-library" id="prior-research" aria-labelledby="prior-research-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PRIOR-RESEARCH LIBRARY</p>
          <h2 id="prior-research-heading">Bring earlier theses into the topic map</h2>
        </div>
        <span className="status-pill">Local only</span>
      </div>
      <p className="field-note">
        Add notes from the original thesis, dissertation, paper, or approved review. The studio compares the record with the current topic; it does not invent a citation, a finding, or a research gap.
      </p>
      <p className="field-note">To mark a record verified, add a stable source description, an access or permission note, the date you checked the original work, and a checked research note. This records your basis for using metadata and your own notes; it does not certify a licence, copyright permission, or institutional approval. Editing a verified record returns it to reviewed, so you can re-check the revised details against the original work.</p>

      <div className="source-preview">
        <h3>1. Preview a public source</h3>
        <p>Paste a public Shodhganga or RSC record. The studio reads only the public page metadata; it does not copy a thesis or paper into a rewrite tool.</p>
        <label>
          Public source URL
          <input
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://shodhganga.inflibnet.ac.in/handle/..."
            type="url"
            value={sourceUrl}
          />
        </label>
        <button className="button button--compact" disabled={isPreviewing} onClick={() => void previewPublicSource()} type="button">
          {isPreviewing ? "Previewing…" : "Preview public source"}
        </button>
        {preview ? (
          <article className="source-preview__card">
            <strong>{preview.title}</strong>
            <small>{preview.authors.length > 0 ? preview.authors.join(", ") : preview.host}{preview.published ? ` · ${preview.published}` : ""}</small>
            {preview.description ? <p><strong>Publisher/repository description:</strong> {preview.description}</p> : <p>No description was available. Open the original record before taking notes.</p>}
            <a href={preview.url} rel="noreferrer" target="_blank">Open original record</a>
            <button className="text-button" onClick={usePreviewInRecord} type="button">Use title and link below</button>
          </article>
        ) : null}
        <p aria-live="polite" className="source-preview__status">{previewStatus}</p>
      </div>

      <div className="prior-research-form">
        <h3>2. Add your research notes</h3>
        <label>
          Thesis, dissertation, or paper title
          <input onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label>
          Citation, repository URL, or stable source description
          <textarea onChange={(event) => setCitation(event.target.value)} rows={2} value={citation} />
        </label>
        <label>
          Access, licence, or permission note {status === "verified" ? "(required)" : "(needed before verification)"}
          <textarea
            onChange={(event) => setAccessNote(event.target.value)}
            placeholder="For example: Public repository metadata checked; no full text copied into this workspace."
            rows={2}
            value={accessNote}
          />
          <small>Record why you may use this record&apos;s metadata and your own notes. This is not a legal determination.</small>
        </label>
        <label>
          When did you check the original work? {status === "verified" ? "(required)" : "(needed before verification)"}
          <input onChange={(event) => setCheckedOn(event.target.value)} type="date" value={checkedOn} />
          <small>Record the day you personally checked the original work. It cannot be a future date. This is not the publication date or a proof of approval.</small>
        </label>
        <label>
          Context, setting, population, or corpus
          <textarea onChange={(event) => setContext(event.target.value)} rows={3} value={context} />
        </label>
        <label>
          Prior research question or contribution
          <textarea onChange={(event) => setResearchQuestion(event.target.value)} rows={3} value={researchQuestion} />
        </label>
        <label>
          Method or analytical approach
          <textarea onChange={(event) => setMethodology(event.target.value)} rows={3} value={methodology} />
        </label>
        <label>
          Reported findings — paraphrase only after checking the source
          <textarea onChange={(event) => setFindings(event.target.value)} rows={3} value={findings} />
        </label>
        <label>
          Stated limitation or unresolved question
          <textarea onChange={(event) => setLimitations(event.target.value)} rows={3} value={limitations} />
        </label>
        <label>
          Verification status
          <select onChange={(event) => setStatus(event.target.value as EvidenceStatus)} value={status}>
            <option value="planned">Planned</option>
            <option value="reviewed">Reviewed</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <button className="button button--compact" onClick={addRecord} type="button">Add to topic map</button>
      </div>

      <ul className="prior-research-list" aria-label="Prior-research records">
        {project.priorResearch.length === 0 ? (
          <li className="ledger-empty">No earlier works yet. Add source-backed research notes to create a wider perspective around the topic.</li>
        ) : project.priorResearch.map((record) => (
          <li key={record.id}>
            <div>
              <strong>{record.id} · {record.status}</strong>
              <span>{record.title}</span>
              {record.citation ? <small>Citation/source: {record.citation}</small> : <small>No source location recorded yet.</small>}
              {record.accessNote ? <small>Access/permission note: {record.accessNote}</small> : <small>No access or permission note recorded yet.</small>}
              <small>Researcher check date: {record.checkedOn?.trim() || "not recorded yet."}</small>
              {record.context ? <small>Context: {record.context}</small> : null}
              {record.methodology ? <small>Method: {record.methodology}</small> : null}
              {record.limitations ? <small>Limitation: {record.limitations}</small> : null}
              <details className="record-editor">
                <summary>Edit this record</summary>
                <p className="record-editor__note">Changes update the local topic map and structural review immediately.</p>
                <div className="record-editor__fields">
                  <label>
                    Thesis, dissertation, or paper title
                    <input aria-label={`Edit ${record.id} title`} onChange={(event) => updateRecord(record.id, { title: event.target.value })} value={record.title} />
                  </label>
                  <label>
                    Citation, repository URL, or stable source description
                    <textarea aria-label={`Edit ${record.id} citation`} onChange={(event) => updateRecord(record.id, { citation: event.target.value })} rows={2} value={record.citation} />
                  </label>
                  <label>
                    Access, licence, or permission note
                    <textarea aria-label={`Edit ${record.id} access or permission note`} onChange={(event) => updateRecord(record.id, { accessNote: event.target.value })} rows={2} value={record.accessNote ?? ""} />
                  </label>
                  <label>
                    Original-work check date
                    <input aria-label={`Edit ${record.id} check date`} onChange={(event) => updateRecord(record.id, { checkedOn: event.target.value })} type="date" value={record.checkedOn ?? ""} />
                  </label>
                  <label>
                    Context, setting, population, or corpus
                    <textarea aria-label={`Edit ${record.id} context`} onChange={(event) => updateRecord(record.id, { context: event.target.value })} rows={2} value={record.context} />
                  </label>
                  <label>
                    Prior research question or contribution
                    <textarea aria-label={`Edit ${record.id} research question`} onChange={(event) => updateRecord(record.id, { researchQuestion: event.target.value })} rows={2} value={record.researchQuestion} />
                  </label>
                  <label>
                    Method or analytical approach
                    <textarea aria-label={`Edit ${record.id} methodology`} onChange={(event) => updateRecord(record.id, { methodology: event.target.value })} rows={2} value={record.methodology} />
                  </label>
                  <label>
                    Reported findings — paraphrase only after checking the source
                    <textarea aria-label={`Edit ${record.id} findings`} onChange={(event) => updateRecord(record.id, { findings: event.target.value })} rows={2} value={record.findings} />
                  </label>
                  <label>
                    Stated limitation or unresolved question
                    <textarea aria-label={`Edit ${record.id} limitations`} onChange={(event) => updateRecord(record.id, { limitations: event.target.value })} rows={2} value={record.limitations} />
                  </label>
                </div>
              </details>
              <label className="ledger-inline-control">
                Status
                <select aria-label={`${record.id} status`} onChange={(event) => updateStatus(record.id, event.target.value as EvidenceStatus)} value={record.status}>
                  <option value="planned">Planned</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="verified">Verified</option>
                </select>
              </label>
            </div>
            <button aria-label={`Remove ${record.id}`} className="text-button" onClick={() => removeRecord(record.id)} type="button">Remove</button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
