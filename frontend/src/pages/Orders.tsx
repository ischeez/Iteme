import { AxiosError } from 'axios'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import { useAuthStore } from '../store/useAuthStore'

interface RequestOfferItem {
  id: string
  price: number
  comment?: string | null
  isAccepted: boolean
  createdAt: string
  seller?: {
    id: string
    username?: string | null
    firstName?: string | null
    avatarUrl?: string | null
  }
}

interface BuyerRequestItem {
  id: string
  title: string
  description: string
  imageUrls?: string[]
  targetPrice: number
  status?: 'OPEN' | 'FULFILLED' | 'CLOSED' | string
  createdAt: string
  buyer?: {
    id?: string
    username?: string | null
    firstName?: string | null
    avatarUrl?: string | null
  }
  offers?: RequestOfferItem[]
}

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
    : []

const normalizeRequestItem = (value: unknown): BuyerRequestItem | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const raw = value as Record<string, unknown>
  if (!raw.id) {
    return null
  }

  const rawOffers: RequestOfferItem[] = Array.isArray(raw.offers)
    ? raw.offers
        .filter((offer): offer is Record<string, unknown> => Boolean(offer) && typeof offer === 'object')
        .map((offer) => {
          const sellerRaw = offer.seller && typeof offer.seller === 'object'
            ? (offer.seller as Record<string, unknown>)
            : null

          return {
            id: String(offer.id ?? ''),
            price: Number(offer.price ?? 0),
            comment: typeof offer.comment === 'string' ? offer.comment : null,
            isAccepted: Boolean(offer.isAccepted),
            createdAt: String(offer.createdAt ?? ''),
            seller: sellerRaw
              ? {
                  id: String(sellerRaw.id ?? ''),
                  username: String(sellerRaw.username ?? '') || null,
                  firstName: String(sellerRaw.firstName ?? '') || null,
                  avatarUrl: String(sellerRaw.avatarUrl ?? '') || null,
                }
              : undefined,
          }
        })
        .filter((offer) => offer.id.length > 0)
    : []

  return {
    id: String(raw.id),
    title: String(raw.title ?? 'Без названия'),
    description: String(raw.description ?? ''),
    imageUrls: toStringArray(raw.imageUrls),
    targetPrice: Number(raw.targetPrice ?? 0),
    status: String(raw.status ?? 'OPEN'),
    createdAt: String(raw.createdAt ?? ''),
    buyer: raw.buyer && typeof raw.buyer === 'object' ? (raw.buyer as BuyerRequestItem['buyer']) : undefined,
    offers: rawOffers,
  }
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

const resolveTelegramChatUrl = (username?: string | null): string | null => {
  const value = String(username ?? '').trim()
  if (!value) {
    return null
  }

  const clean = value.startsWith('@') ? value.slice(1) : value
  return clean ? `https://t.me/${clean}` : null
}

