'use client'

import * as React from 'react'

import { useForm } from '@mantine/form'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
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
import { useData } from '../../../../useData'

type SsoClientIdentifier = 'MFS_DEFAULT' | 'MAIN_PS' | ''

type ModuleOption = {
  id: number
  name: string
}

type PermissionForm = {
  as: string
  sso_client_identifier: SsoClientIdentifier
  permissions: Array<{
    system_type_id: 2
    module_id: number | null
    right_id: number | null
  }>
}

const emptyPermission = (): PermissionForm['permissions'][number] => ({
  system_type_id: 2,
  module_id: null,
  right_id: null
})

export type RoutePermissionDialogData = {
  as: string
  sso_client_identifier?: SsoClientIdentifier
  permissions?: Array<{
    system_type_id?: number
    module_id?: number | null
    module_name?: string
    right_id?: number | null
  }>
}

interface CreateRoutePermissionDialogProps {
  open: boolean
  onClose: () => void
  onCreated?: () => void
  onSuccess?: () => void
  mode?: 'create' | 'update'
  data?: RoutePermissionDialogData | null
}

const PAGE_SIZE = 20

const initialValues: PermissionForm = {
  as: '',
  sso_client_identifier: '',
  permissions: [emptyPermission()]
}

const rightOptions = [
  'read_status',
  'edit_status',
  'create_status',
  'delete_status',
  'approve_status',
  'reject_status',
  'download_status',
  'upload_status',
  'maker_status',
  'checker_status'
].map((name, index) => ({ id: index + 1, name }))

const getRows = (response: any): any[] => {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.modules)) return response.modules
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.aaData)) return response.aaData
  if (Array.isArray(response?.rows)) return response.rows
  if (Array.isArray(response?.records)) return response.records

  return []
}

const getModuleOption = (module: any): ModuleOption | null => {
  const id = Number(module?.module_id ?? module?.id)

  if (!Number.isFinite(id)) return null

  return {
    id,
    name: String(module?.module_name ?? module?.name ?? module?.module ?? `Module ${id}`)
  }
}

