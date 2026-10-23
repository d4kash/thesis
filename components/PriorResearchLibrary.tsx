"use client";

import { useState } from "react";
import type { EvidenceStatus, ThesisProject } from "@/lib/thesis-types";

interface PriorResearchLibraryProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

function nextId(ids: string[]): string {
  const highest = ids.reduce((current, id) => {
    const match = id.match(/^PRV-(\d+)$/);
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);

  return `PRV-${String(highest + 1).padStart(2, "0")}`;
}

export function PriorResearchLibrary({ project, onChange }: PriorResearchLibraryProps) {
  const [title, setTitle] = useState("");
  const [citation, setCitation] = useState("");
  const [context, setContext] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [methodology, setMethodology] = useState("");
  const [findings, setFindings] = useState("");
  const [limitations, setLimitations] = useState("");
  const [status, setStatus] = useState<EvidenceStatus>("reviewed");
  const [message, setMessage] = useState("");

  function addRecord() {
    const cleanTitle = title.trim();
    const details = [context, researchQuestion, methodology, findings, limitations].map((item) => item.trim());

    if (!cleanTitle || !details.some((item) => item.length >= 12)) {
      setMessage("Add the previous thesis title and at least one usable context, question, method, finding, or limitation note.");
      return;
    }

    if (status === "verified" && citation.trim().length < 8) {
      setMessage("A verified prior work needs a citation, repository link, or stable source description.");
      return;
    }

    onChange({
      ...project,
      priorResearch: [
        ...project.priorResearch,
        {
          id: nextId(project.priorResearch.map((record) => record.id)),
          title: cleanTitle,
          citation: citation.trim(),
          context: context.trim(),
          researchQuestion: researchQuestion.trim(),
          methodology: methodology.trim(),
          findings: findings.trim(),
          limitations: limitations.trim(),
          status,
        },
      ],
    });
    setTitle("");
    setCitation("");
    setContext("");
    setResearchQuestion("");
    setMethodology("");
    setFindings("");
    setLimitations("");
    setStatus("reviewed");
    setMessage("Prior-research record added. The topic map and draft have been refreshed.");
  }

  function updateStatus(id: string, nextStatus: EvidenceStatus) {
    onChange({
      ...project,
      priorResearch: project.priorResearch.map((record) => record.id === id ? { ...record, status: nextStatus } : record),
    });
    setMessage(`${id} marked ${nextStatus}. Verify its original document before using it as a formal citation.`);
  }

  function removeRecord(id: string) {
    onChange({ ...project, priorResearch: project.priorResearch.filter((record) => record.id !== id) });
    setMessage(`${id} removed from the local prior-research library.`);
  }

  return (
    <section className="panel prior-research-library" aria-labelledby="prior-research-heading">
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

      <div className="prior-research-form">
        <h3>Add a prior work</h3>
        <label>
          Thesis, dissertation, or paper title
          <input onChange={(event) => setTitle(event.target.value)} value={title} />
        </label>
        <label>
          Citation, repository URL, or stable source description
          <textarea onChange={(event) => setCitation(event.target.value)} rows={2} value={citation} />
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
              {record.context ? <small>Context: {record.context}</small> : null}
              {record.methodology ? <small>Method: {record.methodology}</small> : null}
              {record.limitations ? <small>Limitation: {record.limitations}</small> : null}
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
