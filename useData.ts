import { useMutation } from '@tanstack/react-query'

import { CreateAdminUser, ListAdminUsers, ListUserLoginAttempt, Login } from './services'

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
        })
      }
    }
  }
}
