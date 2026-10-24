import type { ResearchMethod } from "@/lib/thesis-types";

export const METHOD_PLAN_MINIMUM_LENGTH = 12;

export function hasMethodDataAndEthicsPlan(method: ResearchMethod | undefined): boolean {
  return (method?.dataAndEthicsPlan?.trim().length ?? 0) >= METHOD_PLAN_MINIMUM_LENGTH;
}
