"use client";

import { hasMethodDataAndEthicsPlan } from "@/lib/method-readiness";
import type { ThesisProject } from "@/lib/thesis-types";

interface MethodReadinessProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

export function MethodReadiness({ project, onChange }: MethodReadinessProps) {
  const documentedPlanCount = project.methods.filter(hasMethodDataAndEthicsPlan).length;

  function updateMethodPlan(id: string, dataAndEthicsPlan: string) {
    onChange({
      ...project,
      methods: project.methods.map((method) => (
        method.id === id ? { ...method, dataAndEthicsPlan } : method
      )),
    });
  }

  return (
    <section className="panel method-readiness" id="method-readiness" aria-labelledby="method-readiness-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">BEFORE DATA COLLECTION</p>
          <h2 id="method-readiness-heading">Plan safeguards for each method</h2>
        </div>
        <span className="status-pill">{documentedPlanCount}/{project.methods.length} plans recorded</span>
      </div>
      <p className="field-note">
        For each planned method, record how data will be obtained and what permissions, consent, privacy, or provenance steps need checking. This is an editable plan, not an approval record.
      </p>
      <p className="method-readiness__boundary">
        A note here does not confirm ethics approval, consent, institutional permission, data access, or completed data collection. Record only the safeguards you can personally describe and verify later.
      </p>

      {project.methods.length === 0 ? (
        <p className="method-readiness__empty">Add at least one proposed method before planning its data and ethics safeguards.</p>
      ) : (
        <ol className="method-readiness__list">
          {project.methods.map((method) => {
            const isDocumented = hasMethodDataAndEthicsPlan(method);
            const inputId = `method-plan-${method.id}`;

            return (
              <li key={method.id}>
                <div className="method-readiness__method">
                  <strong>{method.id}</strong>
                  <span>{method.text}</span>
                  <small>Objectives: {method.objectiveIds.join(", ") || "none mapped"}</small>
                </div>
                <label htmlFor={inputId}>
                  Data, permissions, and ethics plan
                  <textarea
                    id={inputId}
                    onChange={(event) => updateMethodPlan(method.id, event.target.value)}
                    placeholder="For example: Record data provenance and licence; confirm whether consent, institutional permission, de-identification, or secure retention is required before collection."
                    rows={3}
                    value={method.dataAndEthicsPlan ?? ""}
                  />
                  <small>State what needs checking, or why a safeguard does not apply. Do not claim approval or collected data unless it exists.</small>
                </label>
                <em className={isDocumented ? "method-readiness__status method-readiness__status--recorded" : "method-readiness__status"}>
                  {isDocumented ? "Plan recorded" : "Needs a plan"}
                </em>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
