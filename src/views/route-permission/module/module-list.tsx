'use client'

import * as React from 'react'

import { useForm } from '@mantine/form'

import {
  Button,
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

import dayjs from 'dayjs'

import { useData } from '../../../../useData'
import type { ToastItem } from '@/libs/types'
import CustomTable from '@/components/CustomTable'
import CustomToast from '@/components/custom-toast'
import JSONDialog from '@/components/JsonDialog'
import SSOClientSwitcher, {
  DEFAULT_SSO_CLIENT_IDENTIFIER,
  type SSOClientIdentifier
} from '@/components/SSOClientSwitcher'
import CreateModuleDialog from '../dialog/create-module'
import UpdateModuleDialog from '../dialog/update-module'

type AssociatedSsoClient = {
  sso_client_identifier: SSOClientIdentifier
  system_type_id: number
  system_type_name: string
}

type ModuleRow = {
  sequence_no: number
  id: number
  module_name: string
  module_code: string
  description: string
  is_predefined: boolean
  created_at: string
  updated_at: string
  associated_sso_clients: AssociatedSsoClient[]
  associated_sso_client_identifiers: string[]
  routes_permissions_count: number
  role_permission_count: number
  user_permission_count: number
  can_delete: boolean
}

const clientLabel = (identifier: string) => {
  if (identifier === 'MFS_DEFAULT') return 'Merchant Facing System'
  if (identifier === 'MAIN_PS') return 'Payment Switch'

  return identifier.replaceAll('_', ' ')
}

const ModuleListPage = () => {
  const [tableData, setTableData] = React.useState<ModuleRow[]>([])
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [jsonString, setJsonString] = React.useState<string | null>(null)
  const [actionAnchor, setActionAnchor] = React.useState<HTMLElement | null>(null)
  const [selectedModule, setSelectedModule] = React.useState<ModuleRow | null>(null)
  const [jsonDialog, setJsonDialog] = React.useState(false)
  const [jsonStringView, setJsonStringView] = React.useState('')
  const [openCreateModule, setOpenCreateModule] = React.useState(false)
  const [openUpdateModule, setOpenUpdateModule] = React.useState(false)

  const { mutate: ModuleList, isPending: isModuleListPending } = useData().set.routePermission.moduleList

  const form = useForm<{
    start: number
    length: number
    filter_array_objects: Array<{ filter_column: string; filter_value: SSOClientIdentifier }>
  }>({
    initialValues: {
      start: 0,
      length: 10,
      filter_array_objects: [
        {
          filter_column: 'sso_client_identifier',
          filter_value: DEFAULT_SSO_CLIENT_IDENTIFIER
        }
      ]
    }
  })

  const [pagination, setPagination] = React.useState({
    total: 0,
    per_page: 10,
    current_page: 1
  })

  // local pagination state (0-based index for the table)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const handleCloseToast = (id: number) => {
    setToasts(previous => previous.filter(toast => toast.id !== id))
  }

  const column = React.useMemo<ColumnDef<ModuleRow, any>[]>(
    () => [
      {
        accessorKey: 'module_name',
        header: 'Module',
        cell: ({ row }) => (
          <div className='flex min-is-0 max-is-[330px] items-start gap-3'>
            <div className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <i className='tabler-box text-xl' />
            </div>
            <div className='min-is-0'>
              <Tooltip title={row.original.module_name} placement='top-start'>
                <Typography className='truncate font-semibold' color='text.primary'>
                  {row.original.module_name.replaceAll('_', ' ')}
                </Typography>
              </Tooltip>
              <Typography variant='caption' color='text.secondary' className='font-mono'>
                {row.original.module_code || `ID ${row.original.id}`}
              </Typography>
              <Tooltip title={row.original.description || 'No description'} placement='bottom-start'>
                <Typography variant='body2' color='text.secondary' className='mt-1 truncate'>
                  {row.original.description || 'No description'}
                </Typography>
              </Tooltip>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'associated_sso_clients',
        header: 'SSO Clients',
        cell: ({ row }) => {
          const clients = Array.isArray(row.original.associated_sso_clients)
            ? row.original.associated_sso_clients
            : []

          return clients.length ? (
            <div className='flex max-is-[280px] flex-wrap gap-1.5'>
              {clients.map(client => (
                <Tooltip
                  key={`${client.sso_client_identifier}-${client.system_type_id}`}
                  title={`${clientLabel(client.sso_client_identifier)} · ${client.system_type_name}`}
                >
                  <Chip
                    size='small'
                    variant='tonal'
                    color={client.sso_client_identifier === 'MFS_DEFAULT' ? 'primary' : 'info'}
                    icon={<i className='tabler-server' />}
                    label={clientLabel(client.sso_client_identifier)}
                    className='max-is-[220px] [&_.MuiChip-label]:truncate'
                  />
                </Tooltip>
              ))}
            </div>
          ) : (
            <Typography variant='body2' color='text.secondary'>Not associated</Typography>
          )
        }
      },
      {
        id: 'permission_usage',
        header: 'Permission Usage',
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1.5'>
            <Tooltip title='Route permissions'>
              <Chip size='small' variant='outlined' icon={<i className='tabler-route' />} label={row.original.routes_permissions_count} />
            </Tooltip>
            <Tooltip title='Role permissions'>
              <Chip size='small' variant='outlined' color='primary' icon={<i className='tabler-users' />} label={row.original.role_permission_count} />
            </Tooltip>
            <Tooltip title='Direct user permissions'>
              <Chip size='small' variant='outlined' color='info' icon={<i className='tabler-user' />} label={row.original.user_permission_count} />
            </Tooltip>
          </div>
        )
      },
      {
        accessorKey: 'updated_at',
        header: 'Last Updated',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2'>{dayjs(row.original.updated_at).format('DD MMM YYYY')}</Typography>
            <Typography variant='caption' color='text.secondary'>{dayjs(row.original.updated_at).format('HH:mm')}</Typography>
          </div>
        )
      },
      {
        accessorKey: 'is_predefined',
        header: 'Type',
        cell: ({ row }) => {
          const isProtected = row.original.is_predefined || !row.original.can_delete

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isProtected ? 'secondary' : 'success'}
              icon={<i className={isProtected ? 'tabler-lock' : 'tabler-edit'} />}
              label={isProtected ? 'Protected' : 'Custom'}
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
              aria-label={`Open actions for ${row.original.module_name}`}
              aria-haspopup='menu'
              onClick={event => {
                setSelectedModule(row.original)
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

  const fetchModuleList = (newPageIndex: number, newPageSize: number, filters: string) => {
    const start = newPageIndex * newPageSize
    const length = newPageSize

    ModuleList(
      { start, length, filter_array_objects: filters },
      {
        onSuccess: e => {
          const modules = e?.modules ?? []

          setTableData(modules)
          setPagination({
            total: e?.recordsTotal ?? modules.length ?? 0,
            current_page: e?.current_start ?? newPageIndex + 1,
            per_page: e?.current_length ?? newPageSize
          })
        },
        onError: (e: any) => pushToast('error', e?.description ?? 'An error occurred while fetching module list')
      }
    )
  }

  const handleSubmit = (values: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { start, length, ...otherValues } = values
    const filtersJson = JSON.stringify(otherValues.filter_array_objects)

    setJsonString(filtersJson)

    const firstPage = 0

    setPageIndex(firstPage)
    fetchModuleList(firstPage, pageSize, filtersJson)
  }

  // pagination handlers for CustomTable (server-side mode)
  const handleServerPageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex)
    if (!jsonString) return
    fetchModuleList(newPageIndex, pageSize, jsonString)
  }

  const handleServerPageSizeChange = (newSize: number) => {
    const firstPage = 0

    setPageSize(newSize)
    setPageIndex(firstPage)
    if (!jsonString) return
    fetchModuleList(firstPage, newSize, jsonString)
  }

  const handleSSOClientChange = (ssoClientIdentifier: SSOClientIdentifier) => {
    const filters = form.values.filter_array_objects.map((filter, index) =>
      index === 0 ? { ...filter, filter_value: ssoClientIdentifier } : filter
    )

    const filtersJson = JSON.stringify(filters)

    form.setFieldValue('filter_array_objects.0.filter_value', ssoClientIdentifier)
    setTableData([])
    setPageIndex(0)
    setJsonString(filtersJson)
    fetchModuleList(0, pageSize, filtersJson)
  }

  React.useEffect(() => {
    handleSubmit(form.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleViewJson = () => {
    if (!selectedModule) return

    setJsonStringView(JSON.stringify(selectedModule, null, 2))
    setJsonDialog(true)
    setActionAnchor(null)
  }

  const handleOpenUpdate = () => {
    if (!selectedModule) return

    setOpenUpdateModule(true)
    setActionAnchor(null)
  }

  const refetchCurrentPage = () => {
    if (jsonString) fetchModuleList(pageIndex, pageSize, jsonString)
    else handleSubmit(form.values)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <i className='tabler-list-details' />
        <Typography variant='h4' fontWeight={700}>
          List of Modules
        </Typography>
      </div>
      <CustomTable
        data={tableData ?? []}
        column={column ?? []}
        withPageSizeSelection
        isLoading={isModuleListPending}
        serverSidePagination
        serverTotalItems={pagination.total}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
        leftSection={
          <SSOClientSwitcher
            value={form.values.filter_array_objects[0].filter_value}
            onChange={handleSSOClientChange}
            disabled={isModuleListPending}
          />
        }
        rightSection={
          <Button
            type='button'
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => setOpenCreateModule(true)}
          >
            Create Module
          </Button>
        }
      />

      <Menu
        anchorEl={actionAnchor}
        open={Boolean(actionAnchor)}
        onClose={() => setActionAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: 'min-is-[260px] rounded-xl shadow-lg', elevation: 8 } }}
      >
        <div className='max-is-[300px] px-4 pb-2 pt-3'>
          <Typography variant='caption' color='text.secondary'>MODULE</Typography>
          <Tooltip title={selectedModule?.module_name || ''} placement='top-start'>
            <Typography className='truncate font-semibold' color='text.primary'>
              {selectedModule?.module_name.replaceAll('_', ' ') || 'Unnamed module'}
            </Typography>
          </Tooltip>
        </div>
        <Divider />
        <MenuItem onClick={handleViewJson} className='gap-3 py-3'>
          <ListItemIcon><i className='tabler-braces text-xl' /></ListItemIcon>
          <ListItemText primary='View JSON' secondary='Inspect the complete module record' />
          <i className='tabler-chevron-right text-lg text-textSecondary' />
        </MenuItem>
        <MenuItem onClick={handleOpenUpdate} className='gap-3 py-3'>
          <ListItemIcon><i className='tabler-edit text-xl' /></ListItemIcon>
          <ListItemText primary='Update module' secondary='Edit module details and associations' />
          <i className='tabler-chevron-right text-lg text-textSecondary' />
        </MenuItem>
      </Menu>

      <JSONDialog open={jsonDialog} handleClose={() => setJsonDialog(false)} jsonString={jsonStringView} />
      <CreateModuleDialog
        open={openCreateModule}
        onClose={() => setOpenCreateModule(false)}
        onSuccess={refetchCurrentPage}
      />
      <UpdateModuleDialog
        open={openUpdateModule}
        onClose={() => setOpenUpdateModule(false)}
        onSuccess={refetchCurrentPage}
        data={selectedModule}
      />

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

export default ModuleListPage
