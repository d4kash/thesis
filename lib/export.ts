import type { DraftSection, QualityReport, ThesisProject } from "@/lib/thesis-types";

export function buildDraftMarkdown(
  project: ThesisProject,
  draft: DraftSection[],
  review: QualityReport,
): string {
  const status = review.canExportAsDraft ? "PASSED STRUCTURAL REVIEW" : "REVIEW REQUIRED";
  const sections = draft.map((section) => `## ${section.heading}\n\n${section.body}`).join("\n\n");

  return `# ${project.title}\n\n> ${project.demoLabel}\n> ${status}\n> This output is a topic-led research-planning draft. It is not a submitted thesis and contains no claimed findings.\n> Prior-research records are comparison notes until their original sources have been verified.\n\n${sections}\n\n## Quality review\n\nScore: ${review.score}/100\n\n${review.issues.length === 0 ? "No issues detected." : review.issues.map((entry) => `- **${entry.severity.toUpperCase()}** — ${entry.title}: ${entry.fix}`).join("\n")}`;
}
