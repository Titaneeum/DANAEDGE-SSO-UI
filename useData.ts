import { useMutation } from '@tanstack/react-query'

import {
  CreateAdminUser,
  ListAdminUsers,
  ListUserLoginAttempt,
  LockUnlockAdminUser,
  Login,
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
        })
      }
    }
  }
}
