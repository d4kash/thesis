import type { DraftSection, ThesisProject } from "@/lib/thesis-types";

function list(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function generateDraft(project: ThesisProject): DraftSection[] {
  const objectiveLines = project.objectives.map((objective) => `${objective.id}: ${objective.text}`);
  const methodLines = project.methods.map(
    (method) => `${method.id} → ${method.objectiveIds.join(", ")}: ${method.text}`,
  );
  const sourceLines = project.sources.map(
    (source) => `${source.id} (${source.status}): ${source.label}. ${source.note}`,
  );
  const evidencePlan = sourceLines.length > 0
    ? list(sourceLines)
    : "No source records have been added. Add a source record before turning this outline into a literature review.";
  const resultLines = project.results.map(
    (result) => `${result.id} (${result.verification}; sources: ${result.sourceIds.join(", ") || "none"}): ${result.label}. ${result.note}`,
  );

  return [
    {
      id: "overview",
      heading: "1. Research overview",
      body: `${project.demoLabel}\n\nResearch question: ${project.researchQuestion}\n\nScope: ${project.scope}\n\nThis demonstration draft defines a research path. It does not present completed findings or citations that have not been verified.`,
      claimIds: [],
    },
    {
      id: "literature-plan",
      heading: "2. Literature and evidence plan",
      body: `This section is a source-grounded writing plan, not a literature review with invented citations.\n\nCurrent evidence ledger\n${evidencePlan}\n\nFor each final paragraph, retain the source identifier, a verified citation record, the claim it supports, and the reason the source is relevant.`,
      claimIds: project.sources.map((source) => source.id),
    },
    {
      id: "research-design",
      heading: "3. Research design and methodology",
      body: `Objectives\n${list(objectiveLines)}\n\nMethods mapped to objectives\n${list(methodLines)}\n\nBefore fieldwork or analysis, record the approved protocol, sampling or selection logic, ethics requirements, and the decisions that would change the method.`,
      claimIds: project.methods.map((method) => method.id),
    },
    {
      id: "evidence-plan",
      heading: "4. Claim and evidence ledger",
      body: `Every substantive claim in a final thesis must point to a verified source or a traceable result record.\n\nUse the ledger to distinguish: (a) claims planned for the literature review, (b) methods proposed for the study, and (c) results that have actually been verified.`,
      claimIds: project.sources.map((source) => source.id),
    },
    {
      id: "results-status",
      heading: "5. Results and analysis status",
      body:
        resultLines.length === 0
          ? "No results are stated. This project is a research plan and has no collected or verified findings."
          : `Result ledger\n${list(resultLines)}\n\nOnly verified results with linked source records may support outcome language in the discussion or conclusion.`,
      claimIds: project.results.map((result) => result.id),
    },
    {
      id: "discussion",
      heading: "6. Discussion, limitations, and implications",
      body: "Use this section to interpret verified results in relation to the evidence ledger, explain limitations, and identify what remains uncertain. Until the result ledger is complete, frame this section as a discussion plan rather than a claim of impact or performance.",
      claimIds: [...project.sources.map((source) => source.id), ...project.results.map((result) => result.id)],
    },
    {
      id: "conclusion",
      heading: "7. Conclusion and next evidence step",
      body: "The next responsible step is to verify sources, register the method, and collect or analyze approved data. The project should not make outcome, impact, or performance claims until a result ledger supports them.",
      claimIds: [],
    },
  ];
}
