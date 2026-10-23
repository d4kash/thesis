"use client";

import { useMemo, useState } from "react";
import type { EvidenceStatus, ThesisProject } from "@/lib/thesis-types";

interface EvidenceLedgerProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

function nextId(prefix: "SRC" | "RES", ids: string[]) {
  const highest = ids.reduce((current, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(2, "0")}`;
}

export function EvidenceLedger({ project, onChange }: EvidenceLedgerProps) {
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [sourceStatus, setSourceStatus] = useState<EvidenceStatus>("planned");
  const [resultLabel, setResultLabel] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [resultStatus, setResultStatus] = useState<"unverified" | "verified">("unverified");
  const [resultSourceId, setResultSourceId] = useState("");
  const [message, setMessage] = useState("");

  const verifiedSources = useMemo(
    () => project.sources.filter((source) => source.status === "verified"),
    [project.sources],
  );

  function addSource() {
    const label = sourceLabel.trim();
    const note = sourceNote.trim();

    if (!label || !note) {
      setMessage("Add a source title or citation and a note explaining its relevance.");
      return;
    }

    onChange({
      ...project,
      sources: [
        ...project.sources,
        {
          id: nextId("SRC", project.sources.map((source) => source.id)),
          label,
          kind: "literature-map",
          status: sourceStatus,
          note,
        },
      ],
    });
    setSourceLabel("");
    setSourceNote("");
    setSourceStatus("planned");
    setMessage("Source record added.");
  }

  function addResult() {
    const label = resultLabel.trim();
    const note = resultNote.trim();

    if (!label || !note) {
      setMessage("Add a result label and a note describing the underlying record.");
      return;
    }

    if (resultStatus === "verified" && !resultSourceId) {
      setMessage("A verified result must link to a verified source record.");
      return;
    }

    onChange({
      ...project,
      results: [
        ...project.results,
        {
          id: nextId("RES", project.results.map((result) => result.id)),
          label,
          verification: resultStatus,
          note,
          sourceIds: resultSourceId ? [resultSourceId] : [],
        },
      ],
    });
    setResultLabel("");
    setResultNote("");
    setResultStatus("unverified");
    setResultSourceId("");
    setMessage("Result ledger entry added.");
  }

  function removeSource(id: string) {
    onChange({
      ...project,
      sources: project.sources.filter((source) => source.id !== id),
      results: project.results.map((result) => ({
        ...result,
        sourceIds: result.sourceIds.filter((sourceId) => sourceId !== id),
      })),
    });
    setMessage(`${id} removed. Any linked result will require a new verified evidence link.`);
  }

  function updateSourceStatus(id: string, status: EvidenceStatus) {
    onChange({
      ...project,
      sources: project.sources.map((source) => source.id === id ? { ...source, status } : source),
    });
    setMessage(`${id} marked ${status}.`);
  }

  function updateResult(id: string, changes: { verification?: "unverified" | "verified"; sourceId?: string }) {
    onChange({
      ...project,
      results: project.results.map((result) => {
        if (result.id !== id) return result;
        return {
          ...result,
          verification: changes.verification ?? result.verification,
          sourceIds: changes.sourceId === undefined ? result.sourceIds : changes.sourceId ? [changes.sourceId] : [],
        };
      }),
    });
    setMessage(`${id} updated. The structural review has been refreshed.`);
  }

  function removeResult(id: string) {
    onChange({ ...project, results: project.results.filter((result) => result.id !== id) });
    setMessage(`${id} removed from the result ledger.`);
  }

  return (
    <section className="panel evidence-ledger" aria-labelledby="ledger-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">EVIDENCE LEDGER</p>
          <h2 id="ledger-heading">Trace what supports the draft</h2>
        </div>
        <span className="status-pill">Local only</span>
      </div>
      <p className="field-note">Add source records before writing literature claims. A verified result must link to a verified source record.</p>

      <div className="ledger-form">
        <h3>Add source record</h3>
        <label>
          Source title or citation
          <input onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
        </label>
        <label>
          Relevance and verification note
          <textarea onChange={(event) => setSourceNote(event.target.value)} rows={3} value={sourceNote} />
        </label>
        <label>
          Status
          <select onChange={(event) => setSourceStatus(event.target.value as EvidenceStatus)} value={sourceStatus}>
            <option value="planned">Planned</option>
            <option value="reviewed">Reviewed</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <button className="button button--compact" onClick={addSource} type="button">Add source</button>
      </div>

      <ul className="ledger-list" aria-label="Source records">
        {project.sources.length === 0 ? <li className="ledger-empty">No source records yet.</li> : project.sources.map((source) => (
          <li key={source.id}>
            <div>
              <strong>{source.id} · {source.status}</strong>
              <span>{source.label}</span>
              <small>{source.note}</small>
              <label className="ledger-inline-control">
                Status
                <select aria-label={`${source.id} status`} onChange={(event) => updateSourceStatus(source.id, event.target.value as EvidenceStatus)} value={source.status}>
                  <option value="planned">Planned</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="verified">Verified</option>
                </select>
              </label>
            </div>
            <button aria-label={`Remove ${source.id}`} className="text-button" onClick={() => removeSource(source.id)} type="button">Remove</button>
          </li>
        ))}
      </ul>

      <div className="ledger-form ledger-form--result">
        <h3>Add result ledger entry</h3>
        <label>
          Result label
          <input onChange={(event) => setResultLabel(event.target.value)} value={resultLabel} />
        </label>
        <label>
          Supporting record note
          <textarea onChange={(event) => setResultNote(event.target.value)} rows={3} value={resultNote} />
        </label>
        <label>
          Verification status
          <select onChange={(event) => setResultStatus(event.target.value as "unverified" | "verified")} value={resultStatus}>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
          </select>
        </label>
        <label>
          Verified source link {resultStatus === "verified" ? "(required)" : "(optional)"}
          <select onChange={(event) => setResultSourceId(event.target.value)} value={resultSourceId}>
            <option value="">No verified source selected</option>
            {verifiedSources.map((source) => <option key={source.id} value={source.id}>{source.id} · {source.label}</option>)}
          </select>
        </label>
        <button className="button button--compact" onClick={addResult} type="button">Add result</button>
      </div>

      <ul className="ledger-list" aria-label="Result ledger">
        {project.results.length === 0 ? <li className="ledger-empty">No result entries. The draft correctly states that it has no findings.</li> : project.results.map((result) => (
          <li key={result.id}>
            <div>
              <strong>{result.id} · {result.verification}</strong>
              <span>{result.label}</span>
              <small>{result.note} {result.sourceIds.length > 0 ? `Linked: ${result.sourceIds.join(", ")}.` : "No source linked."}</small>
              <div className="ledger-inline-controls">
                <label className="ledger-inline-control">
                  Status
                  <select aria-label={`${result.id} status`} onChange={(event) => updateResult(result.id, { verification: event.target.value as "unverified" | "verified" })} value={result.verification}>
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                  </select>
                </label>
                <label className="ledger-inline-control">
                  Evidence link
                  <select aria-label={`${result.id} evidence link`} onChange={(event) => updateResult(result.id, { sourceId: event.target.value })} value={result.sourceIds[0] ?? ""}>
                    <option value="">No verified source selected</option>
                    {verifiedSources.map((source) => <option key={source.id} value={source.id}>{source.id}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <button aria-label={`Remove ${result.id}`} className="text-button" onClick={() => removeResult(result.id)} type="button">Remove</button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
