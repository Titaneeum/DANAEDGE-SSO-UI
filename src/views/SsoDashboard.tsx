'use client'

import * as React from 'react'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

import DashCard from '@/components/DashCard'
import SSOClientSwitcher, {
  DEFAULT_SSO_CLIENT_IDENTIFIER,
  type SSOClientIdentifier
} from '@/components/SSOClientSwitcher'
import { useData } from '../../useData'

type RouteRow = {
  as?: string
  uri?: string
  methods?: string[]
  permissions?: unknown[]
  enableRoutePermission?: number
}

type RouteSummary = {
  assigned: number
  enabled: number
  total: number
  unassigned: number
}

type RoleSummary = {
  total: number
  modules: number
  rights: number
  users: number
}

type ModuleSummary = {
  total: number
  protected: number
  custom: number
  routes: number
  roles: number
  users: number
}

const emptyRouteSummary: RouteSummary = { assigned: 0, enabled: 0, total: 0, unassigned: 0 }
const emptyRoleSummary: RoleSummary = { total: 0, modules: 0, rights: 0, users: 0 }
const emptyModuleSummary: ModuleSummary = { total: 0, protected: 0, custom: 0, routes: 0, roles: 0, users: 0 }

const SsoDashboard = () => {
  const { lang } = useParams<{ lang: string }>()
  const [selectedClient, setSelectedClient] = React.useState<SSOClientIdentifier>(DEFAULT_SSO_CLIENT_IDENTIFIER)
  const [routes, setRoutes] = React.useState<RouteRow[]>([])
  const [routeSummary, setRouteSummary] = React.useState<RouteSummary>(emptyRouteSummary)
  const [adminUsers, setAdminUsers] = React.useState(0)
  const [roleSummary, setRoleSummary] = React.useState<RoleSummary>(emptyRoleSummary)
  const [moduleSummary, setModuleSummary] = React.useState<ModuleSummary>(emptyModuleSummary)
  const [errors, setErrors] = React.useState<string[]>([])

  const data = useData()
  const { mutate: getRoutePermissions, isPending: isRoutesPending } = data.set.routePermission.list

  const { mutate: getUnassignedRoutes, isPending: isSummaryPending } =
    data.set.routePermission.unassignedRoutePermission

  const { mutate: getAdminUsers, isPending: isAdminsPending } = data.set.adminUser.adminUserList
  const { mutate: getRoles, isPending: isRolesPending } = data.set.routePermission.roleList
  const { mutate: getModules, isPending: isModulesPending } = data.set.routePermission.moduleList

  const isPermissionLoading = isRoutesPending || isSummaryPending || isModulesPending
  const coverage = routeSummary.total ? Math.round((routeSummary.assigned / routeSummary.total) * 100) : 0

  const reportError = React.useCallback((message: string) => {
    setErrors(previous => (previous.includes(message) ? previous : [...previous, message]))
  }, [])

  const fetchPermissionOverview = React.useCallback(
    (client: SSOClientIdentifier) => {
      getRoutePermissions(client, {
        onSuccess: response => {
          const rows = Array.isArray(response) ? response : response?.routes

          setRoutes(Array.isArray(rows) ? rows : [])
        },
        onError: () => reportError('Route permissions could not be loaded.')
      })

      getUnassignedRoutes(client, {
        onSuccess: response => {
          setRouteSummary({
            assigned: Number(response?.assigned_routes_count ?? 0),
            enabled: Number(response?.enabled_routes_count ?? 0),
            total: Number(response?.total_routes_from_sso_client ?? 0),
            unassigned: Number(response?.unassigned_routes_count ?? 0)
          })
        },
        onError: () => reportError('Route coverage could not be loaded.')
      })

      getModules(
        {
          start: 0,
          length: 100,
          filter_array_objects: JSON.stringify([
            { filter_column: 'sso_client_identifier', filter_value: client }
          ])
        },
        {
          onSuccess: response => {
            const modules = Array.isArray(response?.modules) ? response.modules : []

            setModuleSummary({
              total: Number(response?.recordsTotal ?? modules.length),
              protected: modules.filter((module: any) => module?.is_predefined || !module?.can_delete).length,
              custom: modules.filter((module: any) => !module?.is_predefined && module?.can_delete).length,
              routes: modules.reduce(
                (total: number, module: any) => total + Number(module?.routes_permissions_count ?? 0),
                0
              ),
              roles: modules.reduce(
                (total: number, module: any) => total + Number(module?.role_permission_count ?? 0),
                0
              ),
              users: modules.reduce(
                (total: number, module: any) => total + Number(module?.user_permission_count ?? 0),
                0
              )
            })
          },
          onError: () => reportError('Module inventory could not be loaded.')
        }
      )
    },
    [getModules, getRoutePermissions, getUnassignedRoutes, reportError]
  )

  const fetchWorkspaceOverview = React.useCallback(() => {
    getAdminUsers(
      {
        start: 0,
        length: 1,
        filter_array_objects: JSON.stringify([{ filter_column: 'source_reference_id', filter_value: '' }])
      },
      {
        onSuccess: response => {
          const responseData = response?.data
          const rows = Array.isArray(responseData) ? responseData : responseData?.data

          setAdminUsers(Number(responseData?.recordsTotal ?? rows?.length ?? 0))
        },
        onError: () => reportError('Admin user totals could not be loaded.')
      }
    )

    getRoles(
      {
        start: 0,
        length: 100,
        filter_array_objects: JSON.stringify([
          { filter_column: 'created_at', filter_start: '2018-01-01', filter_end: '2050-01-01' },
          { filter_column: 'keyword', filter_value: '' }
        ])
      },
      {
        onSuccess: response => {
          const roles = response?.roles ?? response?.data?.data ?? response?.data ?? []
          const rows = Array.isArray(roles) ? roles : []

          setRoleSummary({
            total: Number(response?.recordsTotal ?? rows.length),
            modules: rows.reduce((total: number, role: any) => total + Number(role?.modules_count ?? 0), 0),
            rights: rows.reduce((total: number, role: any) => total + Number(role?.total_rights_count ?? 0), 0),
            users: rows.reduce((total: number, role: any) => total + Number(role?.users_count ?? 0), 0)
          })
        },
        onError: () => reportError('Role totals could not be loaded.')
      }
    )
  }, [getAdminUsers, getRoles, reportError])

  React.useEffect(() => {
    fetchWorkspaceOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    setErrors([])
    setRoutes([])
    setRouteSummary(emptyRouteSummary)
    setModuleSummary(emptyModuleSummary)
    fetchPermissionOverview(selectedClient)
  }, [fetchPermissionOverview, selectedClient])

  const refreshDashboard = () => {
    setErrors([])
    fetchWorkspaceOverview()
    fetchPermissionOverview(selectedClient)
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <div className='mb-1 flex items-center gap-2'>
            <i className='tabler-gauge text-2xl text-primary' />
            <Typography variant='h4' className='font-bold'>
              SSO Operations Dashboard
            </Typography>
          </div>
          <Typography color='text.secondary'>
            Monitor administrators, roles, modules, and route-permission coverage from one workspace.
          </Typography>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <SSOClientSwitcher value={selectedClient} onChange={setSelectedClient} disabled={isPermissionLoading} />
          <Button
            variant='outlined'
            startIcon={<i className={isPermissionLoading ? 'tabler-loader-2 animate-spin' : 'tabler-refresh'} />}
            onClick={refreshDashboard}
            disabled={isPermissionLoading || isAdminsPending || isRolesPending}
          >
            Refresh
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <Alert severity='warning' onClose={() => setErrors([])}>
          {errors.join(' ')} Other dashboard sections remain available.
        </Alert>
      )}

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5'>
        <DashCard
          title='Admin Users'
          value={adminUsers}
          icon={<i className='tabler-users-group' />}
          color='primary'
          loading={isAdminsPending}
        />
        <DashCard
          title='Roles'
          value={roleSummary.total}
          icon={<i className='tabler-user-cog' />}
          color='info'
          loading={isRolesPending}
        />
        <DashCard
          title='Modules'
          value={moduleSummary.total}
          icon={<i className='tabler-box' />}
          color='info'
          loading={isModulesPending}
        />
        <DashCard
          title='Assigned Routes'
          value={routeSummary.assigned}
          icon={<i className='tabler-route-square' />}
          color='success'
          loading={isPermissionLoading}
        />
        <DashCard
          title='Unassigned Routes'
          value={routeSummary.unassigned}
          icon={<i className='tabler-route-off' />}
          color='warning'
          loading={isPermissionLoading}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <Card className='rounded-xl border border-solid border-divider shadow-sm xl:col-span-2'>
          <CardContent className='!p-6'>
            <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <Typography variant='h5' className='font-semibold'>
                  Route Permission Coverage
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedClient === 'MFS_DEFAULT' ? 'Merchant Facing System' : 'Payment Switch'} route readiness
                </Typography>
              </div>
              <Chip
                variant='tonal'
                color={coverage >= 80 ? 'success' : coverage >= 50 ? 'warning' : 'error'}
                label={`${coverage}% covered`}
              />
            </div>

            {isSummaryPending ? (
              <div className='space-y-4'>
                <Skeleton height={28} />
                <Skeleton height={90} />
              </div>
            ) : (
              <>
                <LinearProgress
                  variant='determinate'
                  value={coverage}
                  color={coverage >= 80 ? 'success' : coverage >= 50 ? 'warning' : 'error'}
                  sx={{ height: 10, borderRadius: 5, mb: 5 }}
                />
                <div className='grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-4'>
                  {[
                    ['Total routes', routeSummary.total, 'tabler-route'],
                    ['Assigned', routeSummary.assigned, 'tabler-shield-check'],
                    ['Enabled', routeSummary.enabled, 'tabler-circle-check'],
                    ['Needs setup', routeSummary.unassigned, 'tabler-alert-circle']
                  ].map(([label, value, icon]) => (
                    <div key={String(label)} className='rounded-xl bg-actionHover p-4'>
                      <i className={`${icon} mb-2 text-xl text-primary`} />
                      <Typography variant='h5' className='font-bold'>{value}</Typography>
                      <Typography variant='caption' color='text.secondary'>{label}</Typography>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-xl border border-solid border-divider shadow-sm'>
          <CardContent className='!p-6'>
            <Typography variant='h5' className='font-semibold'>Access Inventory</Typography>
            <Typography variant='body2' color='text.secondary' className='mb-5'>
              Module usage for the selected client and role membership totals
            </Typography>
            <div className='space-y-1'>
              {[
                { label: 'Protected modules', value: moduleSummary.protected, icon: 'tabler-lock', color: 'secondary', loading: isModulesPending },
                { label: 'Custom modules', value: moduleSummary.custom, icon: 'tabler-box', color: 'primary', loading: isModulesPending },
                { label: 'Route permission links', value: moduleSummary.routes, icon: 'tabler-route', color: 'info', loading: isModulesPending },
                { label: 'Role permission links', value: moduleSummary.roles, icon: 'tabler-key', color: 'warning', loading: isModulesPending },
                { label: 'Direct user grants', value: moduleSummary.users, icon: 'tabler-user-check', color: 'success', loading: isModulesPending },
                { label: 'Role memberships', value: roleSummary.users, icon: 'tabler-users', color: 'success', loading: isRolesPending }
              ].map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && <Divider />}
                  <div className='flex items-center justify-between py-4'>
                    <div className='flex items-center gap-3'>
                      <Box
                        className='flex size-10 items-center justify-center rounded-lg'
                        sx={{ color: `${item.color}.main`, bgcolor: `${item.color}.lightOpacity` }}
                      >
                        <i className={`${item.icon} text-xl`} />
                      </Box>
                      <Typography>{item.label}</Typography>
                    </div>
                    {item.loading ? <Skeleton width={35} /> : <Typography className='font-bold'>{item.value}</Typography>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-3'>
        <Card className='rounded-xl border border-solid border-divider shadow-sm xl:col-span-2'>
          <CardContent className='!p-0'>
            <div className='flex items-center justify-between px-6 py-5'>
              <div>
                <Typography variant='h5' className='font-semibold'>Protected Routes</Typography>
                <Typography variant='body2' color='text.secondary'>Recent routes for the selected SSO client</Typography>
              </div>
              <Button component={Link} href={`/${lang}/route-permission-list`} endIcon={<i className='tabler-arrow-right' />}>
                View all
              </Button>
            </div>
            <Divider />
            {isRoutesPending ? (
              <div className='space-y-3 p-6'>{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} height={45} />)}</div>
            ) : routes.length ? (
              routes.slice(0, 5).map((route, index) => (
                <React.Fragment key={`${route.as ?? route.uri}-${index}`}>
                  {index > 0 && <Divider />}
                  <div className='flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-is-0'>
                      <Typography className='truncate font-medium'>{route.as || route.uri || 'Unnamed route'}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {route.permissions?.length ?? 0} permission{route.permissions?.length === 1 ? '' : 's'} assigned
                      </Typography>
                    </div>
                    <div className='flex shrink-0 flex-wrap gap-2'>
                      {(route.methods ?? []).map(method => <Chip key={method} size='small' variant='tonal' color='primary' label={method} />)}
                      <Chip size='small' variant='tonal' color={route.enableRoutePermission === 1 ? 'success' : 'error'} label={route.enableRoutePermission === 1 ? 'Enabled' : 'Disabled'} />
                    </div>
                  </div>
                </React.Fragment>
              ))
            ) : (
              <div className='px-6 py-12 text-center'>
                <i className='tabler-route-off mb-2 text-4xl text-textDisabled' />
                <Typography color='text.secondary'>No assigned routes for this SSO client.</Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='rounded-xl border border-solid border-divider shadow-sm'>
          <CardContent className='!p-6'>
            <Typography variant='h5' className='font-semibold'>Workspace Shortcuts</Typography>
            <Typography variant='body2' color='text.secondary' className='mb-4'>Manage the areas summarized here</Typography>
            <div className='space-y-2'>
              {[
                ['Admin users', 'admin-user-list', 'tabler-users-group'],
                ['Route permissions', 'route-permission-list', 'tabler-route-square'],
                ['Unassigned routes', 'unassigned-route-permission', 'tabler-route-off'],
                ['Roles', 'role-list', 'tabler-user-cog'],
                ['Modules', 'module-list', 'tabler-box']
              ].map(([label, path, icon]) => (
                <Button
                  key={path}
                  component={Link}
                  href={`/${lang}/${path}`}
                  fullWidth
                  color='secondary'
                  className='!justify-between !px-4 !py-3'
                  startIcon={<i className={`${icon} text-xl`} />}
                  endIcon={<i className='tabler-chevron-right' />}
                >
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SsoDashboard
