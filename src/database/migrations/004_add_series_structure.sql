ALTER TABLE projects
ADD COLUMN series_structure TEXT
    CHECK (
        series_structure IS NULL
        OR series_structure IN (
            'single_season',
            'multi_season'
        )
    );

UPDATE projects
SET series_structure =
    CASE
        WHEN planned_season_count IS NULL
            OR planned_season_count <= 1
        THEN 'single_season'
        ELSE 'multi_season'
    END
WHERE project_type = 'series';