import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestsService } from '../requests/requests.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('offers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OffersController {
  constructor(private requestsService: RequestsService) {}
  @Post(':requestId')
  @Roles(Role.SELLER)
  createOffer(
    @Request() req: { user: { userId: string } },
    @Param('requestId') requestId: string,
    @Body() body: { price: number; comment: string },
  ) {
    return this.requestsService.createOffer(
      req.user.userId,
      requestId,
      body.price,
      body.comment,
    );
  }
  @Post(':offerId/accept')
  @Roles(Role.BUYER)
  acceptOffer(
    @Request() req: { user: { userId: string } },
    @Param('offerId') offerId: string,
  ) {
    return this.requestsService.acceptOffer(req.user.userId, offerId);
  }
}
