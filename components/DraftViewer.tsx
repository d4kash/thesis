import type { DraftSection } from "@/lib/thesis-types";

interface DraftViewerProps {
  sections: DraftSection[];
}

export function DraftViewer({ sections }: DraftViewerProps) {
  return (
    <section className="panel draft-viewer" aria-labelledby="draft-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR WORKING DRAFT</p>
          <h2 id="draft-heading">A first draft built from your topic</h2>
        </div>
        <span className="status-pill">Edit before using</span>
      </div>
      <div className="draft-sections">
        {sections.map((section) => (
          <article className="draft-section" key={section.id}>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
            <small>
              Linked notes: {section.claimIds.length === 0 ? "No source or result link needed for this planning section" : section.claimIds.join(", ")}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
