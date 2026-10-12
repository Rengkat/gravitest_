import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { SocialProfile } from '../interfaces/social profile.interface';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('FACEBOOK_APP_ID'),
      clientSecret: configService.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      callbackURL: configService.getOrThrow<string>('FACEBOOK_CALLBACK_URL'),
      // Request email — requires your FB App to have email permission approved
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any) => void,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    const socialProfile: SocialProfile = {
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value ?? null,
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      avatarUrl: photos?.[0]?.value ?? null,
      accessToken,
    };

    done(null, socialProfile);
  }
}
