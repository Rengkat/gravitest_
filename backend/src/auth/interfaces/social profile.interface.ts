export interface SocialProfile {
  provider: 'google' | 'facebook';
  /** Provider's unique ID for this user */
  providerId: string;
  /** May be null if user denied email permission (Facebook) */
  email: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  accessToken: string;
}
