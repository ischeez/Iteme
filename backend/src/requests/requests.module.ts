import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { OffersController } from '../offers/offers.controller';

@Module({
  controllers: [RequestsController, OffersController],
  providers: [RequestsService],
})
export class RequestsModule {}
