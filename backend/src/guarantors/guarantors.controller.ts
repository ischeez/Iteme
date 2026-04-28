import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GuarantorsService } from './guarantors.service';

@Controller('guarantors')
export class GuarantorsController {
  constructor(private readonly guarantorsService: GuarantorsService) {}

  @Get()
  getPublicList() {
    return this.guarantorsService.getPublicList();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminList() {
    return this.guarantorsService.getAdminList();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      nickname: string;
      avatarUrl?: string;
      description?: string;
      contact?: string;
      telegramUrl?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.guarantorsService.create(body, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      nickname?: string;
      avatarUrl?: string;
      description?: string;
      contact?: string;
      telegramUrl?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.guarantorsService.update(id, body, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.guarantorsService.remove(id);
  }
}
