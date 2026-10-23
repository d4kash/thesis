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
        <p className="eyebrow">THESIS STUDIO / EVIDENCE-FIRST DRAFTING</p>
        <h1>Build the research trail before the thesis.</h1>
        <p className="lede">
          Turn a research brief into a traceable draft, then inspect the claims before you export.
        </p>
      </div>
      <aside className="review-summary" aria-label="Current review status">
        <span className="review-summary__label">Current project</span>
        <strong>{project.title}</strong>
        <div className="review-metrics">
          <span>{score}/100 structural score</span>
          <span>{issueCount} review items</span>
        </div>
      </aside>
    </header>
  );
}
