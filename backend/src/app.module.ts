import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { SubsriptionsModule } from './subscriptions/subscriptions.module';
import { RequestsModule } from './requests/requests.module';
import { VerificationModule } from './verification/verification.module';
import { UploadsModule } from './uploads/uploads.module';
import { SellersModule } from './sellers/sellers.module';
import { GuarantorsModule } from './guarantors/guarantors.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    AuthModule,
    SubsriptionsModule,
    RequestsModule,
    VerificationModule,
    UploadsModule,
    SellersModule,
    GuarantorsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
