'use client'

import * as React from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'

import { useForm } from '@mantine/form'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomToast from '@/components/custom-toast'
import type { ToastItem } from '@/libs/types'
import { useData } from '../../../../useData'

type CreateAdminForm = {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
}

type CreateAdminDialogProps = {
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

const initialValues: CreateAdminForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: ''
}

const CreateAdminDialog = ({ open, onClose, onCreated }: CreateAdminDialogProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [isPasswordShown, setIsPasswordShown] = React.useState(false)

  const { mutate: CreateAdminUser, isPending: isCreateAdminUserPending } = useData().set.adminUser.createAdminUser

  const form = useForm<CreateAdminForm>({
    initialValues,
    validate: {
      first_name: value => (!value.trim() ? 'First name is required' : null),
      last_name: value => (!value.trim() ? 'Last name is required' : null),
      username: value => {
        const username = value.trim()

        if (!username) return 'Username is required'

        if (username.length < 3) return 'Username must contain at least 3 characters'

        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
          return 'Use only letters, numbers, periods, underscores or hyphens'
        }

        return null
      },
      email: value => {
        if (!value.trim()) return 'Email address is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address'

        return null
      },
      password: value => {
        if (!value) return 'Password is required'

        if (value.length < 8) return 'Password must contain at least 8 characters'

        if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
          return 'Include uppercase, lowercase and a number'
        }

        return null
      }
    }
  })

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const handleCloseToast = (id: number) => {
    setToasts(previous => previous.filter(toast => toast.id !== id))
  }

  const resetAndClose = () => {
    if (isCreateAdminUserPending) return

    form.reset()
    setIsPasswordShown(false)
    onClose()
  }

  const handleSubmit = (values: CreateAdminForm) => {
    CreateAdminUser(
      {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim()
      },
      {
        onSuccess: () => {
          pushToast('success', 'Admin user created successfully')
          form.reset()
          setIsPasswordShown(false)
          onClose()
          onCreated?.()
        },
        onError: error => {
          const apiError = error as { description?: string; message?: string }

          pushToast('error', apiError.description || apiError.message || 'Failed to create admin user')
        }
      }
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={resetAndClose}
        fullWidth
        maxWidth='sm'
        PaperProps={{ className: 'rounded-2xl overflow-visible' }}
      >
        <form noValidate autoComplete='off' onSubmit={form.onSubmit(handleSubmit)}>
          <DialogTitle className='flex items-start justify-between gap-4 border-0 border-b border-solid border-divider !px-7 !py-6'>
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <i className='tabler-user-plus text-2xl' />
              </div>
              <div>
                <Typography variant='h5' className='font-semibold'>
                  Create admin user
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Add a new administrator to the Danaedge SSO workspace.
                </Typography>
              </div>
            </div>
            <IconButton
              type='button'
              aria-label='Close create admin dialog'
              onClick={resetAndClose}
              disabled={isCreateAdminUserPending}
              size='small'
            >
              <i className='tabler-x' />
            </IconButton>
          </DialogTitle>

          <DialogContent className='!px-7 !py-7'>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <CustomTextField
                {...form.getInputProps('first_name')}
                autoFocus
                fullWidth
                required
                label='First name'
                placeholder='Enter first name'
                error={Boolean(form.errors.first_name)}
                helperText={form.errors.first_name}
              />
              <CustomTextField
                {...form.getInputProps('last_name')}
                fullWidth
                required
                label='Last name'
                placeholder='Enter last name'
                error={Boolean(form.errors.last_name)}
                helperText={form.errors.last_name}
              />
              <CustomTextField
                {...form.getInputProps('username')}
                fullWidth
                required
                label='Username'
                placeholder='e.g. jane.admin'
                error={Boolean(form.errors.username)}
                helperText={form.errors.username || 'Used to sign in to the admin portal'}
                className='sm:col-span-2'
              />
              <CustomTextField
                {...form.getInputProps('email')}
                fullWidth
                required
                type='email'
                label='Email address'
                placeholder='admin@company.com'
                error={Boolean(form.errors.email)}
                helperText={form.errors.email}
                className='sm:col-span-2'
              />
              <CustomTextField
                {...form.getInputProps('password')}
                fullWidth
                required
                id='create-admin-password'
                type={isPasswordShown ? 'text' : 'password'}
                label='password'
                placeholder='Enter a secure password'
                error={Boolean(form.errors.password)}
                helperText={form.errors.password || 'At least 8 characters with uppercase, lowercase and a number'}
                className='sm:col-span-2'
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          type='button'
                          aria-label={isPasswordShown ? 'Hide password' : 'Show password'}
                          onClick={() => setIsPasswordShown(shown => !shown)}
                          onMouseDown={event => event.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </div>

            <div className='mt-6 flex gap-3 rounded-xl bg-actionHover p-4'>
              <i className='tabler-shield-check mt-0.5 text-xl text-primary' />
              <Typography variant='body2' color='text.secondary'>
                The new account will be created with administrator access.
              </Typography>
            </div>
          </DialogContent>

          <DialogActions className='border-0 border-t border-solid border-divider !px-7 !py-5'>
            <Button
              type='button'
              variant='outlined'
              color='secondary'
              onClick={resetAndClose}
              disabled={isCreateAdminUserPending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isCreateAdminUserPending}
              startIcon={
                isCreateAdminUserPending ? (
                  <i className='tabler-loader-2 animate-spin' />
                ) : (
                  <i className='tabler-user-plus' />
                )
              }
            >
              {isCreateAdminUserPending ? 'Creating admin…' : 'Create admin'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

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
    </>
  )
}

export default CreateAdminDialog
