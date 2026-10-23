# Thesis Studio — Proposed Software Architecture v2.0

Prepared 17 October 2026. This is an implementation specification, not a running application. It supports the handbook and its prompt pack without selecting the user's final PhD topic.

## 1. Product scope and architecture decision

Build a modular monolith with an asynchronous Python worker. Use Next.js with TypeScript for the researcher workspace; FastAPI/Python for research workflows, ingestion and analytical tasks; PostgreSQL for relational records and initial full-text retrieval; S3-compatible object storage for original uploads, datasets, run outputs and exports. Use a PostgreSQL-backed job table initially. Introduce a dedicated queue or semantic index only when measured workload and retrieval quality justify it.

This choice fits an existing Next.js skill set while keeping PDF parsing, OCR, statistics and export tooling in Python. PostgreSQL suits explicit relationships among source versions, extracts, claims, objectives and revisions. Avoid microservices initially: one API and one worker deployment share a versioned domain model. This is a design recommendation, not a benchmark claim. Pin supported dependency versions and review official documentation at implementation time.

The model-provider gateway must be replaceable. Store provider/model identifier, prompt version, input manifest hash, output and usage for every generation. Do not depend on a particular model name or price. Begin with user-uploaded sources; add external discovery connectors after evidence review works reliably. Optional embeddings supplement text search, not claim verification.

## 2. Components and boundaries

| Component | Responsibility | Must not do |
| --- | --- | --- |
| Next.js workspace | Project intake, source viewer, literature matrix, chapter editor, issues and export screen | Hold provider credentials or approve claims automatically |
| FastAPI domain API | Membership checks, versioned records, workflow transitions, task scheduling | Perform long analysis inside a request |
| Ingestion worker | Validate files, unpack bounded archives, extract text/OCR and preserve page maps | Treat document text as operational instructions |
| Evidence service | Search project-scoped extracts; build allowed-evidence bundles | Treat similarity as proof or mix project access scopes |
| Generation gateway | Call a configured provider with prompt/version and constrained inputs | Invent missing evidence or set human approval status |
| Analysis worker | Execute explicit approved analysis recipes on scoped inputs | Execute arbitrary uploaded code with network or secrets |
| Validator | Structural, numerical and citation checks plus support-review flags | Certify scientific validity or originality without review |
| Export worker | Build DOCX/PDF from immutable chapter and reference snapshots | Export stale evidence as submission-ready |

## 3. Core data model

Every project-owned entity has project_id, created_at and appropriate ownership/version fields. UUIDs are suitable identifiers. Keep bibliography verification, extract review and claim support as different status fields.

- users and project_memberships: user_id, project_id, role (owner/researcher/reviewer/viewer). Enforce permissions server-side on every route and retrieval query.
- projects: title, discipline, research_design, scope, university_rules_version, current_revision. University rules are uploaded/versioned rather than assumed.
- objectives: objective_id, question, hypothesis_id if any, method, expected_evidence, status. Unique IDs within each project.
- sources: bibliographic identity, DOI/URL, license, bibliographic_status, correction_status.
- source_versions: source_id, version_id, storage_key, sha256, parser_version, OCR status. Original bytes remain immutable.
- extracts: extract_id, source_version_id, PDF page index, printed page label, section, text, OCR confidence, reviewer status.
- datasets and dataset_versions: provenance, dictionary, license/consent reference, hash, group/split manifest and exclusions.
- analysis_runs: dataset_version_id, code/config/environment hashes, seed, status and log keys. Multiple inputs use run_inputs join records.
- results: run_id, metric, value, unit, denominator, interval, output artifact ID and validation state. Numeric types/precision must suit the analysis.
- claims: kind, text, support_state, reviewer and revision. claim_support links to one or more extracts or results with precise locators.
- sections and section_revisions: outline position, immutable content, author, base_revision, status, prompt_version and bundle_id. Join tables connect revisions to claims and objectives.
- generation_bundles: allowed evidence IDs/versions, selected objective IDs, outline, glossary, constraints, manifest hash and token budget.
- issues: target entity/revision, severity, rule_id, evidence, repair action and resolution record.
- jobs: type, input hash, idempotency key, state, attempts, lease, heartbeat, cancellation flag, progress and error.
- exports: exact revision IDs, reference snapshot, rule version, validation report, artifact hashes and export mode.
- audit_events: actor, action, timestamp, entity ID, prior/new revision and reason. Do not log raw sensitive survey responses.

