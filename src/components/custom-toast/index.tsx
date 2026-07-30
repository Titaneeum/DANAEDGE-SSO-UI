'use client'

import * as React from 'react'

import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material'

import { notificationTypeColors, type NotificationType } from './notification-types'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const defaultTypeColors: Record<ToastType, string> = {
  success: '#166534',
  error: '#B91C1C',
  warning: '#A16207',
  info: '#1D4ED8'
}

const toastIconSx = {
  fontSize: 22,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff'
}

const getDefaultToastIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <i className='tabler-circle-check' style={toastIconSx as React.CSSProperties} />
    case 'error':
      return <i className='tabler-alert-circle' style={toastIconSx as React.CSSProperties} />
    case 'warning':
      return <i className='tabler-alert-triangle' style={toastIconSx as React.CSSProperties} />
    case 'info':
    default:
      return <i className='tabler-info-circle' style={toastIconSx as React.CSSProperties} />
  }
}

const getNotificationTypeIcon = (notificationType?: NotificationType) => {
  switch (notificationType) {
    case 'PAYOUT':
      return <i className='tabler-credit-card-pay' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION':
      return <i className='tabler-cash' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_RECEIVED':
      return <i className='tabler-check' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_PROCESSED':
      return <i className='tabler-arrows-exchange' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_USDT_PROCESSED':
      return <i className='tabler-currency-dollar' style={toastIconSx as React.CSSProperties} />

    case 'PAYOUT_PROCESSED':
      return <i className='tabler-circle-check' style={toastIconSx as React.CSSProperties} />

    case 'PAYOUT_USDT_PROCESSED':
      return <i className='tabler-wallet' style={toastIconSx as React.CSSProperties} />

    case 'POOL_BALANCE':
      return <i className='tabler-pig-money' style={toastIconSx as React.CSSProperties} />

    case 'ACCESS_TO_MERCHANT_PORTAL':
      return <i className='tabler-building-store' style={toastIconSx as React.CSSProperties} />

    case 'PAYOUT_IDR_PROCESSED':
      return <i className='tabler-credit-card-pay' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_IDR_PROCESSED':
      return <i className='tabler-arrows-exchange' style={toastIconSx as React.CSSProperties} />

    case 'PAYOUT_THB_PROCESSED':
      return <i className='tabler-credit-card-pay' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_THB_PROCESSED':
      return <i className='tabler-arrows-exchange' style={toastIconSx as React.CSSProperties} />

    case 'COLLECTION_BEP20_PROCESSED':
      return <i className='tabler-brand-binance' style={toastIconSx as React.CSSProperties} />

    case 'PAYOUT_BEP20_PROCESSED':
      return <i className='tabler-brand-binance' style={toastIconSx as React.CSSProperties} />

    default:
      return null
  }
}

const CustomToast = ({
  open,
  handleClose,
  title,
  message,
  type,
  notificationType,
  offset = 0,
  topOffset = 0,
  maxLines = 6
}: {
  open: boolean
  handleClose: () => void
  title?: string
  message: string
  type?: ToastType
  notificationType?: NotificationType
  offset?: number
  topOffset?: number
  maxLines?: number
}) => {
  const backgroundColor = notificationType
    ? notificationTypeColors[notificationType]
    : defaultTypeColors[type as ToastType]

  const leadingIcon = getNotificationTypeIcon(notificationType) ?? getDefaultToastIcon(type as ToastType)

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        '&.MuiSnackbar-root': {
          top: topOffset + offset * 86
        }
      }}
    >
      <Alert
        icon={false}
        onClose={undefined}
        variant='filled'
        sx={{
          width: 420,
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          backgroundColor,
          color: '#fff',
          p: 0,
          '& .MuiAlert-message': {
            padding: 0,
            width: '100%'
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 4
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              minWidth: 32,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.14)'
            }}
          >
            {leadingIcon}
          </Box>

          <Box
            sx={{
              minWidth: 0,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {title && (
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 14,
                  lineHeight: 1.25,
                  mb: 0.2,
                  color: '#ffffff'
                }}
              >
                {title}
              </Typography>
            )}

            <Typography
              sx={{
                fontSize: 12.5,
                lineHeight: 1.35,
                color: 'rgba(255,255,255,0.92)',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical'
              }}
            >
              {message}
            </Typography>
          </Box>

          <IconButton
            onClick={handleClose}
            size='small'
            sx={{
              ml: 0.5,
              color: '#ffffff',
              alignSelf: 'center',
              p: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.10)'
              }
            }}
          >
            <i className='tabler-x' />
          </IconButton>
        </Box>
      </Alert>
    </Snackbar>
  )
}

export default CustomToast
