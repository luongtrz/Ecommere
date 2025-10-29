import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.ensureUploadDirExists();
  }

  private ensureUploadDirExists() {
    const dirs = [
      this.uploadDir,
      path.join(this.uploadDir, 'products'),
      path.join(this.uploadDir, 'categories'),
      path.join(this.uploadDir, 'avatars'),
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
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

    const filename = file.filename;
    const filePath = path.join(folder, filename);
    const url = `/uploads/${filePath}`;

    return {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      path: filePath,
    };
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
    const fullPath = path.join(this.uploadDir, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { message: 'File deleted successfully' };
    }

    throw new BadRequestException('File not found');
  }
}
