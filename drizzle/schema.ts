import { pgTable, uniqueIndex, unique, text, timestamp, index, foreignKey, jsonb, boolean, vector, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const organizations = pgTable("organizations", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	metadata: text(),
}, (table) => [
	uniqueIndex("organizations_slug_uidx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("organizations_slug_unique").on(table.slug),
]);

export const members = pgTable("members", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	role: text().default('member').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("members_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("members_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "members_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "members_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	activeOrganizationId: text("active_organization_id"),
}, (table) => [
	index("sessions_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_token_unique").on(table.token),
]);

export const chatFolders = pgTable("chat_folders", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chat_folders_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
]);

export const chats = pgTable("chats", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	userId: text("user_id").notNull(),
	folderId: text("folder_id"),
	title: text().notNull(),
	messages: jsonb().notNull(),
	lastError: text("last_error"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chats_folder_idx").using("btree", table.folderId.asc().nullsLast().op("text_ops")),
	index("chats_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	index("chats_updated_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.updatedAt.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.folderId],
			foreignColumns: [chatFolders.id],
			name: "chats_folder_id_chat_folders_id_fk"
		}).onDelete("set null"),
]);

export const invitations = pgTable("invitations", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	email: text().notNull(),
	role: text(),
	status: text().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	inviterId: text("inviter_id").notNull(),
}, (table) => [
	index("invitations_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("invitations_organizationId_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "invitations_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.inviterId],
			foreignColumns: [users.id],
			name: "invitations_inviter_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const verifications = pgTable("verifications", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("verifications_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const installedTools = pgTable("installed_tools", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	itemId: text("item_id").notNull(),
	installedAt: timestamp("installed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("installed_tools_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
	uniqueIndex("installed_tools_org_item_uidx").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
]);

export const mcpServers = pgTable("mcp_servers", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	name: text().notNull(),
	url: text().notNull(),
	installedAt: timestamp("installed_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("mcp_servers_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
]);

export const agentMemories = pgTable("agent_memories", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull(),
	key: text().notNull(),
	content: text().notNull(),
	embedding: vector({ dimensions: 1536 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("agent_memories_key_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops"), table.key.asc().nullsLast().op("text_ops")),
	index("agent_memories_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
]);

export const orgSettings = pgTable("org_settings", {
	organizationId: text("organization_id").primaryKey().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	providerConfigs: text("provider_configs"),
});

export const llmTraces = pgTable("llm_traces", {
	id: text().primaryKey().notNull(),
	chatId: text("chat_id"),
	organizationId: text("organization_id").notNull(),
	type: text().notNull(),
	model: text().notNull(),
	provider: text().notNull(),
	promptMessages: jsonb("prompt_messages"),
	toolsAvailable: jsonb("tools_available"),
	temperature: text(),
	maxOutputTokens: integer("max_output_tokens"),
	responseContent: jsonb("response_content"),
	textContent: text("text_content"),
	toolCalls: jsonb("tool_calls"),
	finishReason: text("finish_reason"),
	inputTokensTotal: integer("input_tokens_total"),
	inputTokensNoCache: integer("input_tokens_no_cache"),
	inputTokensCacheRead: integer("input_tokens_cache_read"),
	inputTokensCacheWrite: integer("input_tokens_cache_write"),
	outputTokensTotal: integer("output_tokens_total"),
	outputTokensText: integer("output_tokens_text"),
	outputTokensReasoning: integer("output_tokens_reasoning"),
	durationMs: integer("duration_ms"),
	firstTokenMs: integer("first_token_ms"),
	warnings: jsonb(),
	requestBody: jsonb("request_body"),
	responseMetadata: jsonb("response_metadata"),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("llm_traces_chat_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops")),
	index("llm_traces_created_idx").using("btree", table.chatId.asc().nullsLast().op("text_ops"), table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("llm_traces_org_idx").using("btree", table.organizationId.asc().nullsLast().op("text_ops")),
]);

export const accounts = pgTable("accounts", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("accounts_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
