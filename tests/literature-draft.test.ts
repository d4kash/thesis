import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LiteratureEvidenceMatrix } from "../components/LiteratureEvidenceMatrix";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { generateDraft } from "../lib/draft";
import { buildDraftMarkdown } from "../lib/export";
import { reviseLiteratureEvidenceNote } from "../lib/literature-readiness";
import { buildLocalProjectBackup, parseLocalProjectBackup } from "../lib/local-project-storage";
import { escapeMarkdownInlineText } from "../lib/markdown";
import { reviewProject } from "../lib/quality";
import { reviseEvidenceSource } from "../lib/result-readiness";
import type { ThesisProject } from "../lib/thesis-types";

function fixture(demo = DEMO_PROJECTS[0]): ThesisProject {
  return {
    ...structuredClone(demo),
    id: "local-plan",
    demoLabel: "Synthetic test fixture — not real research",
    sources: [{
      id: "SRC-LIT-01",
      label: "Synthetic reference fixture — not a publication",
      locator: "local-fixture:synthetic-reference",
      checkedOn: "2020-01-01",
      kind: "literature-map",
      status: "verified",
      note: "Synthetic test fixture only; no copyrighted text or real research record.",
    }],
    literatureNotes: [{
      id: "LIT-01",
      sourceId: "SRC-LIT-01",
      claim: "This synthetic note describes a possible comparison structure for testing only.",
      locator: "Section 2.1",
      use: "background",
      status: "verified",
    }],
    results: [],
  };
}

function literature(project: ThesisProject) {
  const section = generateDraft(project).find((entry) => entry.id === "literature-plan");
  assert.ok(section);
  return section;
}

test("literature working draft includes checked own-words notes with their complete source trail", () => {
  const project = fixture();
  const before = structuredClone(project);
  const section = literature(project);
  assert.match(section.heading, /source-linked literature working draft/i);
  for (const value of [project.literatureNotes![0].claim, "LIT-01", "SRC-LIT-01", project.sources[0].label, "local-fixture:synthetic-reference", "Section 2.1", "2020-01-01"]) {
    assert.ok(section.body.includes(value), value);
  }
  assert.match(section.body, /not independently verified/i);
  assert.match(section.body, /not finished bibliography entries/i);
  assert.match(section.body, /Notes included: 1\. Notes awaiting re-check: 0/);
  assert.deepEqual(section.claimIds, ["LIT-01", "SRC-LIT-01"]);
  assert.deepEqual(project, before);
  const markup = renderToStaticMarkup(createElement(LiteratureEvidenceMatrix, { project, onChange() {} }));
  assert.match(markup, /section 3 of your working draft/);
});

test("literature notes are grouped by purpose with explicit empty sections and no invented synthesis", () => {
  const project = fixture();
  project.literatureNotes!.push({ ...project.literatureNotes![0], id: "LIT-02", use: "method", claim: "This second synthetic note describes a proposed method comparison, not findings." });
  const section = literature(project);
  assert.ok(section.body.indexOf("Background and definitions") < section.body.indexOf("Methods and approaches"));
  assert.match(section.body, /\[NEEDS INPUT\] Add a checked own-words note for comparison with earlier work/);
  assert.match(section.body, /Write your own comparison/);
  assert.match(section.body, /Do not claim a novel gap from missing notes alone/);
  assert.equal(section.claimIds.filter((id) => id === "SRC-LIT-01").length, 1);
});

test("reviewed notes stay outside the assembled literature section even with a verified source", () => {
  const project = fixture();
  project.literatureNotes![0].status = "reviewed";
  const section = literature(project);
  assert.equal(section.body.includes(project.literatureNotes![0].claim), false);
  assert.match(section.body, /Notes included: 0\. Notes awaiting re-check: 1/);
  assert.deepEqual(section.claimIds, []);
});

