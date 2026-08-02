import { useMutation } from '@tanstack/react-query'

import {
  AssignRoleToUser,
  CreateAdminUser,
  CreateOrUpdateModule,
  CreateOrUpdateRole,
  CreateORUpdateRoutePermission,
  DeleteRole,
  ListAdminUsers,
  ListUserLoginAttempt,
  LockUnlockAdminUser,
  Login,
  ModuleList,
  RoleList,
  RoutePermissionList,
  UnassignedRoutePermission
} from './services'

export const useData = () => {
  return {
    get: {},
    set: {
      auth: {
        login: useMutation({
          mutationKey: ['login'],
          mutationFn: Login
        })
      },
      adminUser: {
        userLoginAttemptList: useMutation({
          mutationKey: ['userLoginAttemptList'],
          mutationFn: ListUserLoginAttempt
        }),
        adminUserList: useMutation({
          mutationKey: ['adminUserList'],
          mutationFn: ListAdminUsers
        }),
        createAdminUser: useMutation({
          mutationKey: ['createAdminUser'],
          mutationFn: CreateAdminUser
        }),
        lockUnlockAdminUser: useMutation({
          mutationKey: ['lockUnlockAdminUser'],
          mutationFn: LockUnlockAdminUser
        })
      },
      routePermission: {
        list: useMutation({
          mutationKey: ['routePermissionList'],
          mutationFn: RoutePermissionList
        }),
        unassignedRoutePermission: useMutation({
          mutationKey: ['unassignedRoutePermission'],
          mutationFn: UnassignedRoutePermission
        }),
        createORUpdateRoutePermission: useMutation({
          mutationKey: ['createORUpdateRoutePermission'],
          mutationFn: CreateORUpdateRoutePermission
        }),
        moduleList: useMutation({
          mutationKey: ['moduleList'],
          mutationFn: ModuleList
        }),
        createOrUpdateModule: useMutation({
          mutationKey: ['createOrUpdateModule'],
          mutationFn: CreateOrUpdateModule
        }),
        roleList: useMutation({
          mutationKey: ['roleList'],
          mutationFn: RoleList
        }),
        createOrUpdateRole: useMutation({
          mutationKey: ['createOrUpdateRole'],
          mutationFn: CreateOrUpdateRole
        }),
        deleteRole: useMutation({
          mutationKey: ['deleteRole'],
          mutationFn: DeleteRole
        }),
        assignRoleToUser: useMutation({
          mutationKey: ['assignRoleToUser'],
          mutationFn: AssignRoleToUser
        })
      }
    }
  }
}
