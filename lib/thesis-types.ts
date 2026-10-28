export type EvidenceStatus = "planned" | "reviewed" | "verified";
export type LiteratureEvidenceStatus = "reviewed" | "verified";
export type LiteratureUse = "background" | "method" | "comparison" | "limitation";
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
  locator?: string;
  checkedOn?: string;
  kind: "dataset" | "literature-map" | "policy-record" | "field-note";
  status: EvidenceStatus;
  note: string;
}

export interface LiteratureEvidenceNote {
  id: string;
  sourceId: string;
  claim: string;
  locator: string;
  use: LiteratureUse;
  status: LiteratureEvidenceStatus;
}

export interface ResearchObjective {
  id: string;
  text: string;
}

export interface ResearchMethod {
  id: string;
  objectiveIds: string[];
  text: string;
  dataAndEthicsPlan?: string;
}

export interface ResultLedgerItem {
  id: string;
  label: string;
  verification: "unverified" | "verified";
  note: string;
  sourceIds: string[];
  methodIds: string[];
}

export interface PriorResearchRecord {
  id: string;
  title: string;
  citation: string;
  accessNote?: string;
  checkedOn?: string;
  context: string;
  researchQuestion: string;
  methodology: string;
  findings: string;
  limitations: string;
  status: EvidenceStatus;
}

export interface SynopsisDetails {
  problemStatement: string;
  anticipatedContribution: string;
  ethicsAndPermissions: string;
}

export interface ThesisProject {
  id: string;
  demoLabel: string;
  title: string;
  discipline: string;
  researchQuestion: string;
  scope: string;
  dissertationPageTarget?: number;
  objectives: ResearchObjective[];
  methods: ResearchMethod[];
  synopsis?: SynopsisDetails;
  priorResearch: PriorResearchRecord[];
  sources: EvidenceSource[];
  literatureNotes?: LiteratureEvidenceNote[];
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
  literatureNoteCount: number;
  verifiedLiteratureNoteCount: number;
  resultCount: number;
  verifiedResultCount: number;
}
