console.log("Generating git-info.json");

import { $ } from "bun";
import { readFile } from "fs/promises";

async function readText(path: string) {
  try {
    return (await readFile(path, "utf8")).trim();
  } catch {
    return undefined;
  }
}

async function gitValue(command: TemplateStringsArray) {
  const result = await $(command).quiet().nothrow();

  if (result.exitCode !== 0) {
    return undefined;
  }

  return result.text().trim();
}

async function headRef() {
  const head = await readText(".git/HEAD");

  if (!head?.startsWith("ref: ")) {
    return undefined;
  }

  return head.slice("ref: ".length);
}

async function branchFromGitFiles() {
  const ref = await headRef();

  return ref?.startsWith("refs/heads/")
    ? ref.slice("refs/heads/".length)
    : undefined;
}

async function commitFromGitFiles() {
  const head = await readText(".git/HEAD");

  if (!head) {
    return undefined;
  }

  if (!head.startsWith("ref: ")) {
    return head.slice(0, 7);
  }

  const ref = head.slice("ref: ".length);
  const looseRef = await readText(`.git/${ref}`);

  if (looseRef) {
    return looseRef.slice(0, 7);
  }

  const packedRefs = await readText(".git/packed-refs");
  const packedRef = packedRefs
    ?.split("\n")
    .find((line) => !line.startsWith("#") && line.endsWith(` ${ref}`));

  return packedRef?.slice(0, 7);
}

const branch =
  process.env.GIT_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  (await branchFromGitFiles()) ||
  (await gitValue`git rev-parse --abbrev-ref HEAD`) ||
  "unknown";

const commit =
  process.env.GIT_COMMIT ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  (await commitFromGitFiles()) ||
  (await gitValue`git rev-parse --short HEAD`) ||
  "unknown";

const gitInfo = { branch, commit };

await Bun.file("src/git-info.json").write(JSON.stringify(gitInfo, null, 2));
console.log("git-info.json generated:", gitInfo);
console.log("Finished generating git-info.json");
// console.log("Clearing image fetch cache...");

// await rmdir(".next/cache/images", { recursive: true }).catch((err) => {
//   if (err.code !== "ENOENT") {
//     console.error("Failed to clear image fetch cache:", err);
//   }
// });

// console.log("Image fetch cache cleared.");
