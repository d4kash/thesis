# Thesis Studio

Thesis Studio is an evidence-aware research-planning workspace. It creates a structured draft from a project brief, maps methods to objectives, keeps an evidence registry, and reviews output before export.

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

## Research guardrails

A final thesis requires verified sources, approved research methods, and traceable result records. The structural review is a quality aid, not an academic approval process.
