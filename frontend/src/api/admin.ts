import { api } from '../lib/api'

export interface HomepageSettings {
  id: string
  bannerTitle?: string | null
  bannerSubtitle?: string | null
  bannerImageUrl?: string | null
  bannerLinkUrl?: string | null
  isBannerEnabled: boolean
}

export interface AdminProfile {
  user: {
    id: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    avatarUrl?: string | null
    role: 'BUYER' | 'SELLER' | 'ADMIN'
    isAdmin: boolean
  } | null
  profile: {
    nickname?: string | null
    avatarUrl?: string | null
    bio?: string | null
  } | null
}

export async function getPublicHomepageSettings() {
  const { data } = await api.get<HomepageSettings>('/public/homepage-settings')
  return data
}

export async function getAdminHomepageSettings() {
  const { data } = await api.get<HomepageSettings>('/admin/homepage-settings')
  return data
}

export async function updateAdminHomepageSettings(payload: Partial<HomepageSettings>) {
  const { data } = await api.patch<HomepageSettings>('/admin/homepage-settings', payload)
  return data
}

export async function getAdminProfile() {
  const { data } = await api.get<AdminProfile>('/admin/profile')
  return data
}

export async function updateAdminProfile(payload: {
  username?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  nickname?: string
  bio?: string
}) {
  const { data } = await api.patch<AdminProfile>('/admin/profile', payload)
  return data
}
