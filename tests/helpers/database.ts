import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";

export function testDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of readdirSync("drizzle/migrations").filter(file => file.endsWith(".sql")).sort()) sqlite.exec(readFileSync(`drizzle/migrations/${file}`, "utf8"));
  const database = {
    prepare(sql: string) {
      let params: unknown[] = [];
      return {
        bind(...values: unknown[]) { params = values; return this; },
        async run() { const result = sqlite.prepare(sql).run(...params); return { success: true, meta: { changes: Number(result.changes) } }; },
        async all() { return { success: true, results: sqlite.prepare(sql).all(...params) }; },
        async first(column?: string) { const row = sqlite.prepare(sql).get(...params); return column ? row?.[column] ?? null : row ?? null; },
        async raw() { const statement = sqlite.prepare(sql); statement.setReturnArrays(true); return statement.all(...params); },
      };
    },
    async batch(statements: Array<{ run: () => Promise<unknown> }>) {
      sqlite.exec("BEGIN");
      try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec("COMMIT"); return results; }
      catch (error) { sqlite.exec("ROLLBACK"); throw error; }
    },
  };
  return { sqlite, database, close: () => sqlite.close() };
}
