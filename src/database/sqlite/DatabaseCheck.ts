import { getDatabase } from "./Connection";

interface TableRow {
  name: string;
}

export async function checkDatabase(): Promise<string[]> {
  const database = await getDatabase();

  const rows = await database.select<TableRow[]>(
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
      ORDER BY name
    `,
  );

  return rows.map((row) => row.name);
}