DROP INDEX "main_file_public_link_token_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "main_file_public_link_token_uidx" ON "main_file_public_link" USING btree ("token");