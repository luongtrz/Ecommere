import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail,
};
const defaultCreateTransport = jest.fn(() => mockTransporter);

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
  default: {
    createTransport: jest.fn(() => mockTransporter),
  },
}));

describe('MailService', () => {
  let service: MailService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const createServiceWithConfig = async (
    configMap: Record<string, any> = {},
  ) => {
    const mockConfigService = {
      get: jest.fn((key: string) => configMap[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    return {
      service: module.get<MailService>(MailService),
      configService: mockConfigService,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (nodemailer as any).createTransport = defaultCreateTransport;
    (nodemailer as any).default = {
      createTransport: defaultCreateTransport,
    };
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const instance = await createServiceWithConfig();
    service = instance.service;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransporter', () => {
    it('uses default host and port when config is empty', async () => {
      const { service: mailService } = await createServiceWithConfig({});
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      const transporter = mailService.createTransporter();

      expect(transporter).toBe(mockTransporter);
      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: undefined,
        }),
      );
    });

    it('uses custom host and port from config', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_HOST: 'smtp.custom.org',
        SMTP_PORT: '2525',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.custom.org',
          port: 2525,
        }),
      );
    });

    it('falls back to port 587 when SMTP_PORT is not a valid number', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_PORT: 'invalid-port',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
        }),
      );
    });

    it('sets secure to true when SMTP_SECURE is boolean true', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_SECURE: true,
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
        }),
      );
    });

    it('sets secure to true when SMTP_SECURE is string "true"', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_SECURE: 'true',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: true,
        }),
      );
    });

    it('sets secure to false when SMTP_SECURE is boolean false', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_SECURE: false,
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false,
        }),
      );
    });

    it('sets secure to false when SMTP_SECURE is string "false"', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_SECURE: 'false',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          secure: false,
        }),
      );
    });

    it('determines secure based on port === 465 when SMTP_SECURE is undefined', async () => {
      const { service: secureService } = await createServiceWithConfig({
        SMTP_PORT: 465,
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      secureService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 465,
          secure: true,
        }),
      );

      const { service: nonSecureService } = await createServiceWithConfig({
        SMTP_PORT: 587,
      });
      nonSecureService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 587,
          secure: false,
        }),
      );
    });

    it('uses SMTP_USER and SMTP_PASS for auth credentials', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_USER: 'smtp_user@test.com',
        SMTP_PASS: 'smtp_password',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'smtp_user@test.com',
            pass: 'smtp_password',
          },
        }),
      );
    });

    it('falls back to SMTP_USERNAME and SMTP_PASSWORD for auth credentials', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_USERNAME: 'smtp_username@test.com',
        SMTP_PASSWORD: 'smtp_alternate_password',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'smtp_username@test.com',
            pass: 'smtp_alternate_password',
          },
        }),
      );
    });

    it('provides empty string for pass when only user is set', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_USER: 'only_user@test.com',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: 'only_user@test.com',
            pass: '',
          },
        }),
      );
    });

    it('provides empty string for user when only pass is set', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_PASS: 'only_pass',
      });
      (nodemailer as any).createTransport = jest
        .fn()
        .mockReturnValue(mockTransporter);

      mailService.createTransporter();

      expect((nodemailer as any).createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: {
            user: '',
            pass: 'only_pass',
          },
        }),
      );
    });

    it('falls back to nodemailer.default.createTransport when nodemailer.createTransport is undefined', () => {
      const originalCreateTransport = (nodemailer as any).createTransport;
      const originalDefault = (nodemailer as any).default;
      const mockDefaultTransportFn = jest.fn().mockReturnValue(mockTransporter);
      try {
        (nodemailer as any).createTransport = undefined;
        (nodemailer as any).default = {
          createTransport: mockDefaultTransportFn,
        };

        const result = service.createTransporter();

        expect(result).toBe(mockTransporter);
        expect(mockDefaultTransportFn).toHaveBeenCalled();
      } finally {
        (nodemailer as any).createTransport = originalCreateTransport;
        (nodemailer as any).default = originalDefault;
      }
    });

    it('throws error when neither createTransport nor default.createTransport is available', () => {
      const originalCreateTransport = (nodemailer as any).createTransport;
      const originalDefault = (nodemailer as any).default;
      try {
        (nodemailer as any).createTransport = undefined;
        (nodemailer as any).default = undefined;

        expect(() => service.createTransporter()).toThrow(TypeError);
      } finally {
        (nodemailer as any).createTransport = originalCreateTransport;
        (nodemailer as any).default = originalDefault;
      }
    });
  });

  describe('sendMail', () => {
    it('sends email successfully using existing transporter and explicit from option', async () => {
      const info = { messageId: 'msg-1' };
      mockSendMail.mockResolvedValue(info);

      const result = await service.sendMail({
        from: 'sender@custom.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test html</p>',
      });

      expect(result).toEqual(info);
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'sender@custom.com',
        to: 'recipient@test.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test html</p>',
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Email sent to recipient@test.com',
      );
    });

    it('creates a new transporter when this.transporter is falsy', async () => {
      (service as any).transporter = null;
      const createTransporterSpy = jest
        .spyOn(service, 'createTransporter')
        .mockReturnValue({
          sendMail: mockSendMail,
        });
      mockSendMail.mockResolvedValue({ messageId: 'msg-2' });

      await service.sendMail({
        to: 'recipient@test.com',
        subject: 'Hello',
      });

      expect(createTransporterSpy).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalled();
    });

    it('uses SMTP_FROM when options.from is undefined', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_FROM: 'smtp_from@domain.com',
      });
      mockSendMail.mockResolvedValue({ messageId: 'msg-3' });

      await mailService.sendMail({
        to: 'recipient@test.com',
        subject: 'Test',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'smtp_from@domain.com',
        }),
      );
    });

    it('uses SMTP_USER when options.from and SMTP_FROM are undefined', async () => {
      const { service: mailService } = await createServiceWithConfig({
        SMTP_USER: 'smtp_user@domain.com',
      });
      mockSendMail.mockResolvedValue({ messageId: 'msg-4' });

      await mailService.sendMail({
        to: 'recipient@test.com',
        subject: 'Test',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'smtp_user@domain.com',
        }),
      );
    });

    it('uses default fallback email noreply@thaispray.shop when all from sources are undefined', async () => {
      const { service: mailService } = await createServiceWithConfig({});
      mockSendMail.mockResolvedValue({ messageId: 'msg-5' });

      await mailService.sendMail({
        to: 'recipient@test.com',
        subject: 'Test',
      });

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@thaispray.shop',
        }),
      );
    });

    it('logs error with message and stack and rethrows when sendMail fails with standard Error', async () => {
      const sendError = new Error('SMTP connection rejected');
      sendError.stack = 'Error: SMTP connection rejected\n    at test';
      mockSendMail.mockRejectedValue(sendError);

      await expect(
        service.sendMail({
          to: 'recipient@test.com',
          subject: 'Error test',
        }),
      ).rejects.toThrow('SMTP connection rejected');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@test.com: SMTP connection rejected',
        sendError.stack,
      );
    });

    it('logs error when error is a string without message or stack and rethrows', async () => {
      const stringError = 'Direct string error failure';
      mockSendMail.mockRejectedValue(stringError);

      await expect(
        service.sendMail({
          to: 'recipient@test.com',
          subject: 'String error test',
        }),
      ).rejects.toEqual(stringError);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@test.com: Direct string error failure',
        undefined,
      );
    });

    it('logs error when error is an object without message property', async () => {
      const customError = { code: 'ESOCKET', errno: -111 };
      mockSendMail.mockRejectedValue(customError);

      await expect(
        service.sendMail({
          to: 'recipient@test.com',
          subject: 'Object error test',
        }),
      ).rejects.toEqual(customError);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send email to recipient@test.com: [object Object]',
        undefined,
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('sends password reset email with reset link in both text and html', async () => {
      const sendMailSpy = jest.spyOn(service, 'sendMail').mockResolvedValue({
        messageId: 'pwd-reset-1',
      });
      const resetLink =
        'https://thaispray.shop/reset-password?token=abcdef123456';

      const result = await service.sendPasswordResetEmail(
        'customer@test.com',
        resetLink,
      );

      expect(result).toEqual({ messageId: 'pwd-reset-1' });
      expect(sendMailSpy).toHaveBeenCalledWith({
        to: 'customer@test.com',
        subject: 'Đặt lại mật khẩu - Thai Spray Shop',
        text: expect.stringContaining(resetLink),
        html: expect.stringContaining(resetLink),
      });

      const callArg = sendMailSpy.mock.calls[0][0];
      expect(callArg.text).toContain('Bạn đã yêu cầu đặt lại mật khẩu.');
      expect(callArg.text).toContain('Liên kết này sẽ hết hạn sau 15 phút.');
      expect(callArg.html).toContain('<h2>Yêu cầu đặt lại mật khẩu</h2>');
      expect(callArg.html).toContain('Thai Spray Shop');
    });

    it('propagates error when sending password reset email fails', async () => {
      jest
        .spyOn(service, 'sendMail')
        .mockRejectedValue(new Error('Send failed'));

      await expect(
        service.sendPasswordResetEmail(
          'customer@test.com',
          'https://thaispray.shop/reset-password?token=xyz',
        ),
      ).rejects.toThrow('Send failed');
    });
  });
});
