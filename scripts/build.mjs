import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = fileURLToPath(new URL("../", import.meta.url));

/** Run both existing build stages with their documented optional-telemetry opt-outs. */
export function runBuild({ env = process.env, execute = spawnSync } = {}) {
  const buildEnv = { ...env, EVE_TELEMETRY_DISABLED: "1", NEXT_TELEMETRY_DISABLED: "1" };
  const stages = [
    resolve(dirname(require.resolve("eve/package.json")), "bin/eve.js"),
    require.resolve("next/dist/bin/next"),
  ];
  for (const entry of stages) {
    const result = execute(process.execPath, [entry, "build"], {
      cwd: projectRoot, env: buildEnv, shell: false, stdio: "inherit",
    });
    if (result.error || result.signal || result.status !== 0) return result.status || 1;
  }
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = runBuild();
}
