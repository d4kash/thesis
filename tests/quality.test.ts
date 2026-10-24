import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExportActions } from "../components/ExportActions";
import { DissertationRoadmap } from "../components/DissertationRoadmap";
import { EvidenceLedger } from "../components/EvidenceLedger";
import { GettingStartedGuide } from "../components/GettingStartedGuide";
import { LiteratureEvidenceMatrix } from "../components/LiteratureEvidenceMatrix";
import { MethodReadiness } from "../components/MethodReadiness";
import { PriorResearchLibrary } from "../components/PriorResearchLibrary";
import { ResearchToolkit } from "../components/ResearchToolkit";
import { SynopsisBuilder } from "../components/SynopsisBuilder";
import { DEMO_PROJECTS } from "../lib/demo-projects";
import { generateDraft } from "../lib/draft";
import { buildDraftMarkdown, buildSupervisorReviewMarkdown } from "../lib/export";
import { buildResearchLandscape } from "../lib/research-landscape";
import { buildResearchSearchPhrase, buildResearchToolkit } from "../lib/research-toolkit";
import { buildDissertationRoadmap, buildDissertationRoadmapMarkdown } from "../lib/dissertation-roadmap";
import { createTopicStarter, hasTopic } from "../lib/topic-starter";
import { reviewProject } from "../lib/quality";
import { canMarkLiteratureNoteVerified, normalizeLiteratureVerification } from "../lib/literature-readiness";
import { canMarkPriorResearchVerified, normalizePriorResearchVerification } from "../lib/prior-research-readiness";
import { canMarkResultVerified, isUsableVerifiedSource, normalizeSourceVerification } from "../lib/result-readiness";
import { extractPublicSourcePreview, parseSupportedPublicSourceUrl, PublicSourceUrlError } from "../lib/public-source-preview";
import { buildSynopsis, buildSynopsisMarkdown } from "../lib/synopsis";
import { buildStudentWritingStarter, WRITING_PHRASE_GROUPS } from "../lib/writing-support";

const VERIFIED_SOURCE_CHECK_DATE = "2026-10-24";

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
  assert.deepEqual(landscape.candidateGaps.map((gap) => gap.recordId), ["PRV-01"]);
  assert.match(landscape.prompts.join(" "), /candidate gap/i);
});

test("a placeholder brief does not surface generic prior-work gaps", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    title: "Untitled research plan",
    discipline: "Choose a discipline",
    researchQuestion: "What focused question will this project investigate?",
    scope: "Define what the project will cover, what it will not cover, and what evidence it needs.",
    priorResearch: [{
      id: "PRV-09",
      title: "Generic project question note",
      citation: "Local review note",
      context: "A generic project research question was discussed.",
      researchQuestion: "What question should a project investigate?",
      methodology: "Planning discussion only.",
      findings: "",
      limitations: "Generic limitation that is not topic-specific.",
      status: "reviewed" as const,
    }],
  };
  const landscape = buildResearchLandscape(project);

  assert.deepEqual(landscape.topicTerms, []);
  assert.deepEqual(landscape.candidateGaps, []);
});

test("a verified prior work without a trace blocks export", () => {
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

  const issue = review.issues.find((item) => item.id === "thin-verified-prior-research-PRV-01");

  assert.equal(issue?.severity, "critical");
  assert.equal(review.canExportAsDraft, false);
});

test("an incomplete prior-work record cannot retain verified status", () => {
  const incompleteRecord = {
    ...DEMO_PROJECTS[0].priorResearch[0],
    status: "verified" as const,
    citation: "",
    context: "Short",
    researchQuestion: "",
    methodology: "",
    findings: "",
    limitations: "",
  };
  const verifiedRecord = {
    ...DEMO_PROJECTS[0].priorResearch[0],
    status: "verified" as const,
    citation: "Repository record: example/verified-prior-work",
    context: "Checked original research context and scope recorded from the public source.",
  };

  assert.equal(canMarkPriorResearchVerified(incompleteRecord), false);
  assert.equal(normalizePriorResearchVerification(incompleteRecord).status, "reviewed");
  assert.equal(canMarkPriorResearchVerified(verifiedRecord), true);
  assert.equal(normalizePriorResearchVerification(verifiedRecord).status, "verified");
});

