import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

const DEFAULT_FOLDER = 'products';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(file: Express.Multer.File, folder = DEFAULT_FOLDER) {
    this.validateFile(file);

    try {
      const result = await this.uploadToCloudinary(
        file,
        this.normalizeFolder(folder),
      );

      return {
        filename: result.public_id,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: result.secure_url,
        path: result.public_id,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${this.getErrorMessage(error)}`);
      throw new BadRequestException('Upload failed');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder = DEFAULT_FOLDER,
  ) {
    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Maximum ${MAX_FILES} files allowed`);
    }

    for (const file of files) {
      this.validateFile(file);
    }

    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(filePath: string) {
    const validPath = this.validateDeletePath(filePath);

    try {
      const result = await cloudinary.uploader.destroy(validPath, {
        resource_type: 'image',
      });

      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new Error(`Cloudinary returned ${result.result}`);
      }

      return { message: 'File deleted successfully' };
    } catch (error) {
      this.logger.error(`Delete failed: ${this.getErrorMessage(error)}`);
      throw new BadRequestException('Failed to delete file');
    }
  }

  private validateDeletePath(filePath: string): string {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      throw new BadRequestException('File path is required');
    }

    const trimmedPath = filePath.trim();

    if (
      trimmedPath.startsWith('/') ||
      trimmedPath.includes('..') ||
      trimmedPath.includes('\\') ||
      trimmedPath.includes('//') ||
      trimmedPath.endsWith('/') ||
      !this.isAllowedUploadPath(trimmedPath)
    ) {
      throw new BadRequestException('Invalid file path');
    }

    return trimmedPath;
  }

  private isAllowedUploadPath(filePath: string): boolean {
    const configuredFolder = this.configService
      ?.get<string>('CLOUDINARY_FOLDER')
      ?.trim()
      .replace(/^\/+|\/+$/g, '');
    const rootFolder = configuredFolder || 'thaispray';
    const allowedFolders = Array.from(
      new Set([rootFolder, 'thaispray', DEFAULT_FOLDER]),
    );

    return allowedFolders.some((folder) => {
      const prefix = `${folder}/`;
      return filePath.startsWith(prefix) && filePath.length > prefix.length;
    });
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    if (!this.hasValidImageSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. File content does not match declared type.',
      );
    }
  }

  private hasValidImageSignature(buffer: Buffer, mimetype: string): boolean {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      return false;
    }

    const normalizedMime = mimetype?.trim().toLowerCase();

    switch (normalizedMime) {
      case 'image/jpeg':
      case 'image/jpg':
        // JPEG starts with FF D8 FF
        return (
          buffer.length >= 3 &&
          buffer[0] === 0xff &&
          buffer[1] === 0xd8 &&
          buffer[2] === 0xff
        );

      case 'image/png':
        // PNG starts with 89 50 4E 47 0D 0A 1A 0A
        return (
          buffer.length >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );

      case 'image/webp':
        // WebP starts with RIFF (bytes 0..3) and WEBP (bytes 8..11)
        return (
          buffer.length >= 12 &&
          buffer[0] === 0x52 && // 'R'
          buffer[1] === 0x49 && // 'I'
          buffer[2] === 0x46 && // 'F'
          buffer[3] === 0x46 && // 'F'
          buffer[8] === 0x57 && // 'W'
          buffer[9] === 0x45 && // 'E'
          buffer[10] === 0x42 && // 'B'
          buffer[11] === 0x50 // 'P'
        );

      case 'image/gif':
        // GIF starts with GIF87a or GIF89a
        return (
          buffer.length >= 6 &&
          buffer[0] === 0x47 && // 'G'
          buffer[1] === 0x49 && // 'I'
          buffer[2] === 0x46 && // 'F'
          buffer[3] === 0x38 && // '8'
          (buffer[4] === 0x37 || buffer[4] === 0x39) && // '7' or '9'
          buffer[5] === 0x61 // 'a'
        );

      default:
        return false;
    }
  }

  private uploadToCloudinary(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.configService.get<string>('CLOUDINARY_FOLDER') || 'thaispray'}/${folder}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary returned no result'));
            return;
          }

          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  private normalizeFolder(folder: string) {
    const normalized = folder?.trim() || DEFAULT_FOLDER;

    if (
      !/^[a-z0-9][a-z0-9/_-]{0,63}$/i.test(normalized) ||
      normalized.includes('..')
    ) {
      throw new BadRequestException('Invalid upload folder');
    }

    return normalized;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown upload error';
  }
}
