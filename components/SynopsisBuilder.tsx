"use client";

import { useState } from "react";
import { buildSynopsis, buildSynopsisMarkdown, getSynopsisDetails } from "@/lib/synopsis";
import type { SynopsisDetails, ThesisProject } from "@/lib/thesis-types";

interface SynopsisBuilderProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

const INPUTS: Array<{ field: keyof SynopsisDetails; helper: string; label: string; placeholder: string }> = [
  {
    field: "problemStatement",
    label: "What problem will this research address?",
    helper: "Describe the situation, uncertainty, or practical/theoretical issue. Keep it factual and do not add unverified citations.",
    placeholder: "For example: Explain the specific gap, challenge, or question that needs careful study.",
  },
  {
    field: "anticipatedContribution",
    label: "What might this study help clarify?",
    helper: "Describe the intended value of the study without claiming that it will prove, improve, or solve something.",
    placeholder: "For example: This study may help clarify how … within the selected context.",
  },
  {
    field: "ethicsAndPermissions",
    label: "What ethics, permissions, or data-protection steps are needed?",
    helper: "Record what is planned, including a note when no participant data or special permissions are expected.",
    placeholder: "For example: This proposal will confirm institutional requirements before collecting data; no approval has been claimed yet.",
  },
];

export function SynopsisBuilder({ project, onChange }: SynopsisBuilderProps) {
  const [message, setMessage] = useState("");
  const details = getSynopsisDetails(project);
  const synopsis = buildSynopsis(project);

  function updateField(field: keyof SynopsisDetails, value: string) {
    onChange({ ...project, synopsis: { ...details, [field]: value } });
  }

  async function copySynopsis() {
    try {
      await navigator.clipboard.writeText(buildSynopsisMarkdown(project));
      setMessage("Working synopsis copied. Review every section before sharing it with a supervisor.");
    } catch {
      setMessage("Copy was blocked by the browser. Select the synopsis preview and copy it manually.");
    }
  }

  return (
    <section className="panel synopsis-builder" id="synopsis-builder" aria-labelledby="synopsis-builder-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">STEP 1 · SYNOPSIS</p>
          <h2 id="synopsis-builder-heading">Build your synopsis, one answer at a time</h2>
        </div>
        <span className="status-pill">{synopsis.completeCount}/{synopsis.totalCount} ready</span>
      </div>
      <p className="field-note">
        A synopsis is a proposal for what you plan to study. Complete the short prompts below, then revise the editable preview with your supervisor. Missing answers stay clearly marked instead of being guessed.
      </p>

      <div className="synopsis-builder__inputs">
        {INPUTS.map((input) => (
          <label key={input.field}>
            {input.label}
            <textarea
              onChange={(event) => updateField(input.field, event.target.value)}
              placeholder={input.placeholder}
              rows={4}
              value={details[input.field]}
            />
            <small>{input.helper}</small>
          </label>
        ))}
      </div>

      <div className="synopsis-builder__readiness" aria-live="polite">
        <strong>{synopsis.isReadyForSupervisorReview ? "Synopsis checklist complete" : "Synopsis checklist"}</strong>
        <ul>
          {synopsis.sections.map((section) => (
            <li className={section.isComplete ? "synopsis-check synopsis-check--complete" : "synopsis-check"} key={section.id}>
              <span aria-hidden="true">{section.isComplete ? "✓" : "○"}</span>
              <span>{section.heading}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="synopsis-builder__preview" open>
        <summary>Working synopsis preview</summary>
        <p className="field-note">This preview uses your own project entries only. It does not create evidence or results.</p>
        {synopsis.sections.map((section) => (
          <section className={section.isComplete ? "synopsis-preview__section" : "synopsis-preview__section synopsis-preview__section--missing"} key={section.id}>
            <h3>{section.heading}</h3>
            <p>{section.value}</p>
          </section>
        ))}
        <p className="synopsis-builder__boundary">This working synopsis does not state findings, participant data, verified citations, ethics approval, or a completed thesis.</p>
      </details>

      <button className="button button--compact" onClick={() => void copySynopsis()} type="button">Copy working synopsis</button>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