test("a verified literature note returns to reviewed when its source loses a usable trace", () => {
  const source = {
    ...DEMO_PROJECTS[0].sources[1],
    status: "verified" as const,
    label: "Checked scholarly literature record",
    locator: "https://records.example.test/literature/SRC-02",
    checkedOn: VERIFIED_SOURCE_CHECK_DATE,
    note: "Checked source metadata, relevance, and original location before using this note for literature planning.",
  };
  const note = {
    id: "LIT-01",
    sourceId: source.id,
    claim: "The source provides a scoped comparison point for the planned literature review.",
    locator: "section 2.1",
    use: "comparison" as const,
    status: "verified" as const,
  };

  assert.equal(canMarkLiteratureNoteVerified(note, [source]), true);
  assert.equal(canMarkLiteratureNoteVerified(note, [{ ...source, status: "reviewed" }]), false);
  assert.equal(normalizeLiteratureVerification(note, [{ ...source, status: "reviewed" }]).status, "reviewed");
});

test("a verified source needs an original-record locator before it can support claims", () => {
  const source = {
    ...DEMO_PROJECTS[0].sources[0],
    status: "verified" as const,
    locator: "",
    checkedOn: VERIFIED_SOURCE_CHECK_DATE,
    note: "Researcher checked the record provenance, access details, and relevance for this evidence plan.",
  };
  const tracedSource = {
    ...source,
    locator: "https://records.example.test/datasets/SRC-01",
  };
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [source],
    results: [{
      id: "RES-01",
      label: "Synthetic analysis summary",
      verification: "verified" as const,
      note: "Synthetic test record used only to check traceability safeguards.",
      sourceIds: ["SRC-01"],
      methodIds: ["MTH-01"],
    }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(isUsableVerifiedSource(source), false);
  assert.equal(isUsableVerifiedSource(tracedSource), true);
  assert.equal(normalizeSourceVerification(source).status, "reviewed");
  assert.equal(normalizeSourceVerification(tracedSource).status, "verified");
  assert.equal(review.issues.some((item) => item.id === "thin-verified-source-SRC-01"), true);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
});

test("a verified source needs a valid researcher check date before it can support claims", () => {
  const source = {
    ...DEMO_PROJECTS[0].sources[0],
    status: "verified" as const,
    locator: "https://records.example.test/datasets/SRC-01",
    checkedOn: "2026-02-30",
    note: "Researcher checked the record provenance, access details, and relevance for this evidence plan.",
  };
  const checkedSource = {
    ...source,
    checkedOn: VERIFIED_SOURCE_CHECK_DATE,
  };
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [source],
    results: [{
      id: "RES-01",
      label: "Synthetic analysis summary",
      verification: "verified" as const,
      note: "Synthetic test record used only to check traceability safeguards.",
      sourceIds: ["SRC-01"],
      methodIds: ["MTH-01"],
    }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(isUsableVerifiedSource(source), false);
  assert.equal(isUsableVerifiedSource(checkedSource), true);
  assert.equal(normalizeSourceVerification(source).status, "reviewed");
  assert.equal(review.issues.some((item) => item.id === "thin-verified-source-SRC-01"), true);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
});

test("saved prior-research records can be corrected in place", () => {
  const markup = renderToStaticMarkup(
    createElement(PriorResearchLibrary, { project: DEMO_PROJECTS[0], onChange: () => undefined }),
  );

  assert.match(markup, /Edit PRV-01 title/);
  assert.match(markup, /Edit PRV-01 citation/);
  assert.match(markup, /Edit PRV-01 limitations/);
  assert.match(markup, /Preview a public source/);
  assert.match(markup, /reads only the public page metadata/);
  assert.match(markup, /returns it to reviewed/i);
});

test("the start guide gives a plain next step for a new student", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    title: "",
    researchQuestion: "",
    priorResearch: [],
  };
  const review = reviewProject(project, generateDraft(project));
  const markup = renderToStaticMarkup(createElement(GettingStartedGuide, { project, review }));

  assert.match(markup, /Six simple steps to use Thesis Studio/);
  assert.match(markup, /Do this next:/);
  assert.match(markup, /Name your topic/);
  assert.match(markup, /Build your synopsis/);
  assert.match(markup, /Find source records/);
});

