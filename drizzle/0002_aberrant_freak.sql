ALTER TABLE "auth_user" ADD COLUMN "developer_mode_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "developer_api_key_key_prefix_uidx" ON "developer_api_key" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "developer_api_key_userId_idx" ON "developer_api_key" USING btree ("user_id");