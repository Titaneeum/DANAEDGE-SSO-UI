'use client'

import * as React from 'react'

import { useForm } from '@mantine/form'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

import CustomTextField from '@/@core/components/mui/TextField'
import CustomToast from '@/components/custom-toast'
import type { ToastItem } from '@/libs/types'
import type { SSOClientIdentifier } from '@/components/SSOClientSwitcher'
import { useData } from '../../../../useData'

type ClientIdentifier = SSOClientIdentifier | ''

type ModuleOption = {
  id: number
  name: string
  description?: string
}

type RoleForm = {
  role_name: string
  description: string
  role_permissions: Array<{
    key: number
    sso_client_identifier: ClientIdentifier
    system_type_id: 2
    modules_permissions: Array<{
      key: number
      module_id: number | null
      right_status_ids: number[]
    }>
  }>
}

export type RoleDialogData = {
  role_name: string
  description?: string
  modules?: Array<{
    module_id: number
    module_name?: string
    right_status_ids?: number[]
  }>
  role_permissions?: Array<{
    sso_client_identifier: ClientIdentifier
    system_type_id?: number
    modules_permissions?: Array<{
      module_id: number | null
      right_status_ids?: number[]
    }>
  }>
}

interface CreateRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'create' | 'update'
  data?: RoleDialogData | null
}

let itemKey = 0

const nextKey = () => ++itemKey

const emptyModulePermission = (): RoleForm['role_permissions'][number]['modules_permissions'][number] => ({
  key: nextKey(),
  module_id: null,
  right_status_ids: []
})

const emptyRolePermission = (): RoleForm['role_permissions'][number] => ({
  key: nextKey(),
  sso_client_identifier: '',
  system_type_id: 2,
  modules_permissions: [emptyModulePermission()]
})

const initialValues = (): RoleForm => ({
  role_name: '',
  description: '',
  role_permissions: [emptyRolePermission()]
})

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
].map((name, index) => ({ id: index + 1, name: name.replace(/_status$/, '').replaceAll('_', ' ') }))

const getModules = (response: any): ModuleOption[] => {
  const rows = Array.isArray(response?.modules)
    ? response.modules
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : []

  return rows
    .map((module: any) => {
      const id = Number(module?.module_id ?? module?.id)

      if (!Number.isFinite(id)) return null

      return {
        id,
        name: String(module?.module_name ?? module?.name ?? `Module ${id}`),
        description: module?.description ? String(module.description) : undefined
      }
    })
    .filter((module: ModuleOption | null): module is ModuleOption => Boolean(module))
}

