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
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      const result = await this.uploadToCloudinary(file, this.normalizeFolder(folder));

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

  async uploadMultipleFiles(files: Express.Multer.File[], folder = DEFAULT_FOLDER) {
    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > MAX_FILES) {
      throw new BadRequestException(`Maximum ${MAX_FILES} files allowed`);
    }

    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }

  async deleteFile(filePath: string) {
    if (!filePath?.trim()) {
      throw new BadRequestException('File path is required');
    }

    try {
      const result = await cloudinary.uploader.destroy(filePath.trim(), {
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

  private uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<UploadApiResponse> {
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

    if (!/^[a-z0-9][a-z0-9/_-]{0,63}$/i.test(normalized) || normalized.includes('..')) {
      throw new BadRequestException('Invalid upload folder');
    }

    return normalized;
  }

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown upload error';
  }
}
