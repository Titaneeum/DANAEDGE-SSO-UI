'use client'

import * as React from 'react'

import {
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'

import { useForm } from '@mantine/form'

import { useData } from '../../../useData'
import type { ToastItem } from '@/libs/types'
import CustomToast from '@/components/custom-toast'
import CustomTable from '@/components/CustomTable'
import JSONDialog from '@/components/JsonDialog'

type RoutePermissionRow = {
  as: string
  enableRoutePermission: number
  methods: string[]
  permissions: unknown[]
  type: string
  uri: string
}

const methodColor = (method: string): 'default' | 'primary' | 'success' | 'warning' | 'info' | 'error' => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'success'
    case 'POST':
      return 'primary'
    case 'PUT':
      return 'warning'
    case 'PATCH':
      return 'info'
    case 'DELETE':
      return 'error'
    default:
      return 'default'
  }
}

const RoutePermissionListPage = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [tableData, setTableData] = React.useState<RoutePermissionRow[]>([])
  const [actionAnchor, setActionAnchor] = React.useState<HTMLElement | null>(null)
  const [selectedRoute, setSelectedRoute] = React.useState<RoutePermissionRow | null>(null)
  const [jsonDialog, setJsonDialog] = React.useState(false)
  const [jsonStringView, setJsonStringView] = React.useState('')

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const handleCloseToast = (id: number) => {
    setToasts(previous => previous.filter(toast => toast.id !== id))
  }

  const { mutate: RoutePermissionList, isPending: isRoutePermissionListPending } = useData().set.routePermission.list

  const form = useForm({
    initialValues: {
      sso_client_identifier: 'MFS_DEFAULT'
    }
  })

  const column = React.useMemo<ColumnDef<RoutePermissionRow, any>[]>(
    () => [
      {
        accessorKey: 'as',
        header: 'Route',
        cell: ({ row }) => {
          const routeName = row.original.as || 'Unnamed route'
          const routeUri = `/${row.original.uri.replace(/^\/+/, '')}`

          return (
            <div className='flex min-is-0 max-is-[180px] flex-col gap-1 sm:max-is-[280px] lg:max-is-[360px]'>
              <Tooltip title={routeName} placement='top-start'>
                <Typography className='block truncate font-medium' color='text.primary'>
                  {routeName}
                </Typography>
              </Tooltip>
              <Tooltip title={routeUri} placement='bottom-start'>
                <Typography variant='caption' color='text.secondary' className='block truncate font-mono'>
                  {routeUri}
                </Typography>
              </Tooltip>
            </div>
          )
        }
      },
      {
        accessorKey: 'methods',
        header: 'Methods',
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {row.original.methods.length ? (
              row.original.methods.map(method => (
                <Chip
                  key={method}
                  size='small'
                  variant='tonal'
                  color={methodColor(method)}
                  label={method.toUpperCase()}
                />
              ))
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Any
              </Typography>
            )}
          </div>
        )
      },
      {
        accessorKey: 'type',
        header: 'Access Type',
        cell: ({ row }) => {
          const isAuthenticated = row.original.type.toUpperCase() === 'AUTHENTICATED'

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isAuthenticated ? 'info' : 'default'}
              icon={<i className={isAuthenticated ? 'tabler-lock' : 'tabler-world'} />}
              label={row.original.type.replaceAll('_', ' ') || 'Unknown'}
              className='capitalize'
            />
          )
        }
      },
      {
        accessorKey: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => {
          const permissions = row.original.permissions

          return permissions.length ? (
            <Tooltip title={JSON.stringify(permissions, null, 2)}>
              <Chip
                size='small'
                variant='outlined'
                color='primary'
                icon={<i className='tabler-shield-check' />}
                label={`${permissions.length} assigned`}
              />
            </Tooltip>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No permissions
            </Typography>
          )
        }
      },
      {
        accessorKey: 'enableRoutePermission',
        header: 'Status',
        cell: ({ row }) => {
          const isEnabled = row.original.enableRoutePermission === 1

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isEnabled ? 'success' : 'error'}
              icon={<i className={isEnabled ? 'tabler-circle-check' : 'tabler-circle-x'} />}
              label={isEnabled ? 'Enabled' : 'Disabled'}
            />
          )
        }
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Tooltip title='More actions'>
            <IconButton
              size='small'
              aria-label={`Open actions for ${row.original.as}`}
              aria-haspopup='menu'
              onClick={event => {
                setSelectedRoute(row.original)
                setActionAnchor(event.currentTarget)
              }}
              className='rounded-lg'
            >
              <i className='tabler-dots text-xl' />
            </IconButton>
          </Tooltip>
        )
      }
    ],
    []
  )

  const handleSubmit = (values: any) => {
    RoutePermissionList(values.sso_client_identifier, {
      onSuccess: data => {
        setTableData(data ?? [])
      },
      onError: () => {
        pushToast('error', 'Failed to fetch route permission list')
      }
    })
  }

  React.useEffect(() => {
    handleSubmit(form.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCloseActionMenu = () => {
    setActionAnchor(null)
  }

  const handleViewJson = () => {
    if (!selectedRoute) return

    setJsonStringView(JSON.stringify(selectedRoute, null, 2))
    setJsonDialog(true)
    setActionAnchor(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <i className='tabler-route-off' />
        <Typography variant='h4' fontWeight={700}>
          Route Permission List
        </Typography>
      </div>
      <CustomTable data={tableData ?? []} isLoading={isRoutePermissionListPending} column={column ?? []} />

      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={handleCloseActionMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            className: 'min-is-[260px] rounded-xl shadow-lg',
            elevation: 8
          }
        }}
      >
        <div className='max-is-[300px] px-4 pb-2 pt-3'>
          <Typography variant='caption' color='text.secondary'>
            ROUTE
          </Typography>
          <Tooltip title={selectedRoute?.as || ''} placement='top-start'>
            <Typography className='truncate font-semibold' color='text.primary'>
              {selectedRoute?.as || 'Unnamed route'}
            </Typography>
          </Tooltip>
        </div>
        <Divider />
        <MenuItem onClick={handleViewJson} className='gap-3 py-3'>
          <ListItemIcon>
            <i className='tabler-braces text-xl' />
          </ListItemIcon>
          <ListItemText primary='View JSON' secondary='Inspect the complete route record' />
          <i className='tabler-chevron-right text-lg text-textSecondary' />
        </MenuItem>
      </Menu>

      <JSONDialog open={jsonDialog} handleClose={() => setJsonDialog(false)} jsonString={jsonStringView} />

      {toasts.map((toast, index) => (
        <CustomToast
          key={toast.id}
          open
          type={toast.type}
          message={toast.message}
          offset={index}
          handleClose={() => handleCloseToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default RoutePermissionListPage
