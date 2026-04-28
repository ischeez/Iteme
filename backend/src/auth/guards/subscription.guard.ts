import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: { userId: string } = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('Пользователь не найден в запросе');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { isVerified: true },
    });

    if (dbUser?.isVerified) {
      return true;
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    if (!sub || !sub.isActive || !sub.expiresAt || sub.expiresAt < new Date()) {
      throw new ForbiddenException(
        'Требуется активная подписка или верификация продавца',
      );
    }

    return true;
  }
}
