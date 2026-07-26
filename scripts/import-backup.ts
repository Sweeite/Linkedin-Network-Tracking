/**
 * One-time importer for the old prototype's "Export backup" JSON file.
 *
 * Usage:
 *   npx tsx scripts/import-backup.ts <path-to-export.json> <owner-user-id>
 *
 * See the "Importing a prototype backup" section of README.md for full
 * instructions, including where to find the service role key and the
 * owner's user id in the Supabase dashboard.
 *
 * All parsing/validation/mapping logic lives in scripts/lib/backup-import.ts
 * as pure functions with no I/O, so it can be exercised without live
 * Supabase credentials - this file is just the CLI/I-O wrapper around it.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { Database } from "../src/lib/database.types";
import {
  ExportValidationError,
  mapPeople,
  mapPosts,
  parseExportShape,
  type MappedPerson,
  type MappedPost,
} from "./lib/backup-import";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function printUsage(): void {
  console.log(`
Import a prototype "Export backup" JSON file into the real Signal Log
Supabase tables (people, posts).

Usage:
  npx tsx scripts/import-backup.ts <path-to-export.json> <owner-user-id>

Arguments:
  path-to-export.json  Path to the JSON file produced by the prototype's
                        "Export backup" button, shaped like:
                          { "exportedAt": "...", "people": [...], "posts": [...] }
  owner-user-id         The Supabase auth.users.id (a UUID) that every
                        imported row will be stamped with. Find it in the
                        Supabase dashboard under Authentication -> Users.

Required environment variables:
  SUPABASE_SERVICE_ROLE_KEY  Service role key for the project (Project
                              Settings -> API in the Supabase dashboard).
                              Bypasses Row Level Security - never commit it.
  NEXT_PUBLIC_SUPABASE_URL   Read automatically from .env.local if present.

Example:
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
    npx tsx scripts/import-backup.ts ~/Downloads/signal-log-export.json 8c2e...-...-...

Notes:
  - Safe to re-run: existing rows are matched by name (people) or by
    title + date_posted (posts) for the same owner-user-id and skipped
    rather than duplicated.
  - Records with missing/unexpected fields are warned about and filled
    with the column's normal default rather than crashing or inventing data.
`);
}

/** Minimal .env file loader (no dependency on `dotenv`). Does not override
 * variables already present in process.env (e.g. set directly in the shell). */
