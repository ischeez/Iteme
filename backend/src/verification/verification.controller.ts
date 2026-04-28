import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role, VerificationRequestStatus } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ProcessVerificationDto } from './dto/process-verification.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { VerificationService } from './verification.service';

@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post('requests')
  @Roles(Role.SELLER)
  submitRequest(
    @Request() req: { user: { userId: string } },
    @Body() dto: SubmitVerificationDto,
  ) {
    return this.verificationService.submitRequest(
      req.user.userId,
      dto.details,
      dto.evidenceImages,
    );
  }

  @Get('requests/me')
  getMyRequests(@Request() req: { user: { userId: string } }) {
    return this.verificationService.getMyRequests(req.user.userId);
  }

  @Get('requests')
  @Roles(Role.ADMIN)
  getRequests(@Query('status') status?: VerificationRequestStatus) {
    return this.verificationService.getRequestsForAdmin(status);
  }

  @Get('requests/pending-count')
  @Roles(Role.ADMIN)
  getPendingRequestsCount() {
    return this.verificationService.getPendingRequestsCount();
  }

  @Patch('requests/:id/process')
  @Roles(Role.ADMIN)
  processRequest(
    @Param('id') requestId: string,
    @Body() dto: ProcessVerificationDto,
  ) {
    return this.verificationService.processRequest(requestId, dto);
  }

  @Delete('requests/:id')
  @Roles(Role.ADMIN)
  removeRequest(@Param('id') requestId: string) {
    return this.verificationService.removeRequest(requestId);
  }
}
