import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('public')
export class AdminPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get('homepage-settings')
  getHomepageSettings() {
    return this.adminService.getPublicHomepageSettings();
  }
}
