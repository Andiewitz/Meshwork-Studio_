export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  authProvider: string;
  hasNotifiedTeam?: boolean | null;
  readNotificationIds?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export type AuthState =
  | { status: "loading"; user: null; expiresAt: null }
  | { status: "anonymous"; user: null; expiresAt: null }
  | { status: "authenticated"; user: PublicUser; expiresAt: string | null };

export interface AuthResult {
  user: PublicUser;
  expiresAt: string;
  accessTokenExpiresAt?: string;
}
