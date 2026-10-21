import { Test, TestingModule } from '@nestjs/testing';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadsModule } from './uploads.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('UploadsModule', () => {
  describe('Module compilation with overridden provider', () => {
    let moduleRef: TestingModule;
    let uploadsModule: UploadsModule;
    let uploadsController: UploadsController;
    let uploadsService: UploadsService;

    const mockUploadsService = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
    };

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [UploadsModule],
      })
        .overrideProvider(UploadsService)
        .useValue(mockUploadsService)
        .compile();

      uploadsModule = moduleRef.get<UploadsModule>(UploadsModule);
      uploadsController = moduleRef.get<UploadsController>(UploadsController);
      uploadsService = moduleRef.get<UploadsService>(UploadsService);
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should be defined', () => {
      expect(uploadsModule).toBeDefined();
      expect(uploadsModule).toBeInstanceOf(UploadsModule);
    });

    it('should resolve UploadsController', () => {
      expect(uploadsController).toBeDefined();
      expect(uploadsController).toBeInstanceOf(UploadsController);
    });

    it('should resolve UploadsService with the overridden provider', () => {
      expect(uploadsService).toBeDefined();
      expect(uploadsService).toBe(mockUploadsService);
    });

    it('should allow UploadsController to interact with the mocked UploadsService', async () => {
      const mockResult = {
        filename: 'file-123',
        originalName: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        url: 'https://cloudinary.com/test.jpg',
        path: 'products/file-123',
      };
      mockUploadsService.uploadFile.mockResolvedValueOnce(mockResult);

      const mockFile = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test'),
      } as Express.Multer.File;

      const result = await uploadsController.uploadSingle(mockFile, 'products');

      expect(result).toBe(mockResult);
      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'products',
      );
    });
  });

  describe('Module compilation with mocked ConfigService provider', () => {
    let moduleRef: TestingModule;

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const configMap: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
          CLOUDINARY_FOLDER: 'test-folder',
        };
        return configMap[key];
      }),
    };

    @Global()
    @Module({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
      exports: [ConfigService],
    })
    class MockConfigModule {}

    beforeEach(async () => {
      jest.clearAllMocks();

      moduleRef = await Test.createTestingModule({
        imports: [MockConfigModule, UploadsModule],
      }).compile();
    });

    afterEach(async () => {
      if (moduleRef) {
        await moduleRef.close();
      }
    });

    it('should resolve real UploadsService and UploadsController with mocked ConfigService', () => {
      const module = moduleRef.get<UploadsModule>(UploadsModule);
      const service = moduleRef.get<UploadsService>(UploadsService);
      const controller = moduleRef.get<UploadsController>(UploadsController);

      expect(module).toBeDefined();
      expect(module).toBeInstanceOf(UploadsModule);
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(UploadsService);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(UploadsController);
    });
  });

  describe('Direct instantiation', () => {
    it('can be instantiated directly as a class instance', () => {
      const moduleInstance = new UploadsModule();
      expect(moduleInstance).toBeDefined();
      expect(moduleInstance).toBeInstanceOf(UploadsModule);
    });
  });

  describe('Module metadata decoration', () => {
    it('should register controllers, providers, and exports metadata', () => {
      const controllers = Reflect.getMetadata('controllers', UploadsModule);
      const providers = Reflect.getMetadata('providers', UploadsModule);
      const exportsList = Reflect.getMetadata('exports', UploadsModule);

      expect(controllers).toEqual([UploadsController]);
      expect(providers).toEqual([UploadsService]);
      expect(exportsList).toEqual([UploadsService]);
    });
  });
});
