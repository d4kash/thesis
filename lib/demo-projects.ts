import type { ThesisProject } from "@/lib/thesis-types";

export const DEMO_PROJECTS: ThesisProject[] = [
  {
    id: "flora-xai-plan",
    demoLabel: "Synthetic demonstration project • no study data",
    title: "Explainable Leaf-Condition Classification for Flowering Plants",
    discipline: "Applied machine learning",
    researchQuestion:
      "How can an explainability-first evaluation plan assess whether a plant image classifier attends to relevant leaf regions?",
    scope:
      "A planning prototype for selected flowering plant leaf images. It does not report an accuracy value, clinical advice, or completed experiment.",
    objectives: [
      {
        id: "OBJ-01",
        text: "Define a reproducible image-selection and labeling protocol.",
      },
      {
        id: "OBJ-02",
        text: "Compare explanation maps against expert-defined regions of interest.",
      },
      {
        id: "OBJ-03",
        text: "Document uncertainty, failure modes, and data limitations.",
      },
    ],
    methods: [
      {
        id: "MTH-01",
        objectiveIds: ["OBJ-01"],
        text: "Register inclusion criteria, label provenance, image quality checks, and a held-out evaluation split before model training.",
        dataAndEthicsPlan: "Use only a dataset with documented provenance and licence, record its access date, and confirm that no participant data are involved before analysis.",
      },
      {
        id: "MTH-02",
        objectiveIds: ["OBJ-02"],
        text: "Compare model explanation maps with pre-specified expert regions using an auditable overlap protocol.",
        dataAndEthicsPlan: "Confirm whether expert-review permission is required and retain no identifiable reviewer details in the comparison ledger.",
      },
      {
        id: "MTH-03",
        objectiveIds: ["OBJ-03"],
        text: "Log class imbalance, ambiguous labels, image artifacts, and cases where explanations are not interpretable.",
        dataAndEthicsPlan: "Store error logs without personal information and record any access or retention restrictions before analysing limitations.",
      },
    ],
    priorResearch: [
      {
        id: "PRV-01",
        title: "Synthetic visual-explanation evaluation pattern",
        citation: "Synthetic demo record — replace with a verified thesis or article.",
        context: "Image classification and explanation-map assessment for selected flowering-plant leaf images.",
        researchQuestion: "How can visual explanations be checked against relevant image regions?",
        methodology: "A planned comparison of explanation maps with pre-specified reference regions.",
        findings: "No findings recorded; this is a synthetic method pattern only.",
        limitations: "A real source is needed before any claim about model behavior or data quality.",
        status: "planned",
      },
      {
        id: "PRV-02",
        title: "Synthetic dataset-provenance planning pattern",
        citation: "Synthetic demo record — replace with a verified thesis or article.",
        context: "Dataset provenance, label review, and uncertainty logging for applied image studies.",
        researchQuestion: "Which provenance checks should precede an image-classification evaluation?",
        methodology: "A planning checklist for selection criteria, licenses, and held-out evaluation.",
        findings: "No findings recorded; this is a planning example only.",
        limitations: "Does not establish the quality or suitability of any real dataset.",
        status: "planned",
      },
    ],
    sources: [
      {
        id: "SRC-01",
        label: "Leaf-image dataset selection protocol",
        kind: "dataset",
        status: "planned",
        note: "A real dataset and license must be recorded before analysis.",
      },
      {
        id: "SRC-02",
        label: "Explainability evaluation evidence map",
        kind: "literature-map",
        status: "planned",
        note: "Replace with verified scholarly sources during the literature review.",
      },
    ],
    results: [],
  },
  {
    id: "rural-access-plan",
    demoLabel: "Synthetic demonstration project • no survey or archival findings",
    title: "Access to Digital Learning Resources Across Selected Rural Colleges",
    discipline: "Education and information studies",
    researchQuestion:
      "Which institutional conditions shape access to digital learning resources in selected rural colleges?",
    scope:
      "A comparative, mixed-methods research plan. The dashboard contains no respondent data, institutional records, or completed findings.",
    objectives: [
      {
        id: "OBJ-01",
        text: "Map access pathways, availability constraints, and support arrangements.",
      },
      {
        id: "OBJ-02",
        text: "Compare patterns across cases using a transparent coding framework.",
      },
      {
        id: "OBJ-03",
        text: "Specify the privacy, consent, and de-identification process before fieldwork.",
      },
    ],
    methods: [
      {
        id: "MTH-01",
        objectiveIds: ["OBJ-01"],
        text: "Collect an institutional inventory and participant-approved accounts of access pathways after ethics review.",
        dataAndEthicsPlan: "Confirm institutional permission and ethics requirements before recruitment, then obtain consent before collecting participant accounts.",
      },
      {
        id: "MTH-02",
        objectiveIds: ["OBJ-02"],
        text: "Apply a shared case-comparison matrix and retain source links for every coded observation.",
        dataAndEthicsPlan: "Remove direct identifiers, store the coding matrix securely, and document authorised access before any comparative analysis.",
      },
      {
        id: "MTH-03",
        objectiveIds: ["OBJ-03"],
        text: "Use consent records, removal of direct identifiers, and a documented retention schedule.",
        dataAndEthicsPlan: "Confirm retention, deletion, consent withdrawal, and data-access procedures with the supervisor or relevant ethics process.",
      },
    ],
    priorResearch: [
      {
        id: "PRV-01",
        title: "Synthetic rural learning-access comparison pattern",
        citation: "Synthetic demo record — replace with a verified thesis or article.",
        context: "Digital learning-resource access across selected rural college settings.",
        researchQuestion: "Which institutional arrangements shape access to digital learning resources?",
        methodology: "A planned case-comparison matrix with source links for each coded observation.",
        findings: "No findings recorded; this is a synthetic method pattern only.",
        limitations: "Does not describe outcomes at any real institution or for any participants.",
        status: "planned",
      },
      {
        id: "PRV-02",
        title: "Synthetic consent-and-privacy design pattern",
        citation: "Synthetic demo record — replace with a verified thesis or article.",
        context: "Consent, de-identification, and retention planning for education research.",
        researchQuestion: "How should participant accounts and institutional records be protected?",
        methodology: "A proposed privacy review before fieldwork and qualitative coding.",
        findings: "No findings recorded; this is a planning example only.",
        limitations: "Needs a real approved protocol and institutional requirements before use.",
        status: "planned",
      },
    ],
    sources: [
      {
        id: "SRC-01",
        label: "Institutional resource inventory template",
        kind: "policy-record",
        status: "planned",
        note: "Collect only with institutional permission and retain the source date.",
      },
      {
        id: "SRC-02",
        label: "Rural digital-access literature map",
        kind: "literature-map",
        status: "planned",
        note: "Replace with verified sources and a documented search strategy.",
      },
    ],
    results: [],
  },
];

export const DEFAULT_PROJECT_ID = DEMO_PROJECTS[0].id;
