import { CirclePlus, House, Menu, ReceiptText, Search, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

interface NavItem {
  to: string
  label: string
  icon: typeof House
  onlySeller?: boolean
  onlyBuyer?: boolean
  onlyAdmin?: boolean
}

const navItems: NavItem[] = [
  { to: '/feed', label: 'Главная', icon: House },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/create', label: 'Добавить', icon: CirclePlus, onlySeller: true },
  { to: '/admin', label: 'Админ', icon: ShieldCheck, onlyAdmin: true },
  { to: '/profile', label: 'Профиль', icon: UserRound },
]

export function Layout() {
  const role = useAuthStore((state) => state.role)
  const navigate = useNavigate()
  const [isTopMenuOpen, setIsTopMenuOpen] = useState(false)
  const [isFormInputFocused, setIsFormInputFocused] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const topMenuRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()

  useEffect(() => {
    setIsTopMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isSearchOpen) {
      return
    }

    searchInputRef.current?.focus()

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (location.pathname !== '/feed') {
      setSearchText('')
      return
    }

    const params = new URLSearchParams(location.search)
    setSearchText(params.get('q') ?? '')
  }, [location.pathname, location.search])

  const submitSearch = () => {
    const q = searchText.trim()
    const params = new URLSearchParams()

    if (q) {
      params.set('q', q)
    }

    params.set('openSearch', '1')
    navigate(`/feed?${params.toString()}`)
  }

  useEffect(() => {
    if (!isTopMenuOpen) {
      return
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) {
        return
      }

      if (!topMenuRef.current?.contains(target)) {
        setIsTopMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTopMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isTopMenuOpen])

  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      const tag = target.tagName.toLowerCase()
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable
      )
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (isEditableTarget(event.target)) {
        setIsFormInputFocused(true)
      }
    }

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement
        const stillEditing =
          active instanceof HTMLElement &&
          (active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            active.isContentEditable)
        setIsFormInputFocused(stillEditing)
      }, 0)
    }

    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  const visibleNavItems = navItems.filter((item) => {
    if (item.onlySeller && role !== 'SELLER') {
      return false
    }

    if (item.onlyBuyer && role !== 'BUYER') {
      return false
    }

    if (item.onlyAdmin && role !== 'ADMIN') {
      return false
    }

    return true
  })

  return (
    <div className="iteme-shell mx-auto flex min-h-dvh w-full max-w-6xl flex-col text-[#111]">
      <header className="iteme-topbar sticky top-0 z-30">
        <div className="iteme-topbar-side iteme-topbar-side-left iteme-topbar-meta text-[#171717]">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="iteme-topbar-btn"
            aria-label="Открыть поиск"
          >
            <Search size={13} />
            Поиск
          </button>
        </div>

        <div className="iteme-topbar-center">
          <NavLink to="/feed" className="iteme-brand" aria-label="Itemé">
            <span className="iteme-logo" aria-hidden>
              <span className="iteme-logo-core" />
            </span>
            <span className="iteme-wordmark-clip" aria-hidden>
              <span className="iteme-wordmark">Itemé</span>
            </span>
          </NavLink>
        </div>

        <div className="iteme-topbar-side iteme-topbar-side-right iteme-topbar-meta text-[#171717]">
          {role === 'SELLER' || role === 'BUYER' ? (
            <div ref={topMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsTopMenuOpen((prev) => !prev)}
                className="iteme-topbar-btn"
                aria-expanded={isTopMenuOpen}
                aria-haspopup="menu"
                aria-label="Меню"
              >
                <Menu size={14} />
                Меню
              </button>

              {isTopMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] rounded-sm border border-black/10 bg-white p-1.5 shadow-[0_14px_34px_-20px_rgba(0,0,0,0.55)]"
                >
                  <NavLink
                    to="/cart"
                    onClick={() => setIsTopMenuOpen(false)}
                    className="flex w-full cursor-pointer select-none items-center gap-2 rounded-sm border border-transparent px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#222] transition hover:border-black/10 hover:bg-[#f1f1f1]"
                  >
                    <ShoppingBag size={13} />
                    Корзина
                  </NavLink>
                  {role === 'SELLER' && (
                    <NavLink
                      to="/my-listings"
                      onClick={() => setIsTopMenuOpen(false)}
                      className="mt-1 flex w-full cursor-pointer select-none items-center gap-2 rounded-sm border border-transparent px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#222] transition hover:border-black/10 hover:bg-[#f1f1f1]"
                    >
                      <ReceiptText size={13} />
                      Мои объявления
                    </NavLink>
                  )}

                  <NavLink
                    to="/guarantors"
                    onClick={() => setIsTopMenuOpen(false)}
                    className="mt-1 flex w-full cursor-pointer select-none items-center gap-2 rounded-sm border border-transparent px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#222] transition hover:border-black/10 hover:bg-[#f1f1f1]"
                  >
                    <ShieldCheck size={13} />
                    Гаранты
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <NavLink to="/cart" className="iteme-topbar-btn" aria-label="Открыть корзину">
              <ShoppingBag size={13} />
              Корзина
              <span className="iteme-cart-badge">0</span>
            </NavLink>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4 sm:px-5 md:px-8 md:pb-10">
        <Outlet />
      </main>

      {isSearchOpen && (
        <div
          className="iteme-search-modal-overlay"
          onClick={() => setIsSearchOpen(false)}
          aria-hidden
        >
          <div
            className="iteme-search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Поиск объявлений"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="iteme-search-modal-head">
              <p className="iteme-search-modal-title">Поиск объявлений</p>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="iteme-search-modal-close"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <form
              className="iteme-search-modal-form"
              onSubmit={(event) => {
                event.preventDefault()
                submitSearch()
                setIsSearchOpen(false)
              }}
            >
              <input
                ref={searchInputRef}
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Например: джинсы"
                className="iteme-search-modal-input"
              />
              <button type="submit" className="iteme-search-modal-submit">
                Найти
              </button>
            </form>

            <p className="iteme-search-modal-hint">Поиск идет по названию, описанию и бренду.</p>
          </div>
        </div>
      )}

      <nav
        className={`fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-6xl border-t border-black/10 bg-[#efefef]/95 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:hidden ${
          isFormInputFocused ? 'hidden' : ''
        }`}
      >
        <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${visibleNavItems.length}, minmax(0, 1fr))` }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex h-14 w-full flex-col items-center justify-center rounded-xl border text-[11px] font-semibold tracking-wide transition duration-300 ${
                      isActive
                        ? 'border-black bg-black text-white shadow-[0_10px_24px_-18px_rgba(0,0,0,0.8)]'
                        : 'border-black/10 bg-white/75 text-[#686868] hover:border-black/20 hover:bg-white hover:text-black'
                    }`
                  }
                >
                  <Icon size={18} strokeWidth={2.15} className="transition duration-300 group-active:scale-95" />
                  <span className="mt-1">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
