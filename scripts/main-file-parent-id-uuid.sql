-- One-time: align main_file.parent_id with uuid main_file.id (hierarchy).
-- Safe when parent_id is NULL for all rows (typical before nested folders).
-- Run: psql "$DATABASE_URL" -f scripts/main-file-parent-id-uuid.sql
-- Then: pnpm db:push:force

ALTER TABLE main_file DROP CONSTRAINT IF EXISTS main_file_parent_id_fkey;
ALTER TABLE main_file DROP CONSTRAINT IF EXISTS main_file_parent_id_main_file_id_fk;

ALTER TABLE main_file
	ALTER COLUMN parent_id TYPE uuid USING (NULL::uuid);

ALTER TABLE main_file
	ADD CONSTRAINT main_file_parent_id_main_file_id_fk
	FOREIGN KEY (parent_id) REFERENCES main_file (id) ON DELETE CASCADE;
