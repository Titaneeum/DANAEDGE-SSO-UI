'use client'

import * as React from 'react'

import { useForm } from '@mantine/form'

import NotificationDropdown from './layout/shared/NotificationsDropdown'
import type { ApiNotification } from './layout/shared/NotificationsDropdown'
import CustomToast from './custom-toast'
import type { NotificationType } from './custom-toast/notification-types'

const POLL_MS = 15000
const TOAST_MS = 6000

const MOCK_NOTIFICATIONS: ApiNotification[] = [
  {
    id: 'mock-welcome',
    type: 'ACCESS_TO_MERCHANT_PORTAL',
    currency: '',
    title: 'Welcome to Danaedge SSO',
    message: 'Your notification centre is ready for the upcoming API integration.',
    order_id: '',
    amount: '',
    status: 'unread',
    created_at: new Date().toISOString()
  },
  {
    id: 'mock-security',
    type: 'POOL_BALANCE',
    currency: '',
    title: 'Security notice',
    message: 'Notification actions are currently running with local mock data.',
    order_id: '',
    amount: '',
    status: 'read',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
]

type MockMutationOptions<T> = {
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
}

type ToastItem = {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  notificationType?: NotificationType
}

const toastTypeFromNotif = (n: ApiNotification): ToastItem['type'] => {
  switch (n.type) {
    case 'POOL_BALANCE':
    case 'ACCESS_TO_MERCHANT_PORTAL':
      return 'info'

    default:
      return 'info'
  }
}

const CustomNotifications = () => {
  const [notificationsData, setNotificationsData] = React.useState<ApiNotification[]>([])
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const mockNotificationsRef = React.useRef<ApiNotification[]>(MOCK_NOTIFICATIONS)

  const AdminNotificationList = React.useCallback(
    (_variables: unknown, options?: MockMutationOptions<{ data: { data: ApiNotification[] } }>) => {
      options?.onSuccess?.({ data: { data: [...mockNotificationsRef.current] } })
    },
    []
  )

  const MarkNotificationAsRead = React.useCallback(
    (
      { dashboardNotificationId }: { dashboardNotificationId: string },
      options?: MockMutationOptions<{ ok: true }>
    ) => {
      mockNotificationsRef.current = mockNotificationsRef.current.map(notification =>
        notification.id === dashboardNotificationId ? { ...notification, status: 'read' } : notification
      )
      setNotificationsData([...mockNotificationsRef.current])
      options?.onSuccess?.({ ok: true })
    },
    []
  )

  const DeleteNotification = React.useCallback(
    (
      { dashboardNotificationId }: { dashboardNotificationId: string },
      options?: MockMutationOptions<{ ok: true }>
    ) => {
      mockNotificationsRef.current = mockNotificationsRef.current.filter(
        notification => notification.id !== dashboardNotificationId
      )
      setNotificationsData([...mockNotificationsRef.current])
      options?.onSuccess?.({ ok: true })
    },
    []
  )

  const form = useForm({
    initialValues: [
      { filter_column: 'date_of_record', filter_start: null as Date | null, filter_end: null as Date | null },
      { filter_column: 'log_tag', filter_value: '' }
    ]
  })

  const knownIdsRef = React.useRef<Set<string>>(new Set())
  const didInitRef = React.useRef(false)
  const pollingRef = React.useRef<number | null>(null)

  const pushToast = React.useCallback((n: ApiNotification) => {
    const item: ToastItem = {
      id: n.id,
      title: n.title,
      message: n.message,
      type: toastTypeFromNotif(n),
      notificationType: n.type as NotificationType
    }

    setToasts(prev => {
      if (prev.some(t => t.id === item.id)) return prev

      return [item, ...prev].slice(0, 4)
    })

    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== item.id))
    }, TOAST_MS)
  }, [])

  const mergeAndDetectNew = React.useCallback(
    (incoming: ApiNotification[]) => {
      if (!didInitRef.current) {
        didInitRef.current = true
        knownIdsRef.current = new Set(incoming.map(n => n.id))
        setNotificationsData(incoming)

        return
      }

      const known = knownIdsRef.current

      const newOnes = incoming
        .filter(n => !known.has(n.id) && n.status === 'unread')
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

      incoming.forEach(n => known.add(n.id))

      setNotificationsData(incoming)

      newOnes.forEach(pushToast)
    },
    [pushToast]
  )

  const fetchList = React.useCallback(() => {
    const filters = JSON.stringify(form.values)

    AdminNotificationList(
      { start: 0, length: 5, filter_array_objects: filters },
      {
        onSuccess: e => {
          const list = (e?.data?.data ?? []) as ApiNotification[]

          mergeAndDetectNew(list)
        },
        onError: (e: any) => console.error(e)
      }
    )
  }, [AdminNotificationList, form.values, mergeAndDetectNew])

  React.useEffect(() => {
    fetchList()
  }, [fetchList])

  React.useEffect(() => {
    const start = () => {
      if (pollingRef.current) return
      pollingRef.current = window.setInterval(() => {
        if (document.visibilityState === 'visible') fetchList()
      }, POLL_MS)
    }

    const stop = () => {
      if (!pollingRef.current) return
      window.clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    start()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchList()
        start()
      } else {
        stop()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchList])

  const handleDeleteNotification = React.useCallback(
    (notificationId: string) => {
      DeleteNotification(
        { dashboardNotificationId: notificationId },
        {
          onSuccess: () => {},
          onError: (e: any) => console.error(e)
        }
      )
    },
    [DeleteNotification]
  )

  const handleMarkNotificationAsRead = React.useCallback(
    (notificationId: string) => {
      MarkNotificationAsRead(
        { dashboardNotificationId: notificationId },
        {
          onSuccess: () => {},
          onError: (e: any) => console.error(e)
        }
      )
    },
    [MarkNotificationAsRead]
  )

  const handleMarkAllAsRead = React.useCallback(
    (ids: string[]) => {
      ids.forEach(id => handleMarkNotificationAsRead(id))
    },
    [handleMarkNotificationAsRead]
  )

  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <>
      {toasts.map((t, index) => (
        <CustomToast
          key={t.id}
          open={true}
          handleClose={() => closeToast(t.id)}
          title={t.title}
          message={t.message}
          type={t.type}
          notificationType={t.notificationType}
          offset={index}
          topOffset={68}
        />
      ))}

      <NotificationDropdown
        notifications={notificationsData ?? []}
        onDelete={handleDeleteNotification}
        onMarkRead={handleMarkNotificationAsRead}
        onMarkAllRead={handleMarkAllAsRead}
      />
    </>
  )
}

export default CustomNotifications
