import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      employeeNumber: string;
      role: string;
      mustChangePassword: boolean;
      campusId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    employeeNumber?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    employeeNumber: string;
    role: string;
  }
}
