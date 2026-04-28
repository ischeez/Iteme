import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [AuthService, JwtStrategy],
  imports: [
    JwtModule.register({
      secret: 'xyuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu.<3.this.all.yslishal',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
    ConfigModule,
  ],

  controllers: [AuthController],
})
export class AuthModule {}
