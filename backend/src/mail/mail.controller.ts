import { Controller, Get, Query, Res, Logger, Inject } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserNotificationPreferences } from 'src/notifications/entities/user-notification-preferences.entity';
import { UnsubscribeTokenProvider } from './providers/unsubscribe-token.provider';
import { MailService } from './mail.service';
import appConfig from 'src/config/appConfig';
import type { ConfigType } from '@nestjs/config';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserNotificationPreferences)
    private readonly prefsRepo: Repository<UserNotificationPreferences>,
    private readonly unsubscribeTokens: UnsubscribeTokenProvider,
    private readonly mailService: MailService,
    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
  ) {}

  // One-click unsubscribe, reached directly from the link in marketing/
  // broadcast emails — no auth, since the person clicking it is reading
  // email, not logged into the app. The token itself (see
  // UnsubscribeTokenProvider) is what proves which account this is for.
  @Public()
  @Get('unsubscribe')
  @ApiExcludeEndpoint() // reached via email links, not called by the frontend/API clients
  @ApiOperation({ summary: 'One-click unsubscribe from marketing/broadcast emails' })
  async unsubscribe(@Query('token') token: string, @Res() res: Response) {
    const userId = token ? this.unsubscribeTokens.verify(token) : null;

    if (!userId) {
      return res
        .status(400)
        .send(this.renderSimplePage('That unsubscribe link is invalid or has expired.'));
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).send(this.renderSimplePage('We couldn\'t find that account.'));
    }

    const prefs = await this.prefsRepo.findOne({ where: { user: { id: userId } } });
    if (prefs && prefs.emailEnabled) {
      prefs.emailEnabled = false;
      await this.prefsRepo.save(prefs);

      // Best-effort confirmation — the unsubscribe itself already
      // succeeded above regardless of whether this send works.
      this.mailService
        .sendUnsubscribeConfirmation(user.email, {
          firstName: user.firstName,
          notificationSettingsUrl: `${this.appConf.frontendUrl}/dashboard/notifications`,
        })
        .catch((err) =>
          this.logger.warn(`Unsubscribe confirmation email failed for ${user.id}: ${err.message}`),
        );
    }

    return res
      .status(200)
      .send(
        this.renderSimplePage(
          `You've been unsubscribed, ${user.firstName}. You'll still receive essential account emails like password resets and receipts.`,
        ),
      );
  }

  // Minimal styled HTML — this endpoint is hit directly by a browser
  // (someone clicking a link in their email client), not by the SPA, so
  // it needs to be a real page on its own rather than a JSON response.
  private renderSimplePage(message: string): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Gravitest</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, sans-serif; background: #f7f7f5; margin: 0; padding: 48px 24px; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
  <div style="max-width: 420px; text-align: center; background: #fff; padding: 40px 32px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
    <h1 style="font-size: 20px; color: #14532d; margin: 0 0 12px;">Gravitest</h1>
    <p style="font-size: 15px; color: #3f3f46; line-height: 1.6; margin: 0;">${message}</p>
  </div>
</body></html>`;
  }
}
