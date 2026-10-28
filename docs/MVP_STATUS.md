# Thesis Studio MVP acceptance checkpoint

Updated: 28 October 2026. Remote main remains `e0c9d3fdece8f0d285672a78d781e21e1f81c05c`. This candidate builds on preserved page-budget candidate `503125465ff8b6a3b3cc7c0ac94e852755bf6e0f` without updating a remote branch ref.

**Page-budget persistence and result-link recheck candidate verified locally; not released to main or Vercel. Complete MVP sign-off remains pending.** No AWS resources, new paid services, or paid AI calls were used. `AWS_FREE_TIER_PILOT.md`, dependencies and hosting settings are unchanged. Only the stale-result-verification transition was changed in this run.

## Capability in this candidate

Reproduced defect: replacing an eligible source or method retained a result's verified status; clearing a link discarded the edit; changing or removing one source could leave a multi-source result verified because another eligible source remained. The ledger now accepts the edit and returns the affected result to unverified, with a plain-language recheck message. That state survives local reload, backup/restore and supervisor export.

Acceptance and trust boundaries: source/method link changes and linked-source edits, status changes or removal require a separate researcher result check. Unchanged link selections and unrelated eligible results keep their status. A combined relink-and-verify request cannot grant verification; a later explicit status-only request must still pass the existing direct-evidence and method-safeguard gates. Notes, remaining links and synthetic demo fixtures are preserved. This is a local state transition, not independent evidence validation or academic approval.

Inherited from `5031254`:

The selected page target is now a project preference rather than temporary component state. Local save/reload and version-one backup/restore retain it. The UI, copied roadmap, and supervisor-editable packet use the same chapter allocations; the packet now includes the source-linked chapter plan. Demo changes remain temporary and bundled fixtures are unchanged.

Acceptance and trust boundaries: older backups without the optional field default to 300; imported values must be integer numbers between the planner's existing bounds of 80 and 600; strings, objects, null, non-finite, fractional, and out-of-range values are rejected without overwriting a valid save. A page preference cannot grant verification, create findings, change source permissions, or promise completed pages.

## Acceptance checklist

| Researcher capability | Concrete evidence | Remaining limitation |
| --- | --- | --- |
| Start a topic | Topic-starter regressions and new-topic integration workflow | Browser interaction sign-off pending |
| Complete/revise synopsis | Both synthetic demo workflows complete and revise the synopsis | Browser copy interaction unverified |
| Authorised prior-work metadata/own notes | Permission/date/locator regressions, edit invalidation, and full-workflow checks | Recorded checks are researcher assertions, not certified rights or facts |
| Editable source-linked literature draft | Nine focused regressions and edit → exclude → re-check → include flows | Edit through the matrix; no model-generated synthesis |
| Chapter/page plan | Seven focused page-target tests; both demo workflows persist a 250-page plan through restore and supervisor export | This candidate is not on main; browser clicks unverified |
| Methods/ethics/results ledger | Nine new recheck regressions; full workflows retain safeguards and reject literature as direct result evidence | Local candidate only; browser edit interactions unverified; no actual findings or approvals created |
| Local save/restore | Save, reload, backup, restore and malformed-input checks, including new target validation | Browser file interaction unverified; local storage/backups are not encrypted |
| Supervisor-editable export | Markdown exports preserve source trails, permission notes, unresolved items and matching chapter budgets | Markdown only; download interaction unverified |
| Both synthetic demos | `tests/mvp-workflow.test.ts` exercises both full application-data flows and preserves original fixtures | Integration tests, not browser click tests |

## TDD and security evidence

