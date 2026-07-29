import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL

const adminURL = '/api/v1/env/mobile/superadmin'

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
