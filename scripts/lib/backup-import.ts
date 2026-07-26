/**
 * Pure parsing / validation / mapping logic for importing a prototype
 * "Export backup" JSON file into the shape the real `people` / `posts`
 * tables expect.
 *
 * Deliberately has ZERO I/O (no fs, no network, no Supabase client) so it
 * can be unit-exercised against a sample file without any live credentials.
 * See scripts/import-backup.ts for the CLI wrapper that reads the file and
 * talks to Supabase.
 */

// ---------------------------------------------------------------------------
// Row types (mirror the Insert shapes in src/lib/database.types.ts, minus
// the columns the DB fills in itself: id, created_at, updated_at).
// ---------------------------------------------------------------------------

export const PEOPLE_STAGES = [
  "Connected",
  "Conversing",
  "Nurturing",
  "Converted",
] as const;
export type PeopleStage = (typeof PEOPLE_STAGES)[number];

export const CONVERSATION_DEPTHS = ["single", "multi"] as const;
export type ConversationDepth = (typeof CONVERSATION_DEPTHS)[number];

export interface MappedPerson {
  user_id: string;
  name: string;
  role: string | null;
  company: string | null;
  stage: PeopleStage;
  source: string | null;
  connected_date: string | null;
  last_contact_date: string | null;
  conversation_depth: ConversationDepth;
  asked_what_i_do: boolean;
  pain_point: string | null;
  notes: string | null;
}

export interface MappedPost {
  user_id: string;
  date_posted: string | null;
  title: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  notes: string | null;
}

export interface SkippedRecord {
  index: number;
  reason: string;
}

export interface MapResult<T> {
  rows: T[];
  warnings: string[];
  skipped: SkippedRecord[];
}

export interface RawExport {
  exportedAt: string;
  people: unknown[];
  posts: unknown[];
}

// ---------------------------------------------------------------------------
// Top-level shape validation
// ---------------------------------------------------------------------------

export class ExportValidationError extends Error {
  constructor(issues: string[]) {
    super(
      `Backup file does not match the expected export shape:\n` +
        issues.map((issue) => `  - ${issue}`).join("\n")
    );
    this.name = "ExportValidationError";
  }
}

/**
 * Validates that `raw` has the top-level shape:
 *   { exportedAt: string, people: array, posts: array }
 * Throws ExportValidationError (with all problems listed at once) if not.
 * Never invents or coerces missing top-level fields.
 */
export function parseExportShape(raw: unknown): RawExport {
  const issues: string[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ExportValidationError([
      "top-level JSON value must be an object",
    ]);
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.exportedAt !== "string") {
    issues.push(
      `"exportedAt" must be a string, got ${describeType(obj.exportedAt)}`
    );
  }

  if (!Array.isArray(obj.people)) {
    issues.push(`"people" must be an array, got ${describeType(obj.people)}`);
  }

  if (!Array.isArray(obj.posts)) {
    issues.push(`"posts" must be an array, got ${describeType(obj.posts)}`);
  }

  if (issues.length > 0) {
    throw new ExportValidationError(issues);
  }

  return {
    exportedAt: obj.exportedAt as string,
    people: obj.people as unknown[],
    posts: obj.posts as unknown[],
  };
}

// ---------------------------------------------------------------------------
// Field-level helpers - each tries the exact matching key first, warns and
// falls back to a schema-matching default if it's absent or the wrong type.
// Never invents data: a fallback is always either `null` or the column's
// real SQL default, never a guessed value.
// ---------------------------------------------------------------------------

function describeType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  warnings: string[]
): string | null {
  if (!(key in record)) {
    warnings.push(`${label}: missing field "${key}", defaulting to null`);
    return null;
  }
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") {
    warnings.push(
      `${label}: field "${key}" expected string, got ${describeType(value)}, defaulting to null`
    );
    return null;
  }
  return value;
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  warnings: string[]
): string | undefined {
  if (!(key in record)) {
    warnings.push(`${label}: missing required field "${key}"`);
    return undefined;
  }
  const value = record[key];
  if (typeof value !== "string" || value.trim() === "") {
    warnings.push(
      `${label}: field "${key}" expected non-empty string, got ${describeType(value)}`
    );
    return undefined;
  }
  return value;
}

function readOptionalNumber(
  record: Record<string, unknown>,
  key: string,
  fallback: number,
  label: string,
  warnings: string[]
): number {
  if (!(key in record)) {
    warnings.push(
      `${label}: missing field "${key}", defaulting to ${fallback}`
    );
    return fallback;
  }
  const value = record[key];
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    warnings.push(
      `${label}: field "${key}" expected number, got ${describeType(value)}, defaulting to ${fallback}`
    );
    return fallback;
  }
  return value;
}

function readOptionalBoolean(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
  label: string,
  warnings: string[]
): boolean {
  if (!(key in record)) {
    warnings.push(
      `${label}: missing field "${key}", defaulting to ${fallback}`
    );
    return fallback;
  }
  const value = record[key];
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "boolean") {
    warnings.push(
      `${label}: field "${key}" expected boolean, got ${describeType(value)}, defaulting to ${fallback}`
    );
    return fallback;
  }
  return value;
}

