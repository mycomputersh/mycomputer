import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { v7 as uuidv7 } from "uuid"
import * as schema from "@/db/auth-schema"
import { db } from "@/db/drizzle"
import { organizations, members } from "@/db/auth-schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  baseURL: "http://localhost:3000/",
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    database: {
      generateId: () => {
        return uuidv7()
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const slug = crypto.randomUUID().replace(/-/g, "").slice(0, 12)
          const now = new Date()
          const orgId = uuidv7()
          await db.insert(organizations).values({
            id: orgId,
            name: `${user.name}'s Organization`,
            slug,
            createdAt: now,
          })
          await db.insert(members).values({
            id: uuidv7(),
            organizationId: orgId,
            userId: user.id,
            role: "owner",
            createdAt: now,
          })
        },
      },
    },
  },
  plugins: [organization()],
})
