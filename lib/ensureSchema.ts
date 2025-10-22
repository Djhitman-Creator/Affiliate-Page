// lib/ensureSchema.ts
/**
 * SQLite-only safety. On Postgres (or any managed DB), this is a no-op.
 * We keep the same exported name so existing imports keep working.
 */
export async function ensureSqliteTables(): Promise<void> {
  const provider = (process.env.DB_PROVIDER || "").toLowerCase();
  if (provider !== "sqlite") return; // no-op on Postgres/others

  // If you ever run with SQLite locally (DB_PROVIDER=sqlite),
  // you could ensure tables exist here (left intentionally empty).
}

// Optional alias if other files import `ensureSchema`
export { ensureSqliteTables as ensureSchema };
