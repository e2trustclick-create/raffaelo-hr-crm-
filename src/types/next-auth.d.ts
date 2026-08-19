import type { DefaultSession } from '@auth/core/types';

declare module '@auth/core/types' {
  interface User {
    username?: string | null;
  }

  interface Session {
    user: {
      username?: string | null;
    } & DefaultSession['user'];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    username?: string | null;
  }
}