test("the research toolkit creates a topic-only discovery path and preserves a source boundary", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    scope: "Private scope notes must never be sent to an external discovery site.",
  };
  const searchPhrase = buildResearchSearchPhrase(project);
  const toolkit = buildResearchToolkit(project);
  const crossref = toolkit.resources.find((resource) => resource.id === "crossref");
  const markup = renderToStaticMarkup(createElement(ResearchToolkit, { project }));

  assert.match(searchPhrase, /Explainable Leaf-Condition Classification/i);
  assert.doesNotMatch(searchPhrase, /Private scope notes/i);
  assert.match(decodeURIComponent(crossref?.href ?? ""), /Explainable Leaf-Condition Classification/i);
  assert.doesNotMatch(decodeURIComponent(crossref?.href ?? ""), /Private scope notes/i);
  assert.deepEqual(toolkit.resources.map((resource) => resource.id), ["crossref", "openalex", "doaj", "shodhganga", "zotero", "zoterobib"]);
  assert.match(markup, /FREE RESEARCH TOOLKIT/);
  assert.match(markup, /Crossref Metadata Search/);
  assert.match(markup, /does not send your notes, PDFs, or source text/i);
  assert.match(markup, /target="_blank"/);
});

test("the research toolkit waits for a usable topic before creating a search phrase", () => {
  const project = { ...DEMO_PROJECTS[0], title: "", researchQuestion: "" };

  assert.equal(buildResearchSearchPhrase(project), "");
  assert.equal(buildResearchToolkit(project).resources.find((resource) => resource.id === "crossref")?.href, "https://search.crossref.org/");
});

test("a synopsis stays an editable proposal and marks missing entries instead of inventing them", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    researchQuestion: "What focused question will this project investigate?",
    scope: "Define what the project will cover, what it will not cover, and what evidence it needs.",
    objectives: [{ id: "OBJ-01", text: "State one measurable research objective." }],
    methods: [{ id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Describe a method that can be audited and approved." }],
    synopsis: {
      problemStatement: "",
      anticipatedContribution: "",
      ethicsAndPermissions: "",
    },
  };
  const synopsis = buildSynopsis(project);
  const markdown = buildSynopsisMarkdown(project);

  assert.equal(synopsis.isReadyForSupervisorReview, false);
  assert.match(synopsis.sections.find((section) => section.id === "problem")?.value ?? "", /\[NEEDS INPUT\]/);
  assert.match(markdown, /editable research-planning synopsis/i);
  assert.match(markdown, /does not report findings, participant data, ethics approval, or verified citations/i);
});

test("a complete synopsis uses only the researcher-provided project details", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    synopsis: {
      problemStatement: "Researchers need a transparent plan for examining whether image explanations attend to relevant leaf regions in a defined classification setting.",
      anticipatedContribution: "The proposed work may help clarify how an auditable explanation-evaluation protocol can be designed for the selected image context.",
      ethicsAndPermissions: "The proposal will check dataset licenses, provenance, and institutional requirements before collecting or using any additional data.",
    },
  };
  const synopsis = buildSynopsis(project);
  const markdown = buildSynopsisMarkdown(project);

  assert.equal(synopsis.isReadyForSupervisorReview, true);
  assert.equal(synopsis.completeCount, synopsis.totalCount);
  assert.match(markdown, /transparent plan for examining/i);
  assert.match(markdown, /may help clarify/i);
  assert.match(markdown, /check dataset licenses/i);
  assert.match(markdown, /does not report an accuracy value, clinical advice, or completed experiment/i);
  assert.doesNotMatch(markdown, /\bproves\b|\bdemonstrates\b/i);
});

