import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Resend } from 'resend';
import { MailOptions } from '../interfaces/mail-options.interface';
import mailConfig from '../config/mailConfig';

type MailConfiguration = ConfigType<typeof mailConfig>;

@Injectable()
export class MailProvider {
  private readonly logger = new Logger(MailProvider.name);
  private readonly client: Resend;
  readonly fromAddress: string;

  constructor(
    @Inject(mailConfig.KEY)
    private readonly mailConfiguration: MailConfiguration,
  ) {
    if (!this.mailConfiguration.resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.client = new Resend(this.mailConfiguration.resendApiKey);
    this.fromAddress = `${this.mailConfiguration.fromName} <${this.mailConfiguration.fromAddress}>`;
  }

  async send(options: MailOptions): Promise<void> {
    const { data, error } = await this.client.emails.send({
      from: options.from ?? this.fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      tags: options.tags,
    });

    if (error) {
      this.logger.error(
        `Mail delivery failed to ${options.to} | subject=${options.subject} | ${error.message}`,
      );
      throw new Error(error.message);
    }

    this.logger.log(`Mail sent to ${options.to} | id=${data?.id}`);
  }
}
