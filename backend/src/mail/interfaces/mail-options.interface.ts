export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];

  attachments?: any[];

  tags?: {
    name: string;
    value: string;
  }[];
}