test("the synopsis builder gives students plain prompts and preserves an evidence boundary", () => {
  const markup = renderToStaticMarkup(
    createElement(SynopsisBuilder, { project: DEMO_PROJECTS[0], onChange: () => undefined }),
  );

  assert.match(markup, /Build your synopsis, one answer at a time/);
  assert.match(markup, /What problem will this research address\?/);
  assert.match(markup, /What ethics, permissions, or data-protection steps are needed\?/);
  assert.match(markup, /This working synopsis does not state findings/i);
});

test("the long-form roadmap budgets pages without inventing thesis content or results", () => {
  const planningProject = { ...DEMO_PROJECTS[0], results: [] };
  const roadmap = buildDissertationRoadmap(planningProject);
  const shorterRoadmap = buildDissertationRoadmap(planningProject, 250);
  const resultItem = roadmap.items.find((item) => item.id === "results");

  assert.equal(roadmap.items.reduce((total, item) => total + item.pageBudget, 0), 300);
  assert.equal(shorterRoadmap.items.reduce((total, item) => total + item.pageBudget, 0), 250);
  assert.equal(resultItem?.status, "needs-data");
  assert.match(resultItem?.nextStep ?? "", /NEEDS DATA/);
  assert.match(buildDissertationRoadmapMarkdown(roadmap), /not generated thesis content/i);
  assert.match(buildDissertationRoadmapMarkdown(roadmap), /do not add filler, unverified claims, or copied text/i);
});

test("the chapter plan links verified local records without inventing literature or results", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{
      id: "SRC-01",
      label: "Synthetic verified planning source record",
      locator: "https://records.example.test/literature/SRC-01",
      checkedOn: VERIFIED_SOURCE_CHECK_DATE,
      kind: "literature-map" as const,
      status: "verified" as const,
      note: "Synthetic test record with a checked source location and relevance note for planning only.",
    }, {
      id: "SRC-02",
      label: "Synthetic verified analysis record source",
      locator: "https://records.example.test/datasets/SRC-02",
      checkedOn: VERIFIED_SOURCE_CHECK_DATE,
      kind: "dataset" as const,
      status: "verified" as const,
      note: "Synthetic test dataset record used only to verify evidence-link planning behavior.",
    }],
    literatureNotes: [
      {
        id: "LIT-01",
        sourceId: "SRC-01",
        claim: "The source supports documenting a transparent method rationale before any data collection begins.",
        locator: "Section 3, p. 12",
        use: "method" as const,
        status: "verified" as const,
      },
      {
        id: "LIT-02",
        sourceId: "SRC-01",
        claim: "The source identifies a limitation that can be checked when comparing later verified results.",
        locator: "Discussion, p. 18",
        use: "comparison" as const,
        status: "verified" as const,
      },
    ],
    results: [{
      id: "RES-01",
      label: "Synthetic verified analysis record",
      verification: "verified" as const,
      note: "Synthetic test record used only to verify result-to-source planning behavior.",
      sourceIds: ["SRC-02"],
      methodIds: ["MTH-01"],
    }],
  };
  const roadmap = buildDissertationRoadmap(project);
  const literature = roadmap.items.find((item) => item.id === "literature-review");
  const methodology = roadmap.items.find((item) => item.id === "methodology");
  const discussion = roadmap.items.find((item) => item.id === "discussion");

  assert.equal(literature?.evidence.status, "tracked");
  assert.deepEqual(literature?.evidence.recordIds, ["LIT-01", "LIT-02"]);
  assert.deepEqual(methodology?.evidence.recordIds.slice(0, 1), ["LIT-01"]);
  assert.deepEqual(discussion?.evidence.recordIds, ["RES-01", "LIT-02"]);
  assert.match(buildDissertationRoadmapMarkdown(roadmap), /source-linked chapter plan/i);
  assert.match(buildDissertationRoadmapMarkdown(roadmap), /Linked records: LIT-01, LIT-02/);
});

