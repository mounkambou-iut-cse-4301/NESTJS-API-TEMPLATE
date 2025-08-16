import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly config: ConfigService) {}

  async sendEmail(subject: string, message: string, toEmail: string): Promise<void> {
    const user = this.config.get<string>('EMAIL');
    const pass = this.config.get<string>('EMAIL_PASS');
    const host = this.config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com';
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    const secure = this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;
    const rejectUnauthorized = this.config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false';

    if (!user || !pass) {
      this.logger.error('⚠️ Email credentials missing');
      return;
    }

    const transporter = nodemailer.createTransport({
      host, port, secure,
      auth: { user, pass },
      tls: { rejectUnauthorized }, // mets false en DEV si proxy TLS
    });

    try {
      const info = await transporter.sendMail({ from: user, to: toEmail, subject, text: message });
      this.logger.log(`✅ Email sent: ${info.response}`);
    } catch (err) {
      this.logger.error('❌ Email send failed', err as any);
    }
  }
}
