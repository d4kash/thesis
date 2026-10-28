import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import type { SpawnSyncOptions, SpawnSyncReturns } from "node:child_process";

const result = (status: number | null, signal: NodeJS.Signals | null = null): SpawnSyncReturns<Buffer> => ({
  pid: 0, output: [], stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), status, signal,
});

test("normal build uses the telemetry-private full build runner", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.build, "node scripts/build.mjs");
});

test("both build stages retain normal arguments with documented telemetry opt-outs", async () => {
  const { runBuild } = await import("../scripts/build.mjs");
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", PATH: "/synthetic-path", EVE_TELEMETRY_DISABLED: "", NEXT_TELEMETRY_DISABLED: "" };
  const before = { ...env };
  const calls: Array<{ file: string; args: string[]; options: SpawnSyncOptions }> = [];
  assert.equal(runBuild({ env, execute(file, args, options) {
    calls.push({ file, args, options });
    return result(0);
  } }), 0);
  assert.equal(calls.length, 2);
  assert.match(calls[0].args[0], /eve[/\\]bin[/\\]eve\.js$/);
  assert.match(calls[1].args[0], /next[/\\]dist[/\\]bin[/\\]next$/);
  for (const call of calls) {
    assert.equal(call.file, process.execPath);
    assert.deepEqual(call.args.slice(1), ["build"]);
    assert.equal(call.options.shell, false);
    assert.equal(call.options.env?.EVE_TELEMETRY_DISABLED, "1");
    assert.equal(call.options.env?.NEXT_TELEMETRY_DISABLED, "1");
    assert.equal(call.options.env?.PATH, env.PATH);
  }
  assert.deepEqual(env, before);
});

test("Eve build failure stops before Next and preserves failure status", async () => {
  const { runBuild } = await import("../scripts/build.mjs");
  let calls = 0;
  assert.equal(runBuild({ execute() { calls += 1; return result(7); } }), 7);
  assert.equal(calls, 1);
});

test("Next build failure is not hidden", async () => {
  const { runBuild } = await import("../scripts/build.mjs");
  let calls = 0;
  assert.equal(runBuild({ execute() { return result(++calls === 1 ? 0 : 9); } }), 9);
  assert.equal(calls, 2);
});

test("terminated build fails closed", async () => {
  const { runBuild } = await import("../scripts/build.mjs");
  assert.equal(runBuild({ execute() { return result(null, "SIGTERM"); } }), 1);
});
