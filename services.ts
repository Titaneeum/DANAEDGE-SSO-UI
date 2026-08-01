import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const adminURL = '/api/v1/env/mobile/superadmin'

// --------------------- reusable function -------------------------

export const getLoginToken = () => {
  if (typeof window === 'undefined') return null

  return (
    localStorage.getItem('login_token') ||
    (() => {
      const m = document.cookie.match(/(?:^|;\s*)login_token=([^;]+)/)

      return m ? decodeURIComponent(m[1]) : null
    })()
  )
}

const deleteCookieEverywhere = (name: string) => {
  const expires = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  const sameSite = 'SameSite=Lax'
  const secure = location.protocol === 'https:' ? '; Secure' : ''

  const host = window.location.hostname // e.g. portal-dev.danaedge.com
  const parts = host.split('.')
  const rootDomain = parts.length >= 2 ? `.${parts.slice(-2).join('.')}` : host // .danaedge.com (best guess)

  // try a few common domain variants
  const domains = [
    '', // host-only
    `; Domain=${host}`,
    `; Domain=${rootDomain}`,
    `; Domain=.danaedge.com` // optional hardcode if you know it
  ]

  // try common paths
  const paths = ['/', '/admin', '/en', '/ms']

  for (const d of domains) {
    for (const p of paths) {
      document.cookie = `${name}=; Path=${p}; ${expires}; ${sameSite}${d}${secure}`
    }
  }
}

const clearAdminAuth = () => {
  localStorage.removeItem('login_token')
  localStorage.removeItem('login_mfa_token')
  localStorage.removeItem('custom_base_url')
  deleteCookieEverywhere('login_token')
  location.replace('/login')
}

const ADMIN_AUTH_ERROR_CODES = new Set([10184, 10255, 10274, 7777])

const handleAdminAuthError = (responseCode: unknown) => {
  if (typeof responseCode !== 'number' || !ADMIN_AUTH_ERROR_CODES.has(responseCode)) return false

  clearAdminAuth()

  return true
}

// -----------------------------------------------------------------

// ------------------------- login API  ----------------------------

export const Login = async ({ username, password }: { username: string; password: string }) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/login`,
    method: 'POST',
    headers: {
      Accept: 'application/json'
    },
    data: { username, password, system_type_id: 1 }
  })

  return response.data
}

// -----------------------------------------------------------------

// ----------------------- admin user API  -------------------------
export const ListUserLoginAttempt = async ({
  start,
  length,
  filter_array_objects
}: {
  start: number
  length: number
  filter_array_objects: string
}) => {
  const token = getLoginToken()

  const response = await axios({
    baseURL,
    url: `${adminURL}/AdminListOfUserLoginAttempt`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    data: { start, length, filter_array_objects }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const ListAdminUsers = async ({
  start,
  length,
  filter_array_objects
}: {
  start: number
  length: number
  filter_array_objects: string
}) => {
  const token = getLoginToken()

  const response = await axios({
    baseURL,
    url: `${adminURL}/ListOfAdminUser`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`
    },
    data: { start, length, filter_array_objects }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const CreateAdminUser = async ({
  username,
  email,
  password,
  first_name,
  last_name
}: {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
}) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/CreateAdminUser`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },
    data: { username, email, password, first_name, last_name }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const LockUnlockAdminUser = async ({
  user_id,
  user_account_state_id
}: {
  user_id: number
  user_account_state_id: number
}) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/LockUnlockAdminUser`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },
    data: { user_id, user_account_state_id }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

// -----------------------------------------------------------------

// -------------------- route permission API  ----------------------
export const RoutePermissionList = async (sso_client_identifier: string) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/getRoutePermission`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },
    data: { sso_client_identifier }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const UnassignedRoutePermission = async (sso_client_identifier: string) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/getUnassignedRoutePermission`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },
    data: { sso_client_identifier }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const CreateORUpdateRoutePermission = async ({
  as,
  sso_client_identifier,
  permissions
}: {
  as: string
  sso_client_identifier: string
  permissions: Array<{ system_type_id: number; module_id: number; right_id: number }>
}) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/createOrUpdateRoutePermission`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },
    data: { as, sso_client_identifier, permissions }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const RoleList = async ({
  start,
  length,
  filter_array_objects
}: {
  start: number
  length: number
  filter_array_objects: string
}) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/ListRoles`,
    method: 'POST',
    headers: {
      Accept: 'application/json'
    },
    data: { token: getLoginToken(), start, length, filter_array_objects }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

export const ModuleList = async ({
  start,
  length,
  filter_array_objects
}: {
  start: number
  length: number
  filter_array_objects: string
}) => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/ListModules`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${getLoginToken()}`
    },

    data: { start, length, filter_array_objects }
  })

  const payload = response.data

  if (payload.response_code === 2100) {
    return payload.data
  }

  handleAdminAuthError(payload.response_code)

  //else
  throw payload
}

// -----------------------------------------------------------------