test("the long-form roadmap makes citation readiness explicit and rejects plagiarism-removal framing", () => {
  const markup = renderToStaticMarkup(createElement(DissertationRoadmap, { project: DEMO_PROJECTS[0] }));

  assert.match(markup, /Build a source-grounded 300-page plan/);
  assert.match(markup, /Evidence for this chapter/);
  assert.match(markup, /NEEDS SOURCE/);
  assert.match(markup, /Originality and citation readiness/);
  assert.match(markup, /cannot remove plagiarism/i);
  assert.match(markup, /institution.*required similarity review/i);
});

test("public source preview accepts only approved HTTPS scholarly record hosts", () => {
  assert.equal(parseSupportedPublicSourceUrl("https://shodhganga.inflibnet.ac.in/handle/10603/724582").hostname, "shodhganga.inflibnet.ac.in");
  assert.equal(parseSupportedPublicSourceUrl("https://pubs.rsc.org/en/content/articlelanding/2019/nj/c9nj02154j").hostname, "pubs.rsc.org");
  assert.throws(() => parseSupportedPublicSourceUrl("http://pubs.rsc.org/article"), PublicSourceUrlError);
  assert.throws(() => parseSupportedPublicSourceUrl("https://example.org/article"), PublicSourceUrlError);
});

test("public source preview keeps metadata separate from student research notes", () => {
  const preview = extractPublicSourcePreview(`
    <html><head>
      <meta name="citation_title" content="Transparent crop diagnosis planning" />
      <meta name="citation_author" content="A. Researcher" />
      <meta name="citation_doi" content="10.1234/example.1" />
      <meta name="description" content="A public record summary for readers." />
    </head><title>Fallback title</title></html>
  `, "https://shodhganga.inflibnet.ac.in/handle/10603/724582");

  assert.equal(preview.title, "Transparent crop diagnosis planning");
  assert.deepEqual(preview.authors, ["A. Researcher"]);
  assert.equal(preview.doi, "10.1234/example.1");
  assert.match(preview.recordSuggestion, /handle\/10603\/724582/);
  assert.doesNotMatch(preview.recordSuggestion, /finding|limitation/i);
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

test("a student writing starter creates an editable plan from the supplied topic only", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    title: "Sustainable disease diagnosis for flowering plants",
    researchQuestion: "How can image evidence support transparent diagnosis planning?",
    scope: "A planning draft for selected flowering plants, without completed experiments or clinical advice.",
  };
  const starter = buildStudentWritingStarter(project);

  assert.ok(starter);
  assert.match(starter.paragraph, /Sustainable disease diagnosis for flowering plants/);
  assert.match(starter.paragraph, /How can image evidence support transparent diagnosis planning/);
  assert.match(starter.paragraph, /describes a plan, not a result/i);
  assert.doesNotMatch(starter.paragraph, /proves|improves|demonstrates/i);
});

test("the writing helper does not generate a paragraph without a real topic and offers cautious phrase choices", () => {
  const blankProject = {
    ...DEMO_PROJECTS[0],
    title: "Untitled research plan",
  };

  assert.equal(buildStudentWritingStarter(blankProject), null);
  assert.equal(WRITING_PHRASE_GROUPS.every((group) => group.options.length > 0), true);
  assert.match(WRITING_PHRASE_GROUPS.find((group) => group.id === "evidence")?.options.join(" ") ?? "", /suggests|consistent|verification/i);
});

test("a blank or placeholder project cannot be exported as a generic draft", () => {
  const blankProject = {
    ...DEMO_PROJECTS[0],
    title: "",
    discipline: "",
    researchQuestion: "",
    scope: "",
    priorResearch: [],
    sources: [],
    results: [],
  };
  const placeholderProject = { ...blankProject, title: "Untitled research plan" };

  for (const project of [blankProject, placeholderProject]) {
    const review = reviewProject(project, generateDraft(project));
    assert.equal(review.canExportAsDraft, false);
    assert.equal(review.issues.some((item) => item.id === "missing-topic"), true);
  }
});

