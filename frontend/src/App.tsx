import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { api } from './lib/api'
import { Layout } from './layout/Layout'
import AdminDashboard from './pages/AdminDashboard'
import AdminVerificationPanel from './pages/AdminVerificationPanel'
import Cart from './pages/Cart'
import CreateListing from './pages/CreateListing'
import Feed from './pages/Feed'
import Guarantors from './pages/Guarantors'
import ListingDetails from './pages/ListingDetails'
import MyListings from './pages/MyListings'
import NotFound from './pages/NotFound'
import Orders from './pages/Orders'
import OrdersList from './pages/OrdersList'
import Profile from './pages/Profile'
import Requests from './pages/Requests'
import SalesList from './pages/SalesList'
import SellerStore from './pages/SellerStore'
import VerificationCenter from './pages/VerificationCenter'
import { useAuthStore } from './store/useAuthStore'
import type { AuthPayload, AuthUser, UserRole } from './types/auth'

interface TelegramLoginResponse {
  access_token?: string
  token?: string
  role?: UserRole
  user?: (AuthUser & { role?: UserRole })
}

interface TelegramInitUser {
  id: number | string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

const getHashInitData = (): string | null => {
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  const hashParams = new URLSearchParams(hash)
  return hashParams.get('tgWebAppData')
}

const getTelegramInitData = (): { value: string | null; source: 'webapp' | 'hash' | 'none' } => {
  const webAppInitData = window.Telegram?.WebApp?.initData
  if (webAppInitData) {
    return { value: webAppInitData, source: 'webapp' }
  }

  const hashInitData = getHashInitData()
  if (hashInitData) {
    return { value: hashInitData, source: 'hash' }
  }

  return { value: null, source: 'none' }
}

const getTelegramUserFromInitData = (initData: string): AuthUser | null => {
  try {
    const params = new URLSearchParams(initData)
    const userRaw = params.get('user')
    if (!userRaw) {
      return null
    }

    const parsed = JSON.parse(userRaw) as TelegramInitUser
    if (!parsed?.id) {
      return null
    }

    return {
      id: parsed.id,
      username: parsed.username,
      firstName: parsed.first_name,
      lastName: parsed.last_name,
      avatarUrl: parsed.photo_url,
    }
  } catch {
    return null
  }
}

function App() {
  const setAuth = useAuthStore((state) => state.setAuth)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [isBootLoading, setIsBootLoading] = useState(true)
  const [typedText, setTypedText] = useState('')
  const [isTypingDone, setIsTypingDone] = useState(false)
  const telegramAuthAttemptedRef = useRef(false)

  useEffect(() => {
    const authFromTelegram = async () => {
      const initDataInfo = getTelegramInitData()
      const initData = initDataInfo.value

      // Outside Telegram we allow local mode and keep persisted auth state.
      if (!initData) {
        setIsBootLoading(false)
        return
      }

      const telegramUser = getTelegramUserFromInitData(initData)
      if (telegramUser) {
        updateUser(telegramUser)
      }

      // Avoid duplicate login calls in React StrictMode/dev re-renders.
      if (telegramAuthAttemptedRef.current) {
        setIsBootLoading(false)
        return
      }

      telegramAuthAttemptedRef.current = true

      try {
        const response = await api.post<TelegramLoginResponse>('/auth/telegram/login', {
          initData,
        })

        const payloadToken = response.data.access_token ?? response.data.token
        const payloadUser = response.data.user
        const payloadRole = response.data.role ?? response.data.user?.role

        if (!payloadToken || !payloadUser || !payloadRole) {
          throw new Error('Некорректный ответ авторизации')
        }

        setAuth({
          token: payloadToken,
          user: payloadUser,
          role: payloadRole,
        } as AuthPayload)
      } catch (err) {
        void err
        // Keep Telegram user info visible in profile even when JWT login fails.
        if (telegramUser) {
          updateUser(telegramUser)
        }
      } finally {
        setIsBootLoading(false)
      }
    }

    void authFromTelegram()
  }, [setAuth, updateUser])

  useEffect(() => {
    const splashText = 'hi, russian resell'
    let pointer = 0

    const timerId = window.setInterval(() => {
      pointer += 1
      setTypedText(splashText.slice(0, pointer))

      if (pointer >= splashText.length) {
        window.clearInterval(timerId)
        setIsTypingDone(true)
      }
    }, 55)

    return () => window.clearInterval(timerId)
  }, [])

  if (isBootLoading || !isTypingDone) {
    return (
      <div className="iteme-splash">
        <p className="iteme-splash-text">
          {typedText}
          <span className="iteme-cursor" aria-hidden>
            |
          </span>
        </p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/seller/:id" element={<SellerStore />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/guarantors" element={<Guarantors />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/create" element={<CreateListing />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/verification" element={<AdminVerificationPanel />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/purchases" element={<OrdersList />} />
          <Route path="/sales" element={<SalesList />} />
          <Route path="/verification" element={<VerificationCenter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
