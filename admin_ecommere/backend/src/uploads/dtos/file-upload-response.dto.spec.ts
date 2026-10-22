import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FileUploadResponseDto } from './file-upload-response.dto';

describe('FileUploadResponseDto', () => {
  it('should be defined', () => {
    expect(FileUploadResponseDto).toBeDefined();
  });

  describe('instantiation and property assignment', () => {
    it('should create an empty instance with all properties undefined', () => {
      const dto = new FileUploadResponseDto();

      expect(dto).toBeInstanceOf(FileUploadResponseDto);
      expect(dto.filename).toBeUndefined();
      expect(dto.originalName).toBeUndefined();
      expect(dto.mimetype).toBeUndefined();
      expect(dto.size).toBeUndefined();
      expect(dto.url).toBeUndefined();
      expect(dto.path).toBeUndefined();
    });

    it('should correctly set and retrieve each property individually', () => {
      const dto = new FileUploadResponseDto();

      dto.filename = 'sample-file-123.jpg';
      dto.originalName = 'sample.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1048576;
      dto.url =
        'https://res.cloudinary.com/demo/image/upload/sample-file-123.jpg';
      dto.path = 'products/sample-file-123.jpg';

      expect(dto.filename).toBe('sample-file-123.jpg');
      expect(dto.originalName).toBe('sample.jpg');
      expect(dto.mimetype).toBe('image/jpeg');
      expect(dto.size).toBe(1048576);
      expect(dto.url).toBe(
        'https://res.cloudinary.com/demo/image/upload/sample-file-123.jpg',
      );
      expect(dto.path).toBe('products/sample-file-123.jpg');
    });

    it('should populate all properties correctly via Object.assign', () => {
      const uploadData = {
        filename: 'products_abc123.png',
        originalName: 'thumbnail.png',
        mimetype: 'image/png',
        size: 512000,
        url: 'https://res.cloudinary.com/demo/image/upload/products_abc123.png',
        path: 'products/products_abc123.png',
      };

      const dto = Object.assign(new FileUploadResponseDto(), uploadData);

      expect(dto).toBeInstanceOf(FileUploadResponseDto);
      expect(dto).toEqual(uploadData);
      expect(dto.filename).toBe(uploadData.filename);
      expect(dto.originalName).toBe(uploadData.originalName);
      expect(dto.mimetype).toBe(uploadData.mimetype);
      expect(dto.size).toBe(uploadData.size);
      expect(dto.url).toBe(uploadData.url);
      expect(dto.path).toBe(uploadData.path);
    });

    it('should handle zero size and empty strings properly', () => {
      const dto = new FileUploadResponseDto();
      dto.filename = '';
      dto.originalName = '';
      dto.mimetype = '';
      dto.size = 0;
      dto.url = '';
      dto.path = '';

      expect(dto.filename).toBe('');
      expect(dto.originalName).toBe('');
      expect(dto.mimetype).toBe('');
      expect(dto.size).toBe(0);
      expect(dto.url).toBe('');
      expect(dto.path).toBe('');
    });
  });

  describe('plainToInstance transformation', () => {
    it('should correctly transform a complete plain object into a FileUploadResponseDto instance', () => {
      const plain = {
        filename: 'banner_xyz.webp',
        originalName: 'hero-banner.webp',
        mimetype: 'image/webp',
        size: 204800,
        url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/banners/banner_xyz.webp',
        path: 'banners/banner_xyz.webp',
      };

      const instance = plainToInstance(FileUploadResponseDto, plain);

      expect(instance).toBeInstanceOf(FileUploadResponseDto);
      expect(instance.filename).toBe(plain.filename);
      expect(instance.originalName).toBe(plain.originalName);
      expect(instance.mimetype).toBe(plain.mimetype);
      expect(instance.size).toBe(plain.size);
      expect(instance.url).toBe(plain.url);
      expect(instance.path).toBe(plain.path);
    });

    it('should transform an empty object with all fields undefined', () => {
      const instance = plainToInstance(FileUploadResponseDto, {});

      expect(instance).toBeInstanceOf(FileUploadResponseDto);
      expect(instance.filename).toBeUndefined();
      expect(instance.originalName).toBeUndefined();
      expect(instance.mimetype).toBeUndefined();
      expect(instance.size).toBeUndefined();
      expect(instance.url).toBeUndefined();
      expect(instance.path).toBeUndefined();
    });

    it('should transform a partial plain object retaining specified values', () => {
      const partialPlain = {
        filename: 'avatar_999.gif',
        url: 'https://res.cloudinary.com/demo/image/upload/avatar_999.gif',
      };

      const instance = plainToInstance(FileUploadResponseDto, partialPlain);

      expect(instance).toBeInstanceOf(FileUploadResponseDto);
      expect(instance.filename).toBe(partialPlain.filename);
      expect(instance.url).toBe(partialPlain.url);
      expect(instance.originalName).toBeUndefined();
      expect(instance.mimetype).toBeUndefined();
      expect(instance.size).toBeUndefined();
      expect(instance.path).toBeUndefined();
    });

    it('should transform an array of plain upload objects', () => {
      const plainArray = [
        {
          filename: 'img_1.jpg',
          originalName: 'first.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          url: 'https://res.cloudinary.com/demo/image/upload/img_1.jpg',
          path: 'products/img_1.jpg',
        },
        {
          filename: 'img_2.png',
          originalName: 'second.png',
          mimetype: 'image/png',
          size: 2048,
          url: 'https://res.cloudinary.com/demo/image/upload/img_2.png',
          path: 'products/img_2.png',
        },
      ];

      const instances = plainToInstance(FileUploadResponseDto, plainArray);

      expect(instances).toHaveLength(2);
      expect(instances[0]).toBeInstanceOf(FileUploadResponseDto);
      expect(instances[0].filename).toBe('img_1.jpg');
      expect(instances[1]).toBeInstanceOf(FileUploadResponseDto);
      expect(instances[1].filename).toBe('img_2.png');
    });
  });

  describe('validation via class-validator', () => {
    it('should yield unknownValue validation error on direct instantiation (no class-validator decorators)', async () => {
      const dto = new FileUploadResponseDto();
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });

    it('should yield unknownValue validation error on plainToInstance instance', async () => {
      const instance = plainToInstance(FileUploadResponseDto, {
        filename: 'file.jpg',
        originalName: 'file.jpg',
        mimetype: 'image/jpeg',
        size: 5000,
        url: 'https://res.cloudinary.com/demo/file.jpg',
        path: 'uploads/file.jpg',
      });

      const errors = await validate(instance);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });

    it('should yield unknownValue validation error on fully populated instance', async () => {
      const dto = new FileUploadResponseDto();
      dto.filename = 'valid.png';
      dto.originalName = 'valid.png';
      dto.mimetype = 'image/png';
      dto.size = 12345;
      dto.url = 'https://res.cloudinary.com/demo/valid.png';
      dto.path = 'products/valid.png';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.unknownValue).toBe(
        'an unknown value was passed to the validate function',
      );
    });
  });

  describe('Swagger ApiProperty metadata reflection', () => {
    it('should have swagger apiModelProperties metadata registered for all DTO properties', () => {
      const expectedProperties = [
        'filename',
        'originalName',
        'mimetype',
        'size',
        'url',
        'path',
      ];

      for (const property of expectedProperties) {
        const metadata = Reflect.getMetadata(
          'swagger/apiModelProperties',
          FileUploadResponseDto.prototype,
          property,
        );
        expect(metadata).toBeDefined();
      }
    });

    it('should include all property keys in swagger apiModelPropertiesArray', () => {
      const propertyKeys: string[] = Reflect.getMetadata(
        'swagger/apiModelPropertiesArray',
        FileUploadResponseDto.prototype,
      );

      expect(propertyKeys).toBeDefined();
      expect(propertyKeys).toContain(':filename');
      expect(propertyKeys).toContain(':originalName');
      expect(propertyKeys).toContain(':mimetype');
      expect(propertyKeys).toContain(':size');
      expect(propertyKeys).toContain(':url');
      expect(propertyKeys).toContain(':path');
    });
  });
});
