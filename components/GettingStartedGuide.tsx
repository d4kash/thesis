import { hasTopic } from "@/lib/topic-starter";
import { buildSynopsis } from "@/lib/synopsis";
import type { QualityReport, ThesisProject } from "@/lib/thesis-types";

interface GettingStartedGuideProps {
  project: ThesisProject;
  review: QualityReport;
}

export function GettingStartedGuide({ project, review }: GettingStartedGuideProps) {
  const isNewWorkingProject = project.id === "local-plan";
  const synopsis = buildSynopsis(project);
  const hasResearchNotes = project.priorResearch.some((record) =>
    [record.context, record.researchQuestion, record.methodology, record.findings, record.limitations]
      .some((value) => value.trim().length >= 12),
  );
  const steps = [
    { href: "#project-picker", label: "Start a new topic", detail: "Choose “Start a new topic” instead of changing a synthetic example.", done: isNewWorkingProject },
    { href: "#research-brief", label: "Name your topic", detail: "Use a plain working title. You can improve it later.", done: hasTopic(project) },
    { href: "#synopsis-builder", label: "Build your synopsis", detail: "Answer the short prompts, then review the editable plan for your question, scope, objectives, method, and ethics notes.", done: synopsis.isReadyForSupervisorReview },
    { href: "#prior-research", label: "Add and compare earlier research", detail: "Paste a public source link, then record checked notes in your own words with the source beside them.", done: hasResearchNotes },
    { href: "#quality-review", label: "Check and export a planning draft", detail: "Resolve critical checks, then take the draft to your supervisor for review.", done: review.canExportAsDraft && hasResearchNotes },
  ];
  const nextStep = steps.find((step) => !step.done);
  const completedCount = steps.filter((step) => step.done).length;

  return (
    <section className="getting-started panel" aria-labelledby="getting-started-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">START HERE</p>
          <h2 id="getting-started-heading">Five simple steps to use Thesis Studio</h2>
        </div>
        <span className="status-pill">{completedCount}/5 complete</span>
      </div>
      <p className="review-intro">You do not need to know research software. Follow one step at a time; every item stays editable.</p>
      <ol className="getting-started__steps">
        {steps.map((step, index) => (
          <li className={step.done ? "getting-started__step getting-started__step--done" : "getting-started__step"} key={step.label}>
            <span aria-hidden="true" className="getting-started__number">{step.done ? "✓" : index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
            <a href={step.href}>{step.done ? "Review" : "Go"}</a>
          </li>
        ))}
      </ol>
      <p className="getting-started__next">
        <strong>Do this next:</strong>{" "}
        {nextStep ? <a href={nextStep.href}>{nextStep.label}</a> : "Review the draft with your supervisor before using it in any formal submission."}
      </p>
    </section>
  );
}
