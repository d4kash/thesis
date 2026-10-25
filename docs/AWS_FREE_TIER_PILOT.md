# AWS Free Tier pilot for Thesis Studio

**Status:** deployment plan only. No AWS account, credentials, cloud resources, or research records are created by this repository.

This guide is for an owner who wants to run a small, source-grounded Thesis Studio pilot on AWS without treating the Free Tier as an unlimited or permanent hosting plan.

## 1. Eligibility and cost boundary

AWS's current **Free plan** is for new AWS customers. It ends on the earlier of six months after account creation or when the account's Free Tier credits are exhausted. It is not extendable. Check the account's plan, credit balance, and end date in the AWS console before any deployment.

- [AWS Free Tier overview](https://aws.amazon.com/free/)
- [AWS Free Tier FAQ](https://aws.amazon.com/free/free-tier-faqs/)
- [Avoiding unexpected AWS charges](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/avoid-charges-after-free-tier.html)

An existing AWS account may not qualify for the new-account Free plan, even if individual services retain their own always-free allowances. Do **not** create a second account to bypass eligibility rules. Treat any post-free-plan use as a deliberate paid decision by the account owner.

Before deploying, the owner must:

1. Choose the Free plan only if the account is eligible; do not upgrade it automatically.
2. Enable root-account MFA and use a separate least-privilege deployment identity.
3. Turn on billing/credit alerts in the AWS console and record the Free plan end date.
4. Keep AWS credentials out of this repository, browser code, backups, and screenshots. `.env*` is already ignored by Git.

## 2. What this pilot may store

The present app is deliberately local-first. A cloud pilot may eventually store **only** a signed-in researcher's project metadata and own notes:

- topic, synopsis fields, project plan, source metadata and stable locators;
- access/licence/permission notes and researcher check dates;
- own-word literature notes, evidence links, method plans, and review status.

It must not automatically download, scrape, copy, upload, or rewrite full theses, papers, PDFs, participant data, or copyrighted source text. Source files remain outside the pilot until a separate, reviewed upload-and-provenance feature exists.

## 3. Safe AWS shape for a small pilot

The first cloud-backed milestone should be a narrow serverless service, not a full thesis generator.

| Layer | Planned service | Boundary |
| --- | --- | --- |
| Identity | Amazon Cognito | A researcher signs in before any cloud read or write. No anonymous project API. |
| API | API Gateway HTTP API + AWS Lambda | Each request verifies the signed-in subject and project membership on the server. |
| Project records | Amazon DynamoDB | Store validated project records only; partition every record by owner/project scope. Start with low, fixed provisioned capacity and a single region. |
| Web app | Existing Vercel deployment initially; AWS Amplify Hosting only after the production hosting decision | Do not move hosting merely to consume credits. Keep the current tested deployment path intact. |
| Source files | **Not in the first pilot** | No public bucket, no full-text corpus, no automatic downloads. |
| AI/provider calls | **Not in the first pilot** | Model inference is not assumed to be free. Any later provider must be opt-in, source-bounded, logged, and separately cost-approved. |

AWS Lambda has an always-free monthly request/compute allowance, and DynamoDB lists a free tier for a small single-region provisioned table. Those offers can change and must be checked in the owner’s console before provisioning. They are capacity guides, not a promise that every feature has zero cost.

- [AWS Lambda pricing](https://aws.amazon.com/lambda/pricing/)
- [Amazon DynamoDB pricing](https://aws.amazon.com/dynamodb/pricing/)
- [Amazon API Gateway pricing](https://aws.amazon.com/api-gateway/pricing/)

Do not add EC2, NAT Gateway, RDS/Aurora, Bedrock, Textract, OpenSearch, public S3 buckets, public Lambda URLs, or always-on workers to the Free Tier pilot. They are unnecessary for the first authenticated metadata-sync milestone and can create avoidable charges or data exposure.

## 4. Mandatory implementation gates

Cloud synchronization remains disabled until all of these are implemented and tested:

1. **Identity:** Cognito authentication, with no client-supplied user ID trusted by the API.
2. **Authorization:** server-side ownership/membership checks on every project record and guessed-ID denial tests.
3. **Validation:** the existing local-project schema and verification normalizers run again on the server before writes.
4. **Provenance:** every source record preserves its locator, permission/access note, and researcher check date; no source text is silently imported.
5. **Privacy:** no participant identifiers or raw research files in the initial table; no secrets in client bundles or logs.
6. **Audit and exit:** record record-level changes, export an owner backup before the plan ends, then disable or deliberately upgrade the service.

The current local export/backup workflow remains the recovery path. It does not upload a backup to AWS.

## 5. Delivery sequence

1. **Account preflight:** the owner confirms eligibility, MFA, credit end date, region, and alerts in the AWS console.
2. **Authentication foundation:** implement and test Cognito sign-in plus server-side project ownership. No persistence migration yet.
3. **Private metadata API:** add a small DynamoDB-backed project record API with schema validation, revision checks, and cross-project denial tests.
4. **Controlled migration:** let a signed-in researcher explicitly copy a local plan to their own cloud project after seeing exactly what will be sent.
5. **Review before expansion:** measure real use and credit consumption. Consider files, OCR, discovery connectors, or model calls only after their security, licensing, and cost boundaries are separately approved.

This order intentionally postpones data uploads and AI generation. It makes the first AWS feature useful—secure researcher-owned metadata sync—while protecting against fabricated evidence, unauthorized copying, and accidental spend.
