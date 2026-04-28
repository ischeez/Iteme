import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getHomepageSettings() {
    const existing = await this.prisma.homepageSettings.findUnique({
      where: { id: 'homepage' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.homepageSettings.create({
      data: {
        id: 'homepage',
        isBannerEnabled: false,
      },
    });
  }

  async updateHomepageSettings(payload: {
    bannerTitle?: string;
    bannerSubtitle?: string;
    bannerImageUrl?: string;
    bannerLinkUrl?: string;
    isBannerEnabled?: boolean;
  }) {
    return this.prisma.homepageSettings.upsert({
      where: { id: 'homepage' },
      create: {
        id: 'homepage',
        bannerTitle: payload.bannerTitle?.trim() || null,
        bannerSubtitle: payload.bannerSubtitle?.trim() || null,
        bannerImageUrl: payload.bannerImageUrl?.trim() || null,
        bannerLinkUrl: payload.bannerLinkUrl?.trim() || null,
        isBannerEnabled: payload.isBannerEnabled ?? false,
      },
      update: {
        ...(payload.bannerTitle !== undefined
          ? { bannerTitle: payload.bannerTitle?.trim() || null }
          : {}),
        ...(payload.bannerSubtitle !== undefined
          ? { bannerSubtitle: payload.bannerSubtitle?.trim() || null }
          : {}),
        ...(payload.bannerImageUrl !== undefined
          ? { bannerImageUrl: payload.bannerImageUrl?.trim() || null }
          : {}),
        ...(payload.bannerLinkUrl !== undefined
          ? { bannerLinkUrl: payload.bannerLinkUrl?.trim() || null }
          : {}),
        ...(payload.isBannerEnabled !== undefined
          ? { isBannerEnabled: payload.isBannerEnabled }
          : {}),
      },
    });
  }

  async getPublicHomepageSettings() {
    return this.getHomepageSettings();
  }

  async getAdminProfile(userId: string) {
    const [user, profile] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isAdmin: true,
          role: true,
        },
      }),
      this.prisma.adminProfileSettings.findUnique({
        where: { adminUserId: userId },
      }),
    ]);

    return { user, profile };
  }

  async updateAdminProfile(
    userId: string,
    payload: {
      username?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      nickname?: string;
      bio?: string;
    },
  ) {
    const [user, profile] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(payload.username !== undefined
            ? { username: payload.username?.trim() || null }
            : {}),
          ...(payload.firstName !== undefined
            ? { firstName: payload.firstName?.trim() || null }
            : {}),
          ...(payload.lastName !== undefined
            ? { lastName: payload.lastName?.trim() || null }
            : {}),
          ...(payload.avatarUrl !== undefined
            ? { avatarUrl: payload.avatarUrl?.trim() || null }
            : {}),
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          isAdmin: true,
        },
      }),
      this.prisma.adminProfileSettings.upsert({
        where: { adminUserId: userId },
        create: {
          adminUserId: userId,
          nickname: payload.nickname?.trim() || null,
          avatarUrl: payload.avatarUrl?.trim() || null,
          bio: payload.bio?.trim() || null,
        },
        update: {
          ...(payload.nickname !== undefined
            ? { nickname: payload.nickname?.trim() || null }
            : {}),
          ...(payload.avatarUrl !== undefined
            ? { avatarUrl: payload.avatarUrl?.trim() || null }
            : {}),
          ...(payload.bio !== undefined
            ? { bio: payload.bio?.trim() || null }
            : {}),
        },
      }),
    ]);

    return { user, profile };
  }
}
