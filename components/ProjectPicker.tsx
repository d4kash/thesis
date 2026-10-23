import type { ThesisProject } from "@/lib/thesis-types";

interface ProjectPickerProps {
  projects: ThesisProject[];
  selectedId: string;
  onSelect: (project: ThesisProject) => void;
  onCreate: () => void;
}

export function ProjectPicker({ projects, selectedId, onSelect, onCreate }: ProjectPickerProps) {
  return (
    <nav className="project-picker" aria-label="Research projects">
      <div className="project-picker__heading">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h2>Choose a starting point</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={onCreate}>
          Start blank plan
        </button>
      </div>
      <div className="project-cards">
        {projects.map((project) => (
          <button
            aria-pressed={project.id === selectedId}
            className={`project-card ${project.id === selectedId ? "project-card--selected" : ""}`}
            key={project.id}
            onClick={() => onSelect(project)}
            type="button"
          >
            <span className="project-card__discipline">{project.discipline}</span>
            <strong>{project.title}</strong>
            <small>{project.demoLabel}</small>
          </button>
        ))}
      </div>
    </nav>
  );
}
