// Read directly from process.env rather than ConfigService — this needs
// to run at module-definition time (before Nest's DI container exists) so
// AuthModule can decide whether to register GoogleStrategy/FacebookStrategy
// as providers at all. Registering a strategy whose required env vars are
// missing crashes the whole app at bootstrap (PassportStrategy's super()
// call reads them synchronously via ConfigService.getOrThrow) — these
// checks are what prevent that for anyone running without OAuth configured,
// which is the default/common case (see .env.example: "optional social login").

export function isGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
  );
}

export function isFacebookOAuthConfigured(): boolean {
  return !!(
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET &&
    process.env.FACEBOOK_CALLBACK_URL
  );
}
