import { relations } from 'drizzle-orm';
import { MainFileSchema, MainFileShareSchema } from './main.schema';

export const MainFileSchemaRelations = relations(MainFileSchema, () => ({}));

export const MainFileShareSchemaRelations = relations(MainFileShareSchema, ({ one }) => ({
	file: one(MainFileSchema, {
		fields: [MainFileShareSchema.fileId],
		references: [MainFileSchema.id]
	})
}));
