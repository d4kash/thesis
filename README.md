# Thesis Studio

Thesis Studio is an evidence-aware research-planning workspace. It creates a seven-part working draft from a project brief, maps methods to objectives, keeps a source/result ledger, and reviews output before export.

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

- Lets a researcher build a seven-part thesis scaffold from their own project brief.
- Adds source records and result-ledger entries locally, with verified-results required to link to a verified evidence record.
- Keeps the two bundled projects clearly marked as synthetic demonstrations with no findings or citations.
- Exports a clearly watermarked Markdown working draft only after the structural review has no critical issues.
- Runs the same tests, type check, and production build in GitHub Actions on pushes and pull requests.

The Eve agent also includes a source-grounded drafting skill for conversations through its protected agent endpoint. It is deliberately configured to ask for evidence instead of inventing citations, data, or academic results.

## Continuous integration and deployment

`.github/workflows/ci.yml` runs `npm test`, `npm run typecheck`, and `npm run build` on `main` and pull requests. Once the repository is linked to a Vercel project, Vercel can deploy the production branch automatically; no provider API key is committed to this repository.

## Research guardrails

A final thesis requires verified sources, approved research methods, and traceable result records. The structural review is a quality aid, not an academic approval process.
