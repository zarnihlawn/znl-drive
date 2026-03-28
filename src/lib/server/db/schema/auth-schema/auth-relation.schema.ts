import { relations } from 'drizzle-orm';
import { AuthUserSchema, AuthSessionSchema, AuthAccountSchema } from './auth.schema';

export const AuthUserSchemaRelations = relations(AuthUserSchema, ({ many }) => ({
	sessions: many(AuthSessionSchema),
	accounts: many(AuthAccountSchema)
}));

export const AuthSessionSchemaRelations = relations(AuthSessionSchema, ({ one }) => ({
	user: one(AuthUserSchema, {
		fields: [AuthSessionSchema.userId],
		references: [AuthUserSchema.id]
	})
}));

export const AuthAccountSchemaRelations = relations(AuthAccountSchema, ({ one }) => ({
	user: one(AuthUserSchema, {
		fields: [AuthAccountSchema.userId],
		references: [AuthUserSchema.id]
	})
}));
