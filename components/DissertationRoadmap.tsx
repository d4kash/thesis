"use client";

import { useState } from "react";
import {
  buildDissertationRoadmap,
  buildDissertationRoadmapMarkdown,
  DEFAULT_DISSERTATION_PAGE_TARGET,
  type RoadmapStatus,
} from "@/lib/dissertation-roadmap";
import type { ThesisProject } from "@/lib/thesis-types";

interface DissertationRoadmapProps {
  project: ThesisProject;
}

const PAGE_TARGETS = [200, 250, DEFAULT_DISSERTATION_PAGE_TARGET, 350];

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  ready: "Ready to plan",
  "needs-brief": "Needs project brief",
  "needs-sources": "Needs sources",
  "needs-data": "Needs data",
  "needs-review": "Supervisor review",
};

const ORIGINALITY_STATUS_LABELS = {
  ready: "Tracked",
  "needs-attention": "Needs attention",
  "manual-check": "Manual check",
} as const;

export function DissertationRoadmap({ project }: DissertationRoadmapProps) {
  const [pageTarget, setPageTarget] = useState(DEFAULT_DISSERTATION_PAGE_TARGET);
  const [message, setMessage] = useState("");
  const roadmap = buildDissertationRoadmap(project, pageTarget);

  async function copyRoadmap() {
    try {
      await navigator.clipboard.writeText(buildDissertationRoadmapMarkdown(roadmap));
      setMessage("Dissertation roadmap copied as a planning checklist.");
    } catch {
      setMessage("Copy was blocked by the browser. You can select the roadmap text manually.");
    }
  }

  return (
    <section className="panel dissertation-roadmap" id="dissertation-roadmap" aria-labelledby="dissertation-roadmap-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">LONG-FORM THESIS PLAN</p>
          <h2 id="dissertation-roadmap-heading">Build a real {pageTarget}-page dissertation plan</h2>
        </div>
        <span className="status-pill">Planning only</span>
      </div>
      <p className="field-note">
        A page count is a structure, not a target to pad. This plan breaks a long thesis into evidence-led chapters; it never creates research findings or a submission-ready dissertation.
      </p>

      <div className="roadmap-targets" role="group" aria-label="Choose dissertation page target">
        {PAGE_TARGETS.map((target) => (
          <button
            aria-pressed={pageTarget === target}
            className={pageTarget === target ? "roadmap-target roadmap-target--selected" : "roadmap-target"}
            key={target}
            onClick={() => setPageTarget(target)}
            type="button"
          >
            {target} pages
          </button>
        ))}
      </div>

      <ol className="roadmap-list">
        {roadmap.items.map((item) => (
          <li key={item.id}>
            <div className="roadmap-list__budget">~{item.pageBudget}<small>pages</small></div>
            <div>
              <strong>{item.heading}</strong>
              <span>{item.purpose}</span>
              <small>{item.nextStep}</small>
            </div>
            <em className={`roadmap-status roadmap-status--${item.status}`}>{STATUS_LABELS[item.status]}</em>
          </li>
        ))}
      </ol>

      <button className="button button--compact" onClick={() => void copyRoadmap()} type="button">Copy roadmap</button>
      <p aria-live="polite" className="ledger-message">{message}</p>

      <div className="originality-panel">
        <h3>Originality and citation readiness</h3>
        <p>
          Thesis Studio cannot remove plagiarism, turn copied text into original writing, or certify a thesis as plagiarism-free. It can help you keep the evidence and citation trail needed for honest original work.
        </p>
        <ul>
          {roadmap.originalityChecks.map((check) => (
            <li key={check.id}>
              <strong>{check.label}</strong>
              <span>{check.summary}</span>
              <small>{check.nextStep}</small>
              <em className={`originality-status originality-status--${check.status}`}>{ORIGINALITY_STATUS_LABELS[check.status]}</em>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
