import { AxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addProductToCart, createBuyIntent } from '../api/products'
import { BuySafetyModal } from './BuySafetyModal'
import { resolveMediaUrl } from '../lib/media'
import { openTelegramChat } from '../lib/telegram'
import { useAuthStore } from '../store/useAuthStore'
import type { Listing } from '../types/listing'

interface ProductCardProps {
  listing: Listing
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(price)

export function ProductCard({ listing }: ProductCardProps) {
  const navigate = useNavigate()
  const role = useAuthStore((state) => state.role)
  const userId = useAuthStore((state) => state.user?.id)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [isInCart, setIsInCart] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)
  const preview = resolveMediaUrl(listing.photos?.[0] ?? listing.images?.[0] ?? listing.imageUrl)
  const size = listing.size?.trim() || ''
  const isOwnListing = Boolean(userId && listing.sellerId && String(userId) === String(listing.sellerId))
  const actionButtonClass =
    'inline-flex h-10 w-full items-center justify-center rounded-lg border border-black/15 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#efefef]'

  const openDetails = () => {
    navigate(`/listing/${listing.id}`)
  }

  const handleBuy = () => {
    if (!isAuthenticated) {
      setChatError('Чтобы купить товар, сначала авторизуйтесь через Telegram')
      return
    }

    if (role !== 'BUYER') {
      setChatError('Для покупки переключитесь в роль BUYER в профиле')
      return
    }

    if (isOwnListing) {
      setChatError('Нельзя купить собственное объявление')
      return
    }

    if (listing.quantity === 0) {
      setChatError('Товар распродан и недоступен для покупки')
      return
    }

    setChatError(null)
    setIsWarningOpen(true)
  }

  const handleAddToCart = async () => {
    if (isAddingToCart || isInCart) {
      if (isInCart) {
        setCartMessage('Товар уже в корзине')
      }
      return
    }

    if (!isAuthenticated) {
      setCartMessage('Чтобы добавить товар в корзину, авторизуйтесь через Telegram')
      return
    }

    if (role !== 'BUYER') {
      setCartMessage('Чтобы добавить товар в корзину, переключитесь в роль BUYER')
      return
    }

    if (isOwnListing) {
      setCartMessage('Нельзя добавить в корзину собственный товар')
      return
    }

    if (listing.quantity === 0) {
      setCartMessage('Товар распродан и не может быть добавлен в корзину')
      return
    }

    try {
      setIsAddingToCart(true)
      setCartMessage(null)
      await addProductToCart(String(listing.id))
      setIsInCart(true)
      setCartMessage('Товар добавлен в корзину')
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setCartMessage(axiosError.response?.data?.message ?? 'Не удалось добавить товар в корзину')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleConfirmBuy = async () => {
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)
      const data = await createBuyIntent(String(listing.id))

      if (!data.hasContact || !data.chatUrl) {
        setChatError('У продавца не указан контакт для связи')
        return
      }

      setIsWarningOpen(false)
      openTelegramChat(data.chatUrl)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      const message =
        axiosError.response?.data?.message ?? 'Не удалось перейти к продавцу'
      setChatError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article
      className="group touch-manipulation cursor-pointer overflow-hidden rounded-[4px] border border-black/10 bg-[#f7f6f2] transition duration-200 hover:-translate-y-0.5 hover:border-black/25 active:scale-[0.99]"
      role="button"
      tabIndex={0}
      onClick={openDetails}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openDetails()
        }
      }}
      aria-label={`Открыть объявление ${listing.title}`}
    >
      <div className="relative h-40 w-full overflow-hidden bg-[#dbdbdb] sm:h-48">
        {preview ? (
          <img
            src={preview}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#dbdbdb] text-sm text-[#696969]">
            Нет фото
          </div>
        )}
        {size && (
          <div className="absolute bottom-2 right-2 rounded-sm bg-black/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-white">
            {size}
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        <p className="text-lg font-bold leading-none tracking-tight text-black">{formatPrice(listing.price)}</p>

        <div className="mt-2 space-y-2 rounded-xl border border-black/10 bg-white/70 p-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleBuy()
            }}
            disabled={isLoading}
            className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            Купить
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              void handleAddToCart()
            }}
            disabled={isAddingToCart || isInCart}
            className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isAddingToCart ? 'Добавляем...' : isInCart ? 'Уже в корзине' : 'Добавить в корзину'}
          </button>
        </div>

        {chatError && <p className="text-[11px] text-rose-700">{chatError}</p>}
        {cartMessage && <p className="text-[11px] text-[#666]">{cartMessage}</p>}
      </div>

      <BuySafetyModal
        isOpen={isWarningOpen}
        isSubmitting={isLoading}
        listingTitle={listing.title}
        error={chatError}
        onConfirm={() => void handleConfirmBuy()}
        onClose={() => {
          setIsWarningOpen(false)
        }}
      />
    </article>
  )
}
