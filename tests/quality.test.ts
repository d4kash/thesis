import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { generateDraft } from "../lib/draft";
import { buildDraftMarkdown } from "../lib/export";
import { reviewProject } from "../lib/quality";

test("both synthetic demo projects create exportable planning drafts", () => {
  for (const project of DEMO_PROJECTS) {
    const draft = generateDraft(project);
    const review = reviewProject(project, draft);

    assert.equal(review.canExportAsDraft, true, project.title);
    assert.equal(review.issues.filter((item) => item.severity === "critical").length, 0, project.title);
    assert.equal(draft.length, 7, project.title);
    assert.equal(draft.some((section) => section.id === "literature-plan"), true);
    assert.equal(draft.find((section) => section.id === "results-status")?.body.includes("No results are stated"), true);
    assert.match(buildDraftMarkdown(project, draft, review), /research-planning draft/i);
  }
});

test("a verified result must link to a verified evidence record", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: [] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
});

test("a verified result with a verified evidence link can remain a working draft", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, true);
  assert.equal(review.verifiedResultCount, 1);
});

test("a plan that explicitly says it has no findings is not mistaken for an unsupported result", () => {
  const project = DEMO_PROJECTS[0];
  const review = reviewProject(project, generateDraft(project));
  const resultsIssue = review.issues.find((item) => item.id === "unsupported-outcome-results-status");

  assert.equal(resultsIssue, undefined);
});

test("unresolved data in a conclusion blocks export", () => {
  const project = DEMO_PROJECTS[1];
  const draft = generateDraft(project).map((section) =>
    section.id === "conclusion"
      ? { ...section, body: `${section.body}\n[NEEDS DATA]` }
      : section,
  );
  const review = reviewProject(project, draft);

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "unresolved-conclusion"), true);
});
