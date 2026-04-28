import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubsriptionsService {
  constructor(private prisma: PrismaService) {}
  async getMySubscription(userId: string) {
    let sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: { userId },
      });
    }
    if (sub.isActive && sub.expiresAt && sub.expiresAt < new Date()) {
      sub = await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { isActive: false },
      });
    }
    return sub;
  }
  async buySubscription(userId: string) {
    const sub = await this.getMySubscription(userId);
    const now = new Date();
    let newExpariesAt = new Date();

    if (sub.isActive && sub.expiresAt && sub.expiresAt > now) {
      newExpariesAt = new Date(
        sub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
    } else {
      newExpariesAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return this.prisma.subscription.update({
      where: { id: sub.id },
      data: { isActive: true, expiresAt: newExpariesAt },
    });
  }
}
