import type { ThesisProject } from "@/lib/thesis-types";

interface StudioHeaderProps {
  project: ThesisProject;
  score: number;
  issueCount: number;
}

export function StudioHeader({ project, score, issueCount }: StudioHeaderProps) {
  return (
    <header className="site-header">
      <div>
        <p className="eyebrow">THESIS STUDIO / STEP-BY-STEP WRITING</p>
        <h1>Plan and write your thesis, one verified step at a time.</h1>
        <p className="lede">
          Start with your topic, turn it into an editable working draft, and keep sources beside the ideas they support.
        </p>
      </div>
      <aside className="review-summary" aria-label="Current review status">
        <span className="review-summary__label">Current project</span>
        <strong>{project.title.trim() || "New topic"}</strong>
        <div className="review-metrics">
          <span>{score}/100 structural score</span>
          <span>{issueCount} review items</span>
        </div>
      </aside>
    </header>
  );
}
