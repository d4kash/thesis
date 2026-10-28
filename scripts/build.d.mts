import type { SpawnSyncOptions, SpawnSyncReturns } from "node:child_process";

export function runBuild(options?: {
  env?: NodeJS.ProcessEnv;
  execute?: (file: string, args: string[], options: SpawnSyncOptions) => SpawnSyncReturns<Buffer>;
}): number;
