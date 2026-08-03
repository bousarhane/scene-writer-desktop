PRAGMA defer_foreign_keys = ON;

CREATE TABLE scenes_new (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    episode_id TEXT,
    location_id TEXT,

    scene_number TEXT NOT NULL,
    title TEXT,

    heading TEXT NOT NULL,

    interior_exterior TEXT NOT NULL DEFAULT 'unspecified'
        CHECK (
            interior_exterior IN (
                'interior',
                'exterior',
                'interior_exterior',
                'unspecified'
            )
        ),

    time_of_day TEXT NOT NULL DEFAULT 'unspecified'
        CHECK (
            time_of_day IN (
                'day',
                'night',
                'morning',
                'evening',
                'dawn',
                'sunset',
                'continuous',
                'later',
                'unspecified',
                'custom'
            )
        ),

    custom_time_of_day TEXT,

    synopsis TEXT,
    dramatic_purpose TEXT,
    notes TEXT,

    estimated_duration_seconds INTEGER,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'review',
                'approved',
                'omitted'
            )
        ),

    order_index INTEGER NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (episode_id)
        REFERENCES episodes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (location_id)
        REFERENCES locations(id)
        ON DELETE SET NULL,

    UNIQUE (episode_id, scene_number),
    UNIQUE (episode_id, order_index),

    CHECK (order_index >= 0),

    CHECK (
        estimated_duration_seconds IS NULL
        OR estimated_duration_seconds >= 0
    ),

    CHECK (
        time_of_day <> 'custom'
        OR custom_time_of_day IS NOT NULL
    )
);

INSERT INTO scenes_new (
    id,
    project_id,
    episode_id,
    location_id,
    scene_number,
    title,
    heading,
    interior_exterior,
    time_of_day,
    custom_time_of_day,
    synopsis,
    dramatic_purpose,
    notes,
    estimated_duration_seconds,
    status,
    order_index,
    created_at,
    updated_at
)
SELECT
    id,
    project_id,
    episode_id,
    location_id,
    scene_number,
    title,
    heading,
    interior_exterior,
    time_of_day,
    custom_time_of_day,
    synopsis,
    dramatic_purpose,
    notes,
    estimated_duration_seconds,
    status,
    order_index,
    created_at,
    updated_at
FROM scenes;

DROP TABLE scenes;

ALTER TABLE scenes_new
RENAME TO scenes;