import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EvidenceLedger } from "../components/EvidenceLedger";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { generateDraft } from "../lib/draft";
import { buildSupervisorReviewMarkdown } from "../lib/export";
import { buildLocalProjectBackup, loadLocalProject, parseLocalProjectBackup, saveLocalProject } from "../lib/local-project-storage";
import { reviewProject } from "../lib/quality";
import { canMarkResultVerified, recheckResultsAfterSourceChange, reviseEvidenceSource, updateResultVerificationAndLinks } from "../lib/result-readiness";
import type { ThesisProject } from "../lib/thesis-types";

// Only synthetic state-machine fixtures: no actual data, findings or approvals.
function fixture(input: ThesisProject = DEMO_PROJECTS[0]): ThesisProject {
  return {
    ...structuredClone(input), id: "local-plan", demoLabel: "Synthetic result-link test — not actual research",
    priorResearch: [], literatureNotes: [], dissertationPageTarget: 250,
    sources: ["SRC-01", "SRC-02"].map((id) => ({
      id, kind: "dataset", status: "verified", label: `Synthetic ${id} — no research data`,
      locator: `local-fixture:${id}`, checkedOn: "2020-01-01",
      note: "Synthetic traceability fixture only; no participant data or findings exist.",
    })),
    methods: input.methods.map((method) => ({
      ...structuredClone(method), dataAndEthicsPlan: "Synthetic safeguards fixture; no approval or collection has occurred.",
    })),
    results: [{
      id: "RES-01", label: "Synthetic result-status fixture — not a research finding",
      note: "Original test fixture only, used to check record-link transitions without empirical data.",
      verification: "verified", sourceIds: ["SRC-01"], methodIds: [input.methods[0].id],
    }],
  };
}

test("replacing a verified result's source requires a new result check even when the replacement is verified", () => {
  const project = fixture();
  const before = structuredClone(project);
  const result = updateResultVerificationAndLinks(project.results[0], { sourceIds: ["SRC-02"] }, project.sources, project.methods);
  assert.ok(result);
  assert.deepEqual(result.sourceIds, ["SRC-02"]);
  assert.equal(canMarkResultVerified(result, project.sources, project.methods), true);
  assert.equal(result.verification, "unverified");
  assert.deepEqual(project, before);
});

test("replacing a verified result's method requires a new result check even with documented safeguards", () => {
  const project = fixture();
  const result = updateResultVerificationAndLinks(project.results[0], { methodIds: [project.methods[1].id] }, project.sources, project.methods);
  assert.ok(result);
  assert.deepEqual(result.methodIds, [project.methods[1].id]);
  assert.equal(canMarkResultVerified(result, project.sources, project.methods), true);
  assert.equal(result.verification, "unverified");
});

test("clearing evidence or method links is allowed and leaves the result unverified", () => {
  const project = fixture();
  for (const changes of [{ sourceIds: [] }, { methodIds: [] }]) {
    const result = updateResultVerificationAndLinks(project.results[0], changes, project.sources, project.methods);
    assert.ok(result, "the edit must not be discarded just because its old status was verified");
    assert.equal(result.verification, "unverified");
    assert.equal(canMarkResultVerified(result, project.sources, project.methods), false);
    assert.equal(updateResultVerificationAndLinks(result, { verification: "verified" }, project.sources, project.methods), null);
  }
});

test("editing or downgrading any linked source invalidates a result even when another eligible source remains", () => {
  const project = fixture();
  project.results[0].sourceIds = ["SRC-01", "SRC-02"];
  const before = structuredClone(project);
  for (const changedSource of [
    reviseEvidenceSource(project.sources[0], { locator: "local-fixture:corrected-source" }),
    { ...project.sources[0], status: "reviewed" as const },
    { ...project.sources[0], note: "Revised synthetic source note; a new result check is still required." },
  ]) {
    const sources = [changedSource, project.sources[1]];
    const results = recheckResultsAfterSourceChange(project.results, "SRC-01", sources, project.methods);
    assert.equal(canMarkResultVerified(results[0], sources, project.methods), true);
    assert.equal(results[0].verification, "unverified");
    assert.deepEqual(results[0].sourceIds, ["SRC-01", "SRC-02"]);
    const checkedSources = [{ ...changedSource, status: "verified" as const }, sources[1]];
    assert.equal(recheckResultsAfterSourceChange(results, "SRC-01", checkedSources, project.methods)[0].verification, "unverified");
  }
  assert.deepEqual(project, before);
});

