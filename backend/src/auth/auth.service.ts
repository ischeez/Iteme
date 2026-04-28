import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { Role } from '@prisma/client';

type TelegramUser = {
  id: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private isTelegramUser(value: unknown): value is TelegramUser {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      (typeof record.id === 'string' || typeof record.id === 'number') &&
      (record.username === undefined || typeof record.username === 'string') &&
      (record.first_name === undefined ||
        typeof record.first_name === 'string') &&
      (record.last_name === undefined ||
        typeof record.last_name === 'string') &&
      (record.photo_url === undefined || typeof record.photo_url === 'string')
    );
  }

  private parseTelegramUser(userStr: string): TelegramUser {
    let parsed: unknown;

    try {
      parsed = JSON.parse(userStr);
    } catch {
      throw new UnauthorizedException('Некорректные данные пользователя');
    }

    if (!this.isTelegramUser(parsed)) {
      throw new UnauthorizedException('Некорректные данные пользователя');
    }

    return parsed;
  }

  private isAdminTelegramId(telegramId: string): boolean {
    const raw = this.configService.get<string>('ADMIN_TELEGRAM_IDS') ?? '';
    const allowed = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return allowed.includes(telegramId);
  }

  validateTelegramWebAppData(telegramInitData: string): boolean {
    const initData = telegramInitData?.trim();

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const authDate = urlParams.get('auth_date');

    if (!hash) {
      return false;
    }

    // Protect from replay attack: allow only fresh Telegram payloads.
    if (!authDate) {
      return false;
    }

    const authDateSeconds = Number(authDate);
    if (!Number.isFinite(authDateSeconds)) {
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const maxAgeSeconds = 10 * 60;
    if (nowSeconds - authDateSeconds > maxAgeSeconds) {
      return false;
    }

    const paramsWithoutHash = new URLSearchParams(initData);
    paramsWithoutHash.delete('hash');

    const baseDataCheckString = Array.from(paramsWithoutHash.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const paramsWithoutHashAndSignature = new URLSearchParams(initData);
    paramsWithoutHashAndSignature.delete('hash');
    paramsWithoutHashAndSignature.delete('signature');

    const dataCheckStringWithoutSignature = Array.from(
      paramsWithoutHashAndSignature.entries(),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(this.configService.get('TELEGRAM_BOT_TOKEN') as string)
      .digest();

    const calculatedHash = createHmac('sha256', secretKey)
      .update(baseDataCheckString)
      .digest('hex');

    const calculatedHashWithoutSignature = createHmac('sha256', secretKey)
      .update(dataCheckStringWithoutSignature)
      .digest('hex');

    const isHashValid =
      calculatedHash === hash || calculatedHashWithoutSignature === hash;

    return isHashValid;
  }
  async loginWithTelegram(initData: string) {
    const isValid = this.validateTelegramWebAppData(initData);

    if (!isValid) {
      throw new UnauthorizedException('Невалидные данные телеграм');
    }

    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');

    if (!userStr) {
      throw new UnauthorizedException('Данные пользователя отсутствуют');
    }

    const tgUser = this.parseTelegramUser(userStr);
    const telegramIdString = String(tgUser.id);
    const canUseAdmin = this.isAdminTelegramId(telegramIdString);

    const nextAvatarUrl = tgUser.photo_url?.trim();

    const user = await this.prisma.user.upsert({
      where: { telegramId: BigInt(tgUser.id) },
      update: {
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        isAdmin: canUseAdmin,
        ...(canUseAdmin ? { role: Role.ADMIN } : {}),
        ...(nextAvatarUrl ? { avatarUrl: nextAvatarUrl } : {}),
      },
      create: {
        telegramId: BigInt(tgUser.id),
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastName: tgUser.last_name ?? null,
        isAdmin: canUseAdmin,
        role: canUseAdmin ? Role.ADMIN : Role.BUYER,
        avatarUrl: nextAvatarUrl ?? null,
      },
    });

    const payload = {
      sub: user.id,
      telegramId: user.telegramId.toString(),
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl ?? nextAvatarUrl ?? null,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return { user, role: user.role };
  }

  async switchRole(userId: string, nextRole: Role) {
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!current) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    const canUseAdmin = current.isAdmin;

    if (nextRole === Role.ADMIN && !canUseAdmin) {
      throw new BadRequestException('Недостаточно прав для режима ADMIN');
    }

    if (
      nextRole !== Role.BUYER &&
      nextRole !== Role.SELLER &&
      nextRole !== Role.ADMIN
    ) {
      throw new BadRequestException(
        'Можно выбрать только роль BUYER, SELLER или ADMIN',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        isVerified: true,
      },
    });

    const payload = {
      sub: user.id,
      telegramId: user.telegramId.toString(),
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
      },
      role: user.role,
    };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const normalized = avatarUrl?.trim();

    if (!normalized) {
      throw new BadRequestException('avatarUrl обязателен');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: normalized },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        isAdmin: true,
        isVerified: true,
      },
    });

    return { user };
  }
}

//  Еще раз прочесть !!!!
