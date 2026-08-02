'use client'

import * as React from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomToast from '@/components/custom-toast'
import type { ToastItem } from '@/libs/types'
import { useData } from '../../../../useData'

type AdminUserData = {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
}

type RoleOption = {
  id: number
  role_name: string
  description: string
  modules_count: number
  total_rights_count: number
}

interface AssignRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  data: AdminUserData | null
}

const getRoles = (response: any): RoleOption[] => {
  const rows = Array.isArray(response?.roles)
    ? response.roles
    : Array.isArray(response?.data?.data)
      ? response.data.data
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : []

  return rows
    .map((role: any) => {
      const id = Number(role?.id)

      if (!Number.isFinite(id)) return null

      return {
        id,
        role_name: String(role?.role_name ?? `Role ${id}`),
        description: String(role?.description ?? ''),
        modules_count: Number(role?.modules_count ?? 0),
        total_rights_count: Number(role?.total_rights_count ?? 0)
      }
    })
    .filter((role: RoleOption | null): role is RoleOption => Boolean(role))
}

const AssignRoleDialog = ({ open, onClose, onSuccess, data }: AssignRoleDialogProps) => {
  const [roles, setRoles] = React.useState<RoleOption[]>([])
  const [selectedRole, setSelectedRole] = React.useState<RoleOption | null>(null)
  const [roleError, setRoleError] = React.useState('')
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const { mutate: getRoleList, isPending: isRoleListPending } = useData().set.routePermission.roleList
  const { mutate: assignRoleToUser, isPending: isAssignRolePending } = useData().set.routePermission.assignRoleToUser

  React.useEffect(() => {
    if (!open) return

    setSelectedRole(null)
    setRoleError('')
    getRoleList(
      {
        start: 0,
        length: 100,
        filter_array_objects: JSON.stringify([
          { filter_column: 'created_at', filter_start: '2018-01-01', filter_end: '2050-01-01' },
          { filter_column: 'keyword', filter_value: '' }
        ])
      },
      {
        onSuccess: response => setRoles(getRoles(response)),
        onError: error => {
          const apiError = error as { description?: string; message?: string }

          setRoles([])
          setToasts(previous => [
            ...previous,
            {
              id: Date.now() + Math.random(),
              type: 'error',
              message: apiError.description || apiError.message || 'Failed to fetch role list'
            }
          ])
        }
      }
    )
  }, [getRoleList, open])

  const handleClose = () => {
    if (isAssignRolePending) return

    setSelectedRole(null)
    setRoleError('')
    onClose()
  }

  const handleAssign = () => {
    if (!selectedRole) {
      setRoleError('Select a role to continue')

      return
    }

    if (!data) return

    assignRoleToUser(
      { role_id: selectedRole.id, user_id: data.id },
      {
        onSuccess: () => {
          setToasts(previous => [
            ...previous,
            { id: Date.now() + Math.random(), type: 'success', message: 'Role assigned successfully' }
          ])
          setSelectedRole(null)
          onClose()
          onSuccess()
        },
        onError: error => {
          const apiError = error as { description?: string; message?: string }

          setToasts(previous => [
            ...previous,
            {
              id: Date.now() + Math.random(),
              type: 'error',
              message: apiError.description || apiError.message || 'Failed to assign role'
            }
          ])
        }
      }
    )
  }

  const fullName = data ? [data.first_name, data.last_name].filter(Boolean).join(' ') : ''

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth='sm'
        scroll='paper'
        PaperProps={{ className: 'rounded-2xl !m-3 sm:!m-8' }}
      >
        <DialogTitle className='flex items-start justify-between gap-3 border-0 border-b border-solid border-divider !px-4 !py-4 sm:!px-7 sm:!py-6'>
          <div className='flex items-center gap-4'>
            <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <i className='tabler-user-check text-2xl' />
            </div>
            <div>
              <Typography variant='h5' className='font-semibold'>Assign role</Typography>
              <Typography variant='body2' color='text.secondary'>Grant a role and its permissions to this administrator.</Typography>
            </div>
          </div>
          <IconButton type='button' size='small' aria-label='Close assign role dialog' onClick={handleClose} disabled={isAssignRolePending}>
            <i className='tabler-x' />
          </IconButton>
        </DialogTitle>

        <DialogContent className='!px-4 !py-5 sm:!px-7 sm:!py-7'>
          <div className='mb-6 rounded-xl border border-solid border-divider bg-actionHover p-4'>
            <Typography variant='caption' color='text.secondary'>ADMIN USER</Typography>
            <Typography className='font-semibold' color='text.primary'>{fullName || data?.username || 'Unknown user'}</Typography>
            <Typography variant='body2' color='text.secondary'>{data?.email || data?.username}</Typography>
          </div>

          <Autocomplete
            options={roles}
            value={selectedRole}
            loading={isRoleListPending}
            disabled={isAssignRolePending}
            getOptionLabel={option => option.role_name.replaceAll('_', ' ')}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) => {
              setSelectedRole(value)
              if (value) setRoleError('')
            }}
            noOptionsText={isRoleListPending ? 'Loading roles...' : 'No roles available'}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props

              return (
                <li key={key} {...optionProps}>
                  <div className='min-is-0 py-1'>
                    <Typography className='truncate font-medium'>{option.role_name.replaceAll('_', ' ')}</Typography>
                    <Typography variant='caption' color='text.secondary' className='block truncate'>
                      {option.description || `${option.modules_count} modules · ${option.total_rights_count} rights`}
                    </Typography>
                  </div>
                </li>
              )
            }}
            renderInput={params => (
              <CustomTextField
                {...params}
                required
                autoFocus
                label='Role'
                placeholder='Search and select a role'
                error={Boolean(roleError)}
                helperText={roleError || 'The selected role permissions will be granted to this user'}
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isRoleListPending ? <CircularProgress color='inherit' size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
          />
        </DialogContent>

        <DialogActions className='flex-col-reverse gap-2 border-0 border-t border-solid border-divider !px-4 !py-4 sm:flex-row sm:!px-7 sm:!py-5 max-sm:[&>button]:!m-0 max-sm:[&>button]:is-full'>
          <Button type='button' variant='outlined' color='secondary' onClick={handleClose} disabled={isAssignRolePending}>Cancel</Button>
          <Button
            type='button'
            variant='contained'
            onClick={handleAssign}
            disabled={!data || isAssignRolePending || isRoleListPending}
            startIcon={<i className={isAssignRolePending ? 'tabler-loader-2 animate-spin' : 'tabler-user-check'} />}
          >
            {isAssignRolePending ? 'Assigning...' : 'Assign role'}
          </Button>
        </DialogActions>
      </Dialog>

      {toasts.map((toast, index) => (
        <CustomToast
          key={toast.id}
          open
          type={toast.type}
          message={toast.message}
          offset={index}
          handleClose={() => setToasts(previous => previous.filter(item => item.id !== toast.id))}
        />
      ))}
    </>
  )
}

export default AssignRoleDialog
