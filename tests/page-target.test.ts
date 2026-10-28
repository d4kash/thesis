import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DissertationRoadmap } from "../components/DissertationRoadmap";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { buildDissertationRoadmap, buildDissertationRoadmapMarkdown } from "../lib/dissertation-roadmap";
import { generateDraft } from "../lib/draft";
import { buildSupervisorReviewMarkdown } from "../lib/export";
import {
  buildLocalProjectBackup, isStoredLocalProject, loadLocalProject,
  LOCAL_PROJECT_STORAGE_KEY, parseLocalProjectBackup, saveLocalProject,
} from "../lib/local-project-storage";
import { reviewProject } from "../lib/quality";
import type { ThesisProject } from "../lib/thesis-types";

function fixture(pageTarget?: number): ThesisProject & { dissertationPageTarget?: number } {
  return {
    ...structuredClone(DEMO_PROJECTS[0]), id: "local-plan",
    demoLabel: "Synthetic page-budget fixture — not real research",
    ...(pageTarget === undefined ? {} : { dissertationPageTarget: pageTarget }),
  };
}

function memoryStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value); },
    removeItem: (key: string) => { entries.delete(key); },
  };
}

test("the saved project target drives page allocation and copied roadmap without mutation", () => {
  const project = fixture(250);
  const before = structuredClone(project);
  const roadmap = buildDissertationRoadmap(project);
  assert.equal(roadmap.pageTarget, 250);
  assert.equal(roadmap.items.reduce((sum, item) => sum + item.pageBudget, 0), 250);
  assert.match(buildDissertationRoadmapMarkdown(roadmap), /250-page dissertation roadmap/);
  assert.equal(buildDissertationRoadmap(project, 350).pageTarget, 350);
  assert.deepEqual(project, before);
});

test("the selector reflects the current project's target rather than a component-only default", () => {
  for (const target of [250, 350]) {
    const markup = renderToStaticMarkup(createElement(DissertationRoadmap, {
      project: fixture(target), onChange: () => undefined,
    }));
    assert.ok(markup.includes(`source-grounded ${target}-page plan`));
    assert.match(markup, new RegExp(`<button[^>]*aria-pressed="true"[^>]*>${target} pages</button>`));
    assert.doesNotMatch(markup, /<button[^>]*aria-pressed="true"[^>]*>300 pages<\/button>/);
  }
});

test("valid page targets survive local save, reload, backup and restore", () => {
  for (const target of [80, 200, 250, 300, 350, 600]) {
    const storage = memoryStorage();
    assert.equal(saveLocalProject(storage, fixture(target)), true);
    const loaded = loadLocalProject(storage);
    assert.ok(loaded);
    const backup = buildLocalProjectBackup(loaded);
    assert.ok(backup);
    const restored = parseLocalProjectBackup(backup);
    assert.ok(restored);
    assert.equal(buildDissertationRoadmap(restored).pageTarget, target);
    assert.equal(buildDissertationRoadmap(restored).items.reduce((sum, item) => sum + item.pageBudget, 0), target);
    assert.deepEqual(restored, loaded);
  }
});

test("legacy version-one backups without a page target keep the 300-page planning default", () => {
  const legacy = fixture();
  const backup = buildLocalProjectBackup(legacy);
  assert.ok(backup);
  assert.equal(JSON.parse(backup).version, 1);
  assert.equal(Object.hasOwn(JSON.parse(backup).project, "dissertationPageTarget"), false);
  const restored = parseLocalProjectBackup(backup);
  assert.ok(restored);
  assert.equal(buildDissertationRoadmap(restored).pageTarget, 300);
});

test("untrusted page targets are rejected without coercion or overwriting a valid saved project", () => {
  const storage = memoryStorage();
  assert.equal(saveLocalProject(storage, fixture(250)), true);
  const saved = storage.getItem(LOCAL_PROJECT_STORAGE_KEY);
  const envelope = JSON.parse(buildLocalProjectBackup(fixture(250))!);
  for (const target of [null, false, "250", "<script>300</script>", {}, [], 0, -1, 79, 601, 250.5, NaN, Infinity, -Infinity]) {
    const untrusted = { ...fixture(), dissertationPageTarget: target };
    assert.equal(isStoredLocalProject(untrusted), false, `reject ${JSON.stringify(target)}`);
    assert.equal(saveLocalProject(storage, untrusted as unknown as ThesisProject), false);
    assert.equal(storage.getItem(LOCAL_PROJECT_STORAGE_KEY), saved);
    assert.equal(buildLocalProjectBackup(untrusted as unknown as ThesisProject), null);
    assert.equal(parseLocalProjectBackup(JSON.stringify({ ...envelope, project: untrusted })), null);
    const corruptStorage = memoryStorage();
    corruptStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify(untrusted));
    assert.equal(loadLocalProject(corruptStorage), null);
  }
});

test("the supervisor packet includes the restored target and matching chapter budgets", () => {
  const restored = parseLocalProjectBackup(buildLocalProjectBackup(fixture(250))!);
  assert.ok(restored);
  const draft = generateDraft(restored);
  const packet = buildSupervisorReviewMarkdown(restored, draft, reviewProject(restored, draft));
  assert.match(packet, /250-page dissertation roadmap/);
  for (const item of buildDissertationRoadmap(restored, 250).items) {
    assert.ok(packet.includes(`${item.heading}: ~${item.pageBudget} pages`));
  }
  assert.match(packet, /not generated thesis content/);
  assert.match(packet, /SUPERVISOR NOTE/);
  assert.doesNotMatch(packet, /300-page dissertation roadmap/);
});

test("changing the page budget never grants evidence verification or creates research content", () => {
  const project = fixture();
  const updated = { ...project, dissertationPageTarget: 350 };
  const before = structuredClone(project);
  const draft = generateDraft(project);
  assert.deepEqual(generateDraft(updated), draft);
  assert.deepEqual(reviewProject(updated, draft), reviewProject(project, draft));
  const beforeRoadmap = buildDissertationRoadmap(project);
  const afterRoadmap = buildDissertationRoadmap(updated);
  assert.deepEqual(afterRoadmap.items.map(({ pageBudget: _budget, ...item }) => item),
    beforeRoadmap.items.map(({ pageBudget: _budget, ...item }) => item));
  assert.deepEqual(afterRoadmap.originalityChecks, beforeRoadmap.originalityChecks);
  assert.deepEqual(project, before);
});
