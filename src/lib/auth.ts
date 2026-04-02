import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import type { User } from "@/db/schema/users";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      surname: string;
      username: string;
      role: string;
      avatarUrl: string | null;
      language: string;
    };
  }
}

function generateUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}_${suffix}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcryptjs.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        if (!user.isActive) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          surname: user.surname,
          username: user.username,
          role: user.role,
          avatarUrl: user.avatarUrl,
          language: user.language,
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const email = user.email;
          if (!email) return false;

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existing[0]) {
            if (!existing[0].isActive) return false;
            return true;
          }

          // Auto-create user on first Google sign-in
          const nameParts = (user.name || "").split(" ");
          const firstName = nameParts[0] || "User";
          const lastName = nameParts.slice(1).join(" ") || "-";
          const username = generateUsername(email);

          await db.insert(users).values({
            email,
            name: firstName,
            surname: lastName,
            username,
            role: "dancer",
            avatarUrl: user.image || null,
            emailVerified: true,
            kvkkConsent: true,
            termsConsent: true,
            consentAt: new Date(),
            language: "tr",
          });

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
      // On credentials sign-in, user object has custom fields
      if (user && account?.provider === "credentials") {
        token.id = (user as any).id;
        token.surname = (user as any).surname;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl;
        token.language = (user as any).language;
      }

      // On Google sign-in, look up user from DB
      if (user && account?.provider === "google") {
        const email = user.email;
        if (email) {
          const dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (dbUser[0]) {
            token.id = dbUser[0].id;
            token.name = dbUser[0].name;
            token.surname = dbUser[0].surname;
            token.username = dbUser[0].username;
            token.role = dbUser[0].role;
            token.avatarUrl = dbUser[0].avatarUrl;
            token.language = dbUser[0].language;
          }
        }
      }

      if (trigger === "update" && session) {
        token.name = session.user.name;
        token.surname = session.user.surname;
        token.username = session.user.username;
        token.avatarUrl = session.user.avatarUrl;
        token.language = session.user.language;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.surname = token.surname as string;
      session.user.username = token.username as string;
      session.user.role = token.role as string;
      session.user.avatarUrl = token.avatarUrl as string | null;
      session.user.language = token.language as string;
      return session;
    },
  },
  pages: {
    signIn: "/tr/giris",
    error: "/tr/giris",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
});
