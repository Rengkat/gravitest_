 export interface TokenBundle {
    accessToken: string;
    refreshToken: string;
    /** Raw JTI — store this in the session row, NOT the token itself */
    jti: string;
    /** bcrypt hash of the refresh token for the DB */
    refreshTokenHash: string;
    /** Absolute expiry timestamp for the session row */
    refreshExpiresAt: Date;
    /** Access token TTL in seconds — useful for the client */
    expiresIn: number;
  }