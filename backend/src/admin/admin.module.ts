import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminPublicController } from './admin-public.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, AdminPublicController],
  providers: [AdminService],
})
export class AdminModule {}
