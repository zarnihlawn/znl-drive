import { relations } from 'drizzle-orm';
import { DeveloperApiKeySchema } from './developer.schema';
import { AuthUserSchema } from '../auth-schema/auth.schema';

export const DeveloperApiKeySchemaRelations = relations(DeveloperApiKeySchema, ({ one }) => ({
	user: one(AuthUserSchema, {
		fields: [DeveloperApiKeySchema.userId],
		references: [AuthUserSchema.id]
	})
}));
