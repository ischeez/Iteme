import { AxiosError } from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { buySubscription, getMySubscription, type SubscriptionDto } from '../api/subscriptions'
import { api } from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'
import type { AuthUser } from '../types/auth'

interface MeResponse {
  user?: AuthUser
  data?: {
    user?: AuthUser
  }
}

export function useAccessControl() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isVerified = useAuthStore((state) => Boolean(state.user?.isVerified))
  const updateUser = useAuthStore((state) => state.updateUser)
  const [subscription, setSubscription] = useState<SubscriptionDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null)
      setError(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const [subscriptionResult, profileResult] = await Promise.allSettled([
        getMySubscription(),
        api.get<MeResponse>('/auth/me'),
      ])

      if (subscriptionResult.status === 'fulfilled') {
        setSubscription(subscriptionResult.value)
      } else {
        const axiosError = subscriptionResult.reason as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось проверить подписку')
        setSubscription(null)
      }

      if (profileResult.status === 'fulfilled') {
        const payloadUser = profileResult.value.data.user ?? profileResult.value.data.data?.user
        if (payloadUser) {
          updateUser(payloadUser)
        }
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось проверить подписку')
      setSubscription(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, updateUser])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const handleFocus = () => {
      void refresh()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, refresh])

  const activateSubscription = useCallback(async () => {
    const data = await buySubscription()
    setSubscription(data)
    return data
  }, [])

  const hasActiveSubscription =
    Boolean(subscription?.isActive) &&
    Boolean(subscription?.expiresAt) &&
    (subscription?.expiresAt ? new Date(subscription.expiresAt) > new Date() : false)

  const hasListingAccess = hasActiveSubscription || isVerified

  return {
    subscription,
    hasActiveSubscription,
    hasListingAccess,
    isVerified,
    isLoading,
    error,
    refresh,
    activateSubscription,
  }
}
