-- Optional label color: folders default to NULL (no tint).
-- Run: psql "$DATABASE_URL" -f scripts/main-file-color-nullable.sql

ALTER TABLE main_file ALTER COLUMN color DROP DEFAULT;
ALTER TABLE main_file ALTER COLUMN color DROP NOT NULL;
UPDATE main_file SET color = NULL WHERE item_type = 'folder';
