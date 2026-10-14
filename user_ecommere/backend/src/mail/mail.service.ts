import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: any;

  constructor(private readonly configService: ConfigService) {
    this.transporter = this.createTransporter();
  }

  createTransporter(): any {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number | string>('SMTP_PORT')) || 587;
    const secureVal = this.configService.get<string | boolean>('SMTP_SECURE');
    const secure =
      secureVal !== undefined
        ? secureVal === true || secureVal === 'true'
        : port === 465;

    const user =
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('SMTP_USERNAME');
    const pass =
      this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('SMTP_PASSWORD');

    const auth = (user || pass) ? { user: user || '', pass: pass || '' } : undefined;

    const createTransport =
      (nodemailer as any).createTransport ||
      ((nodemailer as any).default && (nodemailer as any).default.createTransport);

    return createTransport({
      host,
      port,
      secure,
      auth,
    });
  }

  async sendMail(options: SendMailOptions) {
    const transporter = this.transporter || this.createTransporter();
    const from =
      options.from ||
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'noreply@thaispray.shop';

    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error?.message || error}`, error?.stack);
      throw error;
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string) {
    const subject = 'Đặt lại mật khẩu - Thai Spray Shop';
    const text = `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập liên kết sau để đặt lại mật khẩu của bạn:\n\n${resetLink}\n\nLiên kết này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Yêu cầu đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Thai Spray Shop.</p>
        <p>Vui lòng bấm vào liên kết bên dưới để tạo mật khẩu mới:</p>
        <p style="margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Hoặc bạn có thể sao chép liên kết này vào trình duyệt:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Liên kết có hiệu lực trong vòng 15 phút.</p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      </div>
    `;

    return await this.sendMail({
      to,
      subject,
      text,
      html,
    });
  }
}
