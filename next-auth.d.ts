import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      roles: string[];
      organizationId?: string;
    };
  }

  interface User {
    id: string;
    roles: string[];
    organizationId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    organizationId?: string;
  }
}
