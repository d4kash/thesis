import type { DraftSection } from "@/lib/thesis-types";

interface DraftViewerProps {
  sections: DraftSection[];
}

export function DraftViewer({ sections }: DraftViewerProps) {
  return (
    <section className="panel draft-viewer" aria-labelledby="draft-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DRAFT STUDIO</p>
          <h2 id="draft-heading">Traceable working draft</h2>
        </div>
        <span className="status-pill">Generated from current brief</span>
      </div>
      <div className="draft-sections">
        {sections.map((section) => (
          <article className="draft-section" key={section.id}>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
            <small>
              Trace IDs: {section.claimIds.length === 0 ? "None required for this planning section" : section.claimIds.join(", ")}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