test("a punctuation-only title cannot act as a thesis topic", () => {
  const punctuationOnlyProject = {
    ...DEMO_PROJECTS[0],
    title: "---",
    discipline: "",
    researchQuestion: "",
    scope: "",
    priorResearch: [],
    sources: [],
    results: [],
  };
  const nonEnglishTopicProject = { ...punctuationOnlyProject, title: "फूलों की फसल का अध्ययन" };
  const review = reviewProject(punctuationOnlyProject, generateDraft(punctuationOnlyProject));

  assert.equal(hasTopic(punctuationOnlyProject), false);
  assert.equal(hasTopic(nonEnglishTopicProject), true);
  assert.equal(buildStudentWritingStarter(punctuationOnlyProject), null);
  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "missing-topic"), true);
});

test("both copy and download controls respect a structural export hold", () => {
  const blockedMarkup = renderToStaticMarkup(
    createElement(ExportActions, { enabled: false, onCopy: () => undefined, onDownload: () => undefined, onSupervisorDownload: () => undefined, status: "" }),
  );
  const allowedMarkup = renderToStaticMarkup(
    createElement(ExportActions, { enabled: true, onCopy: () => undefined, onDownload: () => undefined, onSupervisorDownload: () => undefined, status: "" }),
  );
  const blockedCopy = blockedMarkup.match(/<button[^>]*>Copy draft text<\/button>/)?.[0] ?? "";
  const blockedDownload = blockedMarkup.match(/<button[^>]*>Download working draft<\/button>/)?.[0] ?? "";
  const allowedCopy = allowedMarkup.match(/<button[^>]*>Copy draft text<\/button>/)?.[0] ?? "";
  const allowedDownload = allowedMarkup.match(/<button[^>]*>Download working draft<\/button>/)?.[0] ?? "";
  const blockedSupervisorDownload = blockedMarkup.match(/<button[^>]*>Download supervisor review packet<\/button>/)?.[0] ?? "";

  assert.match(blockedCopy, /disabled=""/);
  assert.match(blockedDownload, /disabled=""/);
  assert.doesNotMatch(allowedCopy, /disabled=""/);
  assert.doesNotMatch(allowedDownload, /disabled=""/);
  assert.doesNotMatch(blockedSupervisorDownload, /disabled=""/);
});

test("the supervisor review packet keeps citation checks editable without generating citations", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Researcher checked the dataset provenance, licence, and relevance for this planning record." }],
    literatureNotes: [{
      id: "LIT-01",
      sourceId: "SRC-01",
      claim: "The researcher recorded an own-words planning note after checking the original record.",
      locator: "Dataset documentation, section 2",
      use: "method" as const,
      status: "verified" as const,
    }],
  };
  const draft = generateDraft(project);
  const review = reviewProject(project, draft);
  const packet = buildSupervisorReviewMarkdown(project, draft, review);

  assert.match(packet, /Supervisor review packet/);
  assert.match(packet, /No citation is generated by this packet/);
  assert.match(packet, /SRC-01/);
  assert.match(packet, /Original record locator: https:\/\/records\.example\.test\/datasets\/SRC-01/);
  assert.match(packet, /Researcher check date: 2026-10-24/);
  assert.match(packet, /LIT-01/);
  assert.match(packet, /\[SUPERVISOR NOTE\]/);
  assert.match(packet, /not a thesis, a citation generator, an ethics approval, or an originality certificate/i);
});

test("a verified result must link to a verified evidence record", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: [], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
});

test("a verified result must link to a planned method", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01"], methodIds: [] }],
  };
  const review = reviewProject(project, generateDraft(project));
  const roadmap = buildDissertationRoadmap(project);

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-method-traceability-RES-01"), true);
  assert.equal(roadmap.items.find((item) => item.id === "results")?.status, "needs-data");
});

test("a verified result needs a method-specific data and ethics plan", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    methods: DEMO_PROJECTS[0].methods.map((method) => (
      method.id === "MTH-01" ? { ...method, dataAndEthicsPlan: "" } : method
    )),
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));
  const roadmap = buildDissertationRoadmap(project);

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.verifiedResultCount, 0);
  assert.equal(review.issues.some((item) => item.id === "result-method-readiness-RES-01"), true);
  assert.equal(roadmap.items.find((item) => item.id === "results")?.status, "needs-data");
});

