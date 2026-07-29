import { useMutation } from '@tanstack/react-query'

import { Login } from './services'

export const useData = () => {
  return {
    get: {},
    set: {
      auth: {
        login: useMutation({
          mutationKey: ['login'],
          mutationFn: Login
        })
      }
    }
  }
}