test("removing one of several source links invalidates only affected results and preserves remaining links", () => {
  const project = fixture();
  project.results[0].sourceIds = ["SRC-01", "SRC-02"];
  project.results.push({ ...structuredClone(project.results[0]), id: "RES-02", sourceIds: ["SRC-02"] });
  const before = structuredClone(project);
  const results = recheckResultsAfterSourceChange(project.results, "SRC-01", [project.sources[1]], project.methods);
  assert.deepEqual(results[0].sourceIds, ["SRC-02"]);
  assert.equal(results[0].verification, "unverified");
  assert.deepEqual(results[1], project.results[1]);
  assert.deepEqual(project, before);
});

test("unchanged links preserve status and separate explicit verification still requires eligible records", () => {
  const project = fixture();
  const current = project.results[0];
  const unchanged = updateResultVerificationAndLinks(current, { sourceIds: [...current.sourceIds], methodIds: [...current.methodIds] }, project.sources, project.methods);
  assert.deepEqual(unchanged, current);
  const pending = { ...current, verification: "unverified" as const };
  assert.equal(updateResultVerificationAndLinks(pending, {}, project.sources, project.methods)?.verification, "unverified");
  assert.equal(updateResultVerificationAndLinks(pending, { verification: "verified" }, project.sources, project.methods)?.verification, "verified");
  assert.equal(updateResultVerificationAndLinks(pending, { verification: "verified" }, [], project.methods), null);
  assert.equal(updateResultVerificationAndLinks(pending, { verification: "verified" }, project.sources, []), null);
});

test("a combined link edit and verification request cannot verify the newly selected evidence", () => {
  const project = fixture();
  const result = updateResultVerificationAndLinks(project.results[0], { sourceIds: ["SRC-02"], verification: "verified" }, project.sources, project.methods);
  assert.ok(result);
  assert.equal(result.verification, "unverified");
  assert.equal(updateResultVerificationAndLinks(result, { verification: "verified" }, project.sources, project.methods)?.verification, "verified");
});

test("both synthetic demo-derived workflows retain recheck status across local reload, backup and export", () => {
  for (const demo of DEMO_PROJECTS) {
    const originalDemo = structuredClone(demo);
    const project = fixture(demo);
    const revised = updateResultVerificationAndLinks(project.results[0], { sourceIds: ["SRC-02"] }, project.sources, project.methods);
    assert.ok(revised);
    project.results = [revised];
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => { entries.set(key, value); },
      removeItem: (key: string) => { entries.delete(key); },
    };
    assert.equal(saveLocalProject(storage, project), true);
    const loaded = loadLocalProject(storage);
    assert.ok(loaded);
    const backup = buildLocalProjectBackup(loaded);
    assert.ok(backup);
    const restored = parseLocalProjectBackup(backup);
    assert.ok(restored);
    const draft = generateDraft(restored);
    const review = reviewProject(restored, draft);
    assert.equal(restored.results[0].verification, "unverified");
    assert.equal(review.verifiedResultCount, 0);
    const packet = buildSupervisorReviewMarkdown(restored, draft, review);
    assert.match(packet, /RES-01 — UNVERIFIED/);
    assert.match(packet, /250-page dissertation roadmap/);
    assert.match(packet, /Synthetic result-link test/);
    const markup = renderToStaticMarkup(createElement(EvidenceLedger, { project: restored, onChange: () => undefined }));
    assert.match(markup, /RES-01 · unverified/);
    assert.deepEqual(demo, originalDemo);
  }
});

test("the ledger explains that changing support requires a new result check", () => {
  const markup = renderToStaticMarkup(createElement(EvidenceLedger, { project: fixture(), onChange: () => undefined }));
  assert.match(markup, /Changing a result.*evidence or method links returns it to unverified/);
  assert.match(markup, /even when another linked source is still verified/);
});
