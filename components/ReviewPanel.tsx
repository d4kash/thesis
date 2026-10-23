import type { QualityReport } from "@/lib/thesis-types";

interface ReviewPanelProps {
  review: QualityReport;
}

const severityOrder = ["critical", "warning", "info"] as const;

export function ReviewPanel({ review }: ReviewPanelProps) {
  const criticalCount = review.issues.filter((item) => item.severity === "critical").length;

  return (
    <section className="panel review-panel" aria-labelledby="review-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">OUTPUT REVIEW</p>
          <h2 id="review-heading">{review.canExportAsDraft ? "Draft can be exported" : "Resolve critical issues first"}</h2>
        </div>
        <div className={`score-badge ${review.canExportAsDraft ? "score-badge--pass" : "score-badge--hold"}`}>
          {review.score}/100
        </div>
      </div>
      <p className="review-intro">
        {criticalCount === 0
          ? "The structural scan found no unsupported outcome claims or broken method mappings. Verify planned sources before formal citation."
          : "A result or conclusion includes an unsupported claim. Keep this as a working draft until its evidence record is complete."}
      </p>
      <div className="issues">
        {severityOrder.map((severity) => {
          const issues = review.issues.filter((item) => item.severity === severity);
          return issues.length > 0 ? (
            <div className="issue-group" key={severity}>
              <h3>{severity}</h3>
              <ul>
                {issues.map((item) => (
                  <li className={`issue issue--${item.severity}`} key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <small>Fix: {item.fix}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null;
        })}
      </div>
    </section>
  );
}
