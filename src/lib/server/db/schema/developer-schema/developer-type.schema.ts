import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { DeveloperApiKeySchema as DeveloperApiKeyTable } from './developer.schema';

export type DeveloperApiKeySchemaType = InferSelectModel<typeof DeveloperApiKeyTable>;
export type DeveloperApiKeySchemaInsertType = InferInsertModel<typeof DeveloperApiKeyTable>;
export type DeveloperApiKeySchemaUpdateType = Partial<DeveloperApiKeySchemaInsertType>;

