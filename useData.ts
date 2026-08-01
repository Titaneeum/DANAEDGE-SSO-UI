import { useMutation } from '@tanstack/react-query'

import {
  CreateAdminUser,
  CreateORUpdateRoutePermission,
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
        roleList: useMutation({
          mutationKey: ['roleList'],
          mutationFn: RoleList
        })
      }
    }
  }
}