const CreateRoleDialog = ({ open, onClose, onSuccess, mode = 'create', data }: CreateRoleDialogProps) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [moduleOptions, setModuleOptions] = React.useState<Record<number, ModuleOption[]>>({})
  const [loadingGroups, setLoadingGroups] = React.useState<number[]>([])

  const { mutate: createRole, isPending: isCreateRolePending } = useData().set.routePermission.createOrUpdateRole
  const { mutate: getModuleList } = useData().set.routePermission.moduleList

  const form = useForm<RoleForm>({
    initialValues: initialValues(),
    validate: {
      role_name: value => {
        const roleName = value.trim()

        if (!roleName) return 'Role name is required'
        if (!/^[A-Za-z0-9_]+$/.test(roleName)) return 'Use only letters, numbers, and underscores'

        return null
      },
      description: value => (!value.trim() ? 'Description is required' : null),
      role_permissions: {
        sso_client_identifier: value => (!value ? 'SSO client is required' : null),
        modules_permissions: {
          module_id: value => (value == null ? 'Module is required' : null),
          right_status_ids: value => (!value.length ? 'Select at least one right' : null)
        }
      }
    }
  })

  const isUpdate = mode === 'update'

  const pushToast = React.useCallback((type: ToastItem['type'], message: string) => {
    setToasts(previous => [...previous, { id: Date.now() + Math.random(), type, message }])
  }, [])

  const loadModules = (groupKey: number, client: ClientIdentifier) => {
    if (!client) return

    setLoadingGroups(previous => [...previous, groupKey])
    getModuleList(
      {
        start: 0,
        length: 100,
        filter_array_objects: JSON.stringify([{ filter_column: 'sso_client_identifier', filter_value: client }])
      },
      {
        onSuccess: response => {
          setModuleOptions(previous => ({ ...previous, [groupKey]: getModules(response) }))
          setLoadingGroups(previous => previous.filter(key => key !== groupKey))
        },
        onError: () => {
          setLoadingGroups(previous => previous.filter(key => key !== groupKey))
          pushToast('error', 'Failed to fetch module list')
        }
      }
    )
  }

  React.useEffect(() => {
    if (!open || !isUpdate || !data) return

    const rolePermissions = data.role_permissions?.length
      ? data.role_permissions.map(rolePermission => ({
          key: nextKey(),
          sso_client_identifier: rolePermission.sso_client_identifier,
          system_type_id: 2 as const,
          modules_permissions: rolePermission.modules_permissions?.length
            ? rolePermission.modules_permissions.map(modulePermission => ({
                key: nextKey(),
                module_id: modulePermission.module_id,
                right_status_ids: modulePermission.right_status_ids ?? []
              }))
            : [emptyModulePermission()]
        }))
      : data.modules?.length
        ? [
            {
              key: nextKey(),
              sso_client_identifier: 'MFS_DEFAULT' as const,
              system_type_id: 2 as const,
              modules_permissions: data.modules.map(module => ({
                key: nextKey(),
                module_id: module.module_id,
                right_status_ids: module.right_status_ids ?? []
              }))
            }
          ]
        : [emptyRolePermission()]

    form.setValues({
      role_name: data.role_name ?? '',
      description: data.description ?? '',
      role_permissions: rolePermissions
    })
    form.clearErrors()
    setModuleOptions({})
    rolePermissions.forEach(rolePermission => {
      if (rolePermission.sso_client_identifier) loadModules(rolePermission.key, rolePermission.sso_client_identifier)
    })

    // Hydrate only when a new selected role is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isUpdate, open])

  const resetAndClose = () => {
    if (isCreateRolePending) return

    form.setValues(initialValues())
    form.resetDirty()
    form.clearErrors()
    setModuleOptions({})
    setLoadingGroups([])
    onClose()
  }

  const handleSubmit = (values: RoleForm) => {
    createRole(
      {
        role_name: values.role_name.trim(),
        description: values.description.trim(),
        role_permissions: values.role_permissions.map(rolePermission => ({
          sso_client_identifier: rolePermission.sso_client_identifier,
          system_type_id: rolePermission.system_type_id,
          modules_permissions: rolePermission.modules_permissions.map(modulePermission => ({
            module_id: Number(modulePermission.module_id),
            right_status_ids: modulePermission.right_status_ids.map(Number)
          }))
        }))
      },
      {
        onSuccess: () => {
          pushToast('success', `Role ${isUpdate ? 'updated' : 'created'} successfully`)
          form.setValues(initialValues())
          setModuleOptions({})
          onClose()
          onSuccess()
        },
        onError: error => {
          const apiError = error as { description?: string; message?: string }

          pushToast('error', apiError.description || apiError.message || `Failed to ${isUpdate ? 'update' : 'create'} role`)
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
        maxWidth='lg'
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
                <i className={`${isUpdate ? 'tabler-user-edit' : 'tabler-user-shield'} text-2xl`} />
              </div>
              <div>
                <Typography variant='h5' className='font-semibold'>
                  {isUpdate ? 'Update role' : 'Create role'}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {isUpdate
                    ? 'Update the role details and assigned module rights.'
                    : 'Define a role and assign module rights for one or more SSO clients.'}
                </Typography>
              </div>
            </div>
            <IconButton
              type='button'
              size='small'
              aria-label={`Close ${isUpdate ? 'update' : 'create'} role dialog`}
              onClick={resetAndClose}
              disabled={isCreateRolePending}
            >
              <i className='tabler-x' />
            </IconButton>
          </DialogTitle>

          <DialogContent className='min-bs-0 flex-1 overflow-y-auto !px-4 !py-5 sm:!px-7 sm:!py-7'>
            <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
              <CustomTextField
                {...form.getInputProps('role_name')}
                autoFocus
                fullWidth
                required
                label='Role name'
                placeholder='REPORT_ONLY_ADMIN'
                error={Boolean(form.errors.role_name)}
                helperText={form.errors.role_name || 'Use an uppercase, underscore-separated name'}
              />
              <CustomTextField
                {...form.getInputProps('description')}
                fullWidth
                required
                label='Description'
                placeholder='Admin to use with report only'
                error={Boolean(form.errors.description)}
                helperText={form.errors.description}
              />
            </div>

            <div className='mt-7 space-y-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <Typography className='font-semibold'>Role permissions</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Assign modules and one or more rights per client.
                  </Typography>
                </div>
                <Button
                  type='button'
                  variant='outlined'
                  size='small'
                  startIcon={<i className='tabler-plus' />}
                  disabled={form.values.role_permissions.length >= 2}
                  onClick={() => form.insertListItem('role_permissions', emptyRolePermission())}
                >
                  Add Role Permission
                </Button>
              </div>

              {form.values.role_permissions.map((rolePermission, groupIndex) => {
                const groupPath = `role_permissions.${groupIndex}`
                const isLoadingModules = loadingGroups.includes(rolePermission.key)
                const options = moduleOptions[rolePermission.key] ?? []

                return (
                  <div key={rolePermission.key} className='rounded-xl border border-solid border-divider p-5'>
                    <div className='mb-5 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                          <i className='tabler-server' />
                        </div>
                        <Typography className='font-semibold'>Client permission {groupIndex + 1}</Typography>
                      </div>
                      {form.values.role_permissions.length > 1 && (
                        <IconButton
                          type='button'
                          size='small'
                          color='error'
                          aria-label={`Remove client permission ${groupIndex + 1}`}
                          onClick={() => form.removeListItem('role_permissions', groupIndex)}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      )}
                    </div>

                    <div className='mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                      <CustomTextField
                        select
                        fullWidth
                        required
                        label='SSO client'
                        value={rolePermission.sso_client_identifier}
                        onChange={event => {
                          const client = event.target.value as ClientIdentifier

                          form.setFieldValue(`${groupPath}.sso_client_identifier`, client)
                          form.setFieldValue(`${groupPath}.modules_permissions`, [emptyModulePermission()])
                          setModuleOptions(previous => ({ ...previous, [rolePermission.key]: [] }))
                          loadModules(rolePermission.key, client)
                        }}
                        error={Boolean(form.errors[`${groupPath}.sso_client_identifier`])}
                        helperText={form.errors[`${groupPath}.sso_client_identifier`]}
                      >
                        <MenuItem
                          value='MFS_DEFAULT'
                          disabled={form.values.role_permissions.some(
                            (permission, index) =>
                              index !== groupIndex && permission.sso_client_identifier === 'MFS_DEFAULT'
                          )}
                        >
                          Merchant Facing System
                        </MenuItem>
                        <MenuItem
                          value='MAIN_PS'
                          disabled={form.values.role_permissions.some(
                            (permission, index) =>
                              index !== groupIndex && permission.sso_client_identifier === 'MAIN_PS'
                          )}
                        >
                          Payment Switch
                        </MenuItem>
                      </CustomTextField>
                      <CustomTextField
                        fullWidth
                        disabled
                        label='System type'
                        value={rolePermission.system_type_id}
                        helperText='Fixed system type'
                      />
                    </div>

                    <div className='space-y-4'>
                      {rolePermission.modules_permissions.map((modulePermission, moduleIndex) => {
                        const modulePath = `${groupPath}.modules_permissions.${moduleIndex}`
                        const selectedModule = options.find(option => option.id === modulePermission.module_id) ?? null
                        const moduleError = form.errors[`${modulePath}.module_id`]
                        const rightsError = form.errors[`${modulePath}.right_status_ids`]

                        return (
                          <div key={modulePermission.key} className='rounded-xl bg-actionHover p-4'>
                            <div className='mb-3 flex items-center justify-between'>
                              <Typography variant='body2' className='font-semibold'>
                                Module {moduleIndex + 1}
                              </Typography>
                              {rolePermission.modules_permissions.length > 1 && (
                                <IconButton
                                  type='button'
                                  size='small'
                                  color='error'
                                  aria-label={`Remove module ${moduleIndex + 1}`}
                                  onClick={() => form.removeListItem(`${groupPath}.modules_permissions`, moduleIndex)}
                                >
                                  <i className='tabler-x' />
                                </IconButton>
                              )}
                            </div>
                            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                              <Autocomplete
                                options={options}
                                value={selectedModule}
                                disabled={!rolePermission.sso_client_identifier}
                                loading={isLoadingModules}
                                getOptionLabel={option => option.name.replaceAll('_', ' ')}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                getOptionDisabled={option =>
                                  rolePermission.modules_permissions.some(
                                    (permission, index) => index !== moduleIndex && permission.module_id === option.id
                                  )
                                }
                                onChange={(_, value) =>
                                  form.setFieldValue(`${modulePath}.module_id`, value?.id ?? null)
                                }
                                renderInput={params => (
                                  <CustomTextField
                                    {...params}
                                    required
                                    label='Module'
                                    placeholder={
                                      rolePermission.sso_client_identifier ? 'Search modules' : 'Select a client first'
                                    }
                                    error={Boolean(moduleError)}
                                    helperText={moduleError}
                                    slotProps={{
                                      input: {
                                        ...params.InputProps,
                                        endAdornment: (
                                          <>
                                            {isLoadingModules ? <CircularProgress color='inherit' size={18} /> : null}
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
                                label='Rights'
                                disabled={!rolePermission.sso_client_identifier}
                                value={modulePermission.right_status_ids}
                                onChange={event => {
                                  const value = event.target.value

                                  form.setFieldValue(
                                    `${modulePath}.right_status_ids`,
                                    (typeof value === 'string' ? value.split(',') : value).map(Number)
                                  )
                                }}
                                error={Boolean(rightsError)}
                                helperText={rightsError}
                                slotProps={{
                                  select: {
                                    multiple: true,
                                    renderValue: selected => (
                                      <div className='flex flex-wrap gap-1'>
                                        {(selected as number[]).map(id => (
                                          <Chip
                                            key={id}
                                            size='small'
                                            label={rightOptions.find(right => right.id === id)?.name ?? id}
                                          />
                                        ))}
                                      </div>
                                    )
                                  }
                                }}
                              >
                                {rightOptions.map(right => (
                                  <MenuItem key={right.id} value={right.id}>
                                    <Checkbox checked={modulePermission.right_status_ids.includes(right.id)} />
                                    <ListItemText primary={right.name} className='capitalize' />
                                  </MenuItem>
                                ))}
                              </CustomTextField>
                            </div>
                          </div>
                        )
                      })}

                      <Button
                        type='button'
                        size='small'
                        startIcon={<i className='tabler-plus' />}
                        disabled={
                          !rolePermission.sso_client_identifier ||
                          rolePermission.modules_permissions.length >= options.length
                        }
                        onClick={() => form.insertListItem(`${groupPath}.modules_permissions`, emptyModulePermission())}
                      >
                        Add module
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>

          <DialogActions className='shrink-0 flex-col-reverse gap-2 border-0 border-t border-solid border-divider !px-4 !py-4 sm:flex-row sm:!px-7 sm:!py-5 max-sm:[&>button]:!m-0 max-sm:[&>button]:is-full'>
            <Button
              type='button'
              variant='outlined'
              color='secondary'
              onClick={resetAndClose}
              disabled={isCreateRolePending}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              disabled={isCreateRolePending}
              startIcon={
                <i
                  className={
                    isCreateRolePending
                      ? 'tabler-loader-2 animate-spin'
                      : isUpdate
                        ? 'tabler-user-edit'
                        : 'tabler-user-shield'
                  }
                />
              }
            >
              {isCreateRolePending ? (isUpdate ? 'Updating...' : 'Creating...') : `${isUpdate ? 'Update' : 'Create'} role`}
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

export default CreateRoleDialog
