import type { ChangeEvent } from "react";
import { createTopicStarter, hasTopic } from "@/lib/topic-starter";
import type { ThesisProject } from "@/lib/thesis-types";

interface ProjectEditorProps {
  project: ThesisProject;
  onChange: (project: ThesisProject) => void;
}

function updateTextField(
  project: ThesisProject,
  field: "title" | "discipline" | "researchQuestion" | "scope",
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): ThesisProject {
  return { ...project, [field]: event.target.value };
}

export function ProjectEditor({ project, onChange }: ProjectEditorProps) {
  return (
    <section className="panel project-editor" aria-labelledby="brief-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">RESEARCH BRIEF</p>
          <h2 id="brief-heading">Frame the project honestly</h2>
        </div>
        <span className="status-pill">Local working draft</span>
      </div>
      <label>
        Thesis topic / working title
        <input
          onChange={(event) => onChange(updateTextField(project, "title", event))}
          value={project.title}
        />
      </label>
      <button
        className="button button--compact project-editor__starter"
        disabled={!hasTopic(project)}
        onClick={() => onChange(createTopicStarter(project))}
        type="button"
      >
        Create evidence-safe starter from topic
      </button>
      <p className="field-note project-editor__starter-note">
        This fills only missing planning fields and preserves existing details. It never creates findings, citations, participant data, or a finished thesis.
      </p>
      <label>
        Discipline or field
        <input
          onChange={(event) => onChange(updateTextField(project, "discipline", event))}
          value={project.discipline}
        />
      </label>
      <label>
        Research question
        <textarea
          onChange={(event) => onChange(updateTextField(project, "researchQuestion", event))}
          rows={3}
          value={project.researchQuestion}
        />
      </label>
      <label>
        Scope and boundary
        <textarea
          onChange={(event) => onChange(updateTextField(project, "scope", event))}
          rows={3}
          value={project.scope}
        />
      </label>
      <p className="field-note">
        Start with a precise topic, then use the prior-research library below to compare earlier work by context, method, findings, and limitations. The starter projects are synthetic.
      </p>
    </section>
  );
}
