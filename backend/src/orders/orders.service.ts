import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from 'rxjs';
import { isAsyncFunction } from 'node:util/types';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}
  async createOrder(buyerId: string, listingId: string) {
    const listing = await this.prisma.productListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw new NotFoundException('Товар не найден');
    }
    if (!listing.isActive) {
      throw new BadRequestException('Этот товар снять с продажи');
    }
    if (listing.sellerId === buyerId) {
      throw new BadRequestException('Вы не можете купить собственный товар');
    }
    const order = await this.prisma.order.create({
      data: {
        buyerId,
        listingId,
        priceAtBuy: listing.price,
        status: OrderStatus.PENDING,
      },
    });
    await this.prisma.productListing.update({
      where: { id: listingId },
      data: {
        isActive: false,
      },
    });
    return order;
  }
  getMyPurchases(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
            imageUrls: true,
            seller: {
              select: { username: true, firstName: true, id: true },
            },
          },
        },
      },
    });
  }
  getMySales(sellerId: string) {
    return this.prisma.order.findMany({
      where: { listing: { sellerId } },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
          },
        },
        buyer: {
          select: {
            username: true,
            telegramId: true,
          },
        },
      },
    });
  }
}