Keep dependency edges from extracts/results to claims to section revisions to exports. Input replacement creates a new version and marks dependent current views stale. Preserve old exported snapshots; never silently rewrite their history.

## 4. Workflow and state rules

Project intake → source ingestion → extraction review → literature matrix → gap/objective review → method plan → data collection or experiment execution → result validation → section drafting → claim review → academic review → export.

This is a dependency graph, not a requirement to block all work behind the slowest step. Introduction and methods drafts can proceed while data collection is pending; results cannot be presented as completed.

Source: uploaded → parsing → needs_review → usable, or failed. Low-confidence OCR stays needs_review. Section: planned → draft → evidence_checked → academic_reviewed. A changed upstream dependency yields stale. Review events include actor and exact revision. A reviewer sees the proposed change before approving it; a model cannot transition to academic_reviewed.

Jobs: queued → running → succeeded/failed/cancelled. A worker acquires a lease, updates heartbeat and writes outputs atomically. On worker loss, expire the lease and retry with a capped backoff. The idempotency key prevents duplicate committed outputs. Cancelling a job prevents output publication even if a provider call finishes later. Retain errors and permit a deliberate retry after repair.

## 5. Drafting contract and retrieval

Draft one bounded section at a time. Retrieve only authorized project sources and rank for the objective/section. Include contradictory evidence and locators. Allow user selection and override of retrieval candidates. Keep long documents outside the prompt except for relevant extracts, with enough context to interpret them accurately.

Request: project_id, section_id, base_revision, prompt_id/version, bundle_id, objective_ids, length_target, citation_style and mode. Resolve bundles server-side; reject arbitrary IDs from other projects. Record every included source/result version.

Response: section text, claim objects, used evidence IDs, unresolved gaps, assumptions and proposed tables. Enforce a structured output schema. Reject references not in the allowed bundle. Check cited passages actually support the text using automated flags plus human review. Citation existence alone is insufficient. Never let the model create measured result rows.

## 6. Proposed API surface

All paths below are design contracts, not existing deployed endpoints. Long-running operations return 202 with job_id. Errors use code, message, field_errors and request_id without secret data.

| Method and route | Purpose |
| --- | --- |
| POST /v1/projects | Create brief and project membership |
| PATCH /v1/projects/{id} | Change scoped project settings with revision precondition |
| POST /v1/projects/{id}/sources/uploads | Authorize a scoped upload and return constrained transfer details |
| POST /v1/projects/{id}/sources/{sourceId}/ingest | Validate upload ownership/checksum and enqueue parse/OCR |
| GET /v1/projects/{id}/extracts | List authorized, filtered extracts and review states |
| POST /v1/projects/{id}/bundles | Freeze a section evidence bundle |
| POST /v1/projects/{id}/sections/{sectionId}/drafts | Generate new draft revision against base_revision |
| POST /v1/projects/{id}/analysis-runs | Queue a supported analysis recipe and input manifest |
| POST /v1/projects/{id}/audits | Run validators on selected revisions |
| POST /v1/projects/{id}/reviews | Record an authorized human review of exact revisions |
| POST /v1/projects/{id}/exports | Request draft or submission export of a fixed snapshot |
| GET /v1/jobs/{jobId} | Read status/progress after project access check |
| POST /v1/jobs/{jobId}/cancel | Request cancellation for an authorized job |

Return 409 for outdated base_revision instead of overwriting another edit. Use idempotency keys for generation, analysis and export requests. Validation failures return actionable issues; nonexistent or inaccessible resources must not disclose another project's metadata.

## 7. Upload, privacy and execution boundaries

Allowlist supported file types and check actual content signatures. Enforce size/page limits, archive entry count and decompressed size limits; reject path traversal, symlinks and executable archive entries. Use isolated parsing workers and quarantine failed or suspicious files. Store original hashes and parsing logs.

For remote URLs, protect against server-side request forgery: deny private/link-local addresses and revalidate redirects. Retrieve only authorized content through approved interfaces. Store access/license metadata and avoid bypassing access controls.