- Baseline: `npm test` passed **89/89**. Existing ledger transitions were extracted into pure helpers without fixing their behavior. Nine focused result-link regressions then produced **eight failures, one pass**. After the minimal fix, **9/9 passed** (`tests/result-link-recheck.test.ts`).
- Candidate: `npm test` **98/98 passed**; `npm run typecheck` passed; full `npm run build` (Eve + Next) passed, exit 0; `git diff --check` passed. Existing installed dependencies were reused, not reinstalled.
- The earlier page-budget candidate retains its seven regression tests (five failed before its implementation). Both original demo workflows and the new-topic flow pass; new demo-derived result fixtures also retain unverified status through save, reload, backup, restore, review, server rendering and export.
- Both synthetic demo workflows and the new-topic workflow now retain a 250-page target through local persistence, portable backup, restore, and supervisor export. Both demo fixtures remain unchanged.
- React guidance: perform invalidation in existing edit handlers and pass the complete project through the existing update/autosave path, without new effects or duplicate verification state. The ledger's existing live status message explains rechecking. Server-rendered tests confirm the guidance and restored unverified label; they do not exercise browser events.
- Imports/backups: additive optional number in the existing version-one schema; strict validation at load, save, backup creation and restore. Invalid input does not replace a good saved project. No coercion of text or malformed JSON values into a page count.
- Provenance/stale verification: eligibility of replacement records does not carry forward the researcher's previous result check. Editing, downgrading or removing any linked source invalidates affected results even if another eligible source remains. Rechecking a source cannot automatically verify a result. Existing method-plan and result-note edit invalidation stays intact. Imported verification labels remain researcher assertions; the app cannot certify external records or detect edits made outside it.
- Injection/output: the supervisor packet reuses the existing Markdown-escaping chapter-plan renderer; untrusted text/identifier injection regressions still pass. The new field only accepts bounded numbers at the storage boundary.
- Access/PII/external calls: no new accounts, authentication assumptions, credentials, uploads, network fetches, AI calls or source URL handling. Same-browser local data remains unencrypted; do not store participant PII or secrets in the project or backups. No copyrighted full text was retrieved or rewritten.
- Build review: an initial execution review blocked the existing Eve catalog contact. Read-only inspection of installed `compiler/model-catalog.js`, `internal/gateway.js` and `internal/user-agent.js` established an unauthenticated `GET /v1/models/catalog` with no request body or model-generation call. The unchanged full build then passed. No flags, safety controls, credentials or dependency code were changed to bypass the review.

## Browser and release evidence

Browser interaction remains **unverified**. Playwright is present but its Chromium executable is absent; no new browser installation was attempted. The managed preview launcher was available, but passed `next dev --host 0.0.0.0 --port 4173 --strictPort`, which exited with `unknown option '--host'`. The failed preview was stopped. No working application code, network permissions or hosting configuration was changed to compensate for the preview environment.

For baseline `e0c9d3f`, [GitHub Actions run 40607272708](https://github.com/d4kash/thesis/actions/runs/40607272708) completed successfully. The GitHub Vercel status reports **Deployment rate limited — retry in 24 hours**, recorded at 28 October 2026, 05:42:33 IST. Earliest retry is 29 October 2026, 05:42:33 IST, subject to provider availability. The candidate is being preserved without updating a branch ref or triggering a deployment during that cooldown; baseline CI success is not candidate CI evidence.

Earlier connected-team inspection returned 404 for the linked project/deployment. Live deployment access and browser verification still need resolution. No new deployment URL or live-MVP claim is made.

## Next unmet criterion and release handoff

After the cooldown, inspect the current remote head, reconcile this candidate without overwriting intervening work, rerun the suite if inputs changed, and only then update main with a guarded ref update. Verify that candidate's own CI and Vercel checks. Complete the researcher browser flow (topic, synopsis revision, authorised notes, literature draft, page choice, safeguards/result ledger, reload, backup/restore, and exports) on a functioning preview or the linked deployment before MVP sign-off. Do not generate more features solely because release verification is temporarily blocked.

## Quick start once released

1. Start your own topic, then complete and revise the brief and synopsis.
2. Record authorised prior-work metadata and permission/check details. Link own-words literature notes to checked source records and precise page/section/table locators.
3. Choose a page target in the long-form plan. Confirm the local save status; the target also belongs to the backup.
4. Record proposed methods and safeguards. Add result records only when genuine direct evidence exists; missing findings remain explicit. After changing supporting records or links, re-check the result before selecting verified again.
5. Save a backup and download the working draft plus supervisor packet. The packet includes the matching chapter budget and unresolved review items, not a completed or approved thesis.
