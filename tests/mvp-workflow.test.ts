import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { buildDissertationRoadmap } from "../lib/dissertation-roadmap";
import { generateDraft } from "../lib/draft";
import { buildDraftMarkdown, buildSupervisorReviewMarkdown } from "../lib/export";
import { reviseLiteratureEvidenceNote } from "../lib/literature-readiness";
import { buildLocalProjectBackup, loadLocalProject, parseLocalProjectBackup, saveLocalProject } from "../lib/local-project-storage";
import { canMarkPriorResearchVerified, revisePriorResearchRecord } from "../lib/prior-research-readiness";
import { reviewProject } from "../lib/quality";
import { canMarkResultVerified, normalizeResultVerification } from "../lib/result-readiness";
import { buildSynopsis, buildSynopsisMarkdown } from "../lib/synopsis";
import { createTopicStarter } from "../lib/topic-starter";
import type { ThesisProject } from "../lib/thesis-types";

// Application-data integration checks, not browser interactions or actual research.
function exerciseWorkflow(input: ThesisProject) {
  const project: ThesisProject = {
    ...structuredClone(input), id: "local-plan", demoLabel: "Synthetic workflow fixture — not real research",
    synopsis: {
      problemStatement: "Synthetic planning exercise: examine which evidence is still needed.",
      anticipatedContribution: "This proposed exercise may clarify how to organize source-linked notes.",
      ethicsAndPermissions: "Synthetic fixture only; no participants or copyrighted source text are used.",
    },
    sources: [{
      id: "SRC-01", kind: "literature-map", status: "verified",
      label: "Synthetic reference fixture — not a publication",
      locator: "local-fixture:workflow-reference", checkedOn: "2020-01-01",
      note: "Original test metadata and notes created for this test; no real source text used.",
    }],
    priorResearch: [{
      id: "PRV-01", title: "Synthetic prior-work fixture — not a thesis",
      citation: "local-fixture:workflow-reference", checkedOn: "2020-01-01",
      accessNote: "Original synthetic test fixture; no copyrighted work copied or downloaded.",
      context: "Fixture for testing source-linked planning, not a real population.",
      researchQuestion: "", methodology: "", findings: "", limitations: "", status: "verified",
    }],
    literatureNotes: [{
      id: "LIT-01", sourceId: "SRC-01", status: "verified", use: "comparison", locator: "Section 2.1",
      claim: "This synthetic own-words note illustrates comparison planning, not a research finding.",
    }],
    results: [],
  };
  assert.equal(buildSynopsis(project).isReadyForSupervisorReview, true);
  project.synopsis!.problemStatement = "Revised synthetic problem: determine the records needed before comparison.";
  assert.ok(buildSynopsisMarkdown(project).includes(project.synopsis!.problemStatement));
  assert.equal(canMarkPriorResearchVerified(project.priorResearch[0]), true);
  assert.equal(revisePriorResearchRecord(project.priorResearch[0], {
    accessNote: "Revised synthetic permission note needs a new researcher check.",
  }).status, "reviewed");
  assert.equal(canMarkPriorResearchVerified({ ...project.priorResearch[0], accessNote: "" }), false);
  const section = () => generateDraft(project).find((entry) => entry.id === "literature-plan")!;
  assert.ok(section().body.includes(project.literatureNotes![0].claim));
  project.literatureNotes![0] = reviseLiteratureEvidenceNote(project.literatureNotes![0], {
    claim: "Revised synthetic comparison note, still not an empirical finding.",
  }, project.sources);
  assert.match(section().body, /Notes included: 0/);
  project.literatureNotes![0].status = "verified";
  assert.match(section().body, /Notes included: 1/);
  assert.deepEqual(section().claimIds, ["LIT-01", "SRC-01"]);
  project.dissertationPageTarget = 250;
  const roadmap = buildDissertationRoadmap(project);
  assert.equal(roadmap.items.reduce((sum, item) => sum + item.pageBudget, 0), 250);
  assert.ok(roadmap.items.some((item) => item.evidence.recordIds.includes("LIT-01")));
  project.methods[0].dataAndEthicsPlan = "Synthetic safeguards plan only; no approval or data collection has occurred.";
  const pendingResult = {
    id: "RES-01", label: "Synthetic ledger placeholder — no findings available",
    verification: "verified" as const, note: "Await actual direct evidence and approved analysis; this is a test placeholder.",
    sourceIds: ["SRC-01"], methodIds: [project.methods[0].id],
  };
  assert.equal(canMarkResultVerified(pendingResult, project.sources, project.methods), false);
  project.results = [normalizeResultVerification(pendingResult, project.sources, project.methods)];
  assert.equal(project.results[0].verification, "unverified");
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  assert.equal(saveLocalProject(storage, project), true);
  assert.deepEqual(loadLocalProject(storage), project);
  const backup = buildLocalProjectBackup(project);
  assert.ok(backup);
  const restored = parseLocalProjectBackup(backup);
  assert.deepEqual(restored, project);
  assert.equal(buildDissertationRoadmap(restored!).pageTarget, 250);
  assert.equal(parseLocalProjectBackup('{"format":"unknown","project":{}}'), null);
  assert.deepEqual(loadLocalProject(storage), project);
  const draft = generateDraft(restored!);
  const review = reviewProject(restored!, draft);
  const markdown = buildDraftMarkdown(restored!, draft, review);
  const packet = buildSupervisorReviewMarkdown(restored!, draft, review);
  assert.match(markdown, /Synthetic workflow fixture/);
  assert.ok(markdown.includes(project.literatureNotes![0].claim));
  assert.match(markdown, /Re-check location: Section 2\.1/);
  assert.match(markdown, /\[NEEDS INPUT\]/);
  assert.match(packet, /supervisor review/i);
  assert.match(packet, /250-page dissertation roadmap/);
  assert.match(packet, /RES-01 — UNVERIFIED/);
  assert.ok(packet.includes(project.priorResearch[0].accessNote!));
  assert.ok(packet.includes(project.methods[0].dataAndEthicsPlan!));
  assert.equal(review.verifiedResultCount, 0);
}

for (const demo of DEMO_PROJECTS) {
  test(`synthetic full application workflow: ${demo.title}`, () => {
    const before = structuredClone(demo);
    exerciseWorkflow(demo);
    assert.deepEqual(demo, before);
  });
}

test("a new topic can enter the same source-linked local workflow without invented records", () => {
  const starter = createTopicStarter({
    id: "local-plan", demoLabel: "Synthetic new-topic fixture", title: "Synthetic source-linked planning study", discipline: "Research methods",
    researchQuestion: "", scope: "",
    objectives: [{ id: "OBJ-01", text: "State one measurable research objective." }],
    methods: [{ id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Describe a method that can be audited and approved." }],
    priorResearch: [], sources: [], literatureNotes: [], results: [],
  });
  assert.equal(starter.sources.length, 0);
  assert.equal(starter.results.length, 0);
  assert.equal(buildSynopsis(starter).isReadyForSupervisorReview, false);
  exerciseWorkflow(starter);
});
