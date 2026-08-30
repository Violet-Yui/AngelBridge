import { readFileSync } from "node:fs";
import { Client, Pool, type ClientConfig } from "pg";

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

export const databaseConfigFromEnv = (): ClientConfig => {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (connectionString) return { connectionString };

  const passwordFile = required("DATABASE_PASSWORD_FILE");
  const password = readFileSync(passwordFile, "utf8").trim();
  if (!password) throw new Error("DATABASE_PASSWORD_FILE is empty");

  return {
    host: required("DATABASE_HOST"),
    port: Number(process.env.DATABASE_PORT ?? 5432),
    database: required("DATABASE_NAME"),
    user: required("DATABASE_USER"),
    password,
  };
};

export const createDatabaseClient = (): Client =>
  new Client(databaseConfigFromEnv());

export const createDatabasePool = (): Pool =>
  new Pool(databaseConfigFromEnv());
