import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { getMyPurchases, type OrderItem } from '../api/orders'
import { useAuthStore } from '../store/useAuthStore'

const getOrderTitle = (order: OrderItem) => order.listing?.title ?? order.listing?.name ?? `Лот #${order.listingId ?? '-'}`

const getOrderPrice = (order: OrderItem) => {
  if (typeof order.listing?.price !== 'number') {
    return null
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(order.listing.price)
}

export default function OrdersList() {
  const role = useAuthStore((state) => state.role)
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchOrders = async () => {
      if (role !== 'BUYER') {
        setOrders([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await getMyPurchases()
        if (!controller.signal.aborted) {
          setOrders(Array.isArray(response) ? response : [])
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить список заказов')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchOrders()

    return () => controller.abort()
  }, [role])

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Purchases</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Мои покупки</h1>
      </header>

      {role !== 'BUYER' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Эта страница доступна только покупателям.
        </div>
      )}

      {role === 'BUYER' && isLoading && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Загружаем покупки...
        </div>
      )}

      {role === 'BUYER' && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {role === 'BUYER' && !isLoading && !error && orders.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          У тебя пока нет покупок.
        </div>
      )}

      {role === 'BUYER' && !isLoading && !error && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order) => (
            <article key={order.id} className="rounded-sm border border-black/10 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">
                Заказ #{order.id}
              </p>
              <h2 className="mt-1 text-base font-semibold text-black">{getOrderTitle(order)}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#5f5f5f]">
                <span className="rounded-sm border border-black/10 bg-[#f8f8f8] px-2 py-1">
                  Статус: {order.status ?? 'pending'}
                </span>
                {getOrderPrice(order) && (
                  <span className="rounded-sm border border-black/10 bg-[#f8f8f8] px-2 py-1">
                    Сумма: {getOrderPrice(order)}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
