'use client'

import * as React from 'react'

import {
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Typography
} from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'

import { useForm } from '@mantine/form'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomFilters from '@/components/CustomFilters'
import CustomTable from '@/components/CustomTable'
import { useData } from '../../../useData'
import CreateAdminDialog from './dialog/create-admin-dialog'
import JSONDialog from '@/components/JsonDialog'
import AssignRoleDialog from './dialog/assign-role-dialog'

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
  const [jsonDialog, setJsonDialog] = React.useState(false)
  const [jsonStringView, setJsonStringView] = React.useState('')
  const [actionAnchor, setActionAnchor] = React.useState<HTMLElement | null>(null)
  const [selectedAdmin, setSelectedAdmin] = React.useState<AdminUserRow | null>(null)
  const [openAssignRole, setOpenAssignRole] = React.useState(false)

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

  const { mutate: LockUnlockAdminUser, isPending: isLockUnlockAdminUserPending } =
    useData().set.adminUser.lockUnlockAdminUser

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
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const admin = row.original

          return (
            <Tooltip title='More actions'>
              <IconButton
                size='small'
                aria-label={`Open actions for ${admin.username}`}
                aria-haspopup='menu'
                onClick={event => {
                  setSelectedAdmin(admin)
                  setActionAnchor(event.currentTarget)
                }}
                className='rounded-lg'
              >
                <i className='tabler-dots text-xl' />
              </IconButton>
            </Tooltip>
          )
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

  const handleCloseActionMenu = () => {
    if (isLockUnlockAdminUserPending) return

    setActionAnchor(null)
  }

  const refetchCurrentPage = () => {
    const filters = jsonString ?? JSON.stringify(form.values.filter_array_objects)

    fetchAdminUserList(pageIndex, pageSize, filters)
  }

  const handleToggleAdminStatus = () => {
    if (!selectedAdmin || isLockUnlockAdminUserPending) return

    const nextStatusId = selectedAdmin.user_account_status_id === 1 ? 2 : 1

    LockUnlockAdminUser(
      {
        user_id: selectedAdmin.id,
        user_account_state_id: nextStatusId
      },
      {
        onSuccess: () => {
          setActionAnchor(null)
          setSelectedAdmin(null)
          refetchCurrentPage()
        },
        onError: error => console.error(error)
      }
    )
  }

  const handleViewJson = () => {
    if (!selectedAdmin) return

    setJsonStringView(JSON.stringify(selectedAdmin, null, 2))
    setJsonDialog(true)
    setActionAnchor(null)
  }

  const handleOpenAssignRole = () => {
    if (!selectedAdmin) return

    setOpenAssignRole(true)
    setActionAnchor(null)
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
        <i className='tabler-users-group' />
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
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
        <div className='px-4 pb-2 pt-3'>
          <Typography variant='caption' color='text.secondary'>
            ADMIN USER
          </Typography>
          <Typography className='truncate font-semibold' color='text.primary'>
            {selectedAdmin?.username}
          </Typography>
        </div>
        <Divider />
        <MenuItem onClick={handleToggleAdminStatus} disabled={isLockUnlockAdminUserPending} className='gap-3 py-3'>
          <ListItemIcon>
            <i
              className={`${selectedAdmin?.user_account_status_id === 1 ? 'tabler-lock-open' : 'tabler-lock'} text-xl`}
            />
          </ListItemIcon>
          <ListItemText
            primary={selectedAdmin?.user_account_status_id === 1 ? 'Account enabled' : 'Account disabled'}
            secondary={
              selectedAdmin?.user_account_status_id === 1 ? 'Switch off to lock access' : 'Switch on to restore access'
            }
          />
          {isLockUnlockAdminUserPending ? (
            <i className='tabler-loader-2 animate-spin text-xl text-primary' />
          ) : (
            <Switch
              edge='end'
              size='small'
              checked={selectedAdmin?.user_account_status_id === 1}
              inputProps={{ 'aria-label': 'Toggle admin account status' }}
            />
          )}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleViewJson} className='gap-3 py-3'>
          <ListItemIcon>
            <i className='tabler-braces text-xl' />
          </ListItemIcon>
          <ListItemText primary='View JSON' secondary='Inspect the complete user record' />
          <i className='tabler-chevron-right text-lg text-textSecondary' />
        </MenuItem>
        <MenuItem onClick={handleOpenAssignRole} className='gap-3 py-3'>
          <ListItemIcon>
            <i className='tabler-user-check text-xl' />
          </ListItemIcon>
          <ListItemText primary='Assign role' secondary='Grant permissions to this user' />
          <i className='tabler-chevron-right text-lg text-textSecondary' />
        </MenuItem>
      </Menu>

      <CreateAdminDialog
        open={openCreateAdmin}
        onClose={() => setOpenCreateAdmin(false)}
        onCreated={refetchCurrentPage}
      />
      <JSONDialog open={jsonDialog} handleClose={() => setJsonDialog(false)} jsonString={jsonStringView} />
      <AssignRoleDialog
        open={openAssignRole}
        onClose={() => setOpenAssignRole(false)}
        onSuccess={refetchCurrentPage}
        data={selectedAdmin}
      />
    </div>
  )
}

export default AdminUserListPage
