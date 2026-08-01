PRAGMA foreign_keys = ON;


CREATE TABLE projects (
    id TEXT PRIMARY KEY,

    title TEXT NOT NULL,
    subtitle TEXT,

    project_type TEXT NOT NULL
        CHECK (
            project_type IN (
                'film',
                'series',
                'short_film',
                'single_episode',
                'stage_play'
            )
        ),

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'in_progress',
                'review',
                'completed',
                'archived'
            )
        ),

    language TEXT NOT NULL DEFAULT 'ar'
        CHECK (
            language IN (
                'ar',
                'fr',
                'en'
            )
        ),

    text_direction TEXT NOT NULL DEFAULT 'rtl'
        CHECK (
            text_direction IN (
                'rtl',
                'ltr'
            )
        ),

    author_name TEXT,
    description TEXT,

    planned_season_count INTEGER,
    planned_episode_count INTEGER,

    default_episode_duration_minutes INTEGER,

    default_minimum_scenes_per_episode INTEGER,
    default_maximum_scenes_per_episode INTEGER,

    last_opened_at TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    CHECK (
        planned_season_count IS NULL
        OR planned_season_count >= 1
    ),

    CHECK (
        planned_episode_count IS NULL
        OR planned_episode_count >= 1
    ),

    CHECK (
        default_episode_duration_minutes IS NULL
        OR default_episode_duration_minutes >= 1
    ),

    CHECK (
        default_minimum_scenes_per_episode IS NULL
        OR default_minimum_scenes_per_episode >= 0
    ),

    CHECK (
        default_maximum_scenes_per_episode IS NULL
        OR default_maximum_scenes_per_episode >= 0
    ),

    CHECK (
        default_minimum_scenes_per_episode IS NULL
        OR default_maximum_scenes_per_episode IS NULL
        OR default_minimum_scenes_per_episode
            <= default_maximum_scenes_per_episode
    )
);

CREATE TABLE seasons (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    number INTEGER NOT NULL,
    title TEXT,
    description TEXT,

    planned_episode_count INTEGER,
    default_episode_duration_minutes INTEGER,

    order_index INTEGER NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    UNIQUE (project_id, number),
    UNIQUE (project_id, order_index),

    CHECK (number >= 1),
    CHECK (order_index >= 0),

    CHECK (
        planned_episode_count IS NULL
        OR planned_episode_count >= 1
    ),

    CHECK (
        default_episode_duration_minutes IS NULL
        OR default_episode_duration_minutes >= 1
    )
);

CREATE TABLE episodes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    season_id TEXT,

    number INTEGER NOT NULL,
    title TEXT,

    synopsis TEXT,
    notes TEXT,

    target_duration_minutes INTEGER NOT NULL,
    estimated_duration_seconds INTEGER,

    status TEXT NOT NULL DEFAULT 'outline'
        CHECK (
            status IN (
                'outline',
                'draft',
                'review',
                'final'
            )
        ),

    order_index INTEGER NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE CASCADE,

    UNIQUE (season_id, number),
    UNIQUE (project_id, order_index),

    CHECK (number >= 1),
    CHECK (order_index >= 0),
    CHECK (target_duration_minutes >= 1),

    CHECK (
        estimated_duration_seconds IS NULL
        OR estimated_duration_seconds >= 0
    )
);

CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    parent_location_id TEXT,

    name TEXT NOT NULL,

    type TEXT NOT NULL DEFAULT 'other'
        CHECK (
            type IN (
                'house',
                'room',
                'street',
                'workplace',
                'public_space',
                'vehicle',
                'rural',
                'other'
            )
        ),

    description TEXT,
    notes TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (parent_location_id)
        REFERENCES locations(id)
        ON DELETE SET NULL,

    UNIQUE (project_id, name),

    CHECK (
        parent_location_id IS NULL
        OR parent_location_id <> id
    )
);

CREATE TABLE characters (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    name TEXT NOT NULL,
    short_name TEXT,

    gender TEXT NOT NULL DEFAULT 'unspecified'
        CHECK (
            gender IN (
                'male',
                'female',
                'other',
                'unspecified'
            )
        ),

    age TEXT,

    role TEXT NOT NULL DEFAULT 'unspecified'
        CHECK (
            role IN (
                'main',
                'supporting',
                'secondary',
                'minor',
                'extra',
                'unspecified'
            )
        ),

    physical_description TEXT,
    personality TEXT,
    psychological_profile TEXT,

    goals TEXT,
    motivations TEXT,
    background TEXT,

    notes TEXT,

    order_index INTEGER NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    UNIQUE (project_id, name),
    UNIQUE (project_id, order_index),

    CHECK (order_index >= 0)
);

