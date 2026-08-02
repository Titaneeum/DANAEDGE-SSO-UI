'use client'

import * as React from 'react'

import { useForm } from '@mantine/form'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomToast from '@/components/custom-toast'
import type { ToastItem } from '@/libs/types'
import type { SSOClientIdentifier } from '@/components/SSOClientSwitcher'
import { useData } from '../../../../useData'

type ClientIdentifier = SSOClientIdentifier | ''

type ModuleForm = {
  module_name: string
  module_code: string
  description: string
  associated_sso_clients: Array<{
    key: number
    sso_client_identifier: ClientIdentifier
    system_type_id: 2
  }>
}

export type ModuleDialogData = {
  module_name: string
  module_code: string
  description?: string
  associated_sso_clients?: Array<{
    sso_client_identifier: ClientIdentifier
    system_type_id?: number
  }>
}

interface CreateModuleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'create' | 'update'
  data?: ModuleDialogData | null
}

let associationKey = 0

const emptyAssociation = (): ModuleForm['associated_sso_clients'][number] => ({
  key: ++associationKey,
  sso_client_identifier: '',
  system_type_id: 2
})

const initialValues = (): ModuleForm => ({
  module_name: '',
  module_code: '',
  description: '',
  associated_sso_clients: [emptyAssociation()]
})

const validateIdentifier = (value: string, label: string) => {
  const identifier = value.trim()

  if (!identifier) return `${label} is required`
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) return 'Use only letters, numbers, and underscores'

  return null
}

