import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './mail.module';
import { MailService } from './mail.service';

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

describe('MailModule', () => {
  it('should be defined', () => {
    expect(MailModule).toBeDefined();
  });

  describe('Module metadata', () => {
    it('is marked as a global module', () => {
      const isGlobal = Reflect.getMetadata('__module:global__', MailModule);
      expect(isGlobal).toBe(true);
    });

    it('imports ConfigModule', () => {
      const imports = Reflect.getMetadata('imports', MailModule);
      expect(imports).toBeDefined();
      expect(imports).toContain(ConfigModule);
    });

    it('provides MailService', () => {
      const providers = Reflect.getMetadata('providers', MailModule);
      expect(providers).toBeDefined();
      expect(providers).toContain(MailService);
    });

    it('exports MailService', () => {
      const exports = Reflect.getMetadata('exports', MailModule);
      expect(exports).toBeDefined();
      expect(exports).toContain(MailService);
    });
  });

  describe('Module compilation', () => {
    it('compiles successfully when providers are overridden with stubs', async () => {
      const mockMailService = {
        sendMail: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
        createTransporter: jest.fn(),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [MailModule],
      })
        .overrideProvider(MailService)
        .useValue(mockMailService)
        .compile();

      expect(moduleRef).toBeDefined();

      const mailModule = moduleRef.get<MailModule>(MailModule);
      expect(mailModule).toBeDefined();
      expect(mailModule).toBeInstanceOf(MailModule);

      const mailService = moduleRef.get<MailService>(MailService);
      expect(mailService).toBeDefined();
      expect(mailService).toBe(mockMailService);
    });

    it('compiles successfully with real MailService and mocked ConfigService', async () => {
      const mockConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [MailModule],
      })
        .overrideProvider(ConfigService)
        .useValue(mockConfigService)
        .compile();

      expect(moduleRef).toBeDefined();

      const mailModule = moduleRef.get<MailModule>(MailModule);
      expect(mailModule).toBeDefined();
      expect(mailModule).toBeInstanceOf(MailModule);

      const mailService = moduleRef.get<MailService>(MailService);
      expect(mailService).toBeDefined();
      expect(mailService).toBeInstanceOf(MailService);
    });
  });
});
