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
import { normalizeLiteratureVerification } from "@/lib/literature-readiness";
import { isDissertationPageTarget } from "@/lib/dissertation-page-target";
import { normalizePriorResearchVerification } from "@/lib/prior-research-readiness";
import { normalizeResultVerification, normalizeSourceVerification } from "@/lib/result-readiness";

export const LOCAL_PROJECT_STORAGE_KEY = "thesis-studio:local-plan:v1";
export const LOCAL_PROJECT_BACKUP_FORMAT = "thesis-studio-local-project";
export const LOCAL_PROJECT_BACKUP_VERSION = 1;
export const MAX_LOCAL_PROJECT_BACKUP_BYTES = 250_000;
export const MAX_LOCAL_PROJECT_TEXT_CHARACTERS = 12_000;

export interface LocalProjectStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

interface LocalProjectBackup {
  format: typeof LOCAL_PROJECT_BACKUP_FORMAT;
  project: ThesisProject;
  version: typeof LOCAL_PROJECT_BACKUP_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string" && record[key].length <= MAX_LOCAL_PROJECT_TEXT_CHARACTERS;
}

function hasNonEmptyString(record: Record<string, unknown>, key: string): boolean {
  return hasString(record, key) && (record[key] as string).trim().length > 0;
}

function hasOptionalString(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined
    || (typeof record[key] === "string" && record[key].length <= MAX_LOCAL_PROJECT_TEXT_CHARACTERS);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isResearchObjective(value: unknown): value is ResearchObjective {
  return isRecord(value) && hasNonEmptyString(value, "id") && hasString(value, "text");
}

function isResearchMethod(value: unknown): value is ResearchMethod {
  return isRecord(value)
    && hasNonEmptyString(value, "id")
    && hasString(value, "text")
    && isStringArray(value.objectiveIds)
    && hasOptionalString(value, "dataAndEthicsPlan");
}

function isEvidenceSource(value: unknown): value is EvidenceSource {
  return isRecord(value)
    && hasNonEmptyString(value, "id")
    && hasString(value, "label")
    && hasString(value, "note")
    && hasOptionalString(value, "locator")
    && hasOptionalString(value, "checkedOn")
    && ["dataset", "literature-map", "policy-record", "field-note"].includes(value.kind as string)
    && ["planned", "reviewed", "verified"].includes(value.status as string);
}

function isPriorResearchRecord(value: unknown): value is PriorResearchRecord {
  return isRecord(value)
    && hasNonEmptyString(value, "id")
    && ["title", "citation", "context", "researchQuestion", "methodology", "findings", "limitations"].every((key) => hasString(value, key))
    && hasOptionalString(value, "accessNote")
    && hasOptionalString(value, "checkedOn")
    && ["planned", "reviewed", "verified"].includes(value.status as string);
}

function isLiteratureEvidenceNote(value: unknown): value is LiteratureEvidenceNote {
  return isRecord(value)
    && ["id", "sourceId"].every((key) => hasNonEmptyString(value, key))
    && ["claim", "locator"].every((key) => hasString(value, key))
    && ["background", "method", "comparison", "limitation"].includes(value.use as string)
    && ["reviewed", "verified"].includes(value.status as string);
}

function isResultLedgerItem(value: unknown): value is ResultLedgerItem {
  return isRecord(value)
    && hasNonEmptyString(value, "id")
    && ["label", "note"].every((key) => hasString(value, key))
    && ["unverified", "verified"].includes(value.verification as string)
    && isStringArray(value.sourceIds)
    && isStringArray(value.methodIds);
}

function isSynopsisDetails(value: unknown): value is SynopsisDetails {
  return isRecord(value)
    && ["problemStatement", "anticipatedContribution", "ethicsAndPermissions"].every((key) => hasString(value, key));
}

function hasUniqueIds(records: Array<{ id: string }>): boolean {
  return new Set(records.map((record) => record.id)).size === records.length;
}

function hasUniqueKnownReferences(referenceIds: string[], knownIds: Set<string>): boolean {
  return new Set(referenceIds).size === referenceIds.length
    && referenceIds.every((id) => knownIds.has(id));
}

export function isStoredLocalProject(value: unknown): value is ThesisProject {
  if (!isRecord(value) || value.id !== "local-plan") return false;

  const hasValidShape = ["demoLabel", "title", "discipline", "researchQuestion", "scope"].every((key) => hasString(value, key))
    && (value.dissertationPageTarget === undefined || isDissertationPageTarget(value.dissertationPageTarget))
    && Array.isArray(value.objectives) && value.objectives.every(isResearchObjective)
    && Array.isArray(value.methods) && value.methods.every(isResearchMethod)
    && Array.isArray(value.priorResearch) && value.priorResearch.every(isPriorResearchRecord)
    && Array.isArray(value.sources) && value.sources.every(isEvidenceSource)
    && (value.literatureNotes === undefined || (Array.isArray(value.literatureNotes) && value.literatureNotes.every(isLiteratureEvidenceNote)))
    && Array.isArray(value.results) && value.results.every(isResultLedgerItem)
    && (value.synopsis === undefined || isSynopsisDetails(value.synopsis));

  if (!hasValidShape) return false;

  const project = value as unknown as ThesisProject;
  const literatureNotes = project.literatureNotes ?? [];
  const objectiveIds = new Set(project.objectives.map((objective) => objective.id));
  const methodIds = new Set(project.methods.map((method) => method.id));
  const sourceIds = new Set(project.sources.map((source) => source.id));

  return hasUniqueIds(project.objectives)
    && hasUniqueIds(project.methods)
    && hasUniqueIds(project.priorResearch)
    && hasUniqueIds(project.sources)
    && hasUniqueIds(literatureNotes)
    && hasUniqueIds(project.results)
    && project.methods.every((method) => hasUniqueKnownReferences(method.objectiveIds, objectiveIds))
    && literatureNotes.every((note) => sourceIds.has(note.sourceId))
    && project.results.every((result) => (
      hasUniqueKnownReferences(result.sourceIds, sourceIds)
      && hasUniqueKnownReferences(result.methodIds, methodIds)
    ));
}

function normalizeStoredLocalProject(project: ThesisProject): ThesisProject {
  const sources = project.sources.map(normalizeSourceVerification);
  const literatureNotes = (project.literatureNotes ?? []).map((note) => normalizeLiteratureVerification(note, sources));
  const priorResearch = project.priorResearch.map(normalizePriorResearchVerification);
  const results = project.results.map((result) => normalizeResultVerification(result, sources, project.methods));

  return { ...project, literatureNotes, priorResearch, results, sources };
}

export function loadLocalProject(storage: LocalProjectStorage): ThesisProject | null {
  try {
    const value = storage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    if (!value) return null;

    const parsed: unknown = JSON.parse(value);
    if (!isStoredLocalProject(parsed)) return null;

    return normalizeStoredLocalProject(parsed);
  } catch {
    return null;
  }
}

export function buildLocalProjectBackup(project: ThesisProject): string | null {
  if (!isStoredLocalProject(project)) return null;

  const backup: LocalProjectBackup = {
    format: LOCAL_PROJECT_BACKUP_FORMAT,
    project: normalizeStoredLocalProject(project),
    version: LOCAL_PROJECT_BACKUP_VERSION,
  };
  const serializedBackup = JSON.stringify(backup, null, 2);

  return textByteLength(serializedBackup) <= MAX_LOCAL_PROJECT_BACKUP_BYTES ? serializedBackup : null;
}

export function parseLocalProjectBackup(value: string): ThesisProject | null {
  if (textByteLength(value) > MAX_LOCAL_PROJECT_BACKUP_BYTES) return null;

  try {
    const backup: unknown = JSON.parse(value);
    if (!isRecord(backup)
      || backup.format !== LOCAL_PROJECT_BACKUP_FORMAT
      || backup.version !== LOCAL_PROJECT_BACKUP_VERSION
      || !isStoredLocalProject(backup.project)) {
      return null;
    }

    return normalizeStoredLocalProject(backup.project);
  } catch {
    return null;
  }
}

export function saveLocalProject(storage: LocalProjectStorage, project: ThesisProject): boolean {
  if (!isStoredLocalProject(project)) return false;

  try {
    storage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify(normalizeStoredLocalProject(project)));
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
