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

## What the upgraded workspace does

- Lets a researcher turn a topic and research brief into an eight-part thesis scaffold.
- Presents the intake in student-friendly language, with an editable topic-based opening paragraph and a short own-voice phrase guide.
- Provides an evidence-safe starter action that turns a new topic into a research question, scope, objectives, and auditable method plan while leaving results and citations empty.
- Includes a student-facing free research toolkit for Crossref, OpenAlex, DOAJ, Shodhganga, Zotero, and ZoteroBib. It opens the official services in a new tab and never sends notes, PDFs, or source text from Thesis Studio.
- Stores prior-thesis or paper notes locally: source trace, setting, question, method, reported finding, and stated limitation.
- Builds a transparent topic map that ranks local prior-work records by term overlap and surfaces only **candidate** gaps from notes supplied by the researcher.
- Adds source records and result-ledger entries locally; verified sources need a reusable original-record locator, and verified results must link to a verified direct evidence record.
- Keeps the two bundled projects clearly marked as synthetic demonstrations with no findings or citations.
- Exports a clearly watermarked Markdown working draft only after the structural review has no critical issues.
- Runs the same tests, type check, and production build in GitHub Actions on pushes and pull requests.

The Eve agent also includes a source-grounded drafting skill for conversations through its protected agent endpoint. It is deliberately configured to ask for evidence instead of inventing citations, data, or academic results.

## Continuous integration and deployment

`.github/workflows/ci.yml` runs `npm test`, `npm run typecheck`, and `npm run build` on `main` and pull requests. Once the repository is linked to a Vercel project, Vercel can deploy the production branch automatically; no provider API key is committed to this repository.

## Research guardrails

A final thesis requires verified sources, approved research methods, and traceable result records. The structural review and topic map are quality aids, not academic approval or automatic literature review systems.

The phrase guide is for expressing a writer's own verified ideas more clearly. It does not rewrite copied passages, bypass plagiarism checks, or remove the need to cite a source.
