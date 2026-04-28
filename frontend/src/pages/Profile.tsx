import { AxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthUser, UserRole } from '../types/auth'

interface MeResponse {
  user?: AuthUser
  role?: UserRole
  data?: {
    user?: AuthUser
    role?: UserRole
  }
}

interface UploadImageResponse {
  filename: string
  url: string
}

export default function Profile() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const updateUser = useAuthStore((state) => state.updateUser)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [isLoading, setIsLoading] = useState(false)
  const [isSwitchingRole, setIsSwitchingRole] = useState(false)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [switchRoleError, setSwitchRoleError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  const activeRole: UserRole | null =
    role === 'BUYER' || role === 'SELLER' || role === 'ADMIN' ? role : null
  const roleLabel =
    activeRole === 'SELLER'
      ? 'Seller Mode'
      : activeRole === 'BUYER'
        ? 'Buyer Mode'
        : activeRole === 'ADMIN'
          ? 'Admin Mode'
        : 'Роль не определена'

  const handleSwitchRole = async (nextRole: UserRole) => {
    if (!token || isSwitchingRole || role === nextRole) {
      return
    }

    try {
      setIsSwitchingRole(true)
      setSwitchRoleError(null)

      const response = await api.patch<{
        access_token: string
        user: AuthUser
        role: UserRole
      }>('/auth/switch-role', {
        role: nextRole,
      })

      setAuth({
        token: response.data.access_token,
        user: {
          ...response.data.user,
          avatarUrl: response.data.user.avatarUrl ?? user?.avatarUrl,
        },
        role: response.data.role,
      })
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setSwitchRoleError(axiosError.response?.data?.message ?? 'Не удалось сменить роль')
    } finally {
      setIsSwitchingRole(false)
    }
  }

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      return
    }

    if (role !== 'SELLER' && role !== 'ADMIN') {
      setAvatarError('Смена аватарки доступна только продавцу')
      return
    }

    try {
      setIsAvatarUploading(true)
      setAvatarError(null)

      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await api.post<UploadImageResponse>('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const profileResponse = await api.patch<{ user: AuthUser }>('/auth/avatar', {
        avatarUrl: uploadResponse.data.url,
      })

      updateUser(profileResponse.data.user)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setAvatarError(axiosError.response?.data?.message ?? 'Не удалось обновить аватар')
    } finally {
      setIsAvatarUploading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    const fetchProfile = async () => {
      if (!token) {
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get<MeResponse>('/auth/me', {
          signal: controller.signal,
        })

        const payloadUser = response.data.user ?? response.data.data?.user ?? null
        if (payloadUser) {
          updateUser(payloadUser)
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось получить профиль с бэкенда')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchProfile()

    return () => controller.abort()
  }, [token, updateUser])

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Account</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Профиль</h1>
      </header>

      {isLoading && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#515151]">
          Загружаем данные профиля...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-sm border border-black/10 bg-white p-4 md:p-5">
        <div className="rounded-sm border border-black/10 bg-[#f4f4f4] p-3.5 md:p-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={resolveMediaUrl(user.avatarUrl) ?? user.avatarUrl}
                  alt={user.username ?? user.firstName ?? 'Telegram user'}
                  className="h-14 w-14 rounded-full border border-black/15 object-cover shadow-[0_6px_16px_-14px_rgba(0,0,0,0.7)]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-black/20 bg-[#ddd] text-sm font-semibold text-[#4c4c4c] shadow-[0_6px_16px_-14px_rgba(0,0,0,0.7)]">
                  {user?.username?.[0]?.toUpperCase() ?? user?.firstName?.[0]?.toUpperCase() ?? 'T'}
                </div>
              )}

              {(role === 'SELLER' || role === 'ADMIN') && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isAvatarUploading}
                  className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-black bg-white text-sm font-bold text-black transition hover:bg-[#efefef] disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Сменить аватар"
                >
                  +
                </button>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                disabled={isAvatarUploading}
                onChange={(event) => void handleAvatarUpload(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-xl font-semibold leading-tight tracking-[-0.01em] text-black [overflow-wrap:anywhere]">
                  {user?.username ? `@${user.username}` : user?.firstName ?? 'Telegram User'}
                </p>
                {user?.isVerified && (
                  <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border border-[#1d6dff]/20 bg-gradient-to-b from-[#2d7dff] to-[#1765ef] px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_-14px_rgba(29,109,255,0.95)]">
                    VERIFIED
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#7b7b7b]">Профиль из Telegram</p>
            </div>
          </div>

          {isAvatarUploading && (
            <p className="mt-2 text-xs text-[#666]">Загружаем и сохраняем аватар...</p>
          )}
          {avatarError && <p className="mt-2 text-xs text-rose-600">{avatarError}</p>}
        </div>

        {!user?.isVerified && (
          <div className="flex justify-stretch sm:justify-end">
            <Link
              to="/verification"
              className="inline-flex h-9 w-full items-center justify-center rounded-sm border border-black/15 bg-[#f7f7f7] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef] sm:w-auto"
            >
              Центр верификации
            </Link>
          </div>
        )}

        <div className="grid gap-2 text-sm text-[#2d2d2d] md:grid-cols-3">
          <div className="border border-black/10 bg-[#fafafa] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Статус</p>
            <p className="mt-1 font-semibold text-black">
              {isAuthenticated
                ? 'Авторизован'
                : user
                  ? 'Telegram распознан'
                  : 'Не авторизован'}
            </p>
          </div>

          <div className="border border-black/10 bg-[#fafafa] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Роль</p>
            <p className="mt-1 font-semibold text-black">{role ?? 'Не определена'}</p>
          </div>

          <div className="border border-black/10 bg-[#fafafa] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Пользователь</p>
            <p className="mt-1 font-semibold text-black">
              {user?.username ?? user?.firstName ?? user?.lastName ?? 'Telegram User'}
            </p>
          </div>
        </div>

        <section className="space-y-3 rounded-sm border border-black/10 bg-[#f8f8f8] p-3 md:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Режим работы</p>
              <p className="mt-1 text-sm font-semibold text-black">{roleLabel}</p>
            </div>
            <span className="rounded-sm border border-black/15 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4d4d4d]">
              {activeRole ?? 'UNKNOWN'}
            </span>
          </div>

          <div className="relative rounded-[10px] border border-black/10 bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <div
              className={`pointer-events-none absolute bottom-1 top-1 z-0 w-[calc(50%-0.25rem)] rounded-[8px] bg-black transition-transform duration-300 ease-out ${
                activeRole === 'SELLER'
                  ? 'translate-x-[calc(100%+0.5rem)] opacity-100'
                  : activeRole === 'BUYER'
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-0 opacity-0'
              }`}
            />

            <div className="relative z-10 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => void handleSwitchRole('BUYER')}
                disabled={isSwitchingRole || activeRole === 'BUYER' || !isAuthenticated}
                className={`h-11 rounded-[8px] px-3 text-xs font-semibold uppercase tracking-[0.14em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
                  activeRole === 'BUYER' ? 'text-white' : 'text-[#404040] hover:text-black'
                }`}
              >
                Buyer
              </button>

              <button
                type="button"
                onClick={() => void handleSwitchRole('SELLER')}
                disabled={isSwitchingRole || activeRole === 'SELLER' || !isAuthenticated}
                className={`h-11 rounded-[8px] px-3 text-xs font-semibold uppercase tracking-[0.14em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-70 ${
                  activeRole === 'SELLER' ? 'text-white' : 'text-[#404040] hover:text-black'
                }`}
              >
                Seller
              </button>
            </div>
          </div>

          {isSwitchingRole && (
            <p className="text-xs text-[#6f6f6f]">Переключаем режим и обновляем доступы...</p>
          )}

          {switchRoleError && (
            <p className="text-xs text-rose-600">{switchRoleError}</p>
          )}

          {!isAuthenticated && (
            <p className="text-xs text-[#6f6f6f]">Для переключения роли нужна полная авторизация (JWT).</p>
          )}

          {activeRole && (
            <div className="grid grid-cols-1 gap-2">
              <Link
                to={activeRole === 'SELLER' ? '/sales' : activeRole === 'ADMIN' ? '/admin' : '/purchases'}
                className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black/15 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef]"
              >
                {activeRole === 'SELLER' ? 'Мои продажи' : activeRole === 'ADMIN' ? 'Админ панель' : 'Мои покупки'}
              </Link>
              {activeRole === 'ADMIN' && (
                <Link
                  to="/admin/verification"
                  className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black/15 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef]"
                >
                  Верификация
                </Link>
              )}
              {activeRole === 'SELLER' && (
                <Link
                  to="/my-listings"
                  className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black/15 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef]"
                >
                  Мои объявления
                </Link>
              )}
              {user?.isAdmin && (
                <button
                  type="button"
                  onClick={() => void handleSwitchRole('ADMIN')}
                  disabled={isSwitchingRole || activeRole === 'ADMIN' || !isAuthenticated}
                  className="inline-flex h-10 items-center justify-center rounded-[8px] border border-black bg-black px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#222] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Переключить в Admin
                </button>
              )}
            </div>
          )}

          <div className="rounded-sm border border-black/10 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Активный сценарий</p>
            {activeRole === 'SELLER' ? (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <p className="text-xs text-[#4f4f4f]">Работаешь как продавец. Раздел продаж доступен отдельно от Orders.</p>
                <Link
                  to="/create"
                  className="rounded-sm border border-black/15 bg-[#f7f7f7] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef]"
                >
                  Добавить
                </Link>
              </div>
            ) : (
              <div className="mt-1.5 flex items-center justify-between gap-3">
                {activeRole === 'BUYER' ? (
                  <p className="text-xs text-[#4f4f4f]">В режиме покупателя Мои покупки доступны как отдельный раздел.</p>
                ) : (
                  <p className="text-xs text-[#4f4f4f]">Выбери роль, чтобы открыть нужный сценарий работы.</p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
