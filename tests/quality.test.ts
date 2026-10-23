import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { generateDraft } from "../lib/draft";
import { buildDraftMarkdown } from "../lib/export";
import { buildResearchLandscape } from "../lib/research-landscape";
import { createTopicStarter } from "../lib/topic-starter";
import { reviewProject } from "../lib/quality";

test("both synthetic demo projects create exportable planning drafts", () => {
  for (const project of DEMO_PROJECTS) {
    const draft = generateDraft(project);
    const review = reviewProject(project, draft);

    assert.equal(review.canExportAsDraft, true, project.title);
    assert.equal(review.issues.filter((item) => item.severity === "critical").length, 0, project.title);
    assert.equal(draft.length, 8, project.title);
    assert.equal(draft.some((section) => section.id === "research-landscape"), true);
    assert.equal(draft.some((section) => section.id === "literature-plan"), true);
    assert.equal(draft.find((section) => section.id === "results-status")?.body.includes("No results are stated"), true);
    assert.match(buildDraftMarkdown(project, draft, review), /topic-led research-planning draft/i);
  }
});

test("the topic map ranks supplied prior research and keeps limitations as candidate gaps", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    priorResearch: [
      {
        id: "PRV-01",
        title: "Leaf image explanation study",
        citation: "Repository record: example/leaf-explanations",
        context: "Flowering plant leaf-image classification with visual explanation checks.",
        researchQuestion: "How are explanation maps evaluated for leaf image classifiers?",
        methodology: "Compare explanation maps to defined leaf regions.",
        findings: "The original source must be checked before quoting any finding.",
        limitations: "The setting did not test explanation maps across multiple flowering plant groups.",
        status: "verified" as const,
      },
      {
        id: "PRV-02",
        title: "Unrelated campus transportation study",
        citation: "Repository record: example/campus-transport",
        context: "Travel behavior on a university campus.",
        researchQuestion: "How do commuters choose routes?",
        methodology: "Survey route preferences.",
        findings: "No claim used here.",
        limitations: "The survey is limited to one campus.",
        status: "reviewed" as const,
      },
    ],
  };
  const landscape = buildResearchLandscape(project);

  assert.equal(landscape.matches[0]?.record.id, "PRV-01");
  assert.equal(landscape.matches[0]?.matchedTerms.includes("leaf"), true);
  assert.equal(landscape.verifiedMatchCount, 1);
  assert.equal(landscape.candidateGaps[0]?.recordId, "PRV-01");
  assert.match(landscape.prompts.join(" "), /candidate gap/i);
});

test("a verified prior work without a trace is flagged for review", () => {
  const project = {
    ...DEMO_PROJECTS[1],
    priorResearch: [{
      ...DEMO_PROJECTS[1].priorResearch[0],
      status: "verified" as const,
      citation: "",
      context: "Short",
      researchQuestion: "",
      methodology: "",
      findings: "",
      limitations: "",
    }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.issues.some((item) => item.id === "thin-verified-prior-research-PRV-01"), true);
});

test("a topic starter creates a planning scaffold without creating results or citations", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    id: "topic-starter",
    demoLabel: "Local working project • add verified evidence before use",
    title: "Sustainable disease diagnosis for flowering plants",
    discipline: "Choose a discipline",
    researchQuestion: "What focused question will this project investigate?",
    scope: "Define what the project will cover, what it will not cover, and what evidence it needs.",
    objectives: [{ id: "OBJ-01", text: "State one measurable research objective." }],
    methods: [{ id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Describe a method that can be audited and approved." }],
    priorResearch: [],
    sources: [],
    results: [],
  };
  const starter = createTopicStarter(project);

  assert.match(starter.researchQuestion, /Sustainable disease diagnosis for flowering plants/);
  assert.equal(starter.objectives.length, 4);
  assert.equal(starter.methods.length, 4);
  assert.equal(starter.results.length, 0);
  assert.equal(starter.sources.length, 0);
  assert.equal(starter.priorResearch.length, 0);
  assert.match(starter.methods[1]?.text ?? "", /source-linked comparison matrix/i);
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
