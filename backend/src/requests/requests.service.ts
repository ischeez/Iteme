import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OfferStatus } from '@prisma/client';

const IMAGES_MARKER = '[iteme-images]';

const encodeDescriptionWithImages = (
  description: string,
  imageUrls: string[],
) => {
  if (!imageUrls.length) {
    return description;
  }

  return `${description}\n\n${IMAGES_MARKER}${JSON.stringify(imageUrls)}`;
};

const decodeDescriptionWithImages = (description: string) => {
  const markerIndex = description.lastIndexOf(IMAGES_MARKER);
  if (markerIndex === -1) {
    return {
      cleanDescription: description,
      imageUrls: [] as string[],
    };
  }

  const cleanDescription = description.slice(0, markerIndex).trimEnd();
  const rawImagesPayload = description
    .slice(markerIndex + IMAGES_MARKER.length)
    .trim();

  try {
    const parsed = JSON.parse(rawImagesPayload) as unknown;
    const imageUrls = Array.isArray(parsed)
      ? parsed
          .map((value) => String(value ?? '').trim())
          .filter((value) => value.length > 0)
      : [];

    return {
      cleanDescription,
      imageUrls,
    };
  } catch {
    return {
      cleanDescription: description,
      imageUrls: [] as string[],
    };
  }
};

const mapRequestWithImages = <T extends { description: string }>(request: T) => {
  const { cleanDescription, imageUrls } = decodeDescriptionWithImages(
    request.description,
  );

  return {
    ...request,
    description: cleanDescription,
    imageUrls,
  };
};


@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  createRequest(
    buyerId: string,
    title: string,
    description: string,
    targetPrice: number,
    imageUrls?: string[],
  ) {
    const normalizedTitle = title?.trim();
    const normalizedDescription = description?.trim();

    if (!normalizedTitle || !normalizedDescription) {
      throw new BadRequestException('Заполни заголовок и описание запроса');
    }

    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      throw new BadRequestException('Целевая цена должна быть больше 0');
    }

    const normalizedImageUrls = (Array.isArray(imageUrls) ? imageUrls : [])
      .map((url) => String(url ?? '').trim())
      .filter((url) => url.length > 0);

    return this.prisma.buyerRequest.create({
      data: {
        buyerId,
        title: normalizedTitle,
        description: encodeDescriptionWithImages(
          normalizedDescription,
          normalizedImageUrls,
        ),
        targetPrice,
      },
    });
  }

  async getMyRequests(buyerId: string) {
    const requests = await this.prisma.buyerRequest.findMany({
      where: { buyerId },
      include: {
        offers: {
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                firstName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(mapRequestWithImages);
  }

  async getOpenRequests() {
    const requests = await this.prisma.buyerRequest.findMany({
      where: { status: OfferStatus.OPEN },
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
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(mapRequestWithImages);
  }

  async createOffer(
    sellerId: string,
    requestId: string,
    price: number,
    comment?: string,
  ) {
    const request = await this.prisma.buyerRequest.findUnique({
      where: { id: requestId },
      include: { buyer: true },
    });
    if (!request || request.status !== OfferStatus.OPEN) {
      throw new BadRequestException('Заявка не найдена или уже закрыта');
    }
    const offer = await this.prisma.offer.create({
      data: {
        sellerId,
        requestId,
        price,
        comment,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            firstName: true,
            avatarUrl: true,
          },
        },
      },
    });
    return offer;
  }

  async acceptOffer(buyerId: string, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        request: true,
        seller: true,
      },
    });
    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }
    if (offer.request.buyerId !== buyerId) {
      throw new ForbiddenException('Это не ваша заявка');
    }
    if (offer.request.status !== OfferStatus.OPEN) {
      throw new BadRequestException('Заявка уже закрыта');
    }
    await this.prisma.$transaction([
      this.prisma.offer.update({
        where: { id: offerId },
        data: { isAccepted: true },
      }),
      this.prisma.buyerRequest.update({
        where: { id: offer.request.id },
        data: { status: OfferStatus.FULFILLED },
      }),
    ]);
    return { success: true, message: 'Предложение принято' };
  }

  async removeMyRequest(buyerId: string, requestId: string) {
    const request = await this.prisma.buyerRequest.findUnique({
      where: { id: requestId },
      include: {
        offers: {
          select: {
            id: true,
            isAccepted: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Запрос не найден');
    }

    if (request.buyerId !== buyerId) {
      throw new ForbiddenException('Можно удалить только свой запрос');
    }

    if (request.offers.some((offer) => offer.isAccepted)) {
      throw new BadRequestException('Нельзя удалить запрос с принятым предложением');
    }

    await this.prisma.$transaction([
      this.prisma.offer.deleteMany({ where: { requestId } }),
      this.prisma.buyerRequest.delete({ where: { id: requestId } }),
    ]);

    return { success: true };
  }
}
