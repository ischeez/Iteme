import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  async getStore(sellerId: string) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Продавец не найден');
    }

    const [products, reviewsAgg] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where: { sellerId },
        include: {
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sellerReview.aggregate({
        where: { sellerId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return {
      seller,
      rating: reviewsAgg._avg.rating ?? null,
      reviewsCount: reviewsAgg._count._all,
      products,
    };
  }

  getReviews(sellerId: string) {
    return this.prisma.sellerReview.findMany({
      where: { sellerId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replyToReview(
    sellerId: string,
    reviewId: string,
    actorId: string,
    reply: string,
  ) {
    if (actorId !== sellerId) {
      throw new ForbiddenException('Можно отвечать только на отзывы в своем профиле');
    }

    const review = await this.prisma.sellerReview.findFirst({
      where: { id: reviewId, sellerId },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Отзыв не найден');
    }

    const normalizedReply = reply?.trim();
    if (!normalizedReply) {
      throw new BadRequestException('Ответ продавца не должен быть пустым');
    }

    return this.prisma.sellerReview.update({
      where: { id: reviewId },
      data: {
        sellerReply: normalizedReply,
        sellerReplyAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async createReview(
    sellerId: string,
    buyerId: string,
    rating: number,
    productId?: number,
    comment?: string,
  ) {
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }

    if (sellerId === buyerId) {
      throw new ForbiddenException('Нельзя оставить отзыв самому себе');
    }

    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) {
      throw new NotFoundException('Продавец не найден');
    }

    const hasInteraction = await this.prisma.buyerSellerInteraction.findFirst({
      where: {
        buyerId,
        sellerId,
        ...(productId ? { productId } : {}),
      },
      select: { id: true },
    });

    if (!hasInteraction) {
      throw new ForbiddenException(
        'Отзыв можно оставить только после взаимодействия с объявлением продавца',
      );
    }

    const existing = await this.prisma.sellerReview.findUnique({
      where: {
        sellerId_buyerId: {
          sellerId,
          buyerId,
        },
      },
    });

    if (existing) {
      return this.prisma.sellerReview.update({
        where: { sellerId_buyerId: { sellerId, buyerId } },
        data: {
          rating,
          productId: productId ?? existing.productId ?? null,
          comment: comment?.trim() || null,
        },
      });
    }

    return this.prisma.sellerReview.create({
      data: {
        sellerId,
        buyerId,
        productId: productId ?? null,
        rating,
        comment: comment?.trim() || null,
      },
    });
  }
}
