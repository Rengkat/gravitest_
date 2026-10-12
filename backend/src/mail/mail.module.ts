import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import mailConfig from 'src/mail/config/mailConfig';
import jwtConfig from 'src/auth/config/jwtConfig';
import { MailProvider } from './providers/mail.provider';
import { TemplateRendererProvider } from './providers/template-renderer';
import { UnsubscribeTokenProvider } from './providers/unsubscribe-token.provider';
import { MailController } from './mail.controller';
import { User } from 'src/user/entities/user.entity';
import { UserNotificationPreferences } from 'src/notifications/entities/user-notification-preferences.entity';

@Module({
  imports: [
    ConfigModule.forFeature(mailConfig),
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User, UserNotificationPreferences]),
  ],
  controllers: [MailController],
  providers: [
    MailService,
    MailProvider,
    TemplateRendererProvider,
    UnsubscribeTokenProvider,
  ],
  exports: [MailService, UnsubscribeTokenProvider],
})
export class MailModule {}
