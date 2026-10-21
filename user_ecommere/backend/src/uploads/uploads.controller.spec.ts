import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CsrfGuard } from '@/common/guards/csrf.guard';
import { FileUploadResponseDto } from './dtos/file-upload-response.dto';

describe('UploadsController', () => {
  let controller: UploadsController;
  let mockUploadsService: {
    uploadFile: jest.Mock;
    uploadMultipleFiles: jest.Mock;
    deleteFile: jest.Mock;
  };

  const stubInterceptor = {
    intercept: jest.fn((_context, next) => next.handle()),
  };

  const mockJwtGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockCsrfGuard = {
    canActivate: jest.fn(() => true),
  };

  function createMockFile(
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: 'test-image.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 1024,
      destination: '/tmp',
      filename: 'test-image.png',
      path: '/tmp/test-image.png',
      buffer: Buffer.from('fake-image-bytes'),
      stream: null as any,
      ...overrides,
    };
  }

  beforeEach(async () => {
    mockUploadsService = {
      uploadFile: jest.fn(),
      uploadMultipleFiles: jest.fn(),
      deleteFile: jest.fn(),
    };

    const singleInterceptors =
      Reflect.getMetadata(
        '__interceptors__',
        UploadsController.prototype.uploadSingle,
      ) || [];
    const multipleInterceptors =
      Reflect.getMetadata(
        '__interceptors__',
        UploadsController.prototype.uploadMultiple,
      ) || [];

    let moduleBuilder = Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideGuard(CsrfGuard)
      .useValue(mockCsrfGuard)
      .overrideInterceptor(FileInterceptor('file'))
      .useValue(stubInterceptor)
      .overrideInterceptor(FilesInterceptor('files', 10))
      .useValue(stubInterceptor);

    for (const interceptor of [...singleInterceptors, ...multipleInterceptors]) {
      moduleBuilder = moduleBuilder
        .overrideInterceptor(interceptor)
        .useValue(stubInterceptor);
    }

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Route: POST /uploads/single', () => {
    it('delegates to uploadsService.uploadFile with file and folder, returning service result', async () => {
      const file = createMockFile();
      const mockResult: FileUploadResponseDto = {
        filename: 'file-uuid-1',
        originalName: 'test-image.png',
        mimetype: 'image/png',
        size: 1024,
        url: 'https://cloudinary.com/thaispray/products/file-uuid-1.png',
        path: 'products/file-uuid-1',
      };
      mockUploadsService.uploadFile.mockResolvedValue(mockResult);

      const result = await controller.uploadSingle(file, 'products');

      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(
        file,
        'products',
      );
      expect(result).toEqual(mockResult);
    });

    it('delegates to uploadsService.uploadFile with undefined folder when folder is omitted', async () => {
      const file = createMockFile();
      const mockResult: FileUploadResponseDto = {
        filename: 'file-uuid-2',
        originalName: 'test-image.png',
        mimetype: 'image/png',
        size: 1024,
        url: 'https://cloudinary.com/thaispray/products/file-uuid-2.png',
        path: 'products/file-uuid-2',
      };
      mockUploadsService.uploadFile.mockResolvedValue(mockResult);

      const result = await controller.uploadSingle(file, undefined);

      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(
        file,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('throws BadRequestException when file is missing (null) without calling uploadsService', async () => {
      await expect(
        controller.uploadSingle(null as any, 'products'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadSingle(null as any, 'products'),
      ).rejects.toThrow('No file provided');

      expect(mockUploadsService.uploadFile).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when file is missing (undefined) without calling uploadsService', async () => {
      await expect(
        controller.uploadSingle(undefined as any, 'products'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadSingle(undefined as any, 'products'),
      ).rejects.toThrow('No file provided');

      expect(mockUploadsService.uploadFile).not.toHaveBeenCalled();
    });

    it('propagates error when uploadsService.uploadFile fails', async () => {
      const file = createMockFile();
      mockUploadsService.uploadFile.mockRejectedValue(
        new BadRequestException('Upload failed'),
      );

      await expect(controller.uploadSingle(file, 'products')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUploadsService.uploadFile).toHaveBeenCalledWith(
        file,
        'products',
      );
    });
  });

  describe('Route: POST /uploads/multiple', () => {
    it('delegates to uploadsService.uploadMultipleFiles with files array and folder, returning service result', async () => {
      const files = [
        createMockFile({ originalname: 'file1.png' }),
        createMockFile({
          originalname: 'file2.jpg',
          mimetype: 'image/jpeg',
        }),
      ];
      const mockResult: FileUploadResponseDto[] = [
        {
          filename: 'file-1',
          originalName: 'file1.png',
          mimetype: 'image/png',
          size: 1024,
          url: 'https://cloudinary.com/thaispray/banners/file-1.png',
          path: 'banners/file-1',
        },
        {
          filename: 'file-2',
          originalName: 'file2.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: 'https://cloudinary.com/thaispray/banners/file-2.jpg',
          path: 'banners/file-2',
        },
      ];
      mockUploadsService.uploadMultipleFiles.mockResolvedValue(mockResult);

      const result = await controller.uploadMultiple(files, 'banners');

      expect(mockUploadsService.uploadMultipleFiles).toHaveBeenCalledWith(
        files,
        'banners',
      );
      expect(result).toEqual(mockResult);
    });

    it('delegates to uploadsService.uploadMultipleFiles with undefined folder when omitted', async () => {
      const files = [createMockFile()];
      const mockResult: FileUploadResponseDto[] = [
        {
          filename: 'file-1',
          originalName: 'test-image.png',
          mimetype: 'image/png',
          size: 1024,
          url: 'https://cloudinary.com/thaispray/products/file-1.png',
          path: 'products/file-1',
        },
      ];
      mockUploadsService.uploadMultipleFiles.mockResolvedValue(mockResult);

      const result = await controller.uploadMultiple(files, undefined);

      expect(mockUploadsService.uploadMultipleFiles).toHaveBeenCalledWith(
        files,
        undefined,
      );
      expect(result).toEqual(mockResult);
    });

    it('throws BadRequestException when files is undefined without calling uploadsService', async () => {
      await expect(
        controller.uploadMultiple(undefined as any, 'products'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadMultiple(undefined as any, 'products'),
      ).rejects.toThrow('No files provided');

      expect(mockUploadsService.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when files is null without calling uploadsService', async () => {
      await expect(
        controller.uploadMultiple(null as any, 'products'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.uploadMultiple(null as any, 'products'),
      ).rejects.toThrow('No files provided');

      expect(mockUploadsService.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when files array is empty without calling uploadsService', async () => {
      await expect(controller.uploadMultiple([], 'products')).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.uploadMultiple([], 'products')).rejects.toThrow(
        'No files provided',
      );

      expect(mockUploadsService.uploadMultipleFiles).not.toHaveBeenCalled();
    });

    it('propagates error when uploadsService.uploadMultipleFiles fails', async () => {
      const files = [createMockFile()];
      mockUploadsService.uploadMultipleFiles.mockRejectedValue(
        new BadRequestException('Maximum 10 files allowed'),
      );

      await expect(controller.uploadMultiple(files, 'products')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUploadsService.uploadMultipleFiles).toHaveBeenCalledWith(
        files,
        'products',
      );
    });
  });

  describe('Route: DELETE /uploads', () => {
    it('delegates to uploadsService.deleteFile with filePath from body, returning service result', async () => {
      const filePath = 'products/sample-image.jpg';
      const mockResult = { message: 'File deleted successfully' };
      mockUploadsService.deleteFile.mockResolvedValue(mockResult);

      const result = await controller.deleteFile(filePath);

      expect(mockUploadsService.deleteFile).toHaveBeenCalledWith(filePath);
      expect(result).toEqual(mockResult);
    });

    it('propagates error when uploadsService.deleteFile fails', async () => {
      const filePath = 'products/non-existent.jpg';
      mockUploadsService.deleteFile.mockRejectedValue(
        new BadRequestException('Failed to delete file'),
      );

      await expect(controller.deleteFile(filePath)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUploadsService.deleteFile).toHaveBeenCalledWith(filePath);
    });
  });

  describe('Multer configuration and fileFilter behavior', () => {
    it('accepts all allowed image mime types in the interceptor fileFilter', () => {
      const interceptorClass = Reflect.getMetadata(
        '__interceptors__',
        UploadsController.prototype.uploadSingle,
      )?.[0];
      expect(interceptorClass).toBeDefined();

      const instance = new interceptorClass();
      expect(instance.multer).toBeDefined();
      expect(typeof instance.multer.fileFilter).toBe('function');

      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];
      for (const mimetype of allowedTypes) {
        const callback = jest.fn();
        instance.multer.fileFilter(
          null,
          { mimetype } as Express.Multer.File,
          callback,
        );
        expect(callback).toHaveBeenCalledWith(null, true);
      }
    });

    it('rejects non-image mime types in the interceptor fileFilter with BadRequestException', () => {
      const interceptorClass = Reflect.getMetadata(
        '__interceptors__',
        UploadsController.prototype.uploadSingle,
      )?.[0];
      const instance = new interceptorClass();

      const callback = jest.fn();
      instance.multer.fileFilter(
        null,
        { mimetype: 'application/pdf' } as Express.Multer.File,
        callback,
      );

      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false,
      );
      const error = callback.mock.calls[0][0];
      expect(error.message).toBe('Invalid file type. Only images are allowed.');
    });

    it('configures multer 5MB file size limit', () => {
      const interceptorClass = Reflect.getMetadata(
        '__interceptors__',
        UploadsController.prototype.uploadSingle,
      )?.[0];
      const instance = new interceptorClass();
      expect(instance.multer.limits).toEqual({ fileSize: 5 * 1024 * 1024 });
    });
  });
});
