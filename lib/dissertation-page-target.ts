export const DEFAULT_DISSERTATION_PAGE_TARGET = 300;
export const MIN_DISSERTATION_PAGE_TARGET = 80;
export const MAX_DISSERTATION_PAGE_TARGET = 600;

// A planning preference only: never a claim about written or approved pages.
export function isDissertationPageTarget(value: unknown): value is number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= MIN_DISSERTATION_PAGE_TARGET
    && value <= MAX_DISSERTATION_PAGE_TARGET;
}
