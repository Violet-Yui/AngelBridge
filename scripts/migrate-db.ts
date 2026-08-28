import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient } from "../src/database/connection";

const migrationsDirectory = resolve(process.cwd(), "database/migrations");
const client = createDatabaseClient();

try {
  await client.connect();
  await client.query(`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const applied = new Set(
    (await client.query<{ name: string }>("select name from schema_migrations"))
      .rows
      .map(({ name }) => name),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    console.log(`apply ${file}`);
    await client.query(await readFile(resolve(migrationsDirectory, file), "utf8"));
    await client.query("insert into schema_migrations (name) values ($1)", [file]);
  }
} finally {
  await client.end();
}
