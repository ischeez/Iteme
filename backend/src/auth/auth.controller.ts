import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram/login')
  telegramLogin(@Body('initData') initData: string) {
    if (!initData) {
      throw new UnauthorizedException('InitData обязателен');
    }

    return this.authService.loginWithTelegram(initData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @Patch('switch-role')
  @UseGuards(JwtAuthGuard)
  switchRole(
    @Request() req: { user: { userId: string } },
    @Body('role') role: Role,
  ) {
    return this.authService.switchRole(req.user.userId, role);
  }

  @Patch('avatar')
  @UseGuards(JwtAuthGuard)
  updateAvatar(
    @Request() req: { user: { userId: string } },
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.authService.updateAvatar(req.user.userId, avatarUrl);
  }
}
