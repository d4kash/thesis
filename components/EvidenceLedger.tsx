"use client";

import { useMemo, useState } from "react";
import { normalizeLiteratureVerification } from "@/lib/literature-readiness";
import { hasMethodDataAndEthicsPlan } from "@/lib/method-readiness";
import {
  canMarkResultVerified,
  isUsableVerifiedDirectEvidence,
  isUsableVerifiedSource,
  reviseEvidenceSource,
  reviseResultLedgerItem,
  normalizeResultVerification,
  normalizeSourceVerification,
} from "@/lib/result-readiness";
import type { EvidenceSource, EvidenceStatus, ResultLedgerItem, ThesisProject } from "@/lib/thesis-types";

interface EvidenceLedgerProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

const sourceKindLabels: Record<EvidenceSource["kind"], string> = {
  "literature-map": "Literature source — background, method, or comparison",
  dataset: "Dataset or data record",
  "field-note": "Fieldwork or analysis record — internal evidence, not bibliography",
  "policy-record": "Policy or institutional record",
};

const verifiedResultRequirements = [
  "To mark a result verified, provide a clear result label and supporting record note,",
  "link a usable verified data, fieldwork, or policy record, and link a planned method",
  "with a documented data and safeguards plan.",
].join(" ");

const verifiedSourceRequirements = [
  "To mark a source verified, add a meaningful title or citation,",
  "an original-record locator (such as a DOI, stable URL, repository/archive record, or local record ID),",
  "the date you checked the original record,",
  "and a checked relevance note.",
].join(" ");

function nextId(prefix: "SRC" | "RES", ids: string[]) {
  const highest = ids.reduce((current, id) => {
    const match = id.match(new RegExp(`^${prefix}-(\\d+)$`));
    return Math.max(current, match ? Number(match[1]) : 0);
  }, 0);

  return `${prefix}-${String(highest + 1).padStart(2, "0")}`;
}