CREATE TABLE character_aliases (
    id TEXT PRIMARY KEY,
    character_id TEXT NOT NULL,

    alias TEXT NOT NULL,

    FOREIGN KEY (character_id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    UNIQUE (character_id, alias)
);

CREATE TABLE character_relations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,

    source_character_id TEXT NOT NULL,
    target_character_id TEXT NOT NULL,

    relation_type TEXT NOT NULL
        CHECK (
            relation_type IN (
                'parent',
                'child',
                'spouse',
                'sibling',
                'friend',
                'enemy',
                'colleague',
                'relative',
                'custom'
            )
        ),

    custom_label TEXT,
    description TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    FOREIGN KEY (source_character_id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    FOREIGN KEY (target_character_id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    CHECK (
        source_character_id <> target_character_id
    ),

    CHECK (
        relation_type <> 'custom'
        OR custom_label IS NOT NULL
    )
);

CREATE TABLE scenes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    episode_id TEXT NOT NULL,
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

CREATE TABLE scene_elements (
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

    UNIQUE (scene_id, order_index),

    CHECK (order_index >= 0)
);

CREATE TABLE scene_characters (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    character_id TEXT NOT NULL,

    is_speaking INTEGER NOT NULL DEFAULT 0
        CHECK (
            is_speaking IN (0, 1)
        ),

    notes TEXT,
    created_at TEXT NOT NULL,

    FOREIGN KEY (scene_id)
        REFERENCES scenes(id)
        ON DELETE CASCADE,

    FOREIGN KEY (character_id)
        REFERENCES characters(id)
        ON DELETE CASCADE,

    UNIQUE (scene_id, character_id)
);

CREATE TABLE project_settings (
    project_id TEXT PRIMARY KEY,

    default_font_family TEXT NOT NULL DEFAULT 'Cairo',
    default_font_size INTEGER NOT NULL DEFAULT 14,

    page_size TEXT NOT NULL DEFAULT 'a4'
        CHECK (
            page_size IN (
                'a4',
                'letter'
            )
        ),

    show_scene_numbers INTEGER NOT NULL DEFAULT 1
        CHECK (
            show_scene_numbers IN (0, 1)
        ),

    automatic_scene_numbering INTEGER NOT NULL DEFAULT 1
        CHECK (
            automatic_scene_numbering IN (0, 1)
        ),

    auto_save_enabled INTEGER NOT NULL DEFAULT 1
        CHECK (
            auto_save_enabled IN (0, 1)
        ),

    auto_save_interval_seconds INTEGER NOT NULL DEFAULT 30,

    estimated_minutes_per_page REAL NOT NULL DEFAULT 1.0,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE,

    CHECK (default_font_size >= 6),
    CHECK (auto_save_interval_seconds >= 5),
    CHECK (estimated_minutes_per_page > 0)
);

CREATE INDEX idx_seasons_project_id
    ON seasons(project_id);

CREATE INDEX idx_episodes_project_id
    ON episodes(project_id);

CREATE INDEX idx_episodes_season_id
    ON episodes(season_id);

CREATE INDEX idx_scenes_project_id
    ON scenes(project_id);

CREATE INDEX idx_scenes_episode_id
    ON scenes(episode_id);

CREATE INDEX idx_scenes_location_id
    ON scenes(location_id);

CREATE INDEX idx_scene_elements_scene_id
    ON scene_elements(scene_id);

CREATE INDEX idx_scene_elements_character_id
    ON scene_elements(character_id);

CREATE INDEX idx_characters_project_id
    ON characters(project_id);

CREATE INDEX idx_locations_project_id
    ON locations(project_id);

CREATE INDEX idx_scene_characters_scene_id
    ON scene_characters(scene_id);

CREATE INDEX idx_scene_characters_character_id
    ON scene_characters(character_id);

CREATE INDEX idx_character_relations_source
    ON character_relations(source_character_id);

CREATE INDEX idx_character_relations_target
    ON character_relations(target_character_id);