function readOptionalEnum<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  fallback: T,
  label: string,
  warnings: string[]
): T {
  if (!(key in record)) {
    warnings.push(
      `${label}: missing field "${key}", defaulting to "${fallback}"`
    );
    return fallback;
  }
  const value = record[key];
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  warnings.push(
    `${label}: field "${key}" expected one of [${allowed.join(", ")}], got ${JSON.stringify(value)}, defaulting to "${fallback}"`
  );
  return fallback;
}

/** Very loose date sanity check - full validation happens in Postgres. */
function readOptionalDateString(
  record: Record<string, unknown>,
  key: string,
  label: string,
  warnings: string[]
): string | null {
  const value = readOptionalString(record, key, label, warnings);
  if (value === null) return null;
  if (Number.isNaN(Date.parse(value))) {
    warnings.push(
      `${label}: field "${key}" value ${JSON.stringify(value)} does not look like a valid date, defaulting to null`
    );
    return null;
  }
  return value;
}

// ---------------------------------------------------------------------------
// people[] mapping
// ---------------------------------------------------------------------------

export function mapPeople(
  rawPeople: unknown[],
  userId: string
): MapResult<MappedPerson> {
  const rows: MappedPerson[] = [];
  const warnings: string[] = [];
  const skipped: SkippedRecord[] = [];

  rawPeople.forEach((raw, index) => {
    const label = `people[${index}]`;

    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      skipped.push({
        index,
        reason: `${label} is not a JSON object (got ${describeType(raw)}), skipped entirely`,
      });
      return;
    }
    const record = raw as Record<string, unknown>;

    const name = readRequiredString(record, "name", label, warnings);
    if (name === undefined) {
      skipped.push({
        index,
        reason: `${label} missing/invalid required field "name", skipped entirely`,
      });
      return;
    }

    // Now that we know the name, use it in subsequent warnings for clarity.
    const namedLabel = `people[${index}] ("${name}")`;

    rows.push({
      user_id: userId,
      name,
      role: readOptionalString(record, "role", namedLabel, warnings),
      company: readOptionalString(record, "company", namedLabel, warnings),
      stage: readOptionalEnum(
        record,
        "stage",
        PEOPLE_STAGES,
        "Connected",
        namedLabel,
        warnings
      ),
      source: (() => {
        // Column default is "LinkedIn outreach" rather than null.
        if (!("source" in record)) {
          warnings.push(
            `${namedLabel}: missing field "source", defaulting to "LinkedIn outreach"`
          );
          return "LinkedIn outreach";
        }
        const value = record.source;
        if (value === null || value === undefined) return "LinkedIn outreach";
        if (typeof value !== "string") {
          warnings.push(
            `${namedLabel}: field "source" expected string, got ${describeType(value)}, defaulting to "LinkedIn outreach"`
          );
          return "LinkedIn outreach";
        }
        return value;
      })(),
      connected_date: readOptionalDateString(
        record,
        "connected_date",
        namedLabel,
        warnings
      ),
      last_contact_date: readOptionalDateString(
        record,
        "last_contact_date",
        namedLabel,
        warnings
      ),
      conversation_depth: readOptionalEnum(
        record,
        "conversation_depth",
        CONVERSATION_DEPTHS,
        "single",
        namedLabel,
        warnings
      ),
      asked_what_i_do: readOptionalBoolean(
        record,
        "asked_what_i_do",
        false,
        namedLabel,
        warnings
      ),
      pain_point: readOptionalString(
        record,
        "pain_point",
        namedLabel,
        warnings
      ),
      notes: readOptionalString(record, "notes", namedLabel, warnings),
    });
  });

  return { rows, warnings, skipped };
}

// ---------------------------------------------------------------------------
// posts[] mapping
// ---------------------------------------------------------------------------

export function mapPosts(
  rawPosts: unknown[],
  userId: string
): MapResult<MappedPost> {
  const rows: MappedPost[] = [];
  const warnings: string[] = [];
  const skipped: SkippedRecord[] = [];

  rawPosts.forEach((raw, index) => {
    const label = `posts[${index}]`;

    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
      skipped.push({
        index,
        reason: `${label} is not a JSON object (got ${describeType(raw)}), skipped entirely`,
      });
      return;
    }
    const record = raw as Record<string, unknown>;

    rows.push({
      user_id: userId,
      date_posted: readOptionalDateString(
        record,
        "date_posted",
        label,
        warnings
      ),
      title: readOptionalString(record, "title", label, warnings),
      views: readOptionalNumber(record, "views", 0, label, warnings),
      likes: readOptionalNumber(record, "likes", 0, label, warnings),
      comments: readOptionalNumber(record, "comments", 0, label, warnings),
      shares: readOptionalNumber(record, "shares", 0, label, warnings),
      notes: readOptionalString(record, "notes", label, warnings),
    });
  });

  return { rows, warnings, skipped };
}
