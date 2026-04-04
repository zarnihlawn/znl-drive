import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { MainFileActivitySchema, MainFileSchema, MainFileShareSchema } from './main.schema';

export type MainFileSchemaType = InferSelectModel<typeof MainFileSchema>;
export type MainFileSchemaInsertType = InferInsertModel<typeof MainFileSchema>;
export type MainFileSchemaUpdateType = Partial<MainFileSchemaInsertType>;

export type MainFileShareSchemaType = InferSelectModel<typeof MainFileShareSchema>;
export type MainFileShareSchemaInsertType = InferInsertModel<typeof MainFileShareSchema>;
export type MainFileShareSchemaUpdateType = Partial<MainFileShareSchemaInsertType>;

export type MainFileActivitySchemaType = InferSelectModel<typeof MainFileActivitySchema>;
export type MainFileActivitySchemaInsertType = InferInsertModel<typeof MainFileActivitySchema>;
export type MainFileActivitySchemaUpdateType = Partial<MainFileActivitySchemaInsertType>;
