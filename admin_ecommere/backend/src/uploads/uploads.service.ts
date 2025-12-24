import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  private uploadToCloudinary(file: Express.Multer.File, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `${this.configService.get<string>('CLOUDINARY_FOLDER')}/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'products') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Upload to Cloudinary
      const result = await this.uploadToCloudinary(file, folder);

      return {
        filename: result.public_id,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: result.secure_url, // Cloudinary HTTPS URL
        path: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: Express.Multer.File[], folder: string = 'products') {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const maxFiles = 10;
    if (files.length > maxFiles) {
      throw new BadRequestException(`Maximum ${maxFiles} files allowed`);
    }

    return Promise.all(files.map(file => this.uploadFile(file, folder)));
  }

  async deleteFile(filePath: string) {
    try {
      // Delete from Cloudinary using public_id
      await cloudinary.uploader.destroy(filePath);
      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new BadRequestException('Failed to delete file');
    }
  }
}
