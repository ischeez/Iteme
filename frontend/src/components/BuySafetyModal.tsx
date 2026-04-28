import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

interface BuySafetyModalProps {
  isOpen: boolean
  isSubmitting: boolean
  listingTitle?: string
  error?: string | null
  onConfirm: () => void
  onClose: () => void
}

export function BuySafetyModal({
  isOpen,
  isSubmitting,
  listingTitle,
  error,
  onConfirm,
  onClose,
}: BuySafetyModalProps) {
  const navigate = useNavigate()

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  const openGuarantors = () => {
    onClose()
    navigate('/guarantors')
  }

  const modal = (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-[#101010]/85 backdrop-blur-sm" onClick={(event) => event.stopPropagation()}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <section className="relative w-full max-w-xl rounded-3xl border border-black/10 bg-[#f4f2eb] p-5 text-black shadow-[0_32px_90px_-40px_rgba(0,0,0,0.7)] md:p-7" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/20 bg-white text-xl leading-none text-black transition hover:bg-black hover:text-white"
            aria-label="Закрыть предупреждение"
          >
            ×
          </button>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6f6f6f]">Перед покупкой</p>
          <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-tight text-black md:text-[32px]">
            Все сделки на площадке проходят через гаранта.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#4e4e4e]">
            Перед переходом в чат ознакомьтесь с разделом{' '}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                openGuarantors()
              }}
              className="rounded-md bg-[#fff4cd] px-2 py-0.5 font-semibold text-[#5a4300] underline decoration-[#5a4300] decoration-2 underline-offset-4"
            >
              Мои гаранты
            </button>
            .
          </p>

          {listingTitle && (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm text-[#3f3f3f]">
              Покупка по объявлению: <span className="font-semibold text-black">{listingTitle}</span>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-relaxed text-[#2f2f2f]">
            Нажимая кнопку ниже, вы подтверждаете, что прочитали предупреждение о безопасной сделке через гаранта.
          </div>

          {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                openGuarantors()
              }}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-black/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#ececec]"
            >
              Мои гаранты
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-black/20 bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black transition hover:bg-[#ececec]"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-black bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#1c1c1c] disabled:cursor-not-allowed disabled:bg-[#7b7b7b]"
            >
              {isSubmitting ? 'Открываем чат...' : 'Я прочитал'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
