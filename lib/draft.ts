import type { DraftSection, ThesisProject } from "@/lib/thesis-types";
import { buildResearchLandscape } from "@/lib/research-landscape";
import { buildStudentWritingStarter } from "@/lib/writing-support";

function list(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

export function generateDraft(project: ThesisProject): DraftSection[] {
  const landscape = buildResearchLandscape(project);
  const writingStarter = buildStudentWritingStarter(project);
  const objectiveLines = project.objectives.map((objective) => `${objective.id}: ${objective.text}`);
  const methodLines = project.methods.map(
    (method) => `${method.id} → ${method.objectiveIds.join(", ")}: ${method.text}\nData, permissions, and ethics plan: ${method.dataAndEthicsPlan?.trim() || "[NEEDS INPUT] Record the planned safeguards for this method."}`,
  );
  const sourceLines = project.sources.map(
    (source) => `${source.id} (${source.status}): ${source.label}. Original record locator: ${source.locator?.trim() || "not recorded"}. ${source.note}`,
  );
  const evidencePlan = sourceLines.length > 0
    ? list(sourceLines)
    : "No source records have been added. Add a source record before turning this outline into a literature review.";
  const resultLines = project.results.map(
    (result) => `${result.id} (${result.verification}; sources: ${result.sourceIds.join(", ") || "none"}; methods: ${result.methodIds.join(", ") || "none"}): ${result.label}. ${result.note}`,
  );
  const priorResearchLines = landscape.matches
    .filter((match) => match.matchedTerms.length > 0)
    .slice(0, 5)
    .map((match) => {
      const terms = match.matchedTerms.join(", ");
      return `${match.record.id} (${match.record.status}; ${match.relevance}% topic overlap): ${match.record.title}. Matched terms: ${terms}.`;
    });
  const landscapePlan = priorResearchLines.length > 0
    ? list(priorResearchLines)
    : "No prior research records match the current topic terms yet. Add prior works with their context, method, and limitation notes before writing a synthesis.";
  const gapLines = landscape.candidateGaps.length > 0
    ? list(landscape.candidateGaps.map((gap) => `${gap.recordId}: Candidate gap only — ${gap.text}`))
    : "No candidate gaps have been recorded. Add the original work's stated limitations or unresolved questions; do not infer a gap from a title alone.";

  return [
    {
      id: "overview",
      heading: "1. What this study is about",
      body: `${project.demoLabel}\n\n${writingStarter?.paragraph ?? "Add a topic to create an editable opening paragraph for this working draft."}\n\nResearch question: ${project.researchQuestion}\n\nScope: ${project.scope}\n\nThis working draft defines a research path. It does not present completed findings or citations that have not been verified.`,
      claimIds: [],
    },
    {
      id: "research-landscape",
      heading: "2. Prior research landscape and synthesis plan",
      body: `Topic terms used for this local map: ${landscape.topicTerms.join(", ") || "add a more specific topic or research question"}.\n\nMost aligned prior-research records\n${landscapePlan}\n\nCandidate gap signals\n${gapLines}\n\nThis is a comparison plan, not a claim that the prior works agree, differ, or establish a gap. Re-check every record against its original text before formal citation.`,
      claimIds: landscape.matches.filter((match) => match.matchedTerms.length > 0).map((match) => match.record.id),
    },
    {
      id: "literature-plan",
      heading: "3. Literature and evidence plan",
      body: `This section is a source-grounded writing plan, not a literature review with invented citations.\n\nCurrent evidence ledger\n${evidencePlan}\n\nFor each final paragraph, retain the source identifier, a verified citation record, the claim it supports, and the reason the source is relevant.`,
      claimIds: project.sources.map((source) => source.id),
    },
    {
      id: "research-design",
      heading: "4. Research design and methodology",
      body: `Objectives\n${list(objectiveLines)}\n\nMethods mapped to objectives\n${list(methodLines)}\n\nBefore fieldwork or analysis, record the approved protocol, sampling or selection logic, ethics requirements, and the decisions that would change the method. A recorded plan is not evidence of ethics approval, permission, or collected data.`,
      claimIds: project.methods.map((method) => method.id),
    },
    {
      id: "evidence-plan",
      heading: "5. Claim and evidence ledger",
      body: `Every substantive claim in a final thesis must point to a verified source or a traceable result record.\n\nUse the ledger to distinguish: (a) claims planned for the literature review, (b) methods proposed for the study, and (c) results that have actually been verified.`,
      claimIds: project.sources.map((source) => source.id),
    },
    {
      id: "results-status",
      heading: "6. Results and analysis status",
      body:
        resultLines.length === 0
          ? "No results are stated. This project is a research plan and has no collected or verified findings."
          : `Result ledger\n${list(resultLines)}\n\nOnly verified results with linked direct records and planned methods that document data and safeguards may support outcome language in the discussion or conclusion.`,
      claimIds: project.results.map((result) => result.id),
    },
    {
      id: "discussion",
      heading: "7. Discussion, limitations, and implications",
      body: "Use this section to interpret verified results in relation to the evidence ledger, explain limitations, and identify what remains uncertain. Until the result ledger is complete, frame this section as a discussion plan rather than a claim of impact or performance.",
      claimIds: [...project.sources.map((source) => source.id), ...project.results.map((result) => result.id)],
    },
    {
      id: "conclusion",
      heading: "8. Conclusion and next evidence step",
      body: "The next responsible step is to verify sources, register the method, and collect or analyze approved data. The project should not make outcome, impact, or performance claims until a result ledger supports them.",
      claimIds: [],
    },
  ];
}
