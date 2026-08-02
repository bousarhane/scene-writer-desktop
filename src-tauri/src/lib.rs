use tauri_plugin_sql::{
    Migration,
    MigrationKind,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!(
                "../../src/database/migrations/001_initial_schema.sql"
            ),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_project_stories",
            sql: include_str!(
                "../../src/database/migrations/002_create_project_stories.sql"
            ),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:scene-writer.db",
                    migrations,
                )
                .build(),
        )
        .run(tauri::generate_context!())
        .expect(
            "error while running Tauri application",
        );
}