test("the result status gate requires a documented safeguard plan before verification", () => {
  const sources = [{
    ...DEMO_PROJECTS[0].sources[0],
    status: "verified" as const,
    locator: "https://records.example.test/datasets/SRC-01",
    checkedOn: VERIFIED_SOURCE_CHECK_DATE,
    note: "Verified dataset record with license, access date, and relevance notes.",
  }];
  const result = {
    id: "RES-01",
    label: "Held-out evaluation summary",
    verification: "verified" as const,
    note: "A traceable summary was recorded from the documented analysis record.",
    sourceIds: ["SRC-01"],
    methodIds: ["MTH-01"],
  };
  const methodsWithoutPlan = DEMO_PROJECTS[0].methods.map((method) => (
    method.id === "MTH-01" ? { ...method, dataAndEthicsPlan: "" } : method
  ));

  assert.equal(canMarkResultVerified(result, sources, methodsWithoutPlan), false);
  assert.equal(canMarkResultVerified(result, sources, DEMO_PROJECTS[0].methods), true);
});

test("a verified result with a verified evidence link can remain a working draft", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, true);
  assert.equal(review.verifiedResultCount, 1);
});

test("a verified result cannot use a literature source as its direct evidence", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{
      id: "SRC-01",
      label: "Verified literature record for result discussion",
      locator: "https://records.example.test/literature/SRC-01",
      checkedOn: VERIFIED_SOURCE_CHECK_DATE,
      kind: "literature-map" as const,
      status: "verified" as const,
      note: "Checked scholarly source with stable citation details and relevance notes for comparison planning.",
    }],
    results: [{
      id: "RES-01",
      label: "Held-out evaluation summary",
      verification: "verified" as const,
      note: "A traceable summary was recorded for this synthetic test fixture.",
      sourceIds: ["SRC-01"],
      methodIds: ["MTH-01"],
    }],
  };
  const review = reviewProject(project, generateDraft(project));
  const roadmap = buildDissertationRoadmap(project);

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
  assert.equal(roadmap.items.find((item) => item.id === "results")?.status, "needs-data");
});

test("duplicate result identifiers block an otherwise traceable draft", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [
      { id: "RES-01", label: "First evaluation summary", verification: "verified" as const, note: "A traceable evaluation summary was recorded.", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] },
      { id: "RES-01", label: "Second evaluation summary", verification: "verified" as const, note: "A separate traceable evaluation summary was recorded.", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] },
    ],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "duplicate-result-RES-01"), true);
});

test("duplicate research-design identifiers block an otherwise mapped draft", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    objectives: [
      { id: "OBJ-01", text: "Define the research setting." },
      { id: "OBJ-01", text: "Compare the selected prior research." },
    ],
    methods: [
      { id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Use an auditable comparison protocol." },
      { id: "MTH-01", objectiveIds: ["OBJ-01"], text: "Use a separate approved analysis protocol." },
    ],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "duplicate-objective-OBJ-01"), true);
  assert.equal(review.issues.some((item) => item.id === "duplicate-method-MTH-01"), true);
});

test("a verified result cannot rely on a thin verified source record", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, label: "x", note: "x" }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-traceability-RES-01"), true);
});

test("a verified result needs a usable label and supporting record note", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "", verification: "verified" as const, note: "", sourceIds: ["SRC-01"], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "thin-verified-result-RES-01"), true);
});

test("a verified result cannot retain an unknown evidence reference", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{ ...DEMO_PROJECTS[0].sources[0], status: "verified" as const, locator: "https://records.example.test/datasets/SRC-01", checkedOn: VERIFIED_SOURCE_CHECK_DATE, note: "Verified dataset record with license, access date, and relevance notes." }],
    results: [{ id: "RES-01", label: "Held-out evaluation summary", verification: "verified" as const, note: "A traceable summary was recorded.", sourceIds: ["SRC-01", "SRC-MISSING"], methodIds: ["MTH-01"] }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "result-source-reference-RES-01"), true);
});

