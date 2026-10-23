"use client";

import { startTransition, useMemo, useState } from "react";
import { DraftViewer } from "@/components/DraftViewer";
import { DissertationRoadmap } from "@/components/DissertationRoadmap";
import { EvidenceLedger } from "@/components/EvidenceLedger";
import { ExportActions } from "@/components/ExportActions";
import { GettingStartedGuide } from "@/components/GettingStartedGuide";
import { LiteratureEvidenceMatrix } from "@/components/LiteratureEvidenceMatrix";
import { ProjectEditor } from "@/components/ProjectEditor";
import { ProjectPicker } from "@/components/ProjectPicker";
import { PriorResearchLibrary } from "@/components/PriorResearchLibrary";
import { ResearchLandscape } from "@/components/ResearchLandscape";
import { ReviewPanel } from "@/components/ReviewPanel";
import { StudioHeader } from "@/components/StudioHeader";
import { SynopsisBuilder } from "@/components/SynopsisBuilder";
import { WritingCoach } from "@/components/WritingCoach";
import { DEFAULT_PROJECT_ID, DEMO_PROJECTS } from "@/lib/demo-projects";
import { generateDraft } from "@/lib/draft";
import { buildDraftMarkdown } from "@/lib/export";
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

function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ThesisStudio() {
  const [project, setProject] = useState<ThesisProject>(() => {
    const firstProject = DEMO_PROJECTS.find((item) => item.id === DEFAULT_PROJECT_ID);
    return firstProject ?? DEMO_PROJECTS[0];
  });
  const [exportStatus, setExportStatus] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);

  const draft = useMemo(() => generateDraft(project), [project]);
  const review = useMemo(() => reviewProject(project, draft), [project, draft]);
  const markdown = useMemo(() => buildDraftMarkdown(project, draft, review), [project, draft, review]);
  const projects = useMemo(
    () => (project.id === "local-plan" ? [...DEMO_PROJECTS, project] : DEMO_PROJECTS),
    [project],
  );

  function selectProject(nextProject: ThesisProject) {
    setIsSwitching(true);
    startTransition(() => {
      setProject(nextProject);
      setExportStatus("");
    });
    window.setTimeout(() => setIsSwitching(false), 150);
  }

  function createProject() {
    selectProject(createBlankProject());
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
    downloadMarkdown(markdown, `${safeName}-working-draft.md`);
    setExportStatus("Working draft downloaded.");
  }

  return (
    <main className="site-shell">
      <StudioHeader issueCount={review.issues.length} project={project} score={review.score} />
      <p className="demo-banner" role="note">
        <strong>Your thesis workspace:</strong> start with a topic, edit the generated planning text, and add your own verified sources. The included examples are synthetic; this tool does not replace academic supervision, ethics approval, or source verification.
      </p>
      <GettingStartedGuide project={project} review={review} />
      <ProjectPicker onCreate={createProject} onSelect={selectProject} projects={projects} selectedId={project.id} />
      <div aria-busy={isSwitching} className="studio-grid">
        <div className="workspace-stack">
          <ProjectEditor onChange={setProject} project={project} />
          <SynopsisBuilder onChange={setProject} project={project} />
          <DissertationRoadmap project={project} />
          <WritingCoach project={project} />
          <PriorResearchLibrary key={`${project.id}-prior-research`} onChange={setProject} project={project} />
          <EvidenceLedger onChange={setProject} project={project} />
          <LiteratureEvidenceMatrix onChange={setProject} project={project} />
        </div>
        <div className="draft-stack">
          <ResearchLandscape project={project} />
          <DraftViewer sections={draft} />
        </div>
        <ReviewPanel review={review} />
      </div>
      <ExportActions enabled={review.canExportAsDraft} onCopy={copyMarkdown} onDownload={downloadDraft} status={exportStatus} />
      <footer className="site-footer">
        <span>Version 0.2 • evidence-ledger workspace</span>
        <span>Evidence → method → result → claim</span>
      </footer>
    </main>
  );
}
