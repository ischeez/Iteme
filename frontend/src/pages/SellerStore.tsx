import { AxiosError } from 'axios'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createSellerReview, getSellerReviews, getSellerStore, replySellerReview, type SellerReviewItem, type SellerStoreResponse } from '../api/sellers'
import { resolveMediaUrl } from '../lib/media'
import { useAuthStore } from '../store/useAuthStore'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

export default function SellerStore() {
  const { id } = useParams<{ id: string }>()
  const role = useAuthStore((state) => state.role)
  const currentUserId = useAuthStore((state) => state.user?.id)

  const [store, setStore] = useState<SellerStoreResponse | null>(null)
  const [reviews, setReviews] = useState<SellerReviewItem[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canReview = useMemo(
    () => role === 'BUYER' && store?.seller?.id && String(currentUserId ?? '') !== store.seller.id,
    [role, store?.seller?.id, currentUserId],
  )

  const canReply = useMemo(
    () => role === 'SELLER' && store?.seller?.id && String(currentUserId ?? '') === store.seller.id,
    [role, store?.seller?.id, currentUserId],
  )

  useEffect(() => {
    if (!id) {
      setError('Продавец не найден')
      setIsLoading(false)
      return
    }

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const [storeData, reviewsData] = await Promise.all([getSellerStore(id), getSellerReviews(id)])
        setStore(storeData)
        setReviews(reviewsData)
        setReplyDrafts(
          reviewsData.reduce<Record<string, string>>((acc, review) => {
            acc[review.id] = review.sellerReply ?? ''
            return acc
          }, {}),
        )
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить магазин продавца')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [id])

  const onSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id) {
      return
    }

    try {
      setIsSending(true)
      setError(null)
      const review = await createSellerReview(id, { rating, comment: comment.trim() || undefined })
      setReviews((prev) => [review, ...prev.filter((item) => item.id !== review.id)])
      setComment('')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось оставить отзыв')
    } finally {
      setIsSending(false)
    }
  }

  const onReplyReview = async (reviewId: string) => {
    if (!id) {
      return
    }

    const reply = replyDrafts[reviewId]?.trim() ?? ''
    if (!reply) {
      setError('Ответ продавца не должен быть пустым')
      return
    }

    try {
      setError(null)
      setReplyingId(reviewId)
      const updated = await replySellerReview(id, reviewId, { reply })
      setReviews((prev) => prev.map((review) => (review.id === updated.id ? updated : review)))
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: updated.sellerReply ?? '' }))
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось отправить ответ на отзыв')
    } finally {
      setReplyingId(null)
    }
  }

  if (isLoading) {
    return <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#4b4b4b]">Загрузка...</div>
  }

  if (error || !store) {
    return <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error ?? 'Ошибка'}</div>
  }

  return (
    <section className="space-y-4">
      <header className="rounded-sm border border-black/10 bg-white p-4">
        <div className="flex items-center gap-3">
          {store.seller.avatarUrl ? (
            <img src={resolveMediaUrl(store.seller.avatarUrl) ?? store.seller.avatarUrl} alt={store.seller.username ?? 'seller'} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ddd] text-sm font-semibold text-[#555]">
              {(store.seller.username?.[0] ?? store.seller.firstName?.[0] ?? 'S').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-black">
              {store.seller.username ? `@${store.seller.username}` : store.seller.firstName ?? 'Seller'}
            </h1>
            <p className="text-xs text-[#666]">
              Рейтинг: {store.rating ? store.rating.toFixed(1) : '—'} ({store.reviewsCount} отзывов)
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-2 rounded-sm border border-black/10 bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Объявления продавца</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {store.products.map((product) => (
            <Link key={product.id} to={`/listing/${product.id}`} className="rounded-sm border border-black/10 p-3 transition hover:bg-[#f7f7f7]">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-black/10 bg-[#efefef]">
                  {resolveMediaUrl(product.imageUrl) ? (
                    <img src={resolveMediaUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-[#777]">Нет фото</div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black">{product.name}</p>
                  <p className="mt-1 text-xs text-[#666]">{formatPrice(product.price)}</p>
                </div>
              </div>
            </Link>
          ))}
          {store.products.length === 0 && <p className="text-sm text-[#666]">Пока нет активных объявлений.</p>}
        </div>
      </section>

      <section className="space-y-3 rounded-sm border border-black/10 bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#666]">Отзывы</p>

        {canReview && (
          <form onSubmit={onSubmitReview} className="space-y-2 rounded-sm border border-black/10 bg-[#f9f9f9] p-3">
            <label className="block space-y-1 text-sm">
              <span>Оценка</span>
              <select
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className="w-full rounded-sm border border-black/20 bg-white px-2 py-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span>Комментарий</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="w-full rounded-sm border border-black/20 bg-white px-2 py-2"
                placeholder="Как прошла сделка"
              />
            </label>

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-9 items-center justify-center rounded-sm border border-black bg-black px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
            >
              {isSending ? 'Отправка...' : 'Оставить отзыв'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-sm border border-black/10 p-3">
              <p className="text-sm font-semibold text-black">{review.rating}/5</p>
              {review.comment && <p className="mt-1 text-sm text-[#444]">{review.comment}</p>}
              <p className="mt-1 text-xs text-[#777]">
                От: {review.buyer?.username ? `@${review.buyer.username}` : review.buyer?.firstName ?? 'Покупатель'}
              </p>

              {review.sellerReply && (
                <div className="mt-2 rounded-sm border border-black/10 bg-[#f7f7f7] p-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#666]">Ответ продавца</p>
                  <p className="mt-1 text-sm text-[#333]">{review.sellerReply}</p>
                </div>
              )}

              {canReply && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={replyDrafts[review.id] ?? ''}
                    onChange={(event) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [review.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Ответить на отзыв"
                    className="w-full rounded-sm border border-black/20 bg-white px-2 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={replyingId === review.id}
                    onClick={() => void onReplyReview(review.id)}
                    className="inline-flex h-9 items-center justify-center rounded-sm border border-black bg-black px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {replyingId === review.id ? 'Сохраняем...' : review.sellerReply ? 'Обновить ответ' : 'Ответить'}
                  </button>
                </div>
              )}
            </article>
          ))}
          {reviews.length === 0 && <p className="text-sm text-[#666]">Пока отзывов нет.</p>}
        </div>
      </section>
    </section>
  )
}
