import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dir, "../..");
const runtimeTargets = [
  "next.config.ts",
  "package.json",
  "scripts",
  "src",
];
const forbiddenRuntimeReferences = [
  /@eazo\/(?:sdk|node-sdk)/,
  /eazo-brand-banner/,
  /\bEazoProvider\b/,
  /\buseEazo\b/,
  /\bUserSyncEffect\b/,
];

function readRuntimeSources(path: string): Array<{ path: string; source: string }> {
  const absolutePath = resolve(projectRoot, path);
  const entries = readdirSync(absolutePath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativePath = `${path}/${entry.name}`;
    if (entry.isDirectory()) return readRuntimeSources(relativePath);
    if (/\.test\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    return [{ path: relativePath, source: readFileSync(resolve(projectRoot, relativePath), "utf8") }];
  });
}

test("standalone runtime has no Eazo SDK or branding integration", () => {
  const runtimeSources = runtimeTargets.flatMap((target) => {
    const absolutePath = resolve(projectRoot, target);
    if (target.includes(".")) return [{ path: target, source: readFileSync(absolutePath, "utf8") }];
    return readRuntimeSources(target);
  });

  for (const { path, source } of runtimeSources) {
    for (const forbiddenReference of forbiddenRuntimeReferences) {
      expect(source).not.toMatch(forbiddenReference, path);
    }
  }
});
