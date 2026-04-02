import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const createUpdateTimestamp = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull()
};

export const uuidSchemaWrapper = {
	id: uuid('id').primaryKey().defaultRandom().notNull()
};