const CreateModuleDialog = ({
  open,
  onClose,
  onSuccess,
  mode = 'create',
  data
}: CreateModuleDialogProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const { mutate: createOrUpdateModule, isPending: isCreatingModule } =
    useData().set.routePermission.createOrUpdateModule

  const form = useForm<ModuleForm>({
    initialValues: initialValues(),
    validate: {
      module_name: value => validateIdentifier(value, 'Module name'),
      module_code: value => validateIdentifier(value, 'Module code'),
      associated_sso_clients: {
        sso_client_identifier: value => (!value ? 'SSO client is required' : null)
      }
    }
  })

  const isUpdate = mode === 'update'

  React.useEffect(() => {
    if (!open || !isUpdate || !data) return

    form.setValues({
      module_name: data.module_name ?? '',
      module_code: data.module_code ?? '',
      description: data.description ?? '',
      associated_sso_clients: data.associated_sso_clients?.length
        ? data.associated_sso_clients.map(client => ({
            key: ++associationKey,
            sso_client_identifier: client.sso_client_identifier,
            system_type_id: 2
          }))
        : [emptyAssociation()]
    })
    form.clearErrors()

    // Hydrate only when the selected module changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isUpdate, open])

  const resetAndClose = () => {
    if (isCreatingModule) return

    form.setValues(initialValues())
    form.resetDirty()
    form.clearErrors()
    onClose()
  }

  const handleSubmit = (values: ModuleForm) => {
    createOrUpdateModule(
      {
        module_name: values.module_name.trim(),
        module_code: values.module_code.trim(),
        description: values.description.trim(),
        associated_sso_clients: values.associated_sso_clients.map(client => ({
          sso_client_identifier: client.sso_client_identifier,
          system_type_id: client.system_type_id
        }))
      },
      {
        onSuccess: () => {
          setToasts(previous => [
            ...previous,
            {
              id: Date.now() + Math.random(),
              type: 'success',
              message: `Module ${isUpdate ? 'updated' : 'created'} successfully`
            }
          ])
          form.setValues(initialValues())
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
              message:
                apiError.description || apiError.message || `Failed to ${isUpdate ? 'update' : 'create'} module`
            }
          ])
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
        maxWidth='md'
        scroll='paper'
        PaperProps={{
          className: 'rounded-2xl !m-3 sm:!m-8',
          sx: { maxHeight: { xs: 'calc(100dvh - 24px)', sm: 'calc(100dvh - 64px)' } }
        }}
      >
        <form
          noValidate
          autoComplete='off'
          onSubmit={form.onSubmit(handleSubmit)}
          className='flex min-bs-0 flex-1 flex-col overflow-hidden'
        >
          <DialogTitle className='shrink-0 flex items-start justify-between gap-3 border-0 border-b border-solid border-divider !px-4 !py-4 sm:!px-7 sm:!py-6'>
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <i className={`${isUpdate ? 'tabler-edit' : 'tabler-box-plus'} text-2xl`} />
              </div>
              <div>
                <Typography variant='h5' className='font-semibold'>
                  {isUpdate ? 'Update module' : 'Create module'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {isUpdate
                    ? 'Update the module details and SSO client associations.'
                    : 'Register a permission module and associate it with SSO clients.'}
                </Typography>
              </div>
            </div>
            <IconButton
              type='button'
              size='small'
              aria-label={`Close ${isUpdate ? 'update' : 'create'} module dialog`}
              onClick={resetAndClose}
              disabled={isCreatingModule}
            >
              <i className='tabler-x' />
            </IconButton>
          </DialogTitle>

          <DialogContent className='min-bs-0 flex-1 overflow-y-auto !px-4 !py-5 sm:!px-7 sm:!py-7'>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <CustomTextField
                {...form.getInputProps('module_name')}
                autoFocus
                fullWidth
                required
                label='Module name'
                placeholder='PAYMENT_CHANNEL'
                error={Boolean(form.errors.module_name)}
                helperText={form.errors.module_name || 'Use an uppercase, underscore-separated name'}
              />
              <CustomTextField
                {...form.getInputProps('module_code')}
                fullWidth
                required
                label='Module code'
                placeholder='PAYMENT_CHANNEL'
                error={Boolean(form.errors.module_code)}
                helperText={form.errors.module_code || 'Stable code used to identify this module'}
              />
              <CustomTextField
                {...form.getInputProps('description')}
                fullWidth
                multiline
                minRows={3}
                label='Description'
                placeholder='Describe what this module controls'
                className='sm:col-span-2'
              />
            </div>

            <div className='mt-7 space-y-4'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <Typography className='font-semibold'>SSO client associations</Typography>
                  <Typography variant='body2' color='text.secondary'>Choose where this module is available.</Typography>
                </div>
                <Button
                  type='button'
                  size='small'
                  variant='outlined'
                  startIcon={<i className='tabler-plus' />}
                  disabled={form.values.associated_sso_clients.length >= 2}
                  onClick={() => form.insertListItem('associated_sso_clients', emptyAssociation())}
                >
                  Add SSO client
                </Button>
              </div>

              {form.values.associated_sso_clients.map((association, index) => {
                const path = `associated_sso_clients.${index}`

                return (
                  <div key={association.key} className='rounded-xl border border-solid border-divider p-4 sm:p-5'>
                    <div className='mb-4 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                          <i className='tabler-server' />
                        </div>
                        <Typography variant='body2' className='font-semibold'>Association {index + 1}</Typography>
                      </div>
                      {form.values.associated_sso_clients.length > 1 && (
                        <IconButton
                          type='button'
                          size='small'
                          color='error'
                          aria-label={`Remove association ${index + 1}`}
                          onClick={() => form.removeListItem('associated_sso_clients', index)}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      )}
                    </div>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <CustomTextField
                        select
                        fullWidth
                        required
                        label='SSO client'
                        value={association.sso_client_identifier}
                        onChange={event =>
                          form.setFieldValue(`${path}.sso_client_identifier`, event.target.value as ClientIdentifier)
                        }
                        error={Boolean(form.errors[`${path}.sso_client_identifier`])}
                        helperText={form.errors[`${path}.sso_client_identifier`]}
                      >
                        <MenuItem
                          value='MFS_DEFAULT'
                          disabled={form.values.associated_sso_clients.some(
                            (client, clientIndex) =>
                              clientIndex !== index && client.sso_client_identifier === 'MFS_DEFAULT'
                          )}
                        >
                          Merchant Facing System
                        </MenuItem>
                        <MenuItem
                          value='MAIN_PS'
                          disabled={form.values.associated_sso_clients.some(
                            (client, clientIndex) => clientIndex !== index && client.sso_client_identifier === 'MAIN_PS'
                          )}
                        >
                          Payment Switch
                        </MenuItem>
                      </CustomTextField>
                      <CustomTextField
                        fullWidth
                        disabled
                        label='System type'
                        value={association.system_type_id}
                        helperText='Fixed system type'
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>

          <DialogActions className='shrink-0 flex-col-reverse gap-2 border-0 border-t border-solid border-divider !px-4 !py-4 sm:flex-row sm:!px-7 sm:!py-5 max-sm:[&>button]:!m-0 max-sm:[&>button]:is-full'>
            <Button type='button' variant='outlined' color='secondary' onClick={resetAndClose} disabled={isCreatingModule}>Cancel</Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isCreatingModule}
              startIcon={<i className={isCreatingModule ? 'tabler-loader-2 animate-spin' : isUpdate ? 'tabler-edit' : 'tabler-box-plus'} />}
            >
              {isCreatingModule ? (isUpdate ? 'Updating...' : 'Creating...') : `${isUpdate ? 'Update' : 'Create'} module`}
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
          handleClose={() => setToasts(previous => previous.filter(item => item.id !== toast.id))}
        />
      ))}
    </>
  )
}

export default CreateModuleDialog