test("literature assembly rechecks source and note eligibility rather than trusting saved verified labels", () => {
  const invalidations: Array<(project: ThesisProject) => void> = [
    (project) => { project.sources = []; },
    (project) => { project.sources[0].status = "reviewed"; },
    (project) => { project.sources[0].locator = ""; },
    (project) => { project.sources[0].checkedOn = "9999-12-31"; },
    (project) => { project.sources[0].kind = "field-note"; },
    (project) => { project.literatureNotes![0].locator = "somewhere"; },
  ];
  for (const invalidate of invalidations) {
    const project = fixture();
    invalidate(project);
    const section = literature(project);
    assert.equal(section.body.includes(project.literatureNotes![0].claim), false);
    assert.match(section.body, /Notes included: 0\. Notes awaiting re-check: 1/);
    assert.deepEqual(section.claimIds, []);
  }
});

test("ambiguous duplicate note or source identifiers cannot enter a source-linked literature draft", () => {
  for (const duplicate of ["note", "source"]) {
    const project = fixture();
    if (duplicate === "note") project.literatureNotes!.push({ ...project.literatureNotes![0] });
    else project.sources.push({ ...project.sources[0] });
    const section = literature(project);
    assert.equal(section.body.includes(project.literatureNotes![0].claim), false);
    assert.deepEqual(section.claimIds, []);
    assert.match(section.body, /Notes included: 0/);
  }
});

test("editing a note or source removes it from the assembled draft until the researcher rechecks it", () => {
  const project = fixture();
  project.literatureNotes![0] = reviseLiteratureEvidenceNote(project.literatureNotes![0], { claim: "An edited synthetic own-words note needs a new source check." }, project.sources);
  assert.match(literature(project).body, /Notes included: 0/);
  project.literatureNotes![0].status = "verified";
  assert.ok(literature(project).body.includes(project.literatureNotes![0].claim));
  project.sources[0] = reviseEvidenceSource(project.sources[0], { locator: "local-fixture:revised-reference" });
  assert.match(literature(project).body, /Notes included: 0/);
});

test("both synthetic demo-derived workflows retain literature provenance through backup, review and export", () => {
  for (const demo of DEMO_PROJECTS) {
    const project = fixture(demo);
    const backup = buildLocalProjectBackup(project);
    assert.ok(backup);
    const restored = parseLocalProjectBackup(backup);
    assert.ok(restored);
    const draft = generateDraft(restored);
    const review = reviewProject(restored, draft);
    assert.equal(review.canExportAsDraft, true);
    assert.equal(draft.length, 8);
    assert.match(draft.find((entry) => entry.id === "results-status")!.body, /No results are stated/);
    const markdown = buildDraftMarkdown(restored, draft, review);
    assert.ok(markdown.includes(project.literatureNotes![0].claim));
    assert.match(markdown, /Original record locator: local-fixture:synthetic-reference/);
    assert.match(markdown, /Re-check location: Section 2\.1/);
    assert.match(markdown, /not independently verified/i);
  }
});

test("untrusted literature notes cannot inject HTML, links or forged review headings into the output", () => {
  const project = fixture();
  const attack = "A synthetic test note.\n# APPROVED\n<script>alert(1)</script> [click](javascript:alert(1))";
  project.literatureNotes![0].claim = attack;
  const section = literature(project);
  assert.ok(section.body.includes(escapeMarkdownInlineText(attack)));
  assert.equal(section.body.includes("\n# APPROVED"), false);
  assert.equal(section.body.includes("<script>"), false);
  assert.equal(section.body.includes("[click](javascript:"), false);
  const markup = renderToStaticMarkup(createElement("p", null, section.body));
  assert.equal(markup.includes("<script>"), false);
  assert.equal(markup.includes("href="), false);
});

test("untouched demonstrations keep missing literature explicit without creating citations or findings", () => {
  for (const project of DEMO_PROJECTS) {
    const section = literature(project);
    assert.match(section.body, /Notes included: 0/);
    assert.match(section.body, /\[NEEDS INPUT\]/);
    assert.deepEqual(section.claimIds, []);
    assert.equal(reviewProject(project, generateDraft(project)).canExportAsDraft, true);
  }
});
