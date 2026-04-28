import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}
  @Post()
  @Roles(Role.BUYER, Role.ADMIN)
  create(
    @Request() req: { user: { userId: string } },
    @Body('listingId') listingId: string,
  ) {
    return this.ordersService.createOrder(req.user.userId, listingId);
  }
  @Get('my-purchases')
  @Roles(Role.BUYER)
  getPurchases(@Request() req: { user: { userId: string } }) {
    return this.ordersService.getMyPurchases(req.user.userId);
  }
  @Get('my-sales')
  @Roles(Role.SELLER)
  getSellers(@Request() req: { user: { userId: string } }) {
    return this.ordersService.getMySales(req.user.userId);
  }
}
