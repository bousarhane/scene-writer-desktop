CREATE TABLE scene_elements_new (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    character_id TEXT,

    type TEXT NOT NULL
        CHECK (
            type IN (
                'action',
                'character',
                'dialogue',
                'parenthetical',
                'transition',
                'shot',
                'centered_text',
                'note'
            )
        ),

    content TEXT NOT NULL DEFAULT '',

    order_index INTEGER NOT NULL,

    is_dual_dialogue INTEGER NOT NULL DEFAULT 0
        CHECK (
            is_dual_dialogue IN (0, 1)
        ),

    is_locked INTEGER NOT NULL DEFAULT 0
        CHECK (
            is_locked IN (0, 1)
        ),

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (scene_id)
        REFERENCES scenes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (character_id)
        REFERENCES characters(id)
        ON DELETE SET NULL,

    CHECK (order_index >= 0)
);

INSERT INTO scene_elements_new (
    id,
    project_id,
    scene_id,
    character_id,
    type,
    content,
    order_index,
    is_dual_dialogue,
    is_locked,
    created_at,
    updated_at
)
SELECT
    id,
    project_id,
    scene_id,
    character_id,
    type,
    content,
    order_index,
    is_dual_dialogue,
    is_locked,
    created_at,
    updated_at
FROM scene_elements;

DROP TABLE scene_elements;

ALTER TABLE scene_elements_new
    RENAME TO scene_elements;

CREATE INDEX idx_scene_elements_scene_id
    ON scene_elements(scene_id);

CREATE INDEX idx_scene_elements_character_id
    ON scene_elements(character_id);
