import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getAdminHomepageSettings, getAdminProfile, updateAdminHomepageSettings, updateAdminProfile } from '../api/admin'
import { createGuarantor, deleteGuarantor, getAdminGuarantors, updateGuarantor, type GuarantorItem } from '../api/guarantors'
import { deleteProduct, getProducts, type ProductItem } from '../api/products'
import { getPendingVerificationRequestsCount } from '../api/verification'
import { api } from '../lib/api'
import { resolveMediaUrl } from '../lib/media'

type Tab = 'banner' | 'profile' | 'guarantors' | 'listings'

const DESIGN_BANNER_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='700' viewBox='0 0 1600 700' fill='none'>
    <rect width='1600' height='700' fill='#0A0D13'/>
    <rect width='1600' height='700' fill='url(#atmosphere)'/>

    <g opacity='0.58'>
      <rect x='70' y='92' width='440' height='516' rx='8' fill='url(#tileA)'/>
      <rect x='540' y='92' width='520' height='516' rx='8' fill='url(#tileB)'/>
      <rect x='1090' y='92' width='440' height='516' rx='8' fill='url(#tileC)'/>
    </g>

    <rect x='70' y='92' width='1460' height='516' rx='8' stroke='rgba(255,255,255,0.08)'/>

    <g>
      <rect x='92' y='118' width='292' height='88' rx='16' fill='rgba(7,10,15,0.72)' stroke='rgba(255,255,255,0.15)'/>
      <text x='238' y='170' text-anchor='middle' fill='white' font-size='60' font-weight='700' font-family='Georgia, Times New Roman, serif' letter-spacing='1'>Itemé</text>
    </g>

    <g opacity='0.8'>
      <rect x='0' y='536' width='1600' height='164' fill='url(#floor)'/>
      <path d='M0 556C250 540 420 578 640 550C830 526 1000 584 1240 552C1370 534 1500 546 1600 534V700H0V556Z' fill='rgba(255,255,255,0.06)'/>
    </g>

    <defs>
      <radialGradient id='atmosphere' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(910 305) rotate(90) scale(410 860)'>
        <stop stop-color='#152033'/>
        <stop offset='1' stop-color='#0A0D13'/>
      </radialGradient>
      <linearGradient id='tileA' x1='70' y1='92' x2='510' y2='608' gradientUnits='userSpaceOnUse'>
        <stop stop-color='#4A4A4A'/>
        <stop offset='1' stop-color='#12161D'/>
      </radialGradient>
      <linearGradient id='tileB' x1='540' y1='92' x2='1060' y2='608' gradientUnits='userSpaceOnUse'>
        <stop stop-color='#2D2D2D'/>
        <stop offset='0.55' stop-color='#0E131B'/>
        <stop offset='1' stop-color='#060A11'/>
      </radialGradient>
      <linearGradient id='tileC' x1='1090' y1='92' x2='1530' y2='608' gradientUnits='userSpaceOnUse'>
        <stop stop-color='#3C3C3C'/>
        <stop offset='1' stop-color='#10141C'/>
      </linearGradient>
      <linearGradient id='floor' x1='800' y1='536' x2='800' y2='700' gradientUnits='userSpaceOnUse'>
        <stop stop-color='rgba(0,0,0,0.1)'/>
        <stop offset='1' stop-color='rgba(0,0,0,0.7)'/>
      </linearGradient>
    </defs>
  </svg>`,
)}`

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('banner')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [bannerLinkUrl, setBannerLinkUrl] = useState('')
  const [isBannerEnabled, setIsBannerEnabled] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')

  const [guarantors, setGuarantors] = useState<GuarantorItem[]>([])
  const [newNickname, setNewNickname] = useState('')
  const [newTelegramUrl, setNewTelegramUrl] = useState('')
  const [newAvatarUrl, setNewAvatarUrl] = useState('')
  const [isUploadingGuarantorAvatar, setIsUploadingGuarantorAvatar] = useState(false)
  const [listings, setListings] = useState<ProductItem[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [deletingListingId, setDeletingListingId] = useState<number | null>(null)
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0)
  const [isLoadingVerificationCount, setIsLoadingVerificationCount] = useState(true)

  const sortedGuarantors = useMemo(
    () => [...guarantors].sort((a, b) => a.sortOrder - b.sortOrder),
    [guarantors],
  )

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const [banner, profile, gs] = await Promise.all([
          getAdminHomepageSettings(),
          getAdminProfile(),
          getAdminGuarantors(),
        ])

        setBannerTitle(banner.bannerTitle ?? '')
        setBannerSubtitle(banner.bannerSubtitle ?? '')
        setBannerImageUrl(banner.bannerImageUrl ?? '')
        setBannerLinkUrl(banner.bannerLinkUrl ?? '')
        setIsBannerEnabled(banner.isBannerEnabled)

        setUsername(profile.user?.username ?? '')
        setFirstName(profile.user?.firstName ?? '')
        setLastName(profile.user?.lastName ?? '')
        setAvatarUrl(profile.user?.avatarUrl ?? profile.profile?.avatarUrl ?? '')
        setNickname(profile.profile?.nickname ?? '')
        setBio(profile.profile?.bio ?? '')

        setGuarantors(gs)

        setIsLoadingListings(true)
        const products = await getProducts()
        setListings(products)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить админ-панель')
      } finally {
        setIsLoadingListings(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    let isActive = true

    const refreshPendingVerificationCount = async () => {
      try {
        const pendingCount = await getPendingVerificationRequestsCount()
        if (!isActive) {
          return
        }

        setPendingVerificationCount(pendingCount)
      } catch {
        if (!isActive) {
          return
        }
      } finally {
        if (isActive) {
          setIsLoadingVerificationCount(false)
        }
      }
    }

    void refreshPendingVerificationCount()
    const timerId = window.setInterval(() => {
      void refreshPendingVerificationCount()
    }, 20000)

    return () => {
      isActive = false
      window.clearInterval(timerId)
    }
  }, [])

  const saveBanner = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setError(null)
      await updateAdminHomepageSettings({
        bannerTitle,
        bannerSubtitle,
        bannerImageUrl,
        bannerLinkUrl,
        isBannerEnabled,
      })
      setSuccess('Баннер обновлен')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось обновить баннер')
    }
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setError(null)
      await updateAdminProfile({ username, firstName, lastName, avatarUrl, nickname, bio })
      setSuccess('Профиль админа обновлен')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось обновить профиль')
    }
  }

  const addGuarantor = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setError(null)
      const created = await createGuarantor({
        nickname: newNickname,
        telegramUrl: newTelegramUrl || undefined,
        avatarUrl: newAvatarUrl || undefined,
      })
      setGuarantors((prev) => [...prev, created])
      setNewNickname('')
      setNewTelegramUrl('')
      setNewAvatarUrl('')
      setSuccess('Гарант добавлен')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось добавить гаранта')
    }
  }

  const toggleGuarantor = async (item: GuarantorItem) => {
    try {
      const updated = await updateGuarantor(item.id, { isActive: !item.isActive })
      setGuarantors((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось обновить гаранта')
    }
  }

  const removeGuarantor = async (id: string) => {
    try {
      await deleteGuarantor(id)
      setGuarantors((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить гаранта')
    }
  }

  const removeListingByAdmin = async (id: number) => {
    const confirmed = window.confirm('Удалить это объявление? Действие необратимо.')
    if (!confirmed) {
      return
    }

    try {
      setError(null)
      setDeletingListingId(id)
      await deleteProduct(id)
      setListings((prev) => prev.filter((item) => item.id !== id))
      setSuccess('Объявление удалено')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить объявление')
    } finally {
      setDeletingListingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Панель администратора</h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-black/10 bg-white p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Верификация продавцов</p>
          <p className="mt-1 text-sm text-[#2f2f2f]">
            {isLoadingVerificationCount
              ? 'Проверяем заявки...'
              : pendingVerificationCount > 0
                ? `Новых заявок: ${pendingVerificationCount}`
                : 'Новых заявок нет'}
          </p>
        </div>
        <Link
          to="/admin/verification"
          className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white"
        >
          {pendingVerificationCount > 0 ? `Открыть заявки (${pendingVerificationCount})` : 'Открыть заявки'}
        </Link>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('banner')} className={`rounded-sm border px-3 py-2 text-xs font-semibold uppercase ${tab === 'banner' ? 'bg-black text-white' : 'bg-white'}`}>Баннер</button>
        <button onClick={() => setTab('profile')} className={`rounded-sm border px-3 py-2 text-xs font-semibold uppercase ${tab === 'profile' ? 'bg-black text-white' : 'bg-white'}`}>Профиль</button>
        <button onClick={() => setTab('guarantors')} className={`rounded-sm border px-3 py-2 text-xs font-semibold uppercase ${tab === 'guarantors' ? 'bg-black text-white' : 'bg-white'}`}>Гаранты</button>
        <button onClick={() => setTab('listings')} className={`rounded-sm border px-3 py-2 text-xs font-semibold uppercase ${tab === 'listings' ? 'bg-black text-white' : 'bg-white'}`}>Объявления</button>
      </div>

      {error && <div className="rounded-sm border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}

      {tab === 'banner' && (
        <form onSubmit={saveBanner} className="space-y-2 rounded-sm border border-black/10 bg-white p-4">
          <button
            type="button"
            onClick={() => {
              setBannerImageUrl(DESIGN_BANNER_URL)
              setBannerTitle('')
              setBannerSubtitle('')
              setIsBannerEnabled(true)
            }}
            className="rounded-sm border border-black/20 bg-[#f3f3f3] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-[#e8e8e8]"
          >
            Подставить стильный баннер
          </button>
          <input value={bannerTitle} onChange={(event) => setBannerTitle(event.target.value)} placeholder="Заголовок баннера" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={bannerSubtitle} onChange={(event) => setBannerSubtitle(event.target.value)} placeholder="Подзаголовок" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={bannerImageUrl} onChange={(event) => setBannerImageUrl(event.target.value)} placeholder="URL баннера" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <label className="block space-y-1 text-sm">
            <span className="text-[#555]">Или загрузи фото баннера</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }

                try {
                  setError(null)
                  setIsUploadingBanner(true)
                  const formData = new FormData()
                  formData.append('file', file)
                  const uploaded = await api.post<{ filename: string; url: string }>('/uploads/image', formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  })
                  setBannerImageUrl(uploaded.data.url)
                } catch (err) {
                  const axiosError = err as AxiosError<{ message?: string }>
                  setError(axiosError.response?.data?.message ?? 'Не удалось загрузить баннер')
                } finally {
                  setIsUploadingBanner(false)
                  event.currentTarget.value = ''
                }
              }}
              className="w-full rounded-sm border px-3 py-2 text-sm"
            />
            {isUploadingBanner && <span className="text-xs text-[#666]">Загружаем баннер...</span>}
          </label>
          {bannerImageUrl && (
            <div className="overflow-hidden rounded-sm border border-black/10 bg-[#f5f5f5]">
              <img src={resolveMediaUrl(bannerImageUrl) ?? bannerImageUrl} alt="Предпросмотр баннера" className="h-32 w-full object-cover" />
            </div>
          )}
          <input value={bannerLinkUrl} onChange={(event) => setBannerLinkUrl(event.target.value)} placeholder="Ссылка баннера" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isBannerEnabled} onChange={(event) => setIsBannerEnabled(event.target.checked)} />Показывать баннер</label>
          <button type="submit" className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white">Сохранить баннер</button>
        </form>
      )}

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-2 rounded-sm border border-black/10 bg-white p-4">
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Имя" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Фамилия" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="Avatar URL" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Ник в админке" className="w-full rounded-sm border px-3 py-2 text-sm" />
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Описание" rows={3} className="w-full rounded-sm border px-3 py-2 text-sm" />
          <button type="submit" className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white">Сохранить профиль</button>
        </form>
      )}

      {tab === 'guarantors' && (
        <div className="space-y-3 rounded-sm border border-black/10 bg-white p-4">
          <form onSubmit={addGuarantor} className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input value={newNickname} onChange={(event) => setNewNickname(event.target.value)} placeholder="Имя/ник" className="rounded-sm border px-3 py-2 text-sm" />
            <input value={newTelegramUrl} onChange={(event) => setNewTelegramUrl(event.target.value)} placeholder="Telegram URL" className="rounded-sm border px-3 py-2 text-sm" />
            <input value={newAvatarUrl} onChange={(event) => setNewAvatarUrl(event.target.value)} placeholder="Avatar URL (необязательно)" className="rounded-sm border px-3 py-2 text-sm md:col-span-2" />
            <label className="rounded-sm border px-3 py-2 text-sm md:col-span-1">
              <span className="text-xs text-[#666]">Или загрузи аватар</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    return
                  }

                  try {
                    setError(null)
                    setIsUploadingGuarantorAvatar(true)
                    const formData = new FormData()
                    formData.append('file', file)
                    const uploaded = await api.post<{ filename: string; url: string }>('/uploads/image', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                    })
                    setNewAvatarUrl(uploaded.data.url)
                  } catch (err) {
                    const axiosError = err as AxiosError<{ message?: string }>
                    setError(axiosError.response?.data?.message ?? 'Не удалось загрузить аватар гаранта')
                  } finally {
                    setIsUploadingGuarantorAvatar(false)
                    event.currentTarget.value = ''
                  }
                }}
                className="mt-1 w-full"
              />
            </label>
            {isUploadingGuarantorAvatar && <p className="text-xs text-[#666] md:col-span-3">Загружаем аватар гаранта...</p>}
            <button type="submit" className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white md:col-span-3">Добавить гаранта</button>
          </form>

          <div className="space-y-2">
            {sortedGuarantors.map((item) => (
              <article key={item.id} className="flex items-center justify-between rounded-sm border border-black/10 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-black/10 bg-[#efefef]">
                    {item.avatarUrl ? (
                      <img src={resolveMediaUrl(item.avatarUrl) ?? item.avatarUrl} alt={item.nickname} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#777]">G</div>
                    )}
                  </div>
                  <div className="min-w-0">
                  <p className="text-sm font-semibold text-black">{item.nickname}</p>
                    {item.telegramUrl && <p className="truncate text-[11px] text-[#888]">{item.telegramUrl}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void toggleGuarantor(item)} className="rounded-sm border px-2 py-1 text-xs font-semibold uppercase">{item.isActive ? 'Выключить' : 'Включить'}</button>
                  <button type="button" onClick={() => void removeGuarantor(item.id)} className="rounded-sm border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold uppercase text-rose-700">Удалить</button>
                </div>
              </article>
            ))}
            {sortedGuarantors.length === 0 && <p className="text-sm text-[#666]">Пока гарантов нет.</p>}
          </div>
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-3 rounded-sm border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-black">Управление объявлениями продавцов</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  setError(null)
                  setIsLoadingListings(true)
                  const products = await getProducts()
                  setListings(products)
                } catch (err) {
                  const axiosError = err as AxiosError<{ message?: string }>
                  setError(axiosError.response?.data?.message ?? 'Не удалось обновить список объявлений')
                } finally {
                  setIsLoadingListings(false)
                }
              }}
              className="rounded-sm border px-3 py-2 text-xs font-semibold uppercase"
            >
              Обновить
            </button>
          </div>

          {isLoadingListings && <p className="text-sm text-[#666]">Загружаем объявления...</p>}

          {!isLoadingListings && listings.length === 0 && (
            <p className="text-sm text-[#666]">Объявлений пока нет.</p>
          )}

          {!isLoadingListings && listings.length > 0 && (
            <div className="space-y-2">
              {listings.map((item) => (
                <article key={item.id} className="flex items-center justify-between gap-3 rounded-sm border border-black/10 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-black">#{item.id} · {item.name}</p>
                    <p className="truncate text-[12px] text-[#666]">
                      Продавец: {item.seller?.username || item.seller?.firstName || item.sellerId || '—'} · {item.price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeListingByAdmin(item.id)}
                    disabled={deletingListingId === item.id}
                    className="rounded-sm border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold uppercase text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingListingId === item.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
