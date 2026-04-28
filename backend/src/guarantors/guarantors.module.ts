import { Module } from '@nestjs/common';
import { GuarantorsController } from './guarantors.controller';
import { GuarantorsService } from './guarantors.service';

@Module({
  controllers: [GuarantorsController],
  providers: [GuarantorsService],
})
export class GuarantorsModule {}
