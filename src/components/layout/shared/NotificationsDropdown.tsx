'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'

import { useRouter } from 'next/navigation'

import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import type { Theme } from '@mui/material/styles'

import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { Button } from '@mui/material'

import themeConfig from '@configs/themeConfig'
import { useSettings } from '@core/hooks/useSettings'

dayjs.extend(relativeTime)

export type ApiNotification = {
  type: string
  currency: string
  title: string
  message: string
  order_id: string
  amount: string
  status: 'read' | 'unread'
  id: string
  created_at: string
}

type Props = {
  notifications: ApiNotification[]
  onMarkRead?: (id: string) => void
  onDelete?: (id: string) => void
  onMarkAllRead?: (ids: string[]) => void
}

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) return <div className='overflow-x-hidden bs-full'>{children}</div>

  return (
    <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
      {children}
    </PerfectScrollbar>
  )
}

const getTypeColor = (type: string): 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error' => {
  switch (type) {
    case 'COLLECTION_PROCESSED':
      return 'success'
    case 'POOL_BALANCE':
      return 'info'
    case 'PAYOUT_PROCESSED':
      return 'success'
    case 'PAYOUT_FAILED':
      return 'error'
    default:
      return 'default'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'POOL_BALANCE':
      return 'tabler-wallet'
    case 'COLLECTION_PROCESSED':
      return 'tabler-receipt'
    case 'PAYOUT_PROCESSED':
      return 'tabler-send'
    case 'PAYOUT_FAILED':
      return 'tabler-alert-triangle'
    default:
      return 'tabler-bell'
  }
}

const formatFromNow = (iso: string) => {
  const d = dayjs(iso)

  if (!d.isValid()) return iso

  return d.fromNow()
}

const formatAmount = (currency: string, amount: string) => {
  const num = Number(amount)

  if (!amount || Number.isNaN(num)) return null

  return `${currency} ${num.toFixed(2)}`
}

