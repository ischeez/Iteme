import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UpsertGuarantorPayload = {
  nickname: string;
  avatarUrl?: string;
  description?: string;
  contact?: string;
  telegramUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
};

const TELEGRAM_HOST_REGEX = /^(https?:\/\/)?(t\.me|telegram\.me)\//i;

const normalizeTelegramUrl = (
  telegramUrl?: string,
  contact?: string,
): string | null => {
  const fromUrl = (telegramUrl ?? '').trim();
  const fromContact = (contact ?? '').trim();
  const candidate = fromUrl || fromContact;

  if (!candidate) {
    return null;
  }

  if (candidate.startsWith('@')) {
    const username = candidate.slice(1).trim();
    return username ? `https://t.me/${username}` : null;
  }

  if (TELEGRAM_HOST_REGEX.test(candidate)) {
    const normalized = candidate.replace(/^http:\/\//i, 'https://');
    return normalized;
  }

  if (/^[a-zA-Z0-9_]{5,32}$/.test(candidate)) {
    return `https://t.me/${candidate}`;
  }

  return null;
};

const extractTelegramUsername = (telegramUrl?: string | null): string | null => {
  if (!telegramUrl) {
    return null;
  }

  const normalized = telegramUrl.trim().replace(/^http:\/\//i, 'https://');
  const match = normalized.match(/https?:\/\/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{5,32})\/?$/i);
  return match?.[1] ?? null;
};

const buildTelegramAvatarUrl = (telegramUsername?: string | null): string | null => {
  if (!telegramUsername) {
    return null;
  }

  return `https://t.me/i/userpic/320/${telegramUsername}.jpg`;
};

@Injectable()
export class GuarantorsService {
  constructor(private prisma: PrismaService) {}

  getPublicList() {
    return this.prisma.guarantor.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  getAdminList() {
    return this.prisma.guarantor.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(payload: UpsertGuarantorPayload, actorId?: string) {
    const normalizedTelegramUrl = normalizeTelegramUrl(
      payload.telegramUrl,
      payload.contact,
    );
    const telegramUsername = extractTelegramUsername(normalizedTelegramUrl);
    const inferredAvatarUrl = buildTelegramAvatarUrl(telegramUsername);

    const actor = actorId
      ? await this.prisma.user.findUnique({
          where: { id: actorId },
          select: { avatarUrl: true },
        })
      : null;

    const fallbackContact =
      payload.contact?.trim() ||
      (telegramUsername ? `@${telegramUsername}` : payload.nickname.trim());

    return this.prisma.guarantor.create({
      data: {
        nickname: payload.nickname.trim(),
        avatarUrl:
          payload.avatarUrl?.trim() || inferredAvatarUrl || actor?.avatarUrl || null,
        description: payload.description?.trim() || null,
        contact: fallbackContact,
        telegramUrl: normalizedTelegramUrl,
        isActive: payload.isActive ?? true,
        sortOrder: payload.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, payload: Partial<UpsertGuarantorPayload>, actorId?: string) {
    const existing = await this.prisma.guarantor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Гарант не найден');
    }

    const fallbackContact =
      payload.contact !== undefined ? payload.contact : existing.contact;
    const normalizedTelegramUrl =
      payload.telegramUrl !== undefined || payload.contact !== undefined
        ? normalizeTelegramUrl(payload.telegramUrl, fallbackContact)
        : existing.telegramUrl;
    const telegramUsername = extractTelegramUsername(normalizedTelegramUrl);
    const inferredAvatarUrl = buildTelegramAvatarUrl(telegramUsername);

    const actor = actorId
      ? await this.prisma.user.findUnique({
          where: { id: actorId },
          select: { avatarUrl: true },
        })
      : null;

    return this.prisma.guarantor.update({
      where: { id },
      data: {
        ...(payload.nickname !== undefined
          ? { nickname: payload.nickname.trim() }
          : {}),
        ...(payload.avatarUrl !== undefined
          ? { avatarUrl: payload.avatarUrl?.trim() || null }
          : {}),
        ...(payload.avatarUrl === undefined &&
        (payload.telegramUrl !== undefined || payload.contact !== undefined)
          ? {
              avatarUrl: inferredAvatarUrl || actor?.avatarUrl || existing.avatarUrl,
            }
          : {}),
        ...(payload.description !== undefined
          ? { description: payload.description?.trim() || null }
          : {}),
        ...(payload.contact !== undefined
          ? {
              contact:
                payload.contact.trim() ||
                (telegramUsername
                  ? `@${telegramUsername}`
                  : existing.contact),
            }
          : {}),
        ...(payload.telegramUrl !== undefined || payload.contact !== undefined
          ? { telegramUrl: normalizedTelegramUrl }
          : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
        ...(payload.sortOrder !== undefined ? { sortOrder: payload.sortOrder } : {}),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.guarantor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Гарант не найден');
    }

    await this.prisma.guarantor.delete({ where: { id } });
    return { success: true };
  }
}
