import type { DefaultSession } from '@auth/core/types';
import type { UserRole } from '@/generated/prisma/enums';

declare module '@auth/core/types' {
  interface User {
    username?: string | null;
    role?: UserRole;
  }

  interface Session {
    user: {
      id: string;
      username?: string | null;
      role: UserRole;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id?: string;
    username?: string | null;
    role?: UserRole;
  }
}
