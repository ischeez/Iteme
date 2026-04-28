import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const storageDir = join(process.cwd(), process.env.STORAGE_DIR ?? 'storage');

if (!existsSync(storageDir)) {
  mkdirSync(storageDir, { recursive: true });
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  @Post('image')
  @Roles(Role.BUYER, Role.SELLER, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: storageDir,
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname || '.jpg')}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Файл не передан');
    }

    const mimeType = String(file.mimetype ?? '').toLowerCase();
    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException('Можно загружать только изображения');
    }

    return {
      filename: file.filename,
      url: `/storage/${file.filename}`,
    };
  }
}
