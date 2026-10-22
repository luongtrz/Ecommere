import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { UploadsService } from './uploads.service';

const mockUploadStream = {
  pipe: jest.fn(),
};

const mockReadStream = {
  pipe: jest.fn().mockReturnValue(mockUploadStream),
};

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

describe('UploadsService', () => {
  let service: UploadsService;
  let loggerErrorSpy: jest.SpyInstance;

  const mockConfigValues: Record<string, string | undefined> = {
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
    CLOUDINARY_FOLDER: 'test-folder',
  };

  const mockConfigService = {
    get: jest.fn((key: string) => mockConfigValues[key]),
  };

  const mockDefaultUploadResult = {
    public_id: 'test-folder/products/sample_public_id',
    secure_url:
      'https://res.cloudinary.com/test-cloud/image/upload/v1/test-folder/products/sample_public_id.jpg',
    bytes: 1024,
    format: 'jpg',
    resource_type: 'image',
  };

  const createMockFile = (
    overrides?: Partial<Express.Multer.File>,
  ): Express.Multer.File => {
    const defaultBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    return {
      fieldname: 'file',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: defaultBuffer.length,
      buffer: defaultBuffer,
      destination: '',
      filename: 'test-image.jpg',
      path: '',
      stream: null as any,
      ...overrides,
    };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});

    mockConfigValues.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    mockConfigValues.CLOUDINARY_API_KEY = 'test-api-key';
    mockConfigValues.CLOUDINARY_API_SECRET = 'test-api-secret';
    mockConfigValues.CLOUDINARY_FOLDER = 'test-folder';

    mockConfigService.get.mockImplementation(
      (key: string) => mockConfigValues[key],
    );

    (streamifier.createReadStream as jest.Mock).mockReturnValue(mockReadStream);

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
      (_options: any, callback: (error: any, result: any) => void) => {
        if (callback) {
          callback(null, mockDefaultUploadResult);
        }
        return mockUploadStream;
      },
    );

    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
      result: 'ok',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure cloudinary with credentials from ConfigService', () => {
      expect(cloudinary.config).toHaveBeenCalledWith({
        cloud_name: 'test-cloud',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      });
    });
  });

  describe('uploadFile', () => {
    it('should successfully upload a valid JPEG file with default folder', async () => {
      const file = createMockFile();

      const result = await service.uploadFile(file);

      expect(result).toEqual({
        filename: mockDefaultUploadResult.public_id,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: mockDefaultUploadResult.secure_url,
        path: mockDefaultUploadResult.public_id,
      });
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/products',
          resource_type: 'image',
        },
        expect.any(Function),
      );
      expect(streamifier.createReadStream).toHaveBeenCalledWith(file.buffer);
      expect(mockReadStream.pipe).toHaveBeenCalledWith(mockUploadStream);
    });

    it('should successfully upload a valid JPG file with custom folder', async () => {
      const file = createMockFile({
        originalname: 'photo.jpg',
        mimetype: 'image/jpg',
      });

      const result = await service.uploadFile(file, 'categories');

      expect(result).toEqual({
        filename: mockDefaultUploadResult.public_id,
        originalName: 'photo.jpg',
        mimetype: 'image/jpg',
        size: file.size,
        url: mockDefaultUploadResult.secure_url,
        path: mockDefaultUploadResult.public_id,
      });
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/categories',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should successfully upload a valid PNG file', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
      ]);
      const file = createMockFile({
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: pngBuffer,
        size: pngBuffer.length,
      });

      const result = await service.uploadFile(file);

      expect(result.originalName).toBe('image.png');
      expect(result.mimetype).toBe('image/png');
      expect(result.url).toBe(mockDefaultUploadResult.secure_url);
    });

    it('should successfully upload a valid WebP file', async () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const file = createMockFile({
        originalname: 'image.webp',
        mimetype: 'image/webp',
        buffer: webpBuffer,
        size: webpBuffer.length,
      });

      const result = await service.uploadFile(file);

      expect(result.originalName).toBe('image.webp');
      expect(result.mimetype).toBe('image/webp');
      expect(result.url).toBe(mockDefaultUploadResult.secure_url);
    });

    it('should successfully upload a valid GIF87a file', async () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x00]);
      const file = createMockFile({
        originalname: 'anim.gif',
        mimetype: 'image/gif',
        buffer: gifBuffer,
        size: gifBuffer.length,
      });

      const result = await service.uploadFile(file);

      expect(result.originalName).toBe('anim.gif');
      expect(result.mimetype).toBe('image/gif');
      expect(result.url).toBe(mockDefaultUploadResult.secure_url);
    });

    it('should successfully upload a valid GIF89a file', async () => {
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00]);
      const file = createMockFile({
        originalname: 'anim89.gif',
        mimetype: 'image/gif',
        buffer: gifBuffer,
        size: gifBuffer.length,
      });

      const result = await service.uploadFile(file);

      expect(result.originalName).toBe('anim89.gif');
      expect(result.mimetype).toBe('image/gif');
      expect(result.url).toBe(mockDefaultUploadResult.secure_url);
    });

    it('should normalize mimetype with leading/trailing spaces and uppercase letters', async () => {
      const file = createMockFile({
        mimetype: '  IMAGE/JPEG  ',
      });

      const result = await service.uploadFile(file);

      expect(result.mimetype).toBe('  IMAGE/JPEG  ');
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
    });

    it('should fallback to default cloudinary folder "thaispray" when CLOUDINARY_FOLDER is not configured', async () => {
      mockConfigValues.CLOUDINARY_FOLDER = undefined;
      const file = createMockFile();

      await service.uploadFile(file, 'banners');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'thaispray/banners',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should trim folder name and allow valid subfolder path', async () => {
      const file = createMockFile();

      await service.uploadFile(file, '  products/sub-cat_1  ');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/products/sub-cat_1',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should fallback to DEFAULT_FOLDER when folder is empty string or only whitespace', async () => {
      const file = createMockFile();

      await service.uploadFile(file, '   ');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/products',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should fallback to DEFAULT_FOLDER when folder is null or undefined', async () => {
      const file = createMockFile();

      await service.uploadFile(file, undefined);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/products',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should throw BadRequestException when file is not provided (null or undefined)', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(null as any)).rejects.toThrow(
        'No file provided',
      );

      await expect(service.uploadFile(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(undefined as any)).rejects.toThrow(
        'No file provided',
      );
    });

    it('should throw BadRequestException when file size exceeds MAX_FILE_SIZE (5MB)', async () => {
      const file = createMockFile({
        size: 5 * 1024 * 1024 + 1,
      });

      await expect(service.uploadFile(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file)).rejects.toThrow(
        'File size exceeds 5MB limit',
      );
    });

    it('should throw BadRequestException when buffer is null, undefined, or not a Buffer', async () => {
      const fileWithNullBuffer = createMockFile({
        buffer: null as any,
      });
      await expect(service.uploadFile(fileWithNullBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(fileWithNullBuffer)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      const fileWithUndefinedBuffer = createMockFile({
        buffer: undefined as any,
      });
      await expect(service.uploadFile(fileWithUndefinedBuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(fileWithUndefinedBuffer)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      const fileWithNotABuffer = createMockFile({
        buffer: 'not-a-buffer' as any,
      });
      await expect(service.uploadFile(fileWithNotABuffer)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(fileWithNotABuffer)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when mimetype is unsupported or missing', async () => {
      const fileWithPdf = createMockFile({
        mimetype: 'application/pdf',
      });
      await expect(service.uploadFile(fileWithPdf)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(fileWithPdf)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      const fileWithUndefinedMime = createMockFile({
        mimetype: undefined as any,
      });
      await expect(service.uploadFile(fileWithUndefinedMime)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(fileWithUndefinedMime)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when JPEG buffer has invalid signature or insufficient length', async () => {
      // Length < 3
      const shortJpeg = createMockFile({
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8]),
        size: 2,
      });
      await expect(service.uploadFile(shortJpeg)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Byte 0 mismatch
      const wrongByte0 = createMockFile({
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0x00, 0xd8, 0xff]),
        size: 3,
      });
      await expect(service.uploadFile(wrongByte0)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Byte 1 mismatch
      const wrongByte1 = createMockFile({
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xff, 0x00, 0xff]),
        size: 3,
      });
      await expect(service.uploadFile(wrongByte1)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Byte 2 mismatch
      const wrongByte2 = createMockFile({
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0x00]),
        size: 3,
      });
      await expect(service.uploadFile(wrongByte2)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when PNG buffer has invalid signature or insufficient length', async () => {
      // Length < 8
      const shortPng = createMockFile({
        mimetype: 'image/png',
        buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a]),
        size: 7,
      });
      await expect(service.uploadFile(shortPng)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Byte mismatch
      const wrongPng = createMockFile({
        mimetype: 'image/png',
        buffer: Buffer.from([0x00, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        size: 8,
      });
      await expect(service.uploadFile(wrongPng)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when WebP buffer has invalid signature or insufficient length', async () => {
      // Length < 12
      const shortWebp = createMockFile({
        mimetype: 'image/webp',
        buffer: Buffer.from([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
        ]),
        size: 11,
      });
      await expect(service.uploadFile(shortWebp)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Non-RIFF prefix
      const wrongRiff = createMockFile({
        mimetype: 'image/webp',
        buffer: Buffer.from([
          0x00, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
          0x50,
        ]),
        size: 12,
      });
      await expect(service.uploadFile(wrongRiff)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Non-WEBP signature at bytes 8..11
      const wrongWebp = createMockFile({
        mimetype: 'image/webp',
        buffer: Buffer.from([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x45, 0x42,
          0x50,
        ]),
        size: 12,
      });
      await expect(service.uploadFile(wrongWebp)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when GIF buffer has invalid signature or insufficient length', async () => {
      // Length < 6
      const shortGif = createMockFile({
        mimetype: 'image/gif',
        buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37]),
        size: 5,
      });
      await expect(service.uploadFile(shortGif)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Wrong prefix
      const wrongPrefix = createMockFile({
        mimetype: 'image/gif',
        buffer: Buffer.from([0x00, 0x49, 0x46, 0x38, 0x37, 0x61]),
        size: 6,
      });
      await expect(service.uploadFile(wrongPrefix)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Version not 7 or 9 (e.g. '8')
      const wrongVersion = createMockFile({
        mimetype: 'image/gif',
        buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x38, 0x61]),
        size: 6,
      });
      await expect(service.uploadFile(wrongVersion)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      // Byte 5 not 'a' (0x61)
      const wrongEnding = createMockFile({
        mimetype: 'image/gif',
        buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x00]),
        size: 6,
      });
      await expect(service.uploadFile(wrongEnding)).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );
    });

    it('should throw BadRequestException when folder format is invalid (regex failure or path traversal)', async () => {
      const file = createMockFile();

      // Path traversal with ..
      await expect(service.uploadFile(file, '../secrets')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, '../secrets')).rejects.toThrow(
        'Upload failed',
      );

      // Path traversal with products/..
      await expect(service.uploadFile(file, 'products/..')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, 'products/..')).rejects.toThrow(
        'Upload failed',
      );

      // Starts with slash
      await expect(service.uploadFile(file, '/leading-slash')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, '/leading-slash')).rejects.toThrow(
        'Upload failed',
      );

      // Contains invalid characters
      await expect(service.uploadFile(file, 'invalid@folder!')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, 'invalid@folder!')).rejects.toThrow(
        'Upload failed',
      );

      // Exceeds 64 characters
      const tooLongFolder = 'a'.repeat(65);
      await expect(service.uploadFile(file, tooLongFolder)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file, tooLongFolder)).rejects.toThrow(
        'Upload failed',
      );
    });

    it('should throw BadRequestException when Cloudinary upload_stream returns an error', async () => {
      const file = createMockFile();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: (error: any, result: any) => void) => {
          callback(new Error('Cloudinary connection timeout'), null);
          return mockUploadStream;
        },
      );

      await expect(service.uploadFile(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file)).rejects.toThrow('Upload failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Upload failed: Cloudinary connection timeout',
      );
    });

    it('should throw BadRequestException when Cloudinary upload_stream returns no result and no error', async () => {
      const file = createMockFile();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: (error: any, result: any) => void) => {
          callback(null, null);
          return mockUploadStream;
        },
      );

      await expect(service.uploadFile(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file)).rejects.toThrow('Upload failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Upload failed: Cloudinary returned no result',
      );
    });

    it('should throw BadRequestException when Cloudinary upload_stream returns a non-Error failure', async () => {
      const file = createMockFile();
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: (error: any, result: any) => void) => {
          callback('Cloudinary raw string error' as any, null);
          return mockUploadStream;
        },
      );

      await expect(service.uploadFile(file)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadFile(file)).rejects.toThrow('Upload failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Upload failed: Unknown upload error',
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should successfully upload multiple valid files', async () => {
      const jpegFile = createMockFile({
        originalname: 'photo1.jpg',
        mimetype: 'image/jpeg',
      });
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const pngFile = createMockFile({
        originalname: 'photo2.png',
        mimetype: 'image/png',
        buffer: pngBuffer,
        size: pngBuffer.length,
      });

      const results = await service.uploadMultipleFiles([jpegFile, pngFile]);

      expect(results).toHaveLength(2);
      expect(results[0].originalName).toBe('photo1.jpg');
      expect(results[1].originalName).toBe('photo2.png');
      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledTimes(2);
    });

    it('should pass custom folder to each file upload in uploadMultipleFiles', async () => {
      const file1 = createMockFile({ originalname: 'file1.jpg' });
      const file2 = createMockFile({ originalname: 'file2.jpg' });

      await service.uploadMultipleFiles([file1, file2], 'gallery');

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        {
          folder: 'test-folder/gallery',
          resource_type: 'image',
        },
        expect.any(Function),
      );
    });

    it('should throw BadRequestException when files array is empty, undefined, or null', async () => {
      await expect(service.uploadMultipleFiles([])).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadMultipleFiles([])).rejects.toThrow(
        'No files provided',
      );

      await expect(
        service.uploadMultipleFiles(undefined as any),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadMultipleFiles(undefined as any),
      ).rejects.toThrow('No files provided');

      await expect(service.uploadMultipleFiles(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadMultipleFiles(null as any)).rejects.toThrow(
        'No files provided',
      );
    });

    it('should throw BadRequestException when files count exceeds MAX_FILES (10)', async () => {
      const files = Array.from({ length: 11 }, (_, i) =>
        createMockFile({ originalname: `photo-${i}.jpg` }),
      );

      await expect(service.uploadMultipleFiles(files)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadMultipleFiles(files)).rejects.toThrow(
        'Maximum 10 files allowed',
      );
      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('should validate all files before uploading and throw if any file is invalid', async () => {
      const validFile = createMockFile({ originalname: 'valid.jpg' });
      const invalidFile = createMockFile({
        originalname: 'invalid.jpg',
        buffer: Buffer.from([0x00, 0x00, 0x00]),
      });

      await expect(
        service.uploadMultipleFiles([validFile, invalidFile]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadMultipleFiles([validFile, invalidFile]),
      ).rejects.toThrow(
        'Invalid file type. File content does not match declared type.',
      );

      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if any file in batch exceeds size limit', async () => {
      const validFile = createMockFile();
      const oversizedFile = createMockFile({
        size: 5 * 1024 * 1024 + 10,
      });

      await expect(
        service.uploadMultipleFiles([validFile, oversizedFile]),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadMultipleFiles([validFile, oversizedFile]),
      ).rejects.toThrow('File size exceeds 5MB limit');

      expect(cloudinary.uploader.upload_stream).not.toHaveBeenCalled();
    });

    it('should propagate upload failure when one file fails during upload in uploadMultipleFiles', async () => {
      const file1 = createMockFile({ originalname: 'file1.jpg' });
      const file2 = createMockFile({ originalname: 'file2.jpg' });

      let callCount = 0;
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options: any, callback: (error: any, result: any) => void) => {
          callCount++;
          if (callCount === 2) {
            callback(new Error('Cloudinary error on second file'), null);
          } else {
            callback(null, mockDefaultUploadResult);
          }
          return mockUploadStream;
        },
      );

      await expect(service.uploadMultipleFiles([file1, file2])).rejects.toThrow(
        new BadRequestException('Upload failed'),
      );
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file when Cloudinary returns "ok"', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const result = await service.deleteFile('products/sample_image');

      expect(result).toEqual({ message: 'File deleted successfully' });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'products/sample_image',
        { resource_type: 'image' },
      );
    });

    it('should successfully delete a file when Cloudinary returns "not found"', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'not found',
      });

      const result = await service.deleteFile('products/non_existing_image');

      expect(result).toEqual({ message: 'File deleted successfully' });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'products/non_existing_image',
        { resource_type: 'image' },
      );
    });

    it('should trim whitespace from filePath before calling destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const result = await service.deleteFile('  products/trimmed_image  ');

      expect(result).toEqual({ message: 'File deleted successfully' });
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'products/trimmed_image',
        { resource_type: 'image' },
      );
    });

    it('should throw BadRequestException when filePath is empty, whitespace, null, or undefined', async () => {
      await expect(service.deleteFile('')).rejects.toThrow(BadRequestException);
      await expect(service.deleteFile('')).rejects.toThrow(
        'File path is required',
      );

      await expect(service.deleteFile('   ')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile('   ')).rejects.toThrow(
        'File path is required',
      );

      await expect(service.deleteFile(null as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile(null as any)).rejects.toThrow(
        'File path is required',
      );

      await expect(service.deleteFile(undefined as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile(undefined as any)).rejects.toThrow(
        'File path is required',
      );

      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when Cloudinary returns an unexpected result status', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'error',
      });

      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        'Failed to delete file',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Delete failed: Cloudinary returned error',
      );
    });

    it('should throw BadRequestException when Cloudinary uploader.destroy rejects with Error', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Network connection lost'),
      );

      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        'Failed to delete file',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Delete failed: Network connection lost',
      );
    });

    it('should throw BadRequestException when Cloudinary uploader.destroy rejects with a non-Error', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        'Raw string error during destroy',
      );

      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile('products/sample_image')).rejects.toThrow(
        'Failed to delete file',
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Delete failed: Unknown upload error',
      );
    });
  });
});