const CreateRoutePermissionDialog = ({
  open,
  onClose,
  onCreated,
  onSuccess,
  mode = 'create',
  data
}: CreateRoutePermissionDialogProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [moduleOptions, setModuleOptions] = React.useState<ModuleOption[]>([])
  const [selectedModules, setSelectedModules] = React.useState<Array<ModuleOption | null>>([null])
  const [moduleSearch, setModuleSearch] = React.useState('')
  const [debouncedModuleSearch, setDebouncedModuleSearch] = React.useState('')
  const [nextModuleStart, setNextModuleStart] = React.useState(0)
  const [hasMoreModules, setHasMoreModules] = React.useState(false)

  const { mutate: createRoutePermission, isPending: isCreatingRoutePermission } =
    useData().set.routePermission.createORUpdateRoutePermission

  const { mutate: getModuleList, isPending: isGettingModuleList } = useData().set.routePermission.moduleList

  const form = useForm<PermissionForm>({
    initialValues,
    validate: {
      as: value => (!value.trim() ? 'Route is required' : null),
      sso_client_identifier: value => (!value ? 'SSO client is required' : null),
      permissions: {
        module_id: value => (value == null ? 'Module is required' : null),
        right_id: value => (value == null ? 'Right is required' : null)
      }
    }
  })

  const selectedClient = form.values.sso_client_identifier
  const isUpdate = mode === 'update'

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const fetchModules = React.useCallback(
    (start: number, search: string, append: boolean) => {
      if (!selectedClient) return

      const filters: Array<{ filter_column: string; filter_value: string }> = [
        { filter_column: 'sso_client_identifier', filter_value: selectedClient }
      ]

      if (search.trim()) filters.push({ filter_column: 'module_name', filter_value: search.trim() })

      getModuleList(
        { start, length: PAGE_SIZE, filter_array_objects: JSON.stringify(filters) },
        {
          onSuccess: response => {
            const rows = getRows(response)
            const incoming = rows.map(getModuleOption).filter((option): option is ModuleOption => Boolean(option))

            setModuleOptions(previous => {
              const combined = append ? [...previous, ...incoming] : incoming

              return Array.from(new Map(combined.map(option => [option.id, option])).values())
            })
            setNextModuleStart(start + rows.length)

            const total = Number(response?.recordsFiltered ?? response?.recordsTotal ?? response?.total)

            setHasMoreModules(Number.isFinite(total) ? start + rows.length < total : rows.length === PAGE_SIZE)
          },
          onError: () => pushToast('error', 'Failed to fetch module list')
        }
      )
    },
    [getModuleList, pushToast, selectedClient]
  )

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedModuleSearch(moduleSearch), 350)

    return () => window.clearTimeout(timer)
  }, [moduleSearch])

  React.useEffect(() => {
    if (!open || !selectedClient) return

    fetchModules(0, debouncedModuleSearch, false)
  }, [debouncedModuleSearch, fetchModules, open, selectedClient])

  React.useEffect(() => {
    if (!open || !isUpdate || !data) return

    const permissions = data.permissions?.length
      ? data.permissions.map(permission => ({
          system_type_id: 2 as const,
          module_id: permission.module_id ?? null,
          right_id: permission.right_id ?? null
        }))
      : [emptyPermission()]

    form.setValues({
      as: data.as ?? '',
      sso_client_identifier: data.sso_client_identifier ?? '',
      permissions
    })
    setSelectedModules(
      permissions.map((permission, index) => {
        if (permission.module_id == null) return null

        return {
          id: permission.module_id,
          name: data.permissions?.[index]?.module_name ?? `Module ${permission.module_id}`
        }
      })
    )
    setModuleSearch('')
    setDebouncedModuleSearch('')

    // The form instance is intentionally excluded; this should only hydrate when the dialog data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isUpdate, open])

  const resetAndClose = () => {
    if (isCreatingRoutePermission) return

    form.reset()
    setModuleOptions([])
    setSelectedModules([null])
    setModuleSearch('')
    setDebouncedModuleSearch('')
    setNextModuleStart(0)
    setHasMoreModules(false)
    onClose()
  }

  const handleClientChange = (value: SsoClientIdentifier) => {
    form.setFieldValue('sso_client_identifier', value)
    form.setFieldValue(
      'permissions',
      form.values.permissions.map(() => emptyPermission())
    )
    setSelectedModules(form.values.permissions.map(() => null))
    setModuleOptions([])
    setModuleSearch('')
    setDebouncedModuleSearch('')
    setNextModuleStart(0)
    setHasMoreModules(false)
  }

  const handleSubmit = (values: PermissionForm) => {
    createRoutePermission(
      {
        as: values.as.trim(),
        sso_client_identifier: values.sso_client_identifier,
        permissions: values.permissions.map(permission => ({
          system_type_id: permission.system_type_id,
          module_id: Number(permission.module_id),
          right_id: Number(permission.right_id)
        }))
      },
      {
        onSuccess: () => {
          pushToast('success', `Route permission ${isUpdate ? 'updated' : 'created'} successfully`)
          form.reset()
          setModuleOptions([])
          setSelectedModules([null])
          onClose()
          onCreated?.()
          onSuccess?.()
        },
        onError: error => {
          const apiError = error as { description?: string; message?: string }

          pushToast(
            'error',
            apiError.description || apiError.message || `Failed to ${isUpdate ? 'update' : 'create'} route permission`
          )
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
        PaperProps={{ className: 'rounded-2xl overflow-visible !m-3 sm:!m-8' }}
      >
        <form noValidate autoComplete='off' onSubmit={form.onSubmit(handleSubmit)}>
          <DialogTitle className='flex items-start justify-between gap-3 border-0 border-b border-solid border-divider !px-4 !py-4 sm:!px-7 sm:!py-6'>
            <div className='flex items-center gap-4'>
              <div className='flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <i className={`${isUpdate ? 'tabler-shield-edit' : 'tabler-shield-plus'} text-2xl`} />
              </div>
              <div>
                <Typography variant='h5' className='font-semibold'>
                  {isUpdate ? 'Update route permission' : 'Create route permission'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {isUpdate
                    ? 'Update the module rights assigned to this API route.'
                    : 'Assign a module right to an authenticated API route.'}
                </Typography>
              </div>
            </div>
            <IconButton
              type='button'
              aria-label={`Close ${isUpdate ? 'update' : 'create'} route permission dialog`}
              onClick={resetAndClose}
              disabled={isCreatingRoutePermission}
              size='small'
            >
              <i className='tabler-x' />
            </IconButton>
          </DialogTitle>

          <DialogContent className='!px-4 !py-5 sm:!px-7 sm:!py-7'>
            <div className='grid grid-cols-1 gap-5'>
              <CustomTextField
                {...form.getInputProps('as')}
                autoFocus
                fullWidth
                required
                label='Route'
                placeholder='api/v2/authenticated/admin/payment-channels'
                error={Boolean(form.errors.as)}
                helperText={form.errors.as || 'Enter the route without a leading slash'}
              />

              <CustomTextField
                select
                fullWidth
                required
                label='SSO client'
                value={selectedClient}
                onChange={event => handleClientChange(event.target.value as SsoClientIdentifier)}
                error={Boolean(form.errors.sso_client_identifier)}
                helperText={form.errors.sso_client_identifier}
              >
                <MenuItem value='MFS_DEFAULT'>Merchant Facing System</MenuItem>
                <MenuItem value='MAIN_PS'>Payment Switch</MenuItem>
              </CustomTextField>

              <div className='space-y-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='flex items-center gap-3'>
                    <i className='tabler-key text-xl text-primary' />
                    <div>
                      <Typography className='font-medium'>Permissions</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {selectedClient ? 'Choose one or more module rights.' : 'Select an SSO client to continue.'}
                      </Typography>
                    </div>
                  </div>
                  <Button
                    type='button'
                    size='small'
                    variant='outlined'
                    startIcon={<i className='tabler-plus' />}
                    disabled={!selectedClient}
                    onClick={() => {
                      form.insertListItem('permissions', emptyPermission())
                      setSelectedModules(previous => [...previous, null])
                    }}
                  >
                    Add permission
                  </Button>
                </div>

                {form.values.permissions.map((permission, index) => {
                  const moduleError = form.errors[`permissions.${index}.module_id`]
                  const rightError = form.errors[`permissions.${index}.right_id`]

                  return (
                    <div key={index} className='rounded-xl border border-solid border-divider p-5'>
                      <div className='mb-4 flex items-center justify-between'>
                        <Typography variant='body2' className='font-semibold'>
                          Permission {index + 1}
                        </Typography>
                        {form.values.permissions.length > 1 && (
                          <IconButton
                            type='button'
                            size='small'
                            color='error'
                            aria-label={`Remove permission ${index + 1}`}
                            onClick={() => {
                              form.removeListItem('permissions', index)
                              setSelectedModules(previous => previous.filter((_, itemIndex) => itemIndex !== index))
                            }}
                          >
                            <i className='tabler-trash' />
                          </IconButton>
                        )}
                      </div>

                      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
                        <CustomTextField
                          fullWidth
                          disabled
                          label='System type'
                          value={permission.system_type_id}
                          helperText='Fixed system type'
                        />

                        <Autocomplete
                          options={moduleOptions}
                          value={selectedModules[index] ?? null}
                          disabled={!selectedClient}
                          loading={isGettingModuleList}
                          filterOptions={options => options}
                          getOptionLabel={option => option.name.replaceAll('_', ' ')}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          onInputChange={(_, value, reason) => {
                            if (reason === 'input') setModuleSearch(value)
                          }}
                          onChange={(_, value) => {
                            setSelectedModules(previous => previous.map((item, itemIndex) => (itemIndex === index ? value : item)))
                            form.setFieldValue(`permissions.${index}.module_id`, value?.id ?? null)
                          }}
                          ListboxProps={{
                            onScroll: event => {
                              const list = event.currentTarget
                              const isNearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24

                              if (isNearBottom && hasMoreModules && !isGettingModuleList) {
                                fetchModules(nextModuleStart, debouncedModuleSearch, true)
                              }
                            }
                          }}
                          renderInput={params => (
                            <CustomTextField
                              {...params}
                              required
                              label='Module'
                              placeholder={selectedClient ? 'Search modules' : 'Select an SSO client first'}
                              error={Boolean(moduleError)}
                              helperText={moduleError}
                              slotProps={{
                                input: {
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      {isGettingModuleList ? <CircularProgress color='inherit' size={18} /> : null}
                                      {params.InputProps.endAdornment}
                                    </>
                                  )
                                }
                              }}
                            />
                          )}
                        />

                        <CustomTextField
                          select
                          fullWidth
                          required
                          disabled={!selectedClient}
                          label='Right'
                          value={permission.right_id ?? ''}
                          onChange={event => form.setFieldValue(`permissions.${index}.right_id`, Number(event.target.value))}
                          error={Boolean(rightError)}
                          helperText={rightError}
                        >
                          {rightOptions.map(right => (
                            <MenuItem key={right.id} value={right.id}>
                              {right.name.replace(/_status$/, '').replaceAll('_', ' ')}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </DialogContent>

          <DialogActions className='flex-col-reverse gap-2 border-0 border-t border-solid border-divider !px-4 !py-4 sm:flex-row sm:!px-7 sm:!py-5 max-sm:[&>button]:!m-0 max-sm:[&>button]:is-full'>
            <Button type='button' variant='outlined' color='secondary' onClick={resetAndClose} disabled={isCreatingRoutePermission}>
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isCreatingRoutePermission}
              startIcon={
                <i
                  className={
                    isCreatingRoutePermission
                      ? 'tabler-loader-2 animate-spin'
                      : isUpdate
                        ? 'tabler-shield-edit'
                        : 'tabler-shield-plus'
                  }
                />
              }
            >
              {isCreatingRoutePermission ? (isUpdate ? 'Updating...' : 'Creating...') : `${isUpdate ? 'Update' : 'Create'} permission`}
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

export default CreateRoutePermissionDialog
