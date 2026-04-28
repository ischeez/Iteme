import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { SubsriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';

@Controller('subsriptions')
@UseGuards(JwtAuthGuard)
export class SubsriptionsController {
  constructor(private readonly subsriptionsService: SubsriptionsService) {}
  @Get('my')
  getMySubscription(@Request() req: { user: { userId: string } }) {
    return this.subsriptionsService.getMySubscription(req.user.userId);
  }
  @Post('buy')
  buySupscription(@Request() req: { user: { userId: string } }) {
    return this.subsriptionsService.buySubscription(req.user.userId);
  }
}
