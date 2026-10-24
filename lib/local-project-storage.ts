import type {
  EvidenceSource,
  LiteratureEvidenceNote,
  PriorResearchRecord,
  ResearchMethod,
  ResearchObjective,
  ResultLedgerItem,
  SynopsisDetails,
  ThesisProject,
} from "@/lib/thesis-types";

export const LOCAL_PROJECT_STORAGE_KEY = "thesis-studio:local-plan:v1";

export interface LocalProjectStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string";
}

function hasOptionalString(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || typeof record[key] === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isResearchObjective(value: unknown): value is ResearchObjective {
  return isRecord(value) && hasString(value, "id") && hasString(value, "text");
}

function isResearchMethod(value: unknown): value is ResearchMethod {
  return isRecord(value)
    && hasString(value, "id")
    && hasString(value, "text")
    && isStringArray(value.objectiveIds)
    && hasOptionalString(value, "dataAndEthicsPlan");
}

function isEvidenceSource(value: unknown): value is EvidenceSource {
  return isRecord(value)
    && hasString(value, "id")
    && hasString(value, "label")
    && hasString(value, "note")
    && hasOptionalString(value, "locator")
    && hasOptionalString(value, "checkedOn")
    && ["dataset", "literature-map", "policy-record", "field-note"].includes(value.kind as string)
    && ["planned", "reviewed", "verified"].includes(value.status as string);
}

function isPriorResearchRecord(value: unknown): value is PriorResearchRecord {
  return isRecord(value)
    && ["id", "title", "citation", "context", "researchQuestion", "methodology", "findings", "limitations"].every((key) => hasString(value, key))
    && hasOptionalString(value, "checkedOn")
    && ["planned", "reviewed", "verified"].includes(value.status as string);
}

function isLiteratureEvidenceNote(value: unknown): value is LiteratureEvidenceNote {
  return isRecord(value)
    && ["id", "sourceId", "claim", "locator"].every((key) => hasString(value, key))
    && ["background", "method", "comparison", "limitation"].includes(value.use as string)
    && ["reviewed", "verified"].includes(value.status as string);
}

function isResultLedgerItem(value: unknown): value is ResultLedgerItem {
  return isRecord(value)
    && ["id", "label", "note"].every((key) => hasString(value, key))
    && ["unverified", "verified"].includes(value.verification as string)
    && isStringArray(value.sourceIds)
    && isStringArray(value.methodIds);
}

function isSynopsisDetails(value: unknown): value is SynopsisDetails {
  return isRecord(value)
    && ["problemStatement", "anticipatedContribution", "ethicsAndPermissions"].every((key) => hasString(value, key));
}

export function isStoredLocalProject(value: unknown): value is ThesisProject {
  if (!isRecord(value) || value.id !== "local-plan") return false;

  return ["demoLabel", "title", "discipline", "researchQuestion", "scope"].every((key) => hasString(value, key))
    && Array.isArray(value.objectives) && value.objectives.every(isResearchObjective)
    && Array.isArray(value.methods) && value.methods.every(isResearchMethod)
    && Array.isArray(value.priorResearch) && value.priorResearch.every(isPriorResearchRecord)
    && Array.isArray(value.sources) && value.sources.every(isEvidenceSource)
    && (value.literatureNotes === undefined || (Array.isArray(value.literatureNotes) && value.literatureNotes.every(isLiteratureEvidenceNote)))
    && Array.isArray(value.results) && value.results.every(isResultLedgerItem)
    && (value.synopsis === undefined || isSynopsisDetails(value.synopsis));
}

export function loadLocalProject(storage: LocalProjectStorage): ThesisProject | null {
  try {
    const value = storage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    if (!isStoredLocalProject(parsed)) return null;

    return { ...parsed, literatureNotes: parsed.literatureNotes ?? [] };
  } catch {
    return null;
  }
}

export function saveLocalProject(storage: LocalProjectStorage, project: ThesisProject): boolean {
  if (project.id !== "local-plan") return false;

  try {
    storage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalProject(storage: LocalProjectStorage): boolean {
  try {
    storage.removeItem(LOCAL_PROJECT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
