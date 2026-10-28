# Thesis Studio MVP acceptance checkpoint

Updated: 28 October 2026. Reviewed remote baseline: `813b4a0f45c539ceb376fe4501a5ba6a213e7aba`.

**Local verification passed; complete MVP sign-off is pending.** Results below are local, not proof of deployed behavior. No AWS resources, new paid services, or paid AI calls were used. `AWS_FREE_TIER_PILOT.md` is unchanged.

## Capability delivered in this change

Section 3 assembles eligible researcher-written literature notes into background, methods, comparison, and limitation groups. Each note retains its source ID/title, original-record locator, precise re-check location, and check date. Edit notes in the evidence matrix; edits invalidate verification until the researcher checks them again. This is deterministic local assembly, not generated synthesis or independent verification.

Acceptance: only uniquely identified, checked notes with eligible checked sources enter the section; incomplete, stale, ambiguous, or edited notes stay out; missing inputs remain explicit; preview, backup, and exports preserve the source trail. No new citations, findings, research gaps, or source text are invented.

## Acceptance checklist

| Researcher capability | Concrete local evidence | Remaining limitation |
| --- | --- | --- |
| Start a topic | Topic-starter tests; new-topic integration flow | Browser interaction sign-off pending |
| Complete/revise synopsis | Both demo flows complete and revise the synopsis; generated text retains revisions | Copy interaction not browser-tested |
| Authorised prior-work metadata/notes | Permission/date/locator regressions; full-flow permission removal and edit-invalidation checks | Recorded checks do not certify rights or factual accuracy |
| Editable source-linked literature draft | Nine focused regressions; both demos and new-topic edit → exclude → re-check → include flows | Editing is through the matrix; no independent synthesis editor |
| Chapter/page plan | Full flows verify linked note IDs and a 300-page budget sum | Selected UI page target is not persisted; supervisor export uses the default target |
| Methods/ethics/results ledger | Full flows retain safeguards and reject literature as direct result evidence | No actual findings or approvals generated; only synthetic placeholders tested |
| Local save/restore | Both demos converted to local fixtures plus new-topic flow: save, reload, backup, restore, malformed-input rejection | Browser downloads/import interaction pending; local storage/backups are not encrypted |
| Supervisor-editable export | Both Markdown exports retain source trails, permission notes, unresolved results, and draft warnings | Markdown only; no Word/PDF export |
| Both synthetic demos | `tests/mvp-workflow.test.ts` exercises both complete application-data flows without changing bundled fixtures | These are integration tests, not browser click tests |

## Test and security evidence

- TDD: nine literature regressions failed before the assembly implementation, then passed. Five build-runner tests failed before the runner was added, then passed. Three full workflow tests preserve the cross-feature regression path.
- `npm test`: **82/82 passed**. `npm run typecheck`: passed. `npm run build`: full Eve + Next production build passed, exit 0. `git diff --check`: passed.
- Local production HTTP smoke passed: status 200 with both demo controls, the new literature section, restore, and supervisor export controls. This checks server rendering, not browser interaction.
- Source/note eligibility is re-evaluated when rendering. Duplicate IDs, missing/future check dates, wrong source kinds, and edited verification cannot supply an assembled note. Stored verification is a researcher assertion, not an independent fact check.
- Imported backups remain size/shape/reference validated. The new path adds no schema, credentials, uploads, external calls, or access-control assumptions. Do not store participant PII in shared-browser local storage or backups.
- React renders note text as text; Markdown uses the existing literal-text escaping helper. Regressions cover HTML, JavaScript links, and forged headings. Source locators in this path are text, not automatically fetched URLs.
- Build privacy: `scripts/build.mjs` retains both full build stages and failure propagation while setting documented `EVE_TELEMETRY_DISABLED=1` and `NEXT_TELEMETRY_DISABLED=1`. The installed Eve 0.82.0 compiler's catalog lookup is a public GET to `https://ai-gateway.vercel.sh/v1/models/catalog`, with package-version user-agent and no body/authorization header at that call site. It is not a model turn. The safety uncertainty was investigated before the successful retry; no stage or safety control was bypassed.
- No full copyrighted work was retrieved, downloaded, or rewritten. All new inputs are original synthetic test fixtures.

## Verification limits and next criterion

Chromium is unavailable; the earlier browser installation attempt returned invalid/empty archives and was stopped. No browser interaction success is claimed. The existing GitHub baseline has successful CI/Vercel statuses, but the connected `dakshjhas-projects` team returns 404 for `thesis` and its linked deployment; repository-filtered project discovery returned no matches. Deployment access/linkage must be resolved before live sign-off. No hosting settings or credentials were changed.

Next capability to address: persist the chosen chapter page target and use the same target after reload, backup/restore, and supervisor export. Inspection shows the selection currently lives only in `DissertationRoadmap` component state, while `buildSupervisorReviewMarkdown` independently uses the default. Reproduce this with a failing regression before changing it. Do not claim 300 completed pages or a complete MVP while this consistency gap and browser/deployment verification remain open.

## Quick start for this capability

1. Start a topic and revise the brief and synopsis.
2. Record authorised prior-work metadata and permission/check details. Add a literature source with an original-record locator, relevance note, and check date.
3. Write a short own-words note in the evidence matrix; select its source, purpose, and precise page/section/table locator.
4. Check the original record and note before marking each verified. Eligible notes appear in section 3.
5. Edit in the matrix, re-check, save a local backup, and download the working draft and supervisor packet. Resolve missing inputs and write your own synthesis with your supervisor; record IDs are not finished citations.
