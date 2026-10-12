import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isGoogleOAuthConfigured, isFacebookOAuthConfigured } from '../strategies/oauth-config.util';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    if (!isGoogleOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL to enable it.',
      );
    }
    return super.canActivate(context);
  }
}

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  canActivate(context: ExecutionContext) {
    if (!isFacebookOAuthConfigured()) {
      throw new ServiceUnavailableException(
        'Facebook sign-in is not configured on this server. Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_CALLBACK_URL to enable it.',
      );
    }
    return super.canActivate(context);
  }
}
