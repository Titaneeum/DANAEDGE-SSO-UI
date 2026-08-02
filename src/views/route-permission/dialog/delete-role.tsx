'use client'

import * as React from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import CustomToast from '@/components/custom-toast'
import type { ToastItem } from '@/libs/types'
import { useData } from '../../../../useData'

type DeleteRoleData = {
  id: number
  role_name: string
}

interface DeleteRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  data: DeleteRoleData | null
}

const DeleteRoleDialog = ({ open, onClose, onSuccess, data }: DeleteRoleDialogProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const { mutate: deleteRole, isPending: isDeleteRolePending } = useData().set.routePermission.deleteRole

  const handleClose = () => {
    if (!isDeleteRolePending) onClose()
  }

  const handleDelete = () => {
    if (!data) return

    deleteRole(data.id, {
      onSuccess: () => {
        setToasts(previous => [
          ...previous,
          { id: Date.now() + Math.random(), type: 'success', message: 'Role deleted successfully' }
        ])
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
            message: apiError.description || apiError.message || 'Failed to delete role'
          }
        ])
      }
    })
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth='xs'
        PaperProps={{ className: 'rounded-2xl !m-3 sm:!m-8' }}
      >
        <DialogContent className='relative !px-5 !pb-5 !pt-7 text-center sm:!px-8 sm:!pb-7 sm:!pt-8'>
          <IconButton
            type='button'
            size='small'
            aria-label='Close delete role dialog'
            onClick={handleClose}
            disabled={isDeleteRolePending}
            className='!absolute right-3 top-3'
          >
            <i className='tabler-x' />
          </IconButton>

          <div className='mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-error/10 text-error'>
            <i className='tabler-trash text-3xl' />
          </div>
          <Typography variant='h5' className='mb-2 font-semibold'>
            Delete this role?
          </Typography>
          <Typography variant='body2' color='text.secondary' className='mx-auto max-is-[360px]'>
            This permanently removes the role and its permission assignments. This action cannot be undone.
          </Typography>

          <div className='mt-5 rounded-xl border border-solid border-divider bg-actionHover px-4 py-3 text-start'>
            <Typography variant='caption' color='text.secondary'>
              ROLE TO DELETE
            </Typography>
            <Typography className='truncate font-semibold' color='text.primary'>
              {data?.role_name.replaceAll('_', ' ') || 'Unknown role'}
            </Typography>
          </div>
        </DialogContent>

        <DialogActions className='flex-col-reverse gap-2 border-0 border-t border-solid border-divider !px-5 !py-4 sm:flex-row sm:!px-8 max-sm:[&>button]:!m-0 max-sm:[&>button]:is-full'>
          <Button type='button' variant='outlined' color='secondary' onClick={handleClose} disabled={isDeleteRolePending}>
            Keep role
          </Button>
          <Button
            type='button'
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={!data || isDeleteRolePending}
            startIcon={<i className={isDeleteRolePending ? 'tabler-loader-2 animate-spin' : 'tabler-trash'} />}
          >
            {isDeleteRolePending ? 'Deleting...' : 'Delete role'}
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

export default DeleteRoleDialog
