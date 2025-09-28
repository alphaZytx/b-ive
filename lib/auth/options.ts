import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { getDatabase } from "@/lib/db/mongodb";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const db = await getDatabase();
        const user = await db.collection("users").findOne({ "auth.email": credentials.email });

        if (!user || !user.auth?.passwordHash) {
          return null;
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.auth.passwordHash);
        if (!passwordValid) {
          return null;
        }

        const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
        const organizationId = typeof user.organizationId === "string" ? user.organizationId : undefined;

        return {
          id: user.userId ?? user._id?.toString() ?? credentials.email,
          email: user.auth.email,
          name: user.name ?? user.userId ?? credentials.email,
          roles,
          organizationId
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = (user as any).roles ?? [];
        token.organizationId = (user as any).organizationId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.roles = Array.isArray(token.roles) ? (token.roles as string[]) : [];
        if (token.organizationId) {
          session.user.organizationId = token.organizationId as string;
        }
      }

      return session;
    }
  }
};
