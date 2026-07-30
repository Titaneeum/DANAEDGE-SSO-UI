'use client'

import * as React from 'react'

import { Chip, Typography } from '@mui/material'

import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'

import { useForm } from '@mantine/form'

import CustomTable from '@/components/CustomTable'
import { useData } from '../../../useData'
import CustomFilters from '@/components/CustomFilters'
import CustomTextField from '@/@core/components/mui/TextField'

type UserLoginAttemptRow = {
  sequence_no: number
  id: number
  user_id: number | null
  username: string
  ip_address: string
  user_agent: string
  event_type: string
  is_success: number
  reason: string | null
  created_at: string
  updated_at: string
  user_login_attempt_id: number
}

const UserLoginAttempt = () => {
  const [tableData, setTableData] = React.useState<UserLoginAttemptRow[]>([])

  const { mutate: ListUserLoginAttempt, isPending: isUserLoginAttemptListPending } =
    useData().set.adminUser.userLoginAttemptList

  const [pagination, setPagination] = React.useState({
    total: 0,
    per_page: 10,
    current_page: 1
  })

  const [jsonString, setJsonString] = React.useState<string | null>(null)

  // local pagination state (0-based index for the table)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(10)

  const form = useForm({
    initialValues: {
      start: 0,
      length: 10,
      filter_array_objects: [
        {
          filter_column: 'username',
          filter_value: ''
        }
      ]
    }
  })

  const column = React.useMemo<ColumnDef<UserLoginAttemptRow, any>[]>(
    () => [
      {
        accessorKey: 'sequence_no',
        header: 'No.',
        cell: ({ row }) => row.original.sequence_no
      },
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography className='font-medium' color='text.primary'>
              {row.original.username || 'Unknown user'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.user_id ? `User ID: ${row.original.user_id}` : 'Unregistered user'}
            </Typography>
          </div>
        )
      },
      {
        accessorKey: 'ip_address',
        header: 'IP Address',
        cell: ({ row }) => <span className='font-mono text-sm'>{row.original.ip_address || '—'}</span>
      },
      {
        accessorKey: 'user_agent',
        header: 'User Agent',
        cell: ({ row }) => (
          <Typography variant='body2' className='max-is-[220px] break-words'>
            {row.original.user_agent || '—'}
          </Typography>
        )
      },
      {
        accessorKey: 'event_type',
        header: 'Event',
        cell: ({ row }) => (
          <Chip
            size='small'
            variant='tonal'
            color='info'
            label={row.original.event_type.replaceAll('_', ' ')}
            className='capitalize'
          />
        )
      },
      {
        accessorKey: 'is_success',
        header: 'Status',
        cell: ({ row }) => {
          const isSuccessful = row.original.is_success === 1

          return (
            <Chip
              size='small'
              variant='tonal'
              color={isSuccessful ? 'success' : 'error'}
              label={isSuccessful ? 'Successful' : 'Failed'}
            />
          )
        }
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => row.original.reason || '—'
      },
      {
        accessorKey: 'created_at',
        header: 'Attempted At',
        cell: ({ row }) => {
          const createdAt = dayjs(row.original.created_at)

          return createdAt.isValid() ? createdAt.format('DD MMM, YYYY HH:mm:ss') : '—'
        }
      }
    ],
    []
  )

  const fetchUserLoginAttemptList = (newPageIndex: number, newPageSize: number, filters: string) => {
    const start = newPageIndex * newPageSize
    const length = newPageSize

    ListUserLoginAttempt(
      { start, length, filter_array_objects: filters },
      {
        onSuccess: e => {
          setTableData(e?.data ?? [])
          setPagination({
            total: e?.data?.recordsTotal ?? 0,
            current_page: e?.data?.current_start ?? newPageIndex + 1,
            per_page: e?.data?.current_length ?? newPageSize
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
    fetchUserLoginAttemptList(firstPage, pageSize, filtersJson)
  }

  // pagination handlers for CustomTable (server-side mode)
  const handleServerPageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex)
    if (!jsonString) return
    fetchUserLoginAttemptList(newPageIndex, pageSize, jsonString)
  }

  const handleServerPageSizeChange = (newSize: number) => {
    const firstPage = 0

    setPageSize(newSize)
    setPageIndex(firstPage)
    if (!jsonString) return
    fetchUserLoginAttemptList(firstPage, newSize, jsonString)
  }

  const activeTags: string[] = []

  const hasUsername = !!form.values.filter_array_objects[0].filter_value

  if (hasUsername) activeTags.push(form.values.filter_array_objects[0].filter_value)

  const handleClearAllFilters = () => {
    form.reset()
    handleSubmit({
      ...form.values
    })
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <i className='tabler-key' />
        <Typography variant='h4' fontWeight={700}>
          User Login Attempt
        </Typography>
      </div>
      {/* Filter accordion */}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <CustomFilters
          title='Filter'
          loading={isUserLoginAttemptListPending}
          activeTags={activeTags}
          onClear={handleClearAllFilters}
        >
          <div className='grid grid-cols-2 gap-4'>
            {/* <AppReactDatepicker
              selected={form.values.filter_array_objects[0].filter_start}
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
              selected={form.values.filter_array_objects[0].filter_end}
              onChange={(d: Date | null) => form.setFieldValue('filter_array_objects.0.filter_end', d)}
              showTimeSelect
              timeIntervals={15}
              timeFormat='HH:mm'
              dateFormat='dd/MM/yyyy HH:mm'
              minDate={form.values.filter_array_objects[0].filter_start || undefined}
              id='end-date'
              placeholderText='Click to select an end date'
              customInput={<CustomTextField label='End Date' fullWidth />}
            /> */}
            <CustomTextField
              {...form.getInputProps('filter_array_objects.0.filter_value')}
              label='Username'
              placeholder='Enter the username'
            />
          </div>
        </CustomFilters>
      </form>
      <CustomTable
        data={tableData ?? []}
        column={column ?? []}
        withPageSizeSelection
        isLoading={isUserLoginAttemptListPending}
        serverSidePagination
        serverTotalItems={pagination.total}
        serverPageIndex={pageIndex}
        serverPageSize={pageSize}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
      />
    </div>
  )
}

export default UserLoginAttempt
