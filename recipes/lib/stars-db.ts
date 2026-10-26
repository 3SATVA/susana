import postgres from "postgres";

// RECIPES_DB_URL: one or more pooler connection strings (whitespace-separated) for the
// least-privilege role `recipes_app`, which can only read/write public.recipe_stars, public.tags and public.recipe_tags.
type Sql = ReturnType<typeof postgres>;
let cached: Sql | null = null;

export async function client(): Promise<Sql> {
  if (cached) return cached;
  const urls = (process.env.RECIPES_DB_URL ?? "").split(/\s+/).filter(Boolean);
  if (!urls.length) throw new Error("RECIPES_DB_URL not configured");
  let last: unknown;
  for (const url of urls) {
    const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 6, ssl: "require" });
    try {
      await sql`select 1`;
      cached = sql;
      return sql;
    } catch (e) {
      last = e;
      await sql.end({ timeout: 1 }).catch(() => {});
    }
  }
  throw last instanceof Error ? last : new Error("database unreachable");
}

// One connection, strictly one query at a time: postgres.js pipelines concurrent queries on a
// connection, which breaks behind the Supabase transaction pooler (replies get mixed up or hang).
let chain: Promise<unknown> = Promise.resolve();
export function serial<T>(fn: (sql: Sql) => Promise<T>, timeoutMs = 8000): Promise<T> {
  const run = chain.then(async () => {
    const sql = await client();
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        fn(sql),
        new Promise<never>((_, rej) => { t = setTimeout(() => rej(new Error("database timeout")), timeoutMs); }),
      ]);
    } catch (e) {
      // drop the connection on any failure so the next call starts clean
      if (cached === sql) { cached = null; sql.end({ timeout: 1 }).catch(() => {}); }
      throw e;
    } finally {
      clearTimeout(t);
    }
  });
  chain = run.catch(() => {});
  return run;
}

export async function listStars(): Promise<{ id: string; at: string }[]> {
  return serial(async (sql) => {
  const rows = await sql<{ recipe_id: string; starred_at: Date }[]>`
    select recipe_id, starred_at from public.recipe_stars order by starred_at desc`;
  return rows.map((r) => ({ id: r.recipe_id, at: new Date(r.starred_at).toISOString() }));
  });
}

export async function setStar(id: string, starred: boolean) {
  return serial(async (sql) => {
  if (starred) {
    await sql`insert into public.recipe_stars (recipe_id) values (${id}) on conflict (recipe_id) do nothing`;
  } else {
    await sql`delete from public.recipe_stars where recipe_id = ${id}`;
  }
  });
}
