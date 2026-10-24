"use client";

import { useState } from "react";
import { buildResearchToolkit } from "@/lib/research-toolkit";
import type { ThesisProject } from "@/lib/thesis-types";

interface ResearchToolkitProps {
  project: ThesisProject;
}

export function ResearchToolkit({ project }: ResearchToolkitProps) {
  const toolkit = buildResearchToolkit(project);
  const [message, setMessage] = useState("");

  async function copySearchPhrase() {
    if (!toolkit.searchPhrase) return;

    try {
      await navigator.clipboard.writeText(toolkit.searchPhrase);
      setMessage("Search phrase copied. Use it to find source records, then check the original work before adding notes here.");
    } catch {
      setMessage("Copy was blocked by the browser. Select the search phrase and copy it manually.");
    }
  }

  return (
    <section className="panel research-toolkit" id="research-toolkit" aria-labelledby="research-toolkit-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FREE RESEARCH TOOLKIT</p>
          <h2 id="research-toolkit-heading">Find and organise sources without losing the evidence trail</h2>
        </div>
        <span className="status-pill">You choose what to use</span>
      </div>
      <p className="field-note">
        Use these trusted public tools to discover records, read lawful open-access copies, and organise citations. Bring only checked metadata and your own notes back into Thesis Studio.
      </p>

      {toolkit.searchPhrase ? (
        <div className="research-toolkit__query">
          <strong>Start here: search for source records</strong>
          <code>{toolkit.searchPhrase}</code>
          <button className="button button--compact" onClick={() => void copySearchPhrase()} type="button">Copy search phrase</button>
        </div>
      ) : (
        <div className="research-toolkit__query research-toolkit__query--empty" role="status">
          Add a topic above to make a search phrase based only on your title and research question.
        </div>
      )}

      <ol className="research-toolkit__steps">
        <li><strong>Discover:</strong> search a catalogue or thesis repository with your topic.</li>
        <li><strong>Check:</strong> open the original record and confirm the title, authors, date, access rights, and relevance.</li>
        <li><strong>Trace:</strong> add the stable link, an own-words note, and a page/section locator to the evidence ledger below.</li>
        <li><strong>Cite last:</strong> format the bibliography only after every record has been checked.</li>
      </ol>

      <div className="research-toolkit__resources" aria-label="Free research resources">
        {toolkit.resources.map((resource) => (
          <article className="research-toolkit__resource" key={resource.id}>
            <span>{resource.category}</span>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            <small><strong>Bring back:</strong> {resource.returnWith}</small>
            <a href={resource.href} rel="noreferrer" target="_blank">{resource.linkLabel} <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>

      <p className="research-toolkit__boundary">
        Thesis Studio does not send your notes, PDFs, or source text to these services. An external site receives a topic search only after you choose to open its link. Do not upload or rewrite a source to hide its origin; read it, write your own understanding, and cite it.
      </p>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
