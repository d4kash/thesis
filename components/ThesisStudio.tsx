"use client";

import { startTransition, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { DraftViewer } from "@/components/DraftViewer";
import { DissertationRoadmap } from "@/components/DissertationRoadmap";
import { EvidenceLedger } from "@/components/EvidenceLedger";
import { ExportActions } from "@/components/ExportActions";
import { GettingStartedGuide } from "@/components/GettingStartedGuide";
import { LiteratureEvidenceMatrix } from "@/components/LiteratureEvidenceMatrix";
import { MethodReadiness } from "@/components/MethodReadiness";
import { ProjectEditor } from "@/components/ProjectEditor";
import { ProjectPicker } from "@/components/ProjectPicker";
import { PriorResearchLibrary } from "@/components/PriorResearchLibrary";
import { ResearchLandscape } from "@/components/ResearchLandscape";
import { ResearchToolkit } from "@/components/ResearchToolkit";
import { ReviewPanel } from "@/components/ReviewPanel";
import { StudioHeader } from "@/components/StudioHeader";
import { SynopsisBuilder } from "@/components/SynopsisBuilder";
import { WritingCoach } from "@/components/WritingCoach";
import { DEFAULT_PROJECT_ID, DEMO_PROJECTS } from "@/lib/demo-projects";
import { generateDraft } from "@/lib/draft";
import { buildDraftMarkdown, buildSupervisorReviewMarkdown } from "@/lib/export";
import {
  clearLocalProject,
  buildLocalProjectBackup,
  loadLocalProject,
  MAX_LOCAL_PROJECT_BACKUP_BYTES,
  parseLocalProjectBackup,
  saveLocalProject,
  type LocalProjectStorage,
} from "@/lib/local-project-storage";
import { reviewProject } from "@/lib/quality";
import type { ThesisProject } from "@/lib/thesis-types";

function createBlankProject(): ThesisProject {
  return {
    id: "local-plan",
    demoLabel: "Your working project • add verified sources before using claims",
    title: "",
    discipline: "",
    researchQuestion: "",
    scope: "",
    objectives: [
      { id: "OBJ-01", text: "State one measurable research objective." },
    ],
    methods: [
      { id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Describe a method that can be audited and approved." },
    ],
    priorResearch: [],
    sources: [],
    literatureNotes: [],
    results: [],
  };
}

function downloadText(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function browserLocalStorage(): LocalProjectStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function ThesisStudio() {
  const [project, setProject] = useState<ThesisProject>(() => {
    const firstProject = DEMO_PROJECTS.find((item) => item.id === DEFAULT_PROJECT_ID);
    return firstProject ?? DEMO_PROJECTS[0];
  });
  const [localProject, setLocalProject] = useState<ThesisProject | null>(null);
  const [hasLoadedLocalProject, setHasLoadedLocalProject] = useState(false);
  const [localSaveStatus, setLocalSaveStatus] = useState<"saving" | "saved" | "unavailable">("saving");
  const [exportStatus, setExportStatus] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storage = browserLocalStorage();
    const savedProject = storage ? loadLocalProject(storage) : null;
    if (savedProject) {
      setLocalProject(savedProject);
      setProject(savedProject);
    }
    setHasLoadedLocalProject(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedLocalProject || !localProject) return;
    const storage = browserLocalStorage();
    setLocalSaveStatus(storage && saveLocalProject(storage, localProject) ? "saved" : "unavailable");
  }, [hasLoadedLocalProject, localProject]);

  const draft = useMemo(() => generateDraft(project), [project]);
  const review = useMemo(() => reviewProject(project, draft), [project, draft]);
  const markdown = useMemo(() => buildDraftMarkdown(project, draft, review), [project, draft, review]);
  const supervisorReview = useMemo(() => buildSupervisorReviewMarkdown(project, draft, review), [project, draft, review]);
  const projects = useMemo(
    () => (localProject ? [...DEMO_PROJECTS, localProject] : DEMO_PROJECTS),
    [localProject],
  );

  function updateProject(nextProject: ThesisProject) {
    setProject(nextProject);
    if (nextProject.id === "local-plan") {
      setLocalSaveStatus("saving");
      setLocalProject(nextProject);
    }
  }

  function selectProject(nextProject: ThesisProject) {
    setIsSwitching(true);
    startTransition(() => {
      updateProject(nextProject);
      setExportStatus("");
    });
    window.setTimeout(() => setIsSwitching(false), 150);
  }

  function createProject() {
    if (localProject && !window.confirm("Start a new local topic? This replaces the working project saved in this browser.")) return;
    selectProject(createBlankProject());
  }

  function clearSavedProject() {
    if (!window.confirm("Clear the working project saved in this browser? This cannot be undone.")) return;

    const storage = browserLocalStorage();
    if (!storage || !clearLocalProject(storage)) {
      setExportStatus("Browser storage could not be cleared. The working project remains open in this tab.");
      return;
    }

    setLocalProject(null);
    selectProject(DEMO_PROJECTS.find((item) => item.id === DEFAULT_PROJECT_ID) ?? DEMO_PROJECTS[0]);
    setExportStatus("Saved local project cleared from this browser.");
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      setExportStatus("Markdown copied.");
    } catch {
      setExportStatus("Copy was blocked by the browser. Use the download instead.");
    }
  }

  function downloadDraft() {
    const safeName = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "thesis-draft";
    downloadText(markdown, `${safeName}-working-draft.md`, "text/markdown;charset=utf-8");
    setExportStatus("Working draft downloaded.");
  }

  function downloadSupervisorReview() {
    const safeName = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "thesis-review";
    downloadText(supervisorReview, `${safeName}-supervisor-review.md`, "text/markdown;charset=utf-8");
    setExportStatus("Supervisor review packet downloaded.");
  }

  function downloadLocalProjectBackup() {
    if (!localProject) return;

    const backup = buildLocalProjectBackup(localProject);
    if (!backup) {
      setExportStatus("The local project is not valid or is larger than the 250 KB backup limit. Keep records and notes concise; source files and copied thesis text are not part of a backup.");
      return;
    }

    const safeName = localProject.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "thesis-research-plan";
    downloadText(backup, `${safeName}-research-plan-backup.json`, "application/json;charset=utf-8");
    setExportStatus("Local research-plan backup downloaded. It contains your project entries and notes, not external source files.");
  }

  function chooseLocalProjectBackup() {
    backupInputRef.current?.click();
  }

  async function restoreLocalProjectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_LOCAL_PROJECT_BACKUP_BYTES) {
      setExportStatus("That backup is larger than 250 KB. Use a Thesis Studio research-plan backup containing records and notes, not source files.");
      return;
    }

    try {
      const restoredProject = parseLocalProjectBackup(await file.text());
      if (!restoredProject) {
        setExportStatus("That file is not a valid Thesis Studio local research-plan backup. Nothing was imported.");
        return;
      }

      if (localProject && !window.confirm("Restore this backup and replace the local working project saved in this browser?")) return;

      setIsSwitching(true);
      startTransition(() => {
        updateProject(restoredProject);
        setExportStatus("Research-plan backup restored locally. Recheck every source record before relying on it.");
      });
      window.setTimeout(() => setIsSwitching(false), 150);
    } catch {
      setExportStatus("The backup could not be read. Nothing was imported.");
    }
  }

  return (
    <main className="site-shell">
      <StudioHeader issueCount={review.issues.length} project={project} score={review.score} />
      <p className="demo-banner" role="note">
        <strong>Your thesis workspace:</strong> start with a topic, edit the generated planning text, and add your own verified sources. The included examples are synthetic; this tool does not replace academic supervision, ethics approval, or source verification.
      </p>
      <GettingStartedGuide project={project} review={review} />
      <ProjectPicker onCreate={createProject} onSelect={selectProject} projects={projects} selectedId={project.id} />
      <aside className="local-project-notice" role="status">
        {localProject ? (
          <span>
            {localSaveStatus === "unavailable"
              ? <><strong>Not saved:</strong> browser storage is unavailable, so this working project lasts only for this visit. Download anything you need before leaving; nothing has been uploaded.</>
              : localSaveStatus === "saving"
                ? <><strong>Saving locally:</strong> your working topic, notes, and planning records are being saved in this browser only.</>
                : <><strong>Saved locally:</strong> your working topic, notes, and planning records stay in this browser only. This autosave does not upload source text or research files.</>}
          </span>
        ) : <span><strong>Local backup:</strong> restore a previous Thesis Studio research-plan JSON file in this browser. Only validated project records and short notes are accepted; source PDFs or copied thesis text are never imported.</span>}
        <div className="local-project-notice__actions">
          {localProject ? <button className="button button--secondary button--compact" onClick={downloadLocalProjectBackup} type="button">Download local backup</button> : null}
          <button className="button button--secondary button--compact" onClick={chooseLocalProjectBackup} type="button">Restore local backup</button>
          {localProject ? <button className="button button--secondary button--compact" onClick={clearSavedProject} type="button">Clear working project</button> : null}
        </div>
        <input accept="application/json,.json" aria-label="Restore a local Thesis Studio research-plan backup" hidden onChange={(event) => void restoreLocalProjectBackup(event)} ref={backupInputRef} type="file" />
      </aside>
      <div aria-busy={isSwitching} className="studio-grid">
        <div className="workspace-stack">
          <ProjectEditor onChange={updateProject} project={project} />
          <SynopsisBuilder onChange={updateProject} project={project} />
          <MethodReadiness onChange={updateProject} project={project} />
          <DissertationRoadmap project={project} />
          <WritingCoach project={project} />
          <ResearchToolkit project={project} />
          <PriorResearchLibrary key={`${project.id}-prior-research`} onChange={updateProject} project={project} />
          <EvidenceLedger onChange={updateProject} project={project} />
          <LiteratureEvidenceMatrix onChange={updateProject} project={project} />
        </div>
        <div className="draft-stack">
          <ResearchLandscape project={project} />
          <DraftViewer sections={draft} />
        </div>
        <ReviewPanel review={review} />
      </div>
      <ExportActions enabled={review.canExportAsDraft} onCopy={copyMarkdown} onDownload={downloadDraft} onSupervisorDownload={downloadSupervisorReview} status={exportStatus} />
      <footer className="site-footer">
        <span>Version 0.2 • evidence-ledger workspace</span>
        <span>Evidence → method → result → claim</span>
      </footer>
    </main>
  );
}
