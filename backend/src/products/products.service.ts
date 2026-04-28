import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}
  async create(sellerId: string, dto: CreateProductDto) {
    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        username: true,
      },
    });

    if (!seller) {
      throw new NotFoundException('Продавец не найден');
    }

    const existing = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!existing) {
      throw new NotFoundException('Категория не найдена!');
    }

    const normalizedContact = dto.sellerContact?.trim();
    const fallbackContact = seller.username?.trim()
      ? `@${seller.username.trim()}`
      : '';

    return this.prisma.product.create({
      data: {
        ...dto,
        sellerContact: normalizedContact || fallbackContact,
        sellerId,
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: {
        quantity: {
          gt: 0,
        },
      },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMine(sellerId: string) {
    return this.prisma.product.findMany({
      where: {
        sellerId,
        quantity: {
          gt: 0,
        },
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToCart(productId: number, buyerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sellerId: true,
        quantity: true,
      },
    });

    if (!product || !product.sellerId) {
      throw new NotFoundException('Товар не найден');
    }

    if (product.sellerId === buyerId) {
      throw new BadRequestException('Нельзя добавить в корзину собственный товар');
    }

    if (product.quantity <= 0) {
      throw new BadRequestException('Товар недоступен для покупки');
    }

    const item = await this.prisma.buyerSellerInteraction.upsert({
      where: {
        buyerId_sellerId_productId: {
          buyerId,
          sellerId: product.sellerId,
          productId,
        },
      },
      update: {},
      create: {
        buyerId,
        sellerId: product.sellerId,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    return {
      id: item.id,
      productId: item.productId,
      addedAt: item.createdAt,
      status: item.product.quantity > 0 ? 'ACTIVE' : 'UNAVAILABLE',
      product: item.product,
    };
  }

  async getMyCart(buyerId: string) {
    const items = await this.prisma.buyerSellerInteraction.findMany({
      where: { buyerId },
      include: {
        product: {
          include: {
            category: true,
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      productId: item.productId,
      addedAt: item.createdAt,
      status: item.product.quantity > 0 ? 'ACTIVE' : 'UNAVAILABLE',
      product: item.product,
    }));
  }

  async removeFromCart(productId: number, buyerId: string) {
    const relation = await this.prisma.buyerSellerInteraction.findFirst({
      where: { buyerId, productId },
      select: { id: true },
    });

    if (!relation) {
      return { success: true };
    }

    await this.prisma.buyerSellerInteraction.delete({ where: { id: relation.id } });
    return { success: true };
  }

  async getCartBuyers(productId: number, actorId: string, role: Role) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        sellerId: true,
      },
    });

    if (!product || !product.sellerId) {
      throw new NotFoundException('Товар не найден');
    }

    if (role !== Role.ADMIN && product.sellerId !== actorId) {
      throw new ForbiddenException('Можно просматривать только покупателей своих товаров');
    }

    const buyers = await this.prisma.buyerSellerInteraction.findMany({
      where: { productId },
      include: {
        buyer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return buyers.map((item) => ({
      userId: item.buyer.id,
      username: item.buyer.username,
      firstName: item.buyer.firstName,
      avatarUrl: item.buyer.avatarUrl,
      addedAt: item.createdAt,
    }));
  }

  async markAsSold(
    productId: number,
    buyerId: string,
    actorId: string,
    role: Role,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          quantity: true,
          sellerId: true,
        },
      });

      if (!product || !product.sellerId) {
        throw new NotFoundException('Товар не найден');
      }

      if (role !== Role.ADMIN && product.sellerId !== actorId) {
        throw new ForbiddenException('Можно закрывать продажу только своих товаров');
      }

      if (product.quantity <= 0) {
        throw new BadRequestException('Товар уже недоступен');
      }

      const hasBuyerInCart = await tx.buyerSellerInteraction.findUnique({
        where: {
          buyerId_sellerId_productId: {
            buyerId,
            sellerId: product.sellerId,
            productId,
          },
        },
        select: { id: true },
      });

      if (!hasBuyerInCart) {
        throw new BadRequestException('Покупатель не добавлял этот товар в корзину');
      }

      const soldListing = await tx.productListing.create({
        data: {
          sellerId: product.sellerId,
          title: product.name,
          description: product.description,
          price: product.price,
          imageUrls: product.imageUrl ? [product.imageUrl] : [],
          isActive: false,
        },
      });

      const order = await tx.order.create({
        data: {
          buyerId,
          listingId: soldListing.id,
          priceAtBuy: product.price,
          status: OrderStatus.COMPLETED,
        },
      });

      const updated = await tx.product.updateMany({
        where: {
          id: productId,
          quantity: {
            gt: 0,
          },
        },
        data: {
          quantity: 0,
        },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Товар уже продан');
      }

      await tx.buyerSellerInteraction.deleteMany({
        where: {
          productId,
        },
      });

      return {
        success: true,
        orderId: order.id,
        listingId: soldListing.id,
      };
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Объявление не найдено');
    }

    return product;
  }

  async update(
    id: number,
    actorId: string,
    role: Role,
    dto: UpdateProductDto,
  ) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Объявление не найдено');
    }

    if (role !== Role.ADMIN && product.sellerId !== actorId) {
      throw new ForbiddenException('Можно редактировать только свои объявления');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: number, actorId: string, role: Role) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Объявление не найдено');
    }

    if (role !== Role.ADMIN && product.sellerId !== actorId) {
      throw new ForbiddenException('Можно удалять только свои объявления');
    }

    try {
      await this.prisma.$transaction([
        // Keep seller reviews history, but detach from deleted product.
        this.prisma.sellerReview.updateMany({
          where: { productId: id },
          data: { productId: null },
        }),
        this.prisma.buyerSellerInteraction.deleteMany({ where: { productId: id } }),
        this.prisma.transaction.deleteMany({ where: { productId: id } }),
        this.prisma.product.delete({ where: { id } }),
      ]);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Нельзя удалить объявление из-за связанных записей',
        );
      }

      throw error;
    }

    return { success: true };
  }

  async createBuyIntent(productId: number, buyerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
          },
        },
      },
    });

    if (!product || !product.sellerId || !product.seller) {
      throw new NotFoundException('Объявление недоступно для покупки');
    }

    if (product.sellerId === buyerId) {
      throw new BadRequestException('Нельзя купить собственное объявление');
    }

    await this.prisma.buyerSellerInteraction.upsert({
      where: {
        buyerId_sellerId_productId: {
          buyerId,
          sellerId: product.sellerId,
          productId,
        },
      },
      update: {},
      create: {
        buyerId,
        sellerId: product.sellerId,
        productId,
      },
    });

    const toTelegramUrl = (value?: string | null): string | null => {
      const normalized = value?.trim();
      if (!normalized) {
        return null;
      }

      const telegramLinkMatch = normalized.match(
        /^https?:\/\/(t\.me|telegram\.me)\/([A-Za-z0-9_]{5,32})(?:\?.*)?$/i,
      );

      if (telegramLinkMatch?.[2]) {
        return `https://t.me/${telegramLinkMatch[2]}`;
      }

      const usernameCandidate = normalized.startsWith('@')
        ? normalized.slice(1)
        : normalized;

      if (/^[A-Za-z0-9_]{5,32}$/.test(usernameCandidate)) {
        return `https://t.me/${usernameCandidate}`;
      }

      return null;
    };

    let chatUrl = toTelegramUrl(product.sellerContact);

    if (!chatUrl) {
      chatUrl = toTelegramUrl(product.seller.username);
    }

    if (chatUrl) {
      const introText = encodeURIComponent(
        `Здравствуйте! Интересует объявление "${product.name}" (ID: ${product.id}) за ${product.price} ₽.`,
      );
      const separator = chatUrl.includes('?') ? '&' : '?';
      chatUrl = `${chatUrl}${separator}text=${introText}`;
    }

    return {
      productId: product.id,
      sellerId: product.sellerId,
      sellerName: product.seller.username ?? product.seller.firstName ?? 'Seller',
      buyerId,
      listingTitle: product.name,
      listingPrice: product.price,
      listingUrl: `/listing/${product.id}`,
      chatUrl,
      hasContact: Boolean(chatUrl),
    };
  }
}
