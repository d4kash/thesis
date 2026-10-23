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

  return [
    {
      id: "overview",
      heading: "1. Research overview",
      body: `${project.demoLabel}\n\nResearch question: ${project.researchQuestion}\n\nScope: ${project.scope}\n\nThis demonstration draft defines a research path. It does not present completed findings or citations that have not been verified.`,
      claimIds: [],
    },
    {
      id: "research-design",
      heading: "2. Research design",
      body: `Objectives\n${list(objectiveLines)}\n\nMethods mapped to objectives\n${list(methodLines)}\n\nThe final methodology should be revised after approved sources, ethics requirements, and data availability are confirmed.`,
      claimIds: project.methods.map((method) => method.id),
    },
    {
      id: "evidence-plan",
      heading: "3. Evidence plan",
      body: `Evidence registry\n${list(sourceLines)}\n\nEvery substantive claim in a final thesis must point to a verified source or a traceable result record.`,
      claimIds: project.sources.map((source) => source.id),
    },
    {
      id: "results-status",
      heading: "4. Results status",
      body:
        project.results.length === 0
          ? "No results are stated. This project is a research plan and has no collected or verified findings."
          : `Result ledger\n${list(project.results.map((result) => `${result.id} (${result.verification}): ${result.label}. ${result.note}`))}`,
      claimIds: project.results.map((result) => result.id),
    },
    {
      id: "conclusion",
      heading: "5. Conclusion and next evidence step",
      body: "The next responsible step is to verify sources, register the method, and collect or analyze approved data. The project should not make outcome, impact, or performance claims until a result ledger supports them.",
      claimIds: [],
    },
  ];
}
