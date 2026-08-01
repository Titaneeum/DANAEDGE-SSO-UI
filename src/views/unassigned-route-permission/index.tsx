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

import CustomTable from '@/components/CustomTable'
import JSONDialog from '@/components/JsonDialog'
import CustomToast from '@/components/custom-toast'
import DashCard from '@/components/DashCard'
import SSOClientSwitcher, {
  DEFAULT_SSO_CLIENT_IDENTIFIER,
  type SSOClientIdentifier
} from '@/components/SSOClientSwitcher'
import type { ToastItem } from '@/libs/types'
import { useData } from '../../../useData'

type RoutePermission = {
  id: number
  system_type_id: number
  module_id: number
  module_name: string
  right_id: number
  right_name: string
}

type UnassignedRouteRow = {
  uri: string
  methods: string[]
  as: string
  type: string | string[]
  enableRoutePermission: number
  permissions: RoutePermission[]
}

type RouteSummary = {
  assigned_routes_count: number
  enabled_routes_count: number
  total_routes_from_sso_client: number
  unassigned_routes_count: number
}

const emptyRouteSummary: RouteSummary = {
  assigned_routes_count: 0,
  enabled_routes_count: 0,
  total_routes_from_sso_client: 0,
  unassigned_routes_count: 0
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

const UnassignedRoutePermissionPage = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [tableData, setTableData] = React.useState<UnassignedRouteRow[]>([])
  const [routeSummary, setRouteSummary] = React.useState<RouteSummary>(emptyRouteSummary)
  const [actionAnchor, setActionAnchor] = React.useState<HTMLElement | null>(null)
  const [selectedRoute, setSelectedRoute] = React.useState<UnassignedRouteRow | null>(null)
  const [jsonDialog, setJsonDialog] = React.useState(false)
  const [jsonStringView, setJsonStringView] = React.useState('')

  const { mutate: UnassignedRoutePermission, isPending: isUnassignedRoutePermissionPending } =
    useData().set.routePermission.unassignedRoutePermission

  const form = useForm<{ sso_client_identifier: SSOClientIdentifier }>({
    initialValues: {
      sso_client_identifier: DEFAULT_SSO_CLIENT_IDENTIFIER
    }
  })

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const handleCloseToast = (id: number) => {
    setToasts(previous => previous.filter(toast => toast.id !== id))
  }

  const columns = React.useMemo<ColumnDef<UnassignedRouteRow, any>[]>(
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
          const accessTypes = (Array.isArray(row.original.type) ? row.original.type : [row.original.type]).filter(
            (type): type is string => typeof type === 'string' && Boolean(type)
          )

          const isAuthenticated = accessTypes.some(type => type.toUpperCase() === 'AUTHENTICATED')
          const accessTypeLabel = accessTypes.map(type => type.replaceAll('_', ' ')).join(', ')

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isAuthenticated ? 'info' : 'default'}
              icon={<i className={isAuthenticated ? 'tabler-lock' : 'tabler-world'} />}
              label={accessTypeLabel || 'Unknown'}
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

          if (!permissions.length) {
            return (
              <Typography variant='body2' color='text.secondary'>
                No permissions
              </Typography>
            )
          }

          const permissionSummary = permissions
            .map(permission => `${permission.module_name}: ${permission.right_name}`)
            .join('\n')

          return (
            <Tooltip title={<span className='whitespace-pre-line'>{permissionSummary}</span>} placement='top'>
              <div className='flex max-is-[240px] flex-wrap gap-1'>
                {permissions.slice(0, 2).map(permission => (
                  <Chip
                    key={permission.id}
                    size='small'
                    variant='outlined'
                    color='primary'
                    icon={<i className='tabler-shield-check' />}
                    label={`${permission.module_name.replaceAll('_', ' ')} · ${permission.right_name.replaceAll('_', ' ')}`}
                    className='max-is-[220px] capitalize [&_.MuiChip-label]:truncate'
                  />
                ))}
                {permissions.length > 2 && <Chip size='small' label={`+${permissions.length - 2}`} />}
              </div>
            </Tooltip>
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

  const handleSubmit = (values: typeof form.values) => {
    UnassignedRoutePermission(values.sso_client_identifier, {
      onSuccess: data => {
        setTableData(data?.routes ?? [])
        setRouteSummary({
          assigned_routes_count: data?.assigned_routes_count ?? 0,
          enabled_routes_count: data?.enabled_routes_count ?? 0,
          total_routes_from_sso_client: data?.total_routes_from_sso_client ?? 0,
          unassigned_routes_count: data?.unassigned_routes_count ?? 0
        })
      },
      onError: error => {
        const apiError = error as { description?: string; message?: string }

        pushToast('error', apiError.description || apiError.message || 'Failed to fetch unassigned route permissions')
      }
    })
  }

  React.useEffect(() => {
    handleSubmit(form.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSSOClientChange = (ssoClientIdentifier: SSOClientIdentifier) => {
    form.setFieldValue('sso_client_identifier', ssoClientIdentifier)
    setTableData([])
    setRouteSummary(emptyRouteSummary)
    handleSubmit({ sso_client_identifier: ssoClientIdentifier })
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
          Unassigned Route Permission
        </Typography>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <DashCard
          title='Assigned Routes'
          value={routeSummary.assigned_routes_count}
          icon={<i className='tabler-route-square' />}
          color='primary'
          loading={isUnassignedRoutePermissionPending}
        />
        <DashCard
          title='Enabled Routes'
          value={routeSummary.enabled_routes_count}
          icon={<i className='tabler-circle-check' />}
          color='success'
          loading={isUnassignedRoutePermissionPending}
        />
        <DashCard
          title='Total Routes From SSO Client'
          value={routeSummary.total_routes_from_sso_client}
          icon={<i className='tabler-server-2' />}
          color='info'
          loading={isUnassignedRoutePermissionPending}
        />
        <DashCard
          title='Unassigned Routes'
          value={routeSummary.unassigned_routes_count}
          icon={<i className='tabler-route-off' />}
          color='warning'
          loading={isUnassignedRoutePermissionPending}
        />
      </div>

      <CustomTable
        data={tableData ?? []}
        column={columns ?? []}
        isLoading={isUnassignedRoutePermissionPending}
        leftSection={
          <>
            <Typography className='font-semibold'>Route List</Typography>
            <SSOClientSwitcher
              value={form.values.sso_client_identifier}
              onChange={handleSSOClientChange}
              disabled={isUnassignedRoutePermissionPending}
            />
          </>
        }
      />

      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={() => setActionAnchor(null)}
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
            UNASSIGNED ROUTE
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

export default UnassignedRoutePermissionPage