export default function Orders() {
  const role = useAuthStore((state) => state.role)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [myRequests, setMyRequests] = useState<BuyerRequestItem[]>([])
  const [openRequests, setOpenRequests] = useState<BuyerRequestItem[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)

  const [offerDrafts, setOfferDrafts] = useState<Record<string, { price: string; comment: string }>>({})
  const [submittingOfferId, setSubmittingOfferId] = useState<string | null>(null)
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null)
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null)

  const loadBuyerData = async () => {
    try {
      setError(null)
      setIsLoadingRequests(true)

      const [requestsResponse, openRequestsResponse] = await Promise.all([
        api.get<BuyerRequestItem[]>('/requests/my'),
        api.get<BuyerRequestItem[]>('/requests'),
      ])

      const normalizedRequests = Array.isArray(requestsResponse.data)
        ? requestsResponse.data
            .map((item) => normalizeRequestItem(item))
            .filter((item): item is BuyerRequestItem => item !== null)
        : []
      setMyRequests(normalizedRequests)

      const normalizedOpenRequests = Array.isArray(openRequestsResponse.data)
        ? openRequestsResponse.data
            .map((item) => normalizeRequestItem(item))
            .filter((item): item is BuyerRequestItem => item !== null)
        : []
      setOpenRequests(normalizedOpenRequests)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось загрузить данные buyer')
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const loadSellerData = async () => {
    try {
      setError(null)
      setIsLoadingRequests(true)
      const response = await api.get<BuyerRequestItem[]>('/requests')
      const normalizedRequests = Array.isArray(response.data)
        ? response.data
            .map((item) => normalizeRequestItem(item))
            .filter((item): item is BuyerRequestItem => item !== null)
        : []
      setOpenRequests(normalizedRequests)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось загрузить запросы покупателей')
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (role === 'BUYER') {
      void loadBuyerData()
      return
    }

    if (role === 'SELLER') {
      void loadSellerData()
      return
    }

    setMyRequests([])
    setOpenRequests([])
    setIsLoadingRequests(false)
  }, [role])

  const uploadRequestImage = async (file: File) => {
    try {
      setIsUploadingImage(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post<{ filename: string; url: string }>('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImageUrls((prev) => [...prev, response.data.url])
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось загрузить фото для запроса')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const createBuyerRequest = async (event: FormEvent) => {
    event.preventDefault()

    const parsedPrice = Number(targetPrice)
    if (!title.trim() || !description.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Заполни заголовок, описание и корректную цену')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setIsCreatingRequest(true)

      await api.post('/requests', {
        title: title.trim(),
        description: description.trim(),
        targetPrice: parsedPrice,
        imageUrls,
      })

      setTitle('')
      setDescription('')
      setTargetPrice('')
      setImageUrls([])
      setSuccess('Запрос создан. Продавцы уже могут отправлять предложения.')
      await loadBuyerData()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось создать запрос')
    } finally {
      setIsCreatingRequest(false)
    }
  }

  const submitOffer = async (requestId: string) => {
    const draft = offerDrafts[requestId] ?? { price: '', comment: '' }
    const parsedPrice = Number(draft.price)

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('Укажи корректную цену для ответа')
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setSubmittingOfferId(requestId)

      await api.post(`/offers/${requestId}`, {
        price: parsedPrice,
        comment: draft.comment.trim() || undefined,
      })

      setSuccess('Ответ отправлен покупателю')
      setOfferDrafts((prev) => ({
        ...prev,
        [requestId]: { price: '', comment: '' },
      }))
      await loadSellerData()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось отправить ответ')
    } finally {
      setSubmittingOfferId(null)
    }
  }

  const acceptOffer = async (offerId: string) => {
    try {
      setError(null)
      setSuccess(null)
      setAcceptingOfferId(offerId)

      await api.post(`/offers/${offerId}/accept`)
      setSuccess('Предложение принято. Заказ переведен в исполнение.')
      await loadBuyerData()
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось принять предложение')
    } finally {
      setAcceptingOfferId(null)
    }
  }

  const deleteRequest = async (requestId: string) => {
    const confirmed = window.confirm('Удалить этот запрос?')
    if (!confirmed) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      setDeletingRequestId(requestId)

      await api.delete(`/requests/${requestId}`)
      setMyRequests((prev) => prev.filter((item) => item.id !== requestId))
      setSuccess('Запрос удален')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить запрос')
    } finally {
      setDeletingRequestId(null)
    }
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Orders Hub</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Сделки и запросы</h1>
      </header>

      {error && <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {success && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>
      )}

      {role !== 'BUYER' && role !== 'SELLER' && (
        <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">
          Раздел доступен только для ролей BUYER и SELLER.
        </div>
      )}

      {role === 'BUYER' && (
        <>
          <form onSubmit={createBuyerRequest} className="space-y-3 rounded-sm border border-black/10 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Новый запрос</p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Что ищешь? Например: Nike Air Jordan 1 Mid"
              className="w-full rounded-sm border px-3 py-2 text-sm"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Опиши детали: состояние, размер, цвет, сроки"
              className="w-full rounded-sm border px-3 py-2 text-sm"
            />
            <input
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
              type="number"
              min={1}
              placeholder="Целевая цена (₽)"
              className="w-full rounded-sm border px-3 py-2 text-sm"
            />

            <label className="block rounded-sm border border-dashed border-black/20 p-3 text-sm text-[#5e5e5e]">
              Фото к запросу
              <input
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    return
                  }

                  await uploadRequestImage(file)
                  event.currentTarget.value = ''
                }}
                className="mt-2 block w-full text-xs"
              />
              {isUploadingImage && <p className="mt-2 text-xs text-[#777]">Загружаем фото...</p>}
            </label>

            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url) => (
                  <div key={url} className="relative overflow-hidden rounded-sm border border-black/10">
                    <img src={resolveMediaUrl(url) ?? url} alt="Фото запроса" className="h-20 w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreatingRequest}
              className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingRequest ? 'Публикуем...' : 'Опубликовать запрос'}
            </button>
          </form>

          <section className="space-y-2 rounded-sm border border-black/10 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Мои запросы</p>
              <button
                type="button"
                onClick={() => void loadBuyerData()}
                className="rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
              >
                Обновить
              </button>
            </div>

            {isLoadingRequests && <p className="text-sm text-[#555]">Загружаем запросы...</p>}

            {!isLoadingRequests && myRequests.length === 0 && (
              <p className="text-sm text-[#666]">Пока нет запросов. Создай первый выше.</p>
            )}

            {!isLoadingRequests && myRequests.length > 0 && (
              <div className="space-y-3">
                {myRequests.map((requestItem) => (
                  <article key={requestItem.id} className="rounded-sm border border-black/10 bg-[#fafafa] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-black">{requestItem.title}</h3>
                      <button
                        type="button"
                        onClick={() => void deleteRequest(requestItem.id)}
                        disabled={deletingRequestId === requestItem.id || (requestItem.status || 'OPEN') !== 'OPEN'}
                        className="rounded-sm border border-rose-300 bg-rose-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingRequestId === requestItem.id ? 'Удаляем...' : 'Удалить'}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-[#555]">{requestItem.description}</p>
                    <p className="mt-2 text-xs text-[#666]">Цель: {formatPrice(Number(requestItem.targetPrice || 0))} · Статус: {requestItem.status || 'OPEN'}</p>

                    {toStringArray(requestItem.imageUrls).length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {toStringArray(requestItem.imageUrls).map((url) => (
                          <div key={url} className="overflow-hidden rounded-sm border border-black/10 bg-white">
                            <img src={resolveMediaUrl(url) ?? url} alt="Фото запроса" className="h-16 w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Ответы продавцов</p>

                      {(!Array.isArray(requestItem.offers) || requestItem.offers.length === 0) && (
                        <p className="text-sm text-[#666]">Пока никто не ответил.</p>
                      )}

                      {(Array.isArray(requestItem.offers) ? requestItem.offers : []).map((offer) => {
                        const chatUrl = resolveTelegramChatUrl(offer.seller?.username)
                        return (
                          <div key={offer.id} className="rounded-sm border border-black/10 bg-white p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-black">
                                {offer.seller?.username || offer.seller?.firstName || 'Seller'} · {formatPrice(offer.price)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {chatUrl ? (
                                  <a
                                    href={chatUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                                  >
                                    Написать
                                  </a>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => void acceptOffer(offer.id)}
                                  disabled={(requestItem.status || 'OPEN') !== 'OPEN' || acceptingOfferId === offer.id}
                                  className="rounded-sm border border-black bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {acceptingOfferId === offer.id ? 'Принимаем...' : 'Принять'}
                                </button>
                              </div>
                            </div>
                            {offer.comment && <p className="mt-2 text-sm text-[#555]">{offer.comment}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

        </>
      )}

      {(role === 'SELLER' || role === 'BUYER') && (
        <section className="space-y-3 rounded-sm border border-black/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Лента запросов</p>
            <button
              type="button"
              onClick={() => void loadSellerData()}
              className="rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
            >
              Обновить
            </button>
          </div>

          {isLoadingRequests && <p className="text-sm text-[#555]">Загружаем запросы...</p>}

          {!isLoadingRequests && openRequests.length === 0 && (
            <p className="text-sm text-[#666]">Открытых запросов сейчас нет.</p>
          )}

          {!isLoadingRequests && openRequests.length > 0 && (
            <div className="space-y-3">
              {openRequests.map((item) => {
                const draft = offerDrafts[item.id] ?? { price: String(Number(item.targetPrice || 0)), comment: '' }
                const buyerChatUrl = resolveTelegramChatUrl(item.buyer?.username)

                return (
                  <article key={item.id} className="rounded-sm border border-black/10 bg-[#fafafa] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-black">{item.title}</h3>
                        <p className="mt-1 text-sm text-[#555]">{item.description}</p>
                        <p className="mt-2 text-xs text-[#666]">Бюджет: {formatPrice(Number(item.targetPrice || 0))}</p>
                        <p className="mt-1 text-xs text-[#666]">
                          Покупатель: {item.buyer?.username || item.buyer?.firstName || 'Аноним'}
                        </p>
                      </div>
                      {buyerChatUrl ? (
                        <a
                          href={buyerChatUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-sm border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
                        >
                          Начать диалог
                        </a>
                      ) : (
                        <span className="rounded-sm border border-black/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
                          Чат недоступен
                        </span>
                      )}
                    </div>

                    {toStringArray(item.imageUrls).length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {toStringArray(item.imageUrls).map((url) => (
                          <div key={url} className="overflow-hidden rounded-sm border border-black/10 bg-white">
                            <img src={resolveMediaUrl(url) ?? url} alt="Фото из запроса" className="h-16 w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {role === 'SELLER' ? (
                      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.3fr_auto]">
                        <input
                          type="number"
                          min={1}
                          value={draft.price}
                          onChange={(event) =>
                            setOfferDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...draft,
                                price: event.target.value,
                              },
                            }))
                          }
                          className="rounded-sm border px-3 py-2 text-sm"
                          placeholder="Твоя цена"
                        />
                        <input
                          value={draft.comment}
                          onChange={(event) =>
                            setOfferDrafts((prev) => ({
                              ...prev,
                              [item.id]: {
                                ...draft,
                                comment: event.target.value,
                              },
                            }))
                          }
                          className="rounded-sm border px-3 py-2 text-sm"
                          placeholder="Комментарий к предложению"
                        />
                        <button
                          type="button"
                          onClick={() => void submitOffer(item.id)}
                          disabled={submittingOfferId === item.id}
                          className="rounded-sm border border-black bg-black px-3 py-2 text-xs font-semibold uppercase text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submittingOfferId === item.id ? 'Отправляем...' : 'Ответить'}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-[#666]">Ответить на запрос можно в роли SELLER.</p>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {role === 'SELLER' && (
            <p className="text-xs text-[#7a7a7a]">
              Нужен расширенный список продаж? <Link to="/sales" className="font-semibold underline">Открыть продажи</Link>
            </p>
          )}
        </section>
      )}
    </section>
  )
}
