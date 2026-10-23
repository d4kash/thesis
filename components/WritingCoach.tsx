"use client";

import { useState } from "react";
import { buildStudentWritingStarter, WRITING_PHRASE_GROUPS } from "@/lib/writing-support";
import type { ThesisProject } from "@/lib/thesis-types";

interface WritingCoachProps {
  project: ThesisProject;
}

export function WritingCoach({ project }: WritingCoachProps) {
  const starter = buildStudentWritingStarter(project);
  const [message, setMessage] = useState("");

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage("Copy was blocked by the browser. Select the text and copy it manually.");
    }
  }

  return (
    <section className="panel writing-coach" aria-labelledby="writing-coach-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">START WRITING</p>
          <h2 id="writing-coach-heading">Write from your topic, in your own voice</h2>
        </div>
        <span className="status-pill">Editable help</span>
      </div>
      <p className="field-note">
        Add your topic above and get a simple first paragraph to edit. It uses only the details in your project brief.
      </p>

      {starter ? (
        <article className="writing-starter">
          <strong>Starting paragraph for “{starter.topic}”</strong>
          <p>{starter.paragraph}</p>
          <button className="button button--compact" onClick={() => void copyText(starter.paragraph, "Starting paragraph copied.")} type="button">
            Copy starting paragraph
          </button>
        </article>
      ) : (
        <div className="writing-starter writing-starter--empty" role="status">
          Enter a topic above to create an editable starting paragraph.
        </div>
      )}

      <div className="phrase-guide">
        <h3>Choose wording that matches your evidence</h3>
        <p className="field-note">Copy a short phrase, then complete it with your own verified idea.</p>
        {WRITING_PHRASE_GROUPS.map((group) => (
          <div className="phrase-group" key={group.id}>
            <strong>{group.label}</strong>
            <small>Use when {group.useWhen}.</small>
            <div className="phrase-options">
              {group.options.map((option) => (
                <button
                  aria-label={`Copy phrase: ${option}`}
                  className="phrase-option"
                  key={option}
                  onClick={() => void copyText(option, "Writing phrase copied.")}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="writing-integrity-note">
        Phrase choices help you express your own understanding; they do not make copied text original. Read the source, write the idea in your own words, and cite the source whenever the idea or evidence came from it.
      </p>
      <p aria-live="polite" className="ledger-message">{message}</p>
    </section>
  );
}
