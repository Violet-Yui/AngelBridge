import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createDatabaseClient } from "../src/database/connection";

const seedsDirectory = resolve(process.cwd(), "database/seed");
const client = createDatabaseClient();

try {
  await client.connect();
  const files = (await readdir(seedsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`seed ${file}`);
    await client.query(await readFile(resolve(seedsDirectory, file), "utf8"));
  }
} finally {
  await client.end();
}
