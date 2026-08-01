import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:scene-writer.db";

let databaseInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (databaseInstance !== null) {
    return databaseInstance;
  }

  databaseInstance = await Database.load(DATABASE_URL);

  await databaseInstance.execute(
    "PRAGMA foreign_keys = ON",
  );

  return databaseInstance;
}