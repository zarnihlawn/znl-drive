import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
	AuthAccountSchema,
	AuthSessionSchema,
	AuthUserSchema,
	AuthVerificationSchema
} from './auth.schema';

export type AuthUserSchemaType = InferSelectModel<typeof AuthUserSchema>;
export type AuthUserSchemaInsertType = InferInsertModel<typeof AuthUserSchema>;
export type AuthUserSchemaUpdateType = Partial<AuthUserSchemaInsertType>;

export type AuthSessionSchemaType = InferSelectModel<typeof AuthSessionSchema>;
export type AuthSessionSchemaInsertType = InferInsertModel<typeof AuthSessionSchema>;
export type AuthSessionSchemaUpdateType = Partial<AuthSessionSchemaInsertType>;

export type AuthAccountSchemaType = InferSelectModel<typeof AuthAccountSchema>;
export type AuthAccountSchemaInsertType = InferInsertModel<typeof AuthAccountSchema>;
export type AuthAccountSchemaUpdateType = Partial<AuthAccountSchemaInsertType>;

export type AuthVerificationSchemaType = InferSelectModel<typeof AuthVerificationSchema>;
export type AuthVerificationSchemaInsertType = InferInsertModel<typeof AuthVerificationSchema>;
export type AuthVerificationSchemaUpdateType = Partial<AuthVerificationSchemaInsertType>;
