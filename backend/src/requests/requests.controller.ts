import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles(Role.BUYER)
  create(
    @Request() req: { user: { userId: string } },
    @Body()
    body: {
      title: string;
      description: string;
      targetPrice: number;
      imageUrls?: string[];
    },
  ) {
    return this.requestsService.createRequest(
      req.user.userId,
      body.title,
      body.description,
      body.targetPrice,
      body.imageUrls,
    );
  }

  @Get('my')
  @Roles(Role.BUYER)
  getMine(@Request() req: { user: { userId: string } }) {
    return this.requestsService.getMyRequests(req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.BUYER)
  removeMine(
    @Request() req: { user: { userId: string } },
    @Param('id') requestId: string,
  ) {
    return this.requestsService.removeMyRequest(req.user.userId, requestId);
  }

  @Get()
  @Roles(Role.SELLER, Role.BUYER)
  getOpen() {
    return this.requestsService.getOpenRequests();
  }
}