export function EvidenceLedger({ project, onChange }: EvidenceLedgerProps) {
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceLocator, setSourceLocator] = useState("");
  const [sourceCheckedOn, setSourceCheckedOn] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [sourceKind, setSourceKind] = useState<EvidenceSource["kind"]>("literature-map");
  const [sourceStatus, setSourceStatus] = useState<EvidenceStatus>("planned");
  const [resultLabel, setResultLabel] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [resultStatus, setResultStatus] = useState<"unverified" | "verified">("unverified");
  const [resultSourceId, setResultSourceId] = useState("");
  const [resultMethodId, setResultMethodId] = useState("");
  const [message, setMessage] = useState("");

  const verifiedDirectEvidenceSources = useMemo(
    () => project.sources.filter(isUsableVerifiedDirectEvidence),
    [project.sources],
  );

  function addSource() {
    const label = sourceLabel.trim();
    const locator = sourceLocator.trim();
    const note = sourceNote.trim();

    if (!label || !note) {
      setMessage("Add a source title or citation and a note explaining its relevance.");
      return;
    }

    const source = {
      id: nextId("SRC", project.sources.map((entry) => entry.id)),
      label,
      locator,
      checkedOn: sourceCheckedOn,
      kind: sourceKind,
      status: sourceStatus,
      note,
    };

    if (sourceStatus === "verified" && !isUsableVerifiedSource(source)) {
      setMessage(verifiedSourceRequirements);
      return;
    }

    onChange({
      ...project,
      sources: [
        ...project.sources,
        source,
      ],
    });
    setSourceLabel("");
    setSourceLocator("");
    setSourceCheckedOn("");
    setSourceNote("");
    setSourceKind("literature-map");
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

    const result = {
      id: nextId("RES", project.results.map((entry) => entry.id)),
      label,
      verification: resultStatus,
      note,
      sourceIds: resultSourceId ? [resultSourceId] : [],
      methodIds: resultMethodId ? [resultMethodId] : [],
    };

    if (resultStatus === "verified" && !canMarkResultVerified(result, project.sources, project.methods)) {
      setMessage(verifiedResultRequirements);
      return;
    }

    onChange({
      ...project,
      results: [
        ...project.results,
        result,
      ],
    });
    setResultLabel("");
    setResultNote("");
    setResultStatus("unverified");
    setResultSourceId("");
    setResultMethodId("");
    setMessage("Result ledger entry added.");
  }

  function removeSource(id: string) {
    const sources = project.sources.filter((source) => source.id !== id);
    const results = project.results.map((result) => normalizeResultVerification(
      { ...result, sourceIds: result.sourceIds.filter((sourceId) => sourceId !== id) },
      sources,
      project.methods,
    ));
    const returnedToUnverified = results.filter((result, index) => (
      project.results[index]?.verification === "verified" && result.verification === "unverified"
    )).length;

    onChange({
      ...project,
      sources,
      literatureNotes: (project.literatureNotes ?? []).filter((note) => note.sourceId !== id),
      results,
    });
    setMessage(`${id} removed. Linked evidence notes were removed.${returnedToUnverified > 0 ? ` ${returnedToUnverified} linked result${returnedToUnverified === 1 ? "" : "s"} returned to unverified.` : " Any linked result will require a new verified evidence link."}`);
  }

  function updateSourceStatus(id: string, status: EvidenceStatus) {
    const current = project.sources.find((source) => source.id === id);
    if (!current) return;

    if (status === "verified" && !isUsableVerifiedSource({ ...current, status })) {
      setMessage(verifiedSourceRequirements);
      return;
    }

    const sources = project.sources.map((source) => source.id === id ? { ...source, status } : source);
    const literatureNotes = (project.literatureNotes ?? []).map((note) => normalizeLiteratureVerification(note, sources));
    const returnedToReviewed = literatureNotes.filter((note, index) => (
      project.literatureNotes?.[index]?.status === "verified" && note.status === "reviewed"
    )).length;
    const results = project.results.map((result) => normalizeResultVerification(result, sources, project.methods));
    const returnedToUnverified = results.filter((result, index) => (
      project.results[index]?.verification === "verified" && result.verification === "unverified"
    )).length;

    onChange({
      ...project,
      sources,
      literatureNotes,
      results,
    });
    setMessage(`${id} marked ${status}.${returnedToReviewed > 0 ? ` ${returnedToReviewed} linked literature note${returnedToReviewed === 1 ? "" : "s"} returned to reviewed.` : ""}${returnedToUnverified > 0 ? ` ${returnedToUnverified} linked result${returnedToUnverified === 1 ? "" : "s"} returned to unverified.` : ""}`);
  }

  function updateSourceTrace(
    id: string,
    changes: Partial<Pick<EvidenceSource, "locator" | "checkedOn">>,
  ) {
    let sourceReturnedToReviewed = false;
    const sources = project.sources.map((source) => {
      if (source.id !== id) return source;
      const nextSource = reviseEvidenceSource(source, changes);
      sourceReturnedToReviewed ||= source.status === "verified" && nextSource.status === "reviewed";
      return nextSource;
    });
    const literatureNotes = (project.literatureNotes ?? []).map((note) => normalizeLiteratureVerification(note, sources));
    const returnedToReviewed = literatureNotes.filter((note, index) => (
      project.literatureNotes?.[index]?.status === "verified" && note.status === "reviewed"
    )).length;
    const results = project.results.map((result) => normalizeResultVerification(result, sources, project.methods));
    const returnedToUnverified = results.filter((result, index) => (
      project.results[index]?.verification === "verified" && result.verification === "unverified"
    )).length;

    onChange({
      ...project,
      sources,
      literatureNotes,
      results,
    });

    if (sourceReturnedToReviewed) {
      setMessage(`${id} returned to reviewed after an edit.${returnedToReviewed > 0 ? ` ${returnedToReviewed} linked literature note${returnedToReviewed === 1 ? "" : "s"} returned to reviewed.` : ""}${returnedToUnverified > 0 ? ` ${returnedToUnverified} linked result${returnedToUnverified === 1 ? "" : "s"} returned to unverified.` : ""} Recheck the original record before marking it verified again.`);
    } else if (returnedToReviewed > 0) {
      setMessage(`${id} no longer has a usable source trace, so ${returnedToReviewed} linked literature note${returnedToReviewed === 1 ? "" : "s"} returned to reviewed.`);
    } else if (returnedToUnverified > 0) {
      setMessage(`${id} no longer supports ${returnedToUnverified} linked result${returnedToUnverified === 1 ? "" : "s"}, so it returned to unverified.`);
    }
  }

  function updateResult(id: string, changes: { verification?: "unverified" | "verified"; sourceId?: string; methodId?: string }) {
    const current = project.results.find((result) => result.id === id);
    if (!current) return;
    const nextVerification = changes.verification ?? current.verification;
    const nextSourceIds = changes.sourceId === undefined ? current.sourceIds : changes.sourceId ? [changes.sourceId] : [];
    const nextMethodIds = changes.methodId === undefined ? current.methodIds : changes.methodId ? [changes.methodId] : [];
    const nextResult = { ...current, verification: nextVerification, sourceIds: nextSourceIds, methodIds: nextMethodIds };

    if (nextVerification === "verified" && !canMarkResultVerified(nextResult, project.sources, project.methods)) {
      setMessage(verifiedResultRequirements);
      return;
    }

    onChange({
      ...project,
      results: project.results.map((result) => {
        if (result.id !== id) return result;
        return nextResult;
      }),
    });
    setMessage(`${id} updated. The structural review has been refreshed.`);
  }

  function updateResultRecord(
    id: string,
    changes: Partial<Pick<ResultLedgerItem, "label" | "note">>,
  ) {
    let returnedToUnverified = false;
    const results = project.results.map((result) => {
      if (result.id !== id) return result;
      const revisedResult = reviseResultLedgerItem(result, changes, project.sources, project.methods);
      returnedToUnverified ||= result.verification === "verified" && revisedResult.verification === "unverified";
      return revisedResult;
    });

    onChange({ ...project, results });
    setMessage(returnedToUnverified
      ? `${id} returned to unverified after an edit. Re-check the supporting record before marking it verified again.`
      : `${id} updated.`);
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
      <p className="field-note">Classify each record before using it. Literature supports background or comparison; a verified result needs a verified data, fieldwork, or policy record and its planned method. Fieldwork or analysis records stay in the evidence ledger and do not make a formal bibliography entry.</p>
      <p className="evidence-ledger__boundary">Checking a record here does not confirm ethics approval, consent, permission, or a completed study. Linking a result to a method does not approve that method. Record only what you can personally trace.</p>
      <p className="evidence-ledger__boundary">Editing a verified source&apos;s original-record locator or check date returns it to reviewed, so you can re-check the revised trace before using it again.</p>
      <p className="evidence-ledger__boundary">Editing a verified result&apos;s label or supporting-record note returns it to unverified, so you can re-check the revised record before using it again.</p>

      <div className="ledger-form">
        <h3>Add source record</h3>
        <label>
          Source title, data record, or citation
          <input onChange={(event) => setSourceLabel(event.target.value)} value={sourceLabel} />
        </label>
        <label>
          Where can you find the original record again? {sourceStatus === "verified" ? "(required)" : "(needed before verification)"}
          <input
            onChange={(event) => setSourceLocator(event.target.value)}
            placeholder="DOI, stable URL, repository/archive record, or local record ID"
            value={sourceLocator}
          />
          <small>This lets you and your supervisor reopen the original record; it does not create a finished citation.</small>
        </label>
        <label>
          When did you check the original record? {sourceStatus === "verified" ? "(required)" : "(needed before verification)"}
          <input
            onChange={(event) => setSourceCheckedOn(event.target.value)}
            type="date"
            value={sourceCheckedOn}
          />
          <small>Record the day you personally checked the source. This is not the publication date or a proof of approval.</small>
        </label>
        <label>
          Record type
          <select onChange={(event) => setSourceKind(event.target.value as EvidenceSource["kind"])} value={sourceKind}>
            {Object.entries(sourceKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
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
              <small>{sourceKindLabels[source.kind]} · Original record: {source.locator?.trim() || "not recorded yet."} · Check date: {source.checkedOn?.trim() || "not recorded yet."}</small>
              <small>{source.note}</small>
              <label className="ledger-inline-control">
                Original record locator
                <input
                  aria-label={`${source.id} original record locator`}
                  onChange={(event) => updateSourceTrace(source.id, { locator: event.target.value })}
                  placeholder="DOI, URL, repository/archive, or local ID"
                  value={source.locator ?? ""}
                />
              </label>
              <label className="ledger-inline-control">
                Original record check date
                <input
                  aria-label={`${source.id} original record check date`}
                  onChange={(event) => updateSourceTrace(source.id, { checkedOn: event.target.value })}
                  type="date"
                  value={source.checkedOn ?? ""}
                />
              </label>
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
        <p className="evidence-ledger__result-boundary">
          {verifiedResultRequirements} This still does not confirm ethics approval, permission, consent, or completed research.
        </p>
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
          Verified data or record link {resultStatus === "verified" ? "(required)" : "(optional)"}
          <select onChange={(event) => setResultSourceId(event.target.value)} value={resultSourceId}>
            <option value="">No verified data or record selected</option>
            {verifiedDirectEvidenceSources.map((source) => <option key={source.id} value={source.id}>{source.id} · {source.label}</option>)}
          </select>
        </label>
        <label>
          Planned method with safeguards link {resultStatus === "verified" ? "(required)" : "(optional)"}
          <select onChange={(event) => setResultMethodId(event.target.value)} value={resultMethodId}>
            <option value="">No planned method selected</option>
            {project.methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.id} · {method.text} {hasMethodDataAndEthicsPlan(method) ? "(safeguards plan recorded)" : "(safeguards plan needed)"}
              </option>
            ))}
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
              <small>{result.note} {result.sourceIds.length > 0 ? `Data record: ${result.sourceIds.join(", ")}.` : "No data record linked."} {result.methodIds.length > 0 ? `Method: ${result.methodIds.join(", ")}.` : "No planned method linked."}</small>
              <details className="record-editor">
                <summary>Edit this result record</summary>
                <p className="record-editor__note">Editing a verified result returns it to unverified until you re-check the revised label and supporting record.</p>
                <div className="record-editor__fields">
                  <label>
                    Result label
                    <input aria-label={`Edit ${result.id} result label`} onChange={(event) => updateResultRecord(result.id, { label: event.target.value })} value={result.label} />
                  </label>
                  <label>
                    Supporting record note
                    <textarea aria-label={`Edit ${result.id} supporting record note`} onChange={(event) => updateResultRecord(result.id, { note: event.target.value })} rows={3} value={result.note} />
                  </label>
                </div>
              </details>
              <div className="ledger-inline-controls">
                <label className="ledger-inline-control">
                  Status
                  <select aria-label={`${result.id} status`} onChange={(event) => updateResult(result.id, { verification: event.target.value as "unverified" | "verified" })} value={result.verification}>
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                  </select>
                </label>
                <label className="ledger-inline-control">
                  Data or record link
                  <select aria-label={`${result.id} evidence link`} onChange={(event) => updateResult(result.id, { sourceId: event.target.value })} value={result.sourceIds[0] ?? ""}>
                    <option value="">No verified data or record selected</option>
                    {verifiedDirectEvidenceSources.map((source) => <option key={source.id} value={source.id}>{source.id}</option>)}
                  </select>
                </label>
                <label className="ledger-inline-control">
                  Planned method with safeguards
                  <select aria-label={`${result.id} method link`} onChange={(event) => updateResult(result.id, { methodId: event.target.value })} value={result.methodIds[0] ?? ""}>
                    <option value="">No planned method selected</option>
                    {project.methods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.id} {hasMethodDataAndEthicsPlan(method) ? "(plan recorded)" : "(plan needed)"}
                      </option>
                    ))}
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
