import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { OtpProvider } from './providers/otp.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { UserSession } from './entities/user-session.entity';
import { AdminInvite } from './entities/admin-invite.entity';
import { AdminInviteService } from './admin-invite.service';
import { AdminInviteController } from './admin-invite.controller';
import { MailModule } from 'src/mail/mail.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import jwtConfig from './config/jwtConfig';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { SessionService } from './session.service';
import { TokenProvider } from './providers/token.provider';
import { APP_GUARD } from '@nestjs/core';
import { HashModule } from 'src/common/hash/hash.module';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { isGoogleOAuthConfigured, isFacebookOAuthConfigured } from './strategies/oauth-config.util';

@Module({
  controllers: [AuthController, AdminInviteController],
  providers: [
    AuthService,
    AdminInviteService,
    OtpProvider,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
    RolesGuard,
    SessionService,
    TokenProvider,
    // Registered ONLY when their required env vars are actually present —
    // see oauth-config.util.ts. GoogleStrategy/FacebookStrategy read env
    // vars via ConfigService.getOrThrow() in their own constructors, which
    // throws immediately at provider instantiation if missing — that would
    // crash the whole app at bootstrap for the common case of not having
    // OAuth configured. This is what prevents that.
    ...(isGoogleOAuthConfigured() ? [GoogleStrategy] : []),
    ...(isFacebookOAuthConfigured() ? [FacebookStrategy] : []),
    // { provide: APP_GUARD, useClass: JwtAuthGuard },
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    UserModule,
    HashModule,
    TypeOrmModule.forFeature([Otp, UserSession, AdminInvite]),
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [jwtConfig.KEY],
      useFactory: (config: ConfigType<typeof jwtConfig>): JwtModuleOptions => ({
        signOptions: {
          issuer: config.issuer,
          audience: config.audience,
        },
      }),
    }),
    AdminAlertsModule,
  ],
  exports: [
    AuthService,
    OtpProvider,
    JwtAuthGuard,
    RolesGuard,
    SessionService,
    TokenProvider,
  ],
})
export class AuthModule {}
