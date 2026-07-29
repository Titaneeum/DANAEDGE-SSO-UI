import axios from 'axios'

const baseURL = process.env.NEXT_PUBLIC_API_URL
const adminURL = '/api/v1/env/mobile/superadmin'

export const Login = async () => {
  const response = await axios({
    baseURL,
    url: `${adminURL}/login`,
    method: 'POST',
    headers: {
      Accept: 'application/json'
    }
  })

  const payload = response.data

  if (payload.response_code === 200) {
    return payload
  } else throw payload
}
