import { relations } from "drizzle-orm/relations";
import { organizations, members, users, sessions, chatFolders, chats, invitations, accounts } from "./schema";

export const membersRelations = relations(members, ({one}) => ({
	organization: one(organizations, {
		fields: [members.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [members.userId],
		references: [users.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	members: many(members),
	invitations: many(invitations),
}));

export const usersRelations = relations(users, ({many}) => ({
	members: many(members),
	sessions: many(sessions),
	invitations: many(invitations),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const chatsRelations = relations(chats, ({one}) => ({
	chatFolder: one(chatFolders, {
		fields: [chats.folderId],
		references: [chatFolders.id]
	}),
}));

export const chatFoldersRelations = relations(chatFolders, ({many}) => ({
	chats: many(chats),
}));

export const invitationsRelations = relations(invitations, ({one}) => ({
	organization: one(organizations, {
		fields: [invitations.organizationId],
		references: [organizations.id]
	}),
	user: one(users, {
		fields: [invitations.inviterId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));