Protect survey identities: separate contact details from analysis data, minimize model inputs and support controlled de-identification. Encrypt transport/storage using the selected platform; keep secrets in server-side configuration, not client bundles. Signed object URLs must be short-lived and project-scoped. Define retention and deletion for raw files, database rows, indexes and backups.

For an eventual analysis runner, use an isolated container with no network, no credentials, read-only inputs, bounded CPU/memory/time and a dedicated output directory. MVP can accept uploaded analysis outputs rather than execute arbitrary code. External documents and model output must never become shell commands or unrestricted SQL.

## 8. Validation and export

Deterministic rules: unique objective/hypothesis IDs; matching citation/reference IDs; allowed source versions; figure/table sequence; declared denominator reconciliation; finite metrics; unresolved placeholders; stale dependencies; required institution sections. Statistical checks must understand analysis-specific subsets and models instead of assuming all counts match.

Semantic review flags: claim entailment, novelty overstatement, causal overclaim, unexplained contradictory literature, inappropriate generalization and close text reuse. These need human review and must not be advertised as guaranteed plagiarism or AI-detection scores.

Draft export: watermark/header “DRAFT — unresolved issues”, retain citation placeholders where needed and include issue appendix. Submission export: block critical evidence failures and stale or unreviewed required sections; require a recorded readiness decision. Export is not academic approval. Use one structured document representation for DOCX and PDF; render and inspect representative pages plus tables, equations and front matter. Preserve an export manifest and checksums.

## 9. Build milestones with acceptance criteria

M1 — Project and source foundation: authentication, project roles, upload, extraction, page viewer and source register. Accept when a scanned page can be reviewed against its original and cross-project source reads are denied.

M2 — One complete writing path: literature matrix, objectives, versioned bundle, one-section generation, claim links and issue panel. Accept when a claim opens its exact source page; unsupported citations are rejected and a concurrent edit returns 409.

M3 — Evidence-aware exports: prompt pack import, templates, bibliography, draft/submission gates and immutable snapshots. Accept when a missing result blocks submission export but allows marked draft export, and regenerating from the same snapshot preserves content.

M4 — Research-specific workflows: surveys, comparisons, archival extraction, results import and optional sandboxed analysis. Accept when a changed dataset marks dependent text stale and a documented subset is not falsely rejected as a count inconsistency.

M5 — Discovery and scaling: source connectors, optional semantic retrieval, collaboration, job observability and resource budgets. Accept only after retrieval evaluation and load testing show benefits. Maintain bounded retries and cancellation across restarts.

## 10. Required acceptance fixtures

Use small clearly synthetic fixtures for tests, never as actual thesis findings. Cases: duplicated source; scanned OCR error in a number; missing chapter; unsupported DOI; a real source cited for an unrelated claim; prompt injection inside PDF text; changed result checksum; 100 enrolled/90 complete cases with documented exclusions; duplicate hypothesis ID; cross-project guessed ID; worker crash/retry; cancelled generation; simultaneous section edits; export with unresolved empirical claim.

Pass criteria: authorized sources only; no lost edits or duplicate published outputs; unsupported claims flagged; stable source-page mapping; stale propagation; visible draft warnings; submission gate enforcement; no secrets or private participant fields in generation requests. Record executed results, not just planned test names.

## 11. Suggested repository layout

apps/web/ — Next.js interface
services/api/ — FastAPI routes and domain services
services/worker/ — ingestion, generation, analysis and export jobs
packages/contracts/ — versioned JSON schemas and generated client types
prompts/ — prompts.v2.json and later reviewed versions
migrations/ — database migrations
research_templates/ — university and research-design configurations
validation/ — rules and acceptance fixtures
infra/ — local development and deployment configuration

Use separate web, API and worker processes with PostgreSQL and object storage. A local container setup can support development; choose production hosting after workload, cost and data-residency requirements are known. No infrastructure has been provisioned in this deliverable.

## 12. Evidence for technical choices

PostgreSQL documents native full-text search at https://www.postgresql.org/docs/17/textsearch.html . Crossref documents scholarly metadata access at https://www.crossref.org/documentation/retrieve-metadata/rest-api . PMC documents its open-access subset at https://pmc.ncbi.nlm.nih.gov/tools/openftlist/ . These were checked on 17 October 2026. They support individual capabilities, not the entire proposed architecture. All product structure, workflow and module decisions above are design recommendations for this project.