test("a plan that explicitly says it has no findings is not mistaken for an unsupported result", () => {
  const project = DEMO_PROJECTS[0];
  const review = reviewProject(project, generateDraft(project));
  const resultsIssue = review.issues.find((item) => item.id === "unsupported-outcome-results-status");

  assert.equal(resultsIssue, undefined);
});

test("outcome language in a discussion needs verified results", () => {
  const project = DEMO_PROJECTS[0];
  const draft = generateDraft(project).map((section) =>
    section.id === "discussion"
      ? { ...section, body: "The proposed intervention improves accuracy." }
      : section,
  );
  const review = reviewProject(project, draft);

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "unsupported-outcome-discussion"), true);
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

test("a verified literature note traces an own-words note to a checked source location", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    sources: [{
      id: "SRC-01",
      label: "Verified literature record for explanation planning",
      locator: "https://records.example.test/literature/SRC-01",
      checkedOn: VERIFIED_SOURCE_CHECK_DATE,
      kind: "literature-map" as const,
      status: "verified" as const,
      note: "Original article, stable citation, relevance, and access details were checked by the researcher.",
    }],
    literatureNotes: [{
      id: "LIT-01",
      sourceId: "SRC-01",
      claim: "The source frames explanation checking as a planned evaluation step rather than a completed result.",
      locator: "Section 2.1, p. 6",
      use: "method" as const,
      status: "verified" as const,
    }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, true);
  assert.equal(review.verifiedLiteratureNoteCount, 1);
  assert.equal(review.issues.some((item) => item.id === "literature-note-traceability-LIT-01"), false);
});

test("a verified literature note cannot rely on an unverified source record", () => {
  const project = {
    ...DEMO_PROJECTS[0],
    literatureNotes: [{
      id: "LIT-01",
      sourceId: "SRC-01",
      claim: "This note identifies a source-supported background point for later literature review.",
      locator: "p. 4",
      use: "background" as const,
      status: "verified" as const,
    }],
  };
  const review = reviewProject(project, generateDraft(project));

  assert.equal(review.canExportAsDraft, false);
  assert.equal(review.issues.some((item) => item.id === "literature-note-traceability-LIT-01"), true);
});

test("the literature evidence matrix requests an own-words note and a source locator", () => {
  const markup = renderToStaticMarkup(
    createElement(LiteratureEvidenceMatrix, { project: DEMO_PROJECTS[0], onChange: () => undefined }),
  );

  assert.match(markup, /Link each literature note to a source/);
  assert.match(markup, /short paraphrase in your own words/i);
  assert.match(markup, /Page, section, table, figure, or stable passage label/i);
  assert.match(markup, /Do not paste long excerpts/i);
  assert.match(markup, /returns to reviewed/i);
});

test("the evidence ledger separates literature from direct result records", () => {
  const markup = renderToStaticMarkup(
    createElement(EvidenceLedger, { project: DEMO_PROJECTS[0], onChange: () => undefined }),
  );

  assert.match(markup, /Record type/);
  assert.match(markup, /Literature source/);
  assert.match(markup, /Where can you find the original record again\?/);
  assert.match(markup, /DOI, stable URL, repository\/archive record, or local record ID/);
  assert.match(markup, /When did you check the original record\?/);
  assert.match(markup, /This is not the publication date or a proof of approval/i);
  assert.match(markup, /Verified data or record link/);
  assert.match(markup, /Planned method with safeguards link/);
  assert.match(markup, /documented data and safeguards plan/i);
  assert.match(markup, /does not confirm ethics approval, consent, permission, or a completed study/i);
});

test("method readiness records a plan without claiming approval or collected data", () => {
  const markup = renderToStaticMarkup(
    createElement(MethodReadiness, { project: DEMO_PROJECTS[0], onChange: () => undefined }),
  );

  assert.match(markup, /Plan safeguards for each method/);
  assert.match(markup, /Data, permissions, and ethics plan/);
  assert.match(markup, /does not confirm ethics approval, consent, institutional permission, data access, or completed data collection/i);
});
