'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter, useSearchParams } from 'next/navigation'

import Image from 'next/image'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'

import { useForm } from '@mantine/form'

import companyLogo from '../../public/images/logos/danaedgelogo.png'

import type { SystemMode } from '@core/types'
import type { Locale } from '@/configs/i18n'

import CustomTextField from '@core/components/mui/TextField'

import themeConfig from '@configs/themeConfig'

import { getLocalizedUrl } from '@/utils/i18n'
import { useData } from '../../useData'

type ErrorType = {
  message: string[]
}

type FormData = {
  username: string
  password: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Login = ({ mode: _mode }: { mode: SystemMode }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState<ErrorType | null>(null)

  const { mutate: Login, isPending } = useData().set.auth.login

  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const isLocal = process.env.NEXT_PUBLIC_ENV === 'local'

  useEffect(() => {
    if (searchParams.get('sessionExpired') !== '1') return

    localStorage.removeItem('login_token')
    document.cookie =
      'login_token=; Path=/; SameSite=Lax; Max-Age=0' + (isLocal ? '' : '; Domain=.danaedge.com; Secure')
  }, [isLocal, searchParams])

  const form = useForm<FormData>({
    initialValues: {
      username: '',
      password: ''
    },
    validate: {
      username: value => (!value.trim() ? 'This field is required' : null),
      password: value => {
        if (!value) return 'This field is required'
        if (value.length < 5) return 'Password must be at least 5 characters long'

        return null
      }
    }
  })

  const handleSubmit = ({ username, password }: FormData) => {
    setErrorState(null)

    Login(
      { username, password },
      {
        onSuccess: data => {
          const loginToken = data?.data?.token

          if (typeof loginToken !== 'string' || !loginToken) {
            setErrorState({ message: ['The authentication service did not return a login token.'] })

            return
          }

          localStorage.setItem('login_token', loginToken)
          document.cookie =
            `login_token=${encodeURIComponent(loginToken)}; Path=/; SameSite=Lax` +
            (isLocal ? '' : '; Domain=.danaedge.com; Secure')

          const requestedRedirect = searchParams.get('redirectTo')

          const redirectURL =
            requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
              ? requestedRedirect
              : getLocalizedUrl('/dashboard', locale as Locale)

          router.replace(redirectURL)
          router.refresh()
        },
        onError: error => {
          const message = (error as { response?: { data?: { message?: string[] } } }).response?.data?.message

          setErrorState({ message: message ?? ['Unable to sign in.'] })
        }
      }
    )
  }

  return (
    <main className='relative flex min-bs-[100dvh] items-center justify-center overflow-hidden bg-[#f5f7fb] p-5 dark:bg-[#151521] sm:p-8'>
      <div className='pointer-events-none absolute -start-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 -end-20 size-96 rounded-full bg-[#7c5cff]/10 blur-3xl' />

      <Card className='relative z-[1] is-full max-is-[460px] overflow-visible rounded-2xl border border-solid border-white/70 shadow-[0_24px_80px_rgba(27,35,58,0.14)] dark:border-white/10'>
        <Chip
          label='ADMIN'
          variant='tonal'
          color='primary'
          size='small'
          className='absolute end-5 top-5 font-semibold tracking-wide'
        />

        <CardContent className='!p-7 sm:!p-11'>
          <div className='flex flex-col items-center gap-4 mbe-8'>
            <div className='flex min-bs-[96px] min-is-[168px] items-center justify-center overflow-hidden rounded-xl bg-white px-3 py-2 shadow-sm'>
              <Image
                src={companyLogo}
                alt='Dana Edge company logo'
                width={152}
                height={93}
                priority
                unoptimized
                className='block h-auto max-h-[82px] w-auto max-w-[152px] object-contain'
              />
            </div>
            <div className='flex flex-col items-center gap-2 text-center'>
              <Typography variant='h4' className='font-semibold'>
                {`Welcome to ${themeConfig.templateName}`}
              </Typography>
              <Typography color='text.secondary' className='max-is-[340px]'>
                Sign in to manage your applications, identities and access policies.
              </Typography>
            </div>
          </div>

          <form noValidate autoComplete='off' onSubmit={form.onSubmit(handleSubmit)} className='flex flex-col gap-6'>
            <CustomTextField
              {...form.getInputProps('username')}
              autoFocus
              fullWidth
              label='Username'
              placeholder='Enter your username'
              onChange={event => {
                form.setFieldValue('username', event.target.value)
                if (errorState) setErrorState(null)
              }}
              error={Boolean(form.errors.username || errorState)}
              helperText={form.errors.username || errorState?.message?.[0]}
            />

            <CustomTextField
              {...form.getInputProps('password')}
              fullWidth
              label='Password'
              placeholder='••••••••••••'
              id='login-password'
              type={isPasswordShown ? 'text' : 'password'}
              onChange={event => {
                form.setFieldValue('password', event.target.value)
                if (errorState) setErrorState(null)
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        aria-label={isPasswordShown ? 'Hide password' : 'Show password'}
                        onClick={() => setIsPasswordShown(show => !show)}
                        onMouseDown={event => event.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              error={Boolean(form.errors.password || errorState)}
              helperText={form.errors.password || errorState?.message?.[0]}
            />

            {/* <div className='flex justify-end'>
              <Typography
                className='text-end font-medium'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/forgot-password', locale as Locale)}
              >
                Forgot password?
              </Typography>
            </div> */}

            <Button
              fullWidth
              variant='contained'
              size='large'
              type='submit'
              disabled={isPending}
              className='min-bs-12 rounded-lg font-semibold'
            >
              {isPending ? <i className='tabler-loader-2 animate-spin text-xl' /> : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default Login
