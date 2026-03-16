import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.surname = (user as any).surname;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.avatarUrl = (user as any).avatarUrl;
        token.language = (user as any).language;
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
  },
  session: {
    strategy: "jwt",
  },
});
