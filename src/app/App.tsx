import { useEffect, useState } from "react";
import { checkDatabase } from "../database";

function App() {
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize(): Promise<void> {
      try {
        const tableNames = await checkDatabase();
        setTables(tableNames);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : String(caughtError);

        setError(message);
      }
    }

    void initialize();
  }, []);

  return (
    <main
      dir="rtl"
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "32px",
      }}
    >
      <h1>Scene Writer</h1>

      {error !== null ? (
        <>
          <h2>فشل الاتصال بقاعدة البيانات</h2>
          <pre>{error}</pre>
        </>
      ) : tables.length === 0 ? (
        <p>جارٍ فتح قاعدة البيانات...</p>
      ) : (
        <>
          <h2>تم إنشاء قاعدة البيانات بنجاح</h2>

          <p>الجداول الموجودة:</p>

          <ul>
            {tables.map((table) => (
              <li key={table}>{table}</li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default App;