import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Role, VerificationRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessVerificationDto } from './dto/process-verification.dto';

@Injectable()
export class VerificationService {
    constructor(private prisma: PrismaService) {}

    async submitRequest(
        userId: string,
        details: string,
        evidenceImages?: string[],
    ) {
        const normalizedDetails =
            typeof details === 'string' ? details.trim() : '';
        const normalizedEvidenceImages = Array.isArray(evidenceImages)
            ? evidenceImages
                  .map((url) => (typeof url === 'string' ? url.trim() : ''))
                  .filter((url) => Boolean(url))
            : [];

        if (!normalizedDetails) {
            throw new BadRequestException('Поле details обязательно');
        }

        if (normalizedEvidenceImages.length > 8) {
            throw new BadRequestException('Можно прикрепить не больше 8 изображений');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        if (user.role !== Role.SELLER) {
            throw new ForbiddenException('Заявку на верификацию может подать только SELLER');
        }

        const pendingRequest = await this.prisma.verificationRequest.findFirst({
            where: {
                userId,
                status: VerificationRequestStatus.PENDING,
            },
        });

        if (pendingRequest) {
            throw new BadRequestException('У вас уже есть заявка в статусе PENDING');
        }

        return this.prisma.verificationRequest.create({
            data: {
                userId,
                details: normalizedDetails,
                evidenceImages: normalizedEvidenceImages,
            },
        });
    }

    getMyRequests(userId: string) {
        return this.prisma.verificationRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    getRequestsForAdmin(status?: VerificationRequestStatus) {
        return this.prisma.verificationRequest.findMany({
            where: status ? { status } : undefined,
            include: {
                user: {
                    select: {
                        id: true,
                        telegramId: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isVerified: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }).then((items) =>
            items.map((item) => ({
                ...item,
                user: item.user
                    ? {
                          ...item.user,
                          telegramId: item.user.telegramId.toString(),
                      }
                    : item.user,
            })),
        );
    }

    async getPendingRequestsCount() {
        const pending = await this.prisma.verificationRequest.count({
            where: {
                status: VerificationRequestStatus.PENDING,
            },
        });

        return { pending };
    }

    async processRequest(requestId: string, dto: ProcessVerificationDto) {
        const { status, adminComment } = dto;

        if (
            status !== VerificationRequestStatus.APPROVED &&
            status !== VerificationRequestStatus.REJECTED
        ) {
            throw new BadRequestException('Статус должен быть APPROVED или REJECTED');
        }

        return this.prisma.$transaction(async (tx) => {
            const request = await tx.verificationRequest.findUnique({
                where: { id: requestId },
            });

            if (!request) {
                throw new NotFoundException('Заявка на верификацию не найдена');
            }

            if (request.status !== VerificationRequestStatus.PENDING) {
                throw new BadRequestException('Обработать можно только заявку в статусе PENDING');
            }

            const updatedRequest = await tx.verificationRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    adminComment: adminComment?.trim() || null,
                },
            });

            if (status === VerificationRequestStatus.APPROVED) {
                await tx.user.update({
                    where: { id: request.userId },
                    data: { isVerified: true },
                });
            }

            return updatedRequest;
        });
    }

    async removeRequest(requestId: string) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            select: { id: true },
        });

        if (!request) {
            throw new NotFoundException('Заявка на верификацию не найдена');
        }

        await this.prisma.verificationRequest.delete({ where: { id: requestId } });

        return { success: true };
    }
}
