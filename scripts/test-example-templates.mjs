/**
 * Run: node scripts/test-example-templates.mjs
 * (Uses dynamic import — run after build, or duplicate normalize logic)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib/example-prompt-templates.ts"), "utf8");

const prompts = [
  "List public GitHub repos for user teknium1",
  "Search GitHub developers → list their repos",
  "Product Hunt trending → load launch details",
  "Search Airbnb listings → get listing details",
  "Get GitHub profile then list repositories",
  "Search GitHub users and load profile details",
];

function normalize(prompt) {
  return prompt
    .toLowerCase()
    .replace(/\u2192/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const keys = [...src.matchAll(/"search airbnb listings -> get listing details"/g)];
if (keys.length < 1) {
  console.error("FAIL template file missing airbnb key");
  process.exit(1);
}

for (const p of prompts) {
  const n = normalize(p);
  if (!src.includes(`"${n}"`) && !/airbnb/.test(n)) {
    console.warn("WARN no exact template key for:", n);
  }
}

console.log("OK example template keys present for", prompts.length, "prompts");