const NotificationDropdown = ({ notifications, onMarkRead, onDelete, onMarkAllRead }: Props) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notificationsState, setNotificationsState] = useState<ApiNotification[]>(notifications ?? [])

  const anchorRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  useEffect(() => {
    setNotificationsState(notifications ?? [])
  }, [notifications])

  const unreadCount = useMemo(() => notificationsState.filter(n => n.status === 'unread').length, [notificationsState])

  const handleClose = () => setOpen(false)
  const handleToggle = () => setOpen(prev => !prev)

  const handleMarkRead = (event: MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation()
    const current = notificationsState.find(n => n.id === id)

    if (!current) return
    if (current.status === 'read') return

    setNotificationsState(prev => prev.map(n => (n.id === id ? { ...n, status: 'read' } : n)))
    onMarkRead?.(id)
  }

  const handleRemove = (event: MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation()
    setNotificationsState(prev => prev.filter(n => n.id !== id))
    onDelete?.(id)
  }

  const handleMarkAllRead = () => {
    const unreadIds = notificationsState.filter(n => n.status === 'unread').map(n => n.id)

    if (unreadIds.length === 0) return

    setNotificationsState(prev => prev.map(n => ({ ...n, status: 'read' })))

    if (onMarkAllRead) return onMarkAllRead(unreadIds)
    if (onMarkRead) unreadIds.forEach(id => onMarkRead(id))
  }

  const handleOpenNotification = (n: ApiNotification) => {
    if (n.status === 'unread') {
      setNotificationsState(prev => prev.map(x => (x.id === n.id ? { ...x, status: 'read' } : x)))
      onMarkRead?.(n.id)
    }
  }

  useEffect(() => {
    const adjustPopoverHeight = () => {
      if (!ref.current) return
      const availableHeight = window.innerHeight - 100

      ref.current.style.height = `${Math.min(availableHeight, 580)}px`
    }

    adjustPopoverHeight()
    window.addEventListener('resize', adjustPopoverHeight)

    return () => window.removeEventListener('resize', adjustPopoverHeight)
  }, [])

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <Badge
          color='error'
          className='cursor-pointer'
          variant='dot'
          overlap='circular'
          invisible={unreadCount === 0}
          sx={{
            '& .MuiBadge-dot': { top: 6, right: 5, boxShadow: 'var(--mui-palette-background-paper) 0px 0px 0px 2px' }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <i className='tabler-bell' />
        </Badge>
      </IconButton>

      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        ref={ref}
        anchorEl={anchorRef.current}
        {...(isSmallScreen
          ? {
              className: 'is-full !mbs-3 z-[1] max-bs-[580px] bs-[580px]',
              modifiers: [{ name: 'preventOverflow', options: { padding: themeConfig.layoutPadding } }]
            }
          : { className: 'is-[32rem] !mbs-3 z-[1] max-bs-[580px] bs-[580px]' })}
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper
              className={classnames(
                'bs-full overflow-hidden',
                settings.skin === 'bordered' ? 'border shadow-none' : ''
              )}
              sx={{
                borderRadius: 3,
                boxShadow: settings.skin === 'bordered' ? 'none' : '0 14px 50px rgba(0,0,0,.22)',
                backgroundColor: 'var(--mui-palette-background-paper)'
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <div className='bs-full flex flex-col'>
                  {/* Header (sticky + nicer) */}
                  <div
                    className='pli-4 plb-3.5 is-full'
                    style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      backdropFilter: 'blur(10px)',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)'
                    }}
                  >
                    <div className='flex items-center justify-between gap-3'>
                      <Stack spacing={0} className='flex-auto'>
                        <Typography variant='h6'>Notifications</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {unreadCount > 0 ? 'New activity needs your attention' : 'You’re all caught up'}
                        </Typography>
                      </Stack>

                      {unreadCount > 0 && (
                        <Chip
                          size='small'
                          variant='tonal'
                          color='primary'
                          label={`${unreadCount} Unread`}
                          sx={{ fontWeight: 700 }}
                        />
                      )}

                      <Tooltip
                        title={unreadCount > 0 ? 'Mark all as read' : 'Nothing to mark'}
                        placement={placement === 'bottom-end' ? 'left' : 'right'}
                      >
                        <span>
                          <IconButton
                            size='small'
                            onClick={handleMarkAllRead}
                            className='text-textPrimary'
                            disabled={unreadCount === 0}
                            sx={{
                              borderRadius: 2,
                              backgroundColor: 'rgba(255,255,255,0.04)',
                              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                            }}
                          >
                            <i className='tabler-checks' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </div>

                  <Divider />

                  {/* Body */}
                  <ScrollWrapper hidden={hidden}>
                    {notificationsState.length === 0 ? (
                      <Box className='p-8 text-center'>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            margin: '0 auto',
                            display: 'grid',
                            placeItems: 'center',
                            background: 'rgba(255,255,255,0.06)'
                          }}
                        >
                          <i className='tabler-bell-off text-2xl text-textDisabled' />
                        </div>
                        <Typography className='mt-3' variant='body2' color='text.secondary'>
                          No notifications
                        </Typography>
                      </Box>
                    ) : (
                      <div className='p-3'>
                        {notificationsState.map((n, index) => {
                          const isUnread = n.status === 'unread'
                          const amountText = formatAmount(n.currency, n.amount)
                          const typeColor = getTypeColor(n.type)
                          const typeIcon = getTypeIcon(n.type)

                          return (
                            <div
                              key={n.id}
                              onClick={() => handleOpenNotification(n)}
                              className='group cursor-pointer'
                              style={{ marginBottom: index === notificationsState.length - 1 ? 0 : 10 }}
                            >
                              <div
                                className='flex gap-3 p-3'
                                style={{
                                  borderRadius: 16,
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  background: isUnread
                                    ? 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)'
                                    : 'rgba(255,255,255,0.03)',
                                  transition: 'all .18s ease'
                                }}
                              >
                                {/* Left icon "badge" */}
                                <div className='pt-0.5'>
                                  <div
                                    style={{
                                      width: 38,
                                      height: 38,
                                      borderRadius: 14,
                                      display: 'grid',
                                      placeItems: 'center',
                                      background: 'rgba(255,255,255,0.06)',
                                      border: isUnread ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent'
                                    }}
                                  >
                                    <i className={typeIcon} />
                                  </div>
                                </div>

                                {/* Main content */}
                                <div className='flex flex-col flex-auto min-w-0'>
                                  <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                      <Typography
                                        variant='body2'
                                        className='font-semibold'
                                        color={isUnread ? 'text.primary' : 'text.secondary'}
                                        sx={{
                                          whiteSpace: 'normal',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2, // ✅ max 2 lines
                                          WebkitBoxOrient: 'vertical',
                                          lineHeight: 1.25
                                        }}
                                      >
                                        {n.title}
                                      </Typography>
                                    </div>

                                    <Tooltip title={dayjs(n.created_at).format('MMM D, YYYY h:mm A')}>
                                      <Typography
                                        variant='caption'
                                        color='text.disabled'
                                        className='shrink-0'
                                        sx={{ whiteSpace: 'nowrap' }}
                                      >
                                        {formatFromNow(n.created_at)}
                                      </Typography>
                                    </Tooltip>
                                  </div>

                                  <Typography
                                    variant='caption'
                                    color='text.secondary'
                                    className='mt-1 line-clamp-2'
                                    sx={{ opacity: isUnread ? 1 : 0.85 }}
                                  >
                                    {n.message}
                                  </Typography>

                                  {/* Pills row */}
                                  <div className='flex items-center gap-2 flex-wrap mt-2'>
                                    <Chip
                                      size='small'
                                      variant='outlined'
                                      color={typeColor}
                                      label={n.type}
                                      sx={{ height: 24, fontWeight: 700 }}
                                    />

                                    {amountText && (
                                      <Chip
                                        size='small'
                                        variant='tonal'
                                        color='primary'
                                        label={amountText}
                                        sx={{ height: 24, fontWeight: 700 }}
                                      />
                                    )}

                                    {n.order_id && (
                                      <Chip
                                        size='small'
                                        variant='tonal'
                                        color='default'
                                        label={`Order: ${n.order_id}`}
                                        sx={{
                                          height: 24,
                                          maxWidth: '100%',
                                          '& .MuiChip-label': {
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }
                                        }}
                                      />
                                    )}

                                    {/* subtle unread tag */}
                                    {isUnread && (
                                      <Chip
                                        size='small'
                                        variant='tonal'
                                        color='warning'
                                        label='Unread'
                                        sx={{ height: 24, fontWeight: 700 }}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* Actions (show only on hover, tighter + more premium) */}
                                <div className='flex flex-col items-end justify-between'>
                                  {/* Unread indicator */}
                                  <span
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: 999,
                                      marginTop: 6,
                                      background: isUnread ? 'var(--mui-palette-error-main)' : 'transparent'
                                    }}
                                  />

                                  <div className='flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                    <Tooltip title={isUnread ? 'Mark as read' : 'Already read'}>
                                      <span>
                                        <IconButton
                                          size='small'
                                          onClick={e => handleMarkRead(e, n.id)}
                                          disabled={!isUnread}
                                          sx={{
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(255,255,255,0.04)',
                                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                                          }}
                                        >
                                          <i className='tabler-circle-check' />
                                        </IconButton>
                                      </span>
                                    </Tooltip>

                                    <Tooltip title='Delete'>
                                      <IconButton
                                        size='small'
                                        onClick={e => handleRemove(e, n.id)}
                                        sx={{
                                          borderRadius: 2,
                                          backgroundColor: 'rgba(255,255,255,0.04)',
                                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                                        }}
                                      >
                                        <i className='tabler-trash' />
                                      </IconButton>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollWrapper>
                  <Divider className='my-4' />
                  <div className='p-2'>
                    <Button onClick={() => router.push('/admin/dashboard/notifications')} variant='contained' fullWidth>
                      View All
                    </Button>
                  </div>
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationDropdown
