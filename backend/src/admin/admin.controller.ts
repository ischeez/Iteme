import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('homepage-settings')
  getHomepageSettings() {
    return this.adminService.getHomepageSettings();
  }

  @Patch('homepage-settings')
  updateHomepageSettings(
    @Body()
    body: {
      bannerTitle?: string;
      bannerSubtitle?: string;
      bannerImageUrl?: string;
      bannerLinkUrl?: string;
      isBannerEnabled?: boolean;
    },
  ) {
    return this.adminService.updateHomepageSettings(body);
  }

  @Get('profile')
  getProfile(@Request() req: { user: { userId: string } }) {
    return this.adminService.getAdminProfile(req.user.userId);
  }

  @Patch('profile')
  updateProfile(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      username?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      nickname?: string;
      bio?: string;
    },
  ) {
    return this.adminService.updateAdminProfile(req.user.userId, body);
  }
}