function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const contents = readFileSync(path, "utf-8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

interface Summary {
  peopleInserted: number;
  peopleSkippedDedup: number;
  peopleSkippedInvalid: number;
  postsInserted: number;
  postsSkippedDedup: number;
  postsSkippedInvalid: number;
  warnings: number;
}

function dedupeWithinBatch(
  rows: MappedPerson[],
  warnings: string[]
): MappedPerson[] {
  const seen = new Set<string>();
  const result: MappedPerson[] = [];
  for (const row of rows) {
    const key = row.name;
    if (seen.has(key)) {
      warnings.push(
        `people: duplicate entry for name "${row.name}" within the backup file itself, keeping the first occurrence`
      );
      continue;
    }
    seen.add(key);
    result.push(row);
  }
  return result;
}

function postKey(title: string | null, datePosted: string | null): string {
  return `${title ?? ""} ${datePosted ?? ""}`;
}

function dedupePostsWithinBatch(
  rows: MappedPost[],
  warnings: string[]
): MappedPost[] {
  const seen = new Set<string>();
  const result: MappedPost[] = [];
  for (const row of rows) {
    const key = postKey(row.title, row.date_posted);
    if (seen.has(key)) {
      warnings.push(
        `posts: duplicate entry for title ${JSON.stringify(row.title)} / date_posted ${JSON.stringify(row.date_posted)} within the backup file itself, keeping the first occurrence`
      );
      continue;
    }
    seen.add(key);
    result.push(row);
  }
  return result;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  if (args.length < 2) {
    console.error(
      "Error: expected 2 arguments (path-to-export.json, owner-user-id).\n"
    );
    printUsage();
    process.exit(1);
  }

  const [filePathArg, userId] = args;

  if (!UUID_RE.test(userId)) {
    console.error(
      `Error: "${userId}" does not look like a UUID. Find the owner's user id in ` +
        `the Supabase dashboard under Authentication -> Users.`
    );
    process.exit(1);
  }

  const filePath = resolve(process.cwd(), filePathArg);
  if (!existsSync(filePath)) {
    console.error(`Error: file not found: ${filePath}`);
    process.exit(1);
  }

  // Load .env.local (for NEXT_PUBLIC_SUPABASE_URL) without overriding
  // anything already exported in the shell (e.g. SUPABASE_SERVICE_ROLE_KEY).
  loadEnvFile(join(REPO_ROOT, ".env.local"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL is not set (checked process.env and .env.local)."
    );
    process.exit(1);
  }
  if (!serviceRoleKey) {
    console.error(
      "Error: SUPABASE_SERVICE_ROLE_KEY is not set. Export it in your shell before " +
        "running this script - see `npx tsx scripts/import-backup.ts --help`."
    );
    process.exit(1);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error(
      `Error: failed to parse ${filePath} as JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }

  let exportData;
  try {
    exportData = parseExportShape(raw);
  } catch (error) {
    if (error instanceof ExportValidationError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }

  console.log(
    `Read backup exported at ${exportData.exportedAt}: ${exportData.people.length} people, ${exportData.posts.length} posts.\n`
  );

  const peopleResult = mapPeople(exportData.people, userId);
  const postsResult = mapPosts(exportData.posts, userId);

  const allWarnings = [...peopleResult.warnings, ...postsResult.warnings];

  const dedupedPeople = dedupeWithinBatch(peopleResult.rows, allWarnings);
  const dedupedPosts = dedupePostsWithinBatch(postsResult.rows, allWarnings);

  for (const skip of peopleResult.skipped) {
    console.warn(`SKIPPED ${skip.reason}`);
  }
  for (const skip of postsResult.skipped) {
    console.warn(`SKIPPED ${skip.reason}`);
  }
  for (const warning of allWarnings) {
    console.warn(`WARNING: ${warning}`);
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary: Summary = {
    peopleInserted: 0,
    peopleSkippedDedup: 0,
    peopleSkippedInvalid: peopleResult.skipped.length,
    postsInserted: 0,
    postsSkippedDedup: 0,
    postsSkippedInvalid: postsResult.skipped.length,
    warnings: allWarnings.length,
  };

  // --- People: dedupe against existing rows by name, then insert ---
  const { data: existingPeople, error: existingPeopleError } = await supabase
    .from("people")
    .select("name")
    .eq("user_id", userId);

  if (existingPeopleError) {
    console.error(
      `Error: failed to fetch existing people for dedup: ${existingPeopleError.message}`
    );
    process.exit(1);
  }

  const existingPeopleNames = new Set(
    (existingPeople ?? []).map((row) => row.name)
  );
  const peopleToInsert = dedupedPeople.filter(
    (row) => !existingPeopleNames.has(row.name)
  );
  summary.peopleSkippedDedup = dedupedPeople.length - peopleToInsert.length;

  if (peopleToInsert.length > 0) {
    const { error: insertPeopleError } = await supabase
      .from("people")
      .insert(peopleToInsert);
    if (insertPeopleError) {
      console.error(
        `Error: failed to insert people: ${insertPeopleError.message}`
      );
      process.exit(1);
    }
    summary.peopleInserted = peopleToInsert.length;
  }

  // --- Posts: dedupe against existing rows by title + date_posted ---
  const { data: existingPosts, error: existingPostsError } = await supabase
    .from("posts")
    .select("title, date_posted")
    .eq("user_id", userId);

  if (existingPostsError) {
    console.error(
      `Error: failed to fetch existing posts for dedup: ${existingPostsError.message}`
    );
    process.exit(1);
  }

  const existingPostKeys = new Set(
    (existingPosts ?? []).map((row) => postKey(row.title, row.date_posted))
  );
  const postsToInsert = dedupedPosts.filter(
    (row) => !existingPostKeys.has(postKey(row.title, row.date_posted))
  );
  summary.postsSkippedDedup = dedupedPosts.length - postsToInsert.length;

  if (postsToInsert.length > 0) {
    const { error: insertPostsError } = await supabase
      .from("posts")
      .insert(postsToInsert);
    if (insertPostsError) {
      console.error(
        `Error: failed to insert posts: ${insertPostsError.message}`
      );
      process.exit(1);
    }
    summary.postsInserted = postsToInsert.length;
  }

  console.log("\n--- Summary ---");
  console.log(
    `People: ${summary.peopleInserted} inserted, ${summary.peopleSkippedDedup} skipped (already existed), ${summary.peopleSkippedInvalid} skipped (invalid record)`
  );
  console.log(
    `Posts:  ${summary.postsInserted} inserted, ${summary.postsSkippedDedup} skipped (already existed), ${summary.postsSkippedInvalid} skipped (invalid record)`
  );
  console.log(`Warnings: ${summary.warnings}`);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
