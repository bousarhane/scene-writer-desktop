CREATE TABLE project_stories (
    project_id TEXT PRIMARY KEY,

    premise TEXT NOT NULL DEFAULT '',
    logline TEXT NOT NULL DEFAULT '',
    synopsis TEXT NOT NULL DEFAULT '',

    themes TEXT NOT NULL DEFAULT '',
    central_conflict TEXT NOT NULL DEFAULT '',

    starting_point TEXT NOT NULL DEFAULT '',
    expected_direction TEXT NOT NULL DEFAULT '',

    writer_notes TEXT NOT NULL DEFAULT '',

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_project_stories_updated_at
    ON project_stories(updated_at);