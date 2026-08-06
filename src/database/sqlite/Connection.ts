import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL =
  "sqlite:scene-writer.db";

const BUSY_RETRY_DELAYS_MS = [
  80,
  160,
  320,
  640,
  900,
  1200,
];

let rawDatabaseInstance:
  Database | null = null;

let exposedDatabaseInstance:
  Database | null = null;

let databaseLoadingPromise:
  Promise<Database> | null = null;

let writeQueue:
  Promise<void> = Promise.resolve();

export async function getDatabase():
  Promise<Database> {
  if (
    exposedDatabaseInstance !== null
  ) {
    return exposedDatabaseInstance;
  }

  if (
    databaseLoadingPromise !== null
  ) {
    return databaseLoadingPromise;
  }

  databaseLoadingPromise =
    initializeDatabase();

  try {
    exposedDatabaseInstance =
      await databaseLoadingPromise;

    return exposedDatabaseInstance;
  } catch (error) {
    rawDatabaseInstance = null;
    exposedDatabaseInstance = null;
    databaseLoadingPromise = null;

    throw error;
  }
}

export function runExclusiveDatabaseWrite<T>(
  operation:
    (database: Database) => Promise<T>,
): Promise<T> {
  const queuedOperation =
    writeQueue.then(
      async () => {
        const database =
          await getRawDatabase();

        return retryBusyOperation(
          () => operation(database),
        );
      },
      async () => {
        const database =
          await getRawDatabase();

        return retryBusyOperation(
          () => operation(database),
        );
      },
    );

  writeQueue =
    queuedOperation.then(
      () => undefined,
      () => undefined,
    );

  return queuedOperation;
}

async function initializeDatabase():
  Promise<Database> {
  const database =
    await getRawDatabase();

  await database.execute(
    "PRAGMA foreign_keys = ON",
  );

  await database.execute(
    "PRAGMA busy_timeout = 10000",
  );

  await database.execute(
    "PRAGMA journal_mode = WAL",
  );

  await database.execute(
    "PRAGMA synchronous = NORMAL",
  );

  return createSerializedDatabase(
    database,
  );
}

async function getRawDatabase():
  Promise<Database> {
  if (
    rawDatabaseInstance !== null
  ) {
    return rawDatabaseInstance;
  }

  rawDatabaseInstance =
    await Database.load(
      DATABASE_URL,
    );

  return rawDatabaseInstance;
}

function createSerializedDatabase(
  database: Database,
): Database {
  return new Proxy(
    database,
    {
      get(
        target,
        property,
      ) {
        if (
          property === "execute"
        ) {
          return (
            query: string,
            bindValues?: unknown[],
          ) =>
            runExclusiveDatabaseWrite(
              (rawDatabase) =>
                rawDatabase.execute(
                  query,
                  bindValues,
                ),
            );
        }

        const value =
          Reflect.get(
            target,
            property,
            target,
          );

        return typeof value ===
          "function"
          ? value.bind(target)
          : value;
      },
    },
  );
}

async function retryBusyOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  let lastError:
    unknown = null;

  for (
    let attempt = 0;
    attempt <=
      BUSY_RETRY_DELAYS_MS.length;
    attempt += 1
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (
        !isDatabaseBusyError(
          error,
        ) ||
        attempt ===
          BUSY_RETRY_DELAYS_MS.length
      ) {
        throw error;
      }

      await delay(
        BUSY_RETRY_DELAYS_MS[
          attempt
        ],
      );
    }
  }

  throw lastError;
}

function isDatabaseBusyError(
  error: unknown,
): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  const normalized =
    message.toLowerCase();

  return (
    normalized.includes(
      "database is locked",
    ) ||
    normalized.includes(
      "database is busy",
    ) ||
    normalized.includes(
      "sqlite_busy",
    ) ||
    normalized.includes(
      "(code: 5)",
    )
  );
}

function delay(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds,
      );
    },
  );
}
