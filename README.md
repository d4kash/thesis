# Thesis Studio

Thesis Studio is an evidence-aware research-planning workspace. Give it a topic and research brief, add notes from prior theses or papers, and it creates an eight-part working draft with a source-linked research landscape, method map, source/result ledger, and structural review before export.

It ships with two **synthetic demonstration projects**:

1. Explainable leaf-condition classification for flowering plants.
2. Digital learning-resource access across selected rural colleges.

Neither demo contains findings, real citations, participant data, or a submission-ready thesis. The dashboard makes that boundary explicit and flags unsupported outcome language.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

```bash
npm test
npm run typecheck
npm run build
```

## Architecture

- **Next.js** provides the dashboard and export workflow.
- **Eve** compiles the thesis-planning agent; `next.config.ts` uses `withEve` so the agent and web app deploy as one Vercel project.
- **Local demo data** keeps this first release reviewable with no credentials or researcher data. A production release should implement the persistence, provenance, revision, and access-control layers described in [`docs/REFERENCE_ARCHITECTURE.md`](docs/REFERENCE_ARCHITECTURE.md).
- **AWS pilot path:** [`docs/AWS_FREE_TIER_PILOT.md`](docs/AWS_FREE_TIER_PILOT.md) defines the eligibility, cost, privacy, and authentication gates for a future six-month Free Tier proof of concept. It does not provision AWS resources or upload research data.

## What the upgraded workspace does

- Lets a researcher turn a topic and research brief into an eight-part thesis scaffold.
- Presents the intake in student-friendly language, with an editable topic-based opening paragraph and a short own-voice phrase guide.
- Provides an evidence-safe starter action that turns a new topic into a research question, scope, objectives, and auditable method plan while leaving results and citations empty.
- Includes a student-facing free research toolkit for Crossref, OpenAlex, DOAJ, Shodhganga, Zotero, and ZoteroBib. It opens the official services in a new tab and never sends notes, PDFs, or source text from Thesis Studio.
- Stores prior-thesis or paper notes locally: source trace, access/licence/permission basis, researcher check date, setting, question, method, reported finding, and stated limitation.
- Builds a transparent topic map that ranks local prior-work records by term overlap and surfaces only **candidate** gaps from notes supplied by the researcher.
- Adds source records and result-ledger entries locally; verified sources need a reusable original-record locator, researcher check date, and relevance note, while verified results must link to verified direct evidence.
- Requires verified literature notes to retain an own-words note plus a specific re-check marker such as a page, section, table, figure, or dataset field.
- Assembles eligible checked own-words literature notes into section 3 of the working draft, grouped by purpose with source IDs, original-record locators, re-check locations, and dates. Edit the notes in the evidence matrix; changed notes need a new check before reappearing. This is local assembly, not model-generated synthesis or independent verification.
- Saves the selected page target with the local project and its backup. The chapter plan, copied roadmap, and supervisor packet share the same page budgets after reload or restore. Choose 200, 250, 300, or 350 pages in the long-form plan and check the save status; these are planning allocations, not completed pages. Demo selections remain temporary. Older backups without a target keep the 300-page planning default.
- Keeps the two bundled projects clearly marked as synthetic demonstrations with no findings or citations.
- Exports a clearly watermarked Markdown working draft only after the structural review has no critical issues.
- Runs the same tests, type check, and production build in GitHub Actions on pushes and pull requests.

The Eve agent also includes a source-grounded drafting skill for conversations through its protected agent endpoint. It is deliberately configured to ask for evidence instead of inventing citations, data, or academic results.

## Continuous integration and deployment

`.github/workflows/ci.yml` runs `npm test`, `npm run typecheck`, and `npm run build` on `main` and pull requests. Once the repository is linked to a Vercel project, Vercel can deploy the production branch automatically; no provider API key is committed to this repository.

`npm run build` runs the existing full Eve and Next builds through `scripts/build.mjs`, with both frameworks' documented optional telemetry disabled. Build failures still stop the pipeline. Eve may read the public model catalog during compilation; this is not a paid model-generation call. The researcher-facing local workflow does not invoke a model.

## Research guardrails

A final thesis requires verified sources, approved research methods, and traceable result records. The structural review and topic map are quality aids, not academic approval or automatic literature review systems.

The phrase guide is for expressing a writer's own verified ideas more clearly. It does not rewrite copied passages, bypass plagiarism checks, or remove the need to cite a source.

## MVP verification status

See [`docs/MVP_STATUS.md`](docs/MVP_STATUS.md) for the acceptance checklist, concrete local test evidence, verification limits, and next unmet criterion. `tests/mvp-workflow.test.ts` exercises both synthetic demos and a new-topic flow through synopsis, references, literature notes, page planning, safeguards, save/restore, and exports. These application-data integration tests do not replace browser interaction checks. Implemented locally does not mean deployed or supervisor-approved.
