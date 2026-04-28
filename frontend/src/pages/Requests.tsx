import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccessControl } from '../hooks/useAccessControl'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'

interface BuyerRequestItem {
  id: string
  title: string
  description: string
  targetPrice: number
  createdAt: string
  buyer?: {
    firstName?: string | null
  }
}

export default function Requests() {
  const role = useAuthStore((state) => state.role)
  const { hasActiveSubscription, isLoading: isSubscriptionLoading } = useAccessControl()

  const [items, setItems] = useState<BuyerRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingOfferId, setIsSubmittingOfferId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchRequests = async () => {
      if (role !== 'SELLER') {
        setItems([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get<BuyerRequestItem[]>('/requests', {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) {
          setItems(Array.isArray(response.data) ? response.data : [])
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить заявки покупателей')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchRequests()

    return () => controller.abort()
  }, [role])

  const handleReply = async (requestItem: BuyerRequestItem) => {
    if (!hasActiveSubscription) {
      setError('Функция доступна только с подпиской')
      return
    }

    try {
      setIsSubmittingOfferId(requestItem.id)
      setError(null)
      setSuccess(null)

      await api.post(`/offers/${requestItem.id}`, {
        price: requestItem.targetPrice,
        comment: 'Отклик от продавца',
      })

      setSuccess('Отклик отправлен')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось отправить отклик')
    } finally {
      setIsSubmittingOfferId(null)
    }
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Buyer Requests</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Список заявок покупателей</h1>
      </header>

      {role !== 'SELLER' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Раздел доступен только продавцам.
        </div>
      )}

      {role === 'SELLER' && !isSubscriptionLoading && !hasActiveSubscription && (
        <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Функция доступна только с подпиской.{' '}
          <Link to="/cart" className="font-semibold underline">
            Перейти к оплате
          </Link>
        </div>
      )}

      {isLoading && role === 'SELLER' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Загружаем заявки...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {!isLoading && role === 'SELLER' && items.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Пока нет открытых заявок покупателей.
        </div>
      )}

      {!isLoading && role === 'SELLER' && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-sm border border-black/10 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Заявка #{item.id}</p>
              <h2 className="mt-1 text-base font-semibold text-black">{item.title}</h2>
              <p className="mt-1 text-sm text-[#4f4f4f]">{item.description}</p>
              <p className="mt-2 text-xs text-[#5f5f5f]">Целевая цена: {item.targetPrice} ₽</p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#6a6a6a]">Покупатель: {item.buyer?.firstName ?? 'Аноним'}</p>
                <button
                  type="button"
                  onClick={() => void handleReply(item)}
                  disabled={!hasActiveSubscription || isSubscriptionLoading || isSubmittingOfferId === item.id}
                  className="rounded-sm border border-black/15 bg-[#f7f7f7] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingOfferId === item.id ? 'Отправляем...' : 'Откликнуться'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
