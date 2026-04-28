import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SellersService } from './sellers.service';

@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get(':sellerId/store')
  getStore(@Param('sellerId') sellerId: string) {
    return this.sellersService.getStore(sellerId);
  }

  @Get(':sellerId/reviews')
  getReviews(@Param('sellerId') sellerId: string) {
    return this.sellersService.getReviews(sellerId);
  }

  @Post(':sellerId/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BUYER)
  createReview(
    @Param('sellerId') sellerId: string,
    @Request() req: { user: { userId: string } },
    @Body() body: { rating: number; productId?: number; comment?: string },
  ) {
    return this.sellersService.createReview(
      sellerId,
      req.user.userId,
      body.rating,
      body.productId,
      body.comment,
    );
  }

  @Patch(':sellerId/reviews/:reviewId/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  replyToReview(
    @Param('sellerId') sellerId: string,
    @Param('reviewId') reviewId: string,
    @Request() req: { user: { userId: string } },
    @Body() body: { reply: string },
  ) {
    return this.sellersService.replyToReview(
      sellerId,
      reviewId,
      req.user.userId,
      body.reply,
    );
  }
}
