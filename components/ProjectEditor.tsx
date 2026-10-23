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
          <h2 id="brief-heading">Tell us what you want to research</h2>
        </div>
        <span className="status-pill">Your working plan</span>
      </div>
      <label>
        Your topic or working title
        <input
          onChange={(event) => onChange(updateTextField(project, "title", event))}
          placeholder="For example: Digital learning access in rural colleges"
          value={project.title}
        />
      </label>
      <button
        className="button button--compact project-editor__starter"
        disabled={!hasTopic(project)}
        onClick={() => onChange(createTopicStarter(project))}
        type="button"
      >
        Create my starter outline
      </button>
      <p className="field-note project-editor__starter-note">
        We use the words you provide to make an editable question, scope, objectives, and method outline. We never add sources, data, results, or citations that you have not supplied.
      </p>
      <label>
        Your subject or field
        <input
          onChange={(event) => onChange(updateTextField(project, "discipline", event))}
          placeholder="For example: Education and information studies"
          value={project.discipline}
        />
      </label>
      <label>
        What do you want to find out?
        <textarea
          onChange={(event) => onChange(updateTextField(project, "researchQuestion", event))}
          placeholder="Write the question your study will answer."
          rows={3}
          value={project.researchQuestion}
        />
      </label>
      <label>
        What will your study include and leave out?
        <textarea
          onChange={(event) => onChange(updateTextField(project, "scope", event))}
          placeholder="Mention the setting, people or material, time period, and limits."
          rows={3}
          value={project.scope}
        />
      </label>
      <p className="field-note">
        Start with a clear topic. Then add earlier studies and source notes below so you can compare their setting, method, findings, and limitations. The starter projects are synthetic examples only.
      </p>
    </section>
  );
}
