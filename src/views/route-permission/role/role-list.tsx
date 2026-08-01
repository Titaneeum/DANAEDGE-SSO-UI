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

import dayjs from 'dayjs'

import { useData } from '../../../../useData'
import CustomTable from '@/components/CustomTable'
import CustomFilters from '@/components/CustomFilters'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import CustomTextField from '@/@core/components/mui/TextField'
import type { ToastItem } from '@/libs/types'
import CustomToast from '@/components/custom-toast'
import JSONDialog from '@/components/JsonDialog'

type RoleModule = {
  module_id: number
  module_name: string
  rights_count: number
}

type RoleRow = {
  sequence_no: number
  id: number
  role_name: string
  description: string
  created_at: string
  updated_at: string
  users_count: number
  modules_count: number
  total_rights_count: number
  modules: RoleModule[]
  can_delete: boolean
}

type DateFilterValue = string | Date | null | undefined

const asDate = (value: DateFilterValue) => (value ? dayjs(value).toDate() : null)

const RoleListPage = () => {
  const [tableData, setTableData] = React.useState<RoleRow[]>([])

  const [jsonString, setJsonString] = React.useState<string | null>(null)
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [actionAnchor, setActionAnchor] = React.useState<HTMLElement | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<RoleRow | null>(null)
  const [jsonDialog, setJsonDialog] = React.useState(false)
  const [jsonStringView, setJsonStringView] = React.useState('')

  const { mutate: RoleList, isPending: isRoleListPending } = useData().set.routePermission.roleList

  const form = useForm({
    initialValues: {
      start: 0,
      length: 10,
      filter_array_objects: [
        {
          filter_column: 'created_at',
          filter_start: '2018-01-01' as DateFilterValue,
          filter_end: '2050-01-01' as DateFilterValue
        },
        {
          filter_column: 'keyword',
          filter_value: ''
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

  const column = React.useMemo<ColumnDef<RoleRow, any>[]>(
    () => [
      {
        accessorKey: 'role_name',
        header: 'Role',
        cell: ({ row }) => (
          <div className='flex min-is-0 max-is-[320px] flex-col gap-1'>
            <div className='flex items-center gap-2'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <i className='tabler-shield-lock text-lg' />
              </div>
              <div className='min-is-0'>
                <Tooltip title={row.original.role_name} placement='top-start'>
                  <Typography className='truncate font-semibold' color='text.primary'>
                    {row.original.role_name.replaceAll('_', ' ')}
                  </Typography>
                </Tooltip>
                <Typography variant='caption' color='text.secondary'>
                  #{row.original.sequence_no} · ID {row.original.id}
                </Typography>
              </div>
            </div>
            <Tooltip title={row.original.description || 'No description'} placement='bottom-start'>
              <Typography variant='body2' color='text.secondary' className='truncate'>
                {row.original.description || 'No description'}
              </Typography>
            </Tooltip>
          </div>
        )
      },
      {
        accessorKey: 'modules_count',
        header: 'Modules',
        cell: ({ row }) => {
          const moduleSummary = row.original.modules
            .map(module => `${module.module_name.replaceAll('_', ' ')} (${module.rights_count})`)
            .join('\n')

          return (
            <Tooltip title={<span className='whitespace-pre-line'>{moduleSummary || 'No modules assigned'}</span>}>
              <Chip
                size='small'
                variant='tonal'
                color={row.original.modules_count ? 'primary' : 'default'}
                icon={<i className='tabler-box' />}
                label={`${row.original.modules_count} module${row.original.modules_count === 1 ? '' : 's'}`}
              />
            </Tooltip>
          )
        }
      },
      {
        accessorKey: 'total_rights_count',
        header: 'Rights',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            color={row.original.total_rights_count ? 'info' : 'default'}
            icon={<i className='tabler-key' />}
            label={`${row.original.total_rights_count} right${row.original.total_rights_count === 1 ? '' : 's'}`}
          />
        )
      },
      {
        accessorKey: 'users_count',
        header: 'Users',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <i className='tabler-users text-xl text-textSecondary' />
            <Typography>{row.original.users_count}</Typography>
          </div>
        )
      },
      {
        accessorKey: 'updated_at',
        header: 'Last Updated',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2' color='text.primary'>
              {dayjs(row.original.updated_at).format('DD MMM YYYY')}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {dayjs(row.original.updated_at).format('HH:mm')}
            </Typography>
          </div>
        )
      },
      {
        accessorKey: 'can_delete',
        header: 'Type',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color={row.original.can_delete ? 'success' : 'secondary'}
            icon={<i className={row.original.can_delete ? 'tabler-edit' : 'tabler-lock'} />}
            label={row.original.can_delete ? 'Custom' : 'Protected'}
          />
        )
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Tooltip title='More actions'>
            <IconButton
              size='small'
              aria-label={`Open actions for ${row.original.role_name}`}
              aria-haspopup='menu'
              onClick={event => {
                setSelectedRole(row.original)
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

  const fetchRoleList = (newPageIndex: number, newPageSize: number, filters: string) => {
    const start = newPageIndex * newPageSize
    const length = newPageSize

    RoleList(
      { start, length, filter_array_objects: filters },
      {
        onSuccess: e => {
          const roles = e?.roles ?? []

          setTableData(roles)
          setPagination({
            total: e?.recordsTotal ?? roles.length ?? 0,
            current_page: e?.current_start ?? newPageIndex + 1,
            per_page: e?.current_length ?? newPageSize
          })
        },
        onError: (e: any) => pushToast('error', e?.description ?? 'An error occurred while fetching role list')
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
    fetchRoleList(firstPage, pageSize, filtersJson)
  }

  // pagination handlers for CustomTable (server-side mode)
  const handleServerPageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex)
    if (!jsonString) return
    fetchRoleList(newPageIndex, pageSize, jsonString)
  }

  const handleServerPageSizeChange = (newSize: number) => {
    const firstPage = 0

    setPageSize(newSize)
    setPageIndex(firstPage)
    if (!jsonString) return
    fetchRoleList(firstPage, newSize, jsonString)
  }

  const hasStart = !!form.values.filter_array_objects[0].filter_start
  const hasEnd = !!form.values.filter_array_objects[0].filter_end

  const formattedStart = hasStart
    ? dayjs(form.values.filter_array_objects[0].filter_start as Date).format('DD MMM, YYYY HH:mm')
    : null

  const formattedEnd = hasEnd
    ? dayjs(form.values.filter_array_objects[0].filter_end as Date).format('DD MMM, YYYY HH:mm')
    : null

  const activeTags: string[] = []

  if (hasStart) activeTags.push(`Start: ${formattedStart}`)
  if (hasEnd) activeTags.push(`End: ${formattedEnd}`)

  const handleClearAllFilters = () => {
    form.reset()
    handleSubmit({
      ...form.values,
      filter_start: null,
      filter_end: null
    })
  }

  React.useEffect(() => {
    handleSubmit(form.values)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleViewJson = () => {
    if (!selectedRole) return

    setJsonStringView(JSON.stringify(selectedRole, null, 2))
    setJsonDialog(true)
    setActionAnchor(null)
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <i className='tabler-user-cog' />
        <Typography variant='h4' fontWeight={700}>
          Role List
        </Typography>
      </div>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <CustomFilters
          title='Filter'
          loading={isRoleListPending}
          activeTags={activeTags}
          onClear={handleClearAllFilters}
        >
          <div className='grid grid-cols-2 gap-4'>
            <AppReactDatepicker
              selected={asDate(form.values.filter_array_objects[0].filter_start)}
              onChange={(d: Date | null) => form.setFieldValue('filter_array_objects.0.filter_start', d)}
              showTimeSelect
              timeIntervals={15}
              timeFormat='HH:mm'
              dateFormat='dd/MM/yyyy HH:mm'
              id='start-date'
              placeholderText='Click to select a start date'
              customInput={<CustomTextField label='Start Date' fullWidth />}
            />
            <AppReactDatepicker
              selected={asDate(form.values.filter_array_objects[0].filter_end)}
              onChange={(d: Date | null) => form.setFieldValue('filter_array_objects.0.filter_end', d)}
              showTimeSelect
              timeIntervals={15}
              timeFormat='HH:mm'
              dateFormat='dd/MM/yyyy HH:mm'
              minDate={asDate(form.values.filter_array_objects[0].filter_start) || undefined}
              id='end-date'
              placeholderText='Click to select an end date'
              customInput={<CustomTextField label='End Date' fullWidth />}
            />
            <CustomTextField
              {...form.getInputProps('filter_array_objects.1.filter_value')}
              label='Keyword'
              placeholder='Enter the keyword'
            />
          </div>
        </CustomFilters>
      </form>
      <CustomTable
        data={tableData ?? []}
        column={column ?? []}
        withPageSizeSelection
        isLoading={isRoleListPending}
        serverSidePagination
        serverTotalItems={pagination.total}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
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
            ROLE
          </Typography>
          <Tooltip title={selectedRole?.role_name || ''} placement='top-start'>
            <Typography className='truncate font-semibold' color='text.primary'>
              {selectedRole?.role_name.replaceAll('_', ' ') || 'Unnamed role'}
            </Typography>
          </Tooltip>
        </div>
        <Divider />
        <MenuItem onClick={handleViewJson} className='gap-3 py-3'>
          <ListItemIcon>
            <i className='tabler-braces text-xl' />
          </ListItemIcon>
          <ListItemText primary='View JSON' secondary='Inspect the complete role record' />
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

export default RoleListPage
