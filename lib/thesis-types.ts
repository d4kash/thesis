export type EvidenceStatus = "planned" | "reviewed" | "verified";
export type IssueSeverity = "critical" | "warning" | "info";
export type DraftSectionKey =
  | "overview"
  | "research-landscape"
  | "literature-plan"
  | "research-design"
  | "evidence-plan"
  | "results-status"
  | "discussion"
  | "conclusion";

export interface EvidenceSource {
  id: string;
  label: string;
  kind: "dataset" | "literature-map" | "policy-record" | "field-note";
  status: EvidenceStatus;
  note: string;
}

export interface ResearchObjective {
  id: string;
  text: string;
}

export interface ResearchMethod {
  id: string;
  objectiveIds: string[];
  text: string;
}

export interface ResultLedgerItem {
  id: string;
  label: string;
  verification: "unverified" | "verified";
  note: string;
  sourceIds: string[];
}

export interface PriorResearchRecord {
  id: string;
  title: string;
  citation: string;
  context: string;
  researchQuestion: string;
  methodology: string;
  findings: string;
  limitations: string;
  status: EvidenceStatus;
}

export interface ThesisProject {
  id: string;
  demoLabel: string;
  title: string;
  discipline: string;
  researchQuestion: string;
  scope: string;
  objectives: ResearchObjective[];
  methods: ResearchMethod[];
  priorResearch: PriorResearchRecord[];
  sources: EvidenceSource[];
  results: ResultLedgerItem[];
}

export interface DraftSection {
  id: DraftSectionKey;
  heading: string;
  body: string;
  claimIds: string[];
}

export interface QualityIssue {
  id: string;
  severity: IssueSeverity;
  title: string;
  detail: string;
  fix: string;
}

export interface QualityReport {
  issues: QualityIssue[];
  score: number;
  canExportAsDraft: boolean;
  sourceCount: number;
  verifiedSourceCount: number;
  priorResearchCount: number;
  verifiedPriorResearchCount: number;
  resultCount: number;
  verifiedResultCount: number;
}
