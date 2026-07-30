'use client'

import * as React from 'react'

import { Avatar, Button, Chip, Tooltip, Typography } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'

import { useForm } from '@mantine/form'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomFilters from '@/components/CustomFilters'
import CustomTable from '@/components/CustomTable'
import { useData } from '../../../useData'
import CreateAdminDialog from './dialog/create-admin-dialog'

type AdminUserRow = {
  sequence_no: number
  id: number
  user_id: number
  public_ident: string
  username: string
  first_name: string
  last_name: string
  email: string
  email_verified_at: string | null
  user_account_status_id: number
  user_account_status: string
  user_account_status_reason: string | null
  last_login: string | null
  system_type_id: number
  login_with_google_mfa: number
  enable_google_mfa: number
  created_at: string
  updated_at: string
  sso_client_reference: string | null
}

const AdminUserListPage = () => {
  const [tableData, setTableData] = React.useState<AdminUserRow[]>([])
  const [openCreateAdmin, setOpenCreateAdmin] = React.useState(false)

  const [pagination, setPagination] = React.useState({
    total: 0,
    per_page: 10,
    current_page: 1
  })

  const [jsonString, setJsonString] = React.useState<string | null>(null)

  // local pagination state (0-based index for the table)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const { mutate: GetAdminUserList, isPending: isAdminUserListPending } = useData().set.adminUser.adminUserList

  const form = useForm({
    initialValues: {
      start: 0,
      length: 10,
      filter_array_objects: [
        {
          filter_column: 'source_reference_id',
          filter_value: '1'
        }
      ]
    }
  })

  const column = React.useMemo<ColumnDef<AdminUserRow, any>[]>(
    () => [
      {
        accessorKey: 'sequence_no',
        header: 'No.',
        cell: ({ row }) => row.original.sequence_no
      },
      {
        accessorKey: 'username',
        header: 'Admin User',
        cell: ({ row }) => {
          const user = row.original
          const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
          const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'AU'

          return (
            <div className='flex items-center gap-3'>
              <Avatar className='bs-9 is-9 text-sm'>{initials}</Avatar>
              <div className='flex min-is-0 flex-col'>
                <Typography className='truncate font-medium capitalize' color='text.primary'>
                  {fullName}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  @{user.username}
                </Typography>
              </div>
            </div>
          )
        }
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography variant='body2'>{row.original.email || '—'}</Typography>
            <Typography variant='caption' color={row.original.email_verified_at ? 'success.main' : 'text.secondary'}>
              {row.original.email_verified_at ? 'Verified' : 'Not verified'}
            </Typography>
          </div>
        )
      },
      {
        accessorKey: 'user_account_status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.user_account_status
          const isActive = status?.toUpperCase() === 'ACTIVE'

          return (
            <Tooltip title={row.original.user_account_status_reason || ''}>
              <Chip size='small' variant='tonal' color={isActive ? 'success' : 'error'} label={status || 'Unknown'} />
            </Tooltip>
          )
        }
      },
      {
        accessorKey: 'sso_client_reference',
        header: 'SSO Client',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='outlined'
            color='primary'
            label={row.original.sso_client_reference || 'Not assigned'}
          />
        )
      },
      {
        accessorKey: 'enable_google_mfa',
        header: 'Google MFA',
        cell: ({ row }) => {
          const isEnabled = row.original.enable_google_mfa === 1

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isEnabled ? 'success' : 'default'}
              label={isEnabled ? 'Enabled' : 'Disabled'}
            />
          )
        }
      },
      {
        accessorKey: 'last_login',
        header: 'Last Login',
        cell: ({ row }) => {
          const lastLogin = dayjs(row.original.last_login)

          return row.original.last_login && lastLogin.isValid() ? lastLogin.format('DD MMM, YYYY HH:mm:ss') : 'Never'
        }
      },
      {
        accessorKey: 'created_at',
        header: 'Created At',
        cell: ({ row }) => {
          const createdAt = dayjs(row.original.created_at)

          return createdAt.isValid() ? createdAt.format('DD MMM, YYYY HH:mm:ss') : '—'
        }
      }
    ],
    []
  )

  const fetchAdminUserList = (newPageIndex: number, newPageSize: number, filters: string) => {
    const start = newPageIndex * newPageSize
    const length = newPageSize

    GetAdminUserList(
      { start, length, filter_array_objects: filters },
      {
        onSuccess: e => {
          const responseData = e?.data
          const rows = Array.isArray(responseData) ? responseData : responseData?.data

          setTableData(rows ?? [])
          setPagination({
            total: responseData?.recordsTotal ?? rows?.length ?? 0,
            current_page: responseData?.current_start ?? newPageIndex + 1,
            per_page: responseData?.current_length ?? newPageSize
          })
        },
        onError: e => console.error(e)
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
    fetchAdminUserList(firstPage, pageSize, filtersJson)
  }

  // pagination handlers for CustomTable (server-side mode)
  const handleServerPageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex)
    if (!jsonString) return
    fetchAdminUserList(newPageIndex, pageSize, jsonString)
  }

  const handleServerPageSizeChange = (newSize: number) => {
    const firstPage = 0

    setPageSize(newSize)
    setPageIndex(firstPage)
    if (!jsonString) return
    fetchAdminUserList(firstPage, newSize, jsonString)
  }

  const activeTags: string[] = []

  const hasReference = !!form.values.filter_array_objects[0].filter_value

  if (hasReference) activeTags.push(form.values.filter_array_objects[0].filter_value)

  const handleClearAllFilters = () => {
    form.reset()
    handleSubmit({
      ...form.values
    })
  }

  const handleOpenCreateAdmin = () => {
    setOpenCreateAdmin(true)
  }

  React.useEffect(() => {
    handleSubmit({
      ...form.values
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <i className='tabler-key' />
        <Typography variant='h4' fontWeight={700}>
          List of Admin User
        </Typography>
      </div>
      {/* Filter accordion */}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <CustomFilters
          title='Filter'
          loading={isAdminUserListPending}
          activeTags={activeTags}
          onClear={handleClearAllFilters}
        >
          <div className='grid grid-cols-2 gap-4'>
            <CustomTextField
              {...form.getInputProps('filter_array_objects.0.filter_value')}
              label='Source Reference ID'
              placeholder='Enter the source reference ID'
            />
          </div>
        </CustomFilters>
      </form>
      <CustomTable
        rightSection={
          <>
            <Button onClick={handleOpenCreateAdmin} variant='contained' startIcon={<i className='tabler-plus' />}>
              Create Admin
            </Button>
          </>
        }
        data={tableData ?? []}
        column={column ?? []}
        withPageSizeSelection
        isLoading={isAdminUserListPending}
        serverSidePagination
        serverTotalItems={pagination.total}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
      />

      <CreateAdminDialog open={openCreateAdmin} onClose={() => setOpenCreateAdmin(false)} />
    </div>
  )
}

export default AdminUserListPage
