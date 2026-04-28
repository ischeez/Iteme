import { Module } from '@nestjs/common';
import { SubsriptionsService } from './subscriptions.service';
import { SubsriptionsController } from './subscriptions.controller';

@Module({
  controllers: [SubsriptionsController],
  providers: [SubsriptionsService],
})
export class SubsriptionsModule {}
