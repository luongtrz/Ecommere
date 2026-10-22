import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService, SendMailOptions } from './mail.service';

const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail,
};

jest.mock('nodemailer', () => {
  const sendMail = jest.fn();
  const transporter = { sendMail };
  return {
    __esModule: true,
    createTransport: jest.fn(() => transporter),
    default: {
      createTransport: jest.fn(() => transporter),
    },
  };
});

describe('MailService', () => {
  let service: MailService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
    if ((nodemailer as any).default?.createTransport) {
      (
        (nodemailer as any).default.createTransport as jest.Mock
      ).mockReturnValue(mockTransporter);
    }
    mockSendMail.mockReset();
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransporter', () => {
    it('uses default host and port (smtp.gmail.com:587) and secure=false when configuration is missing', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const transporter = service.createTransporter();

      expect(transporter).toBe(mockTransporter);
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: undefined,
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_HOST');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_PORT');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_SECURE');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_USER');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_USERNAME');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_PASS');
      expect(mockConfigService.get).toHaveBeenCalledWith('SMTP_PASSWORD');
    });

    it('uses custom host and numeric port when provided', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.customdomain.com';
        if (key === 'SMTP_PORT') return 2525;
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.customdomain.com',
          port: 2525,
          secure: false,
        }),
      );
    });

    it('parses string port and infers secure=true when port is 465 and SMTP_SECURE is undefined', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return '465';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        }),
      );
    });

    it('infers secure=false when port is not 465 and SMTP_SECURE is undefined', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return '587';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: false,
        }),
      );
    });

    it('sets secure=true when SMTP_SECURE is boolean true', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_SECURE') return true;
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: true,
        }),
      );
    });

    it('sets secure=true when SMTP_SECURE is string "true"', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_SECURE') return 'true';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: true,
        }),
      );
    });

    it('sets secure=false when SMTP_SECURE is boolean false even if port is 465', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return 465;
        if (key === 'SMTP_SECURE') return false;
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: false,
        }),
      );
    });

    it('sets secure=false when SMTP_SECURE is string "false" even if port is 465', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return 465;
        if (key === 'SMTP_SECURE') return 'false';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: false,
        }),
      );
    });

    it('sets secure=false when SMTP_SECURE is an arbitrary string', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PORT') return 465;
        if (key === 'SMTP_SECURE') return 'other';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: false,
        }),
      );
    });

    it('uses SMTP_USER and SMTP_PASS for auth credentials', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_USER') return 'primary_user@example.com';
        if (key === 'SMTP_PASS') return 'primary_password';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'primary_user@example.com',
            pass: 'primary_password',
          },
        }),
      );
    });

    it('falls back to SMTP_USERNAME and SMTP_PASSWORD when SMTP_USER and SMTP_PASS are missing', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_USERNAME') return 'fallback_user@example.com';
        if (key === 'SMTP_PASSWORD') return 'fallback_password';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'fallback_user@example.com',
            pass: 'fallback_password',
          },
        }),
      );
    });

    it('provides default empty string for password when only user is configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_USER') return 'only_user@example.com';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'only_user@example.com',
            pass: '',
          },
        }),
      );
    });

    it('provides default empty string for user when only password is configured', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_PASS') return 'only_secret';
        return undefined;
      });

      service.createTransporter();

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: '',
            pass: 'only_secret',
          },
        }),
      );
    });

    it('uses nodemailer.default.createTransport when nodemailer.createTransport is undefined', () => {
      const originalCreateTransport = (nodemailer as any).createTransport;
      const fallbackTransporter = { sendMail: jest.fn() };
      const fallbackCreateTransport = jest
        .fn()
        .mockReturnValue(fallbackTransporter);

      (nodemailer as any).createTransport = undefined;
      (nodemailer as any).default = {
        createTransport: fallbackCreateTransport,
      };

      try {
        const result = service.createTransporter();
        expect(fallbackCreateTransport).toHaveBeenCalledWith({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: undefined,
        });
        expect(result).toBe(fallbackTransporter);
      } finally {
        (nodemailer as any).createTransport = originalCreateTransport;
      }
    });
  });

  describe('sendMail', () => {
    const mockEmailOptions: SendMailOptions = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Hello plain text',
      html: '<h1>Hello HTML</h1>',
      from: 'sender@example.com',
    };

    it('successfully sends mail when all options including from are provided', async () => {
      const mockResult = {
        messageId: '<test-message-id@example.com>',
        response: '250 OK',
      };
      mockSendMail.mockResolvedValue(mockResult);

      const result = await service.sendMail(mockEmailOptions);

      expect(result).toEqual(mockResult);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Hello plain text',
        html: '<h1>Hello HTML</h1>',
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email sent to recipient@example.com',
      );
    });

    it('uses SMTP_FROM configuration when options.from is not provided', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_FROM') return 'config-from@thaispray.shop';
        return undefined;
      });
      mockSendMail.mockResolvedValue({ accepted: ['recipient@example.com'] });

      const optionsWithoutFrom: SendMailOptions = {
        to: 'recipient@example.com',
        subject: 'Notification',
      };

      await service.sendMail(optionsWithoutFrom);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'config-from@thaispray.shop',
        to: 'recipient@example.com',
        subject: 'Notification',
        text: undefined,
        html: undefined,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email sent to recipient@example.com',
      );
    });

    it('uses SMTP_USER configuration when options.from and SMTP_FROM are not provided', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'SMTP_USER') return 'user-config@thaispray.shop';
        return undefined;
      });
      mockSendMail.mockResolvedValue({ accepted: ['recipient@example.com'] });

      const optionsWithoutFrom: SendMailOptions = {
        to: 'recipient@example.com',
        subject: 'Welcome',
      };

      await service.sendMail(optionsWithoutFrom);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'user-config@thaispray.shop',
        to: 'recipient@example.com',
        subject: 'Welcome',
        text: undefined,
        html: undefined,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email sent to recipient@example.com',
      );
    });

    it('falls back to noreply@thaispray.shop when options.from, SMTP_FROM, and SMTP_USER are missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      mockSendMail.mockResolvedValue({ accepted: ['recipient@example.com'] });

      const optionsWithoutFrom: SendMailOptions = {
        to: 'recipient@example.com',
        subject: 'General Info',
      };

      await service.sendMail(optionsWithoutFrom);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@thaispray.shop',
        to: 'recipient@example.com',
        subject: 'General Info',
        text: undefined,
        html: undefined,
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email sent to recipient@example.com',
      );
    });

    it('lazily initializes transporter via createTransporter if this.transporter is falsy', async () => {
      (service as any).transporter = null;
      const createTransporterSpy = jest.spyOn(service, 'createTransporter');
      mockSendMail.mockResolvedValue({ messageId: 'lazy-id' });

      await service.sendMail(mockEmailOptions);

      expect(createTransporterSpy).toHaveBeenCalled();
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Hello plain text',
        html: '<h1>Hello HTML</h1>',
      });
    });

    it('logs error and rethrows when transporter.sendMail rejects with an Error instance', async () => {
      const mockError = new Error('SMTP connection timed out');
      mockSendMail.mockRejectedValue(mockError);

      await expect(service.sendMail(mockEmailOptions)).rejects.toThrow(
        mockError,
      );
      await expect(service.sendMail(mockEmailOptions)).rejects.toThrow(
        'SMTP connection timed out',
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@example.com: SMTP connection timed out',
        mockError.stack,
      );
    });

    it('logs error and rethrows when transporter.sendMail rejects with a string error', async () => {
      const stringError = 'SMTP network down';
      mockSendMail.mockRejectedValue(stringError);

      await expect(service.sendMail(mockEmailOptions)).rejects.toBe(
        stringError,
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@example.com: SMTP network down',
        undefined,
      );
    });

    it('logs error and rethrows when transporter.sendMail rejects with an empty object without message or stack', async () => {
      const rawError = { code: 'ECONNRESET' };
      mockSendMail.mockRejectedValue(rawError);

      await expect(service.sendMail(mockEmailOptions)).rejects.toEqual(
        rawError,
      );

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        `Failed to send email to recipient@example.com: ${rawError}`,
        undefined,
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    const to = 'user@example.com';
    const resetLink =
      'https://thaispray.shop/auth/reset-password?token=secureToken123';

    it('sends password reset email with required subject, reset link in text, and html button', async () => {
      const mockInfo = { messageId: '<pw-reset-id@example.com>' };
      mockSendMail.mockResolvedValue(mockInfo);

      const sendMailSpy = jest.spyOn(service, 'sendMail');

      const result = await service.sendPasswordResetEmail(to, resetLink);

      expect(result).toEqual(mockInfo);
      expect(sendMailSpy).toHaveBeenCalledTimes(1);

      const callArg = sendMailSpy.mock.calls[0][0];
      expect(callArg.to).toBe(to);
      expect(callArg.subject).toBe('Đặt lại mật khẩu - Thai Spray Shop');
      expect(callArg.text).toContain(resetLink);
      expect(callArg.text).toContain('Bạn đã yêu cầu đặt lại mật khẩu');
      expect(callArg.text).toContain('Liên kết này sẽ hết hạn sau 15 phút');
      expect(callArg.html).toContain(resetLink);
      expect(callArg.html).toContain('Yêu cầu đặt lại mật khẩu');
      expect(callArg.html).toContain('Đặt lại mật khẩu');
      expect(callArg.html).toContain('Liên kết có hiệu lực trong vòng 15 phút');
    });

    it('propagates error when sendMail rejects during password reset', async () => {
      const resetError = new Error('Mail provider quota exceeded');
      jest.spyOn(service, 'sendMail').mockRejectedValue(resetError);

      await expect(
        service.sendPasswordResetEmail(to, resetLink),
      ).rejects.toThrow(resetError);
      await expect(
        service.sendPasswordResetEmail(to, resetLink),
      ).rejects.toThrow('Mail provider quota exceeded');
    });
  });
});
