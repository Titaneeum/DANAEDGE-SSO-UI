'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'

// Third-party Imports
import { useForm } from '@mantine/form'
import classnames from 'classnames'

// Type Imports
import type { SystemMode } from '@core/types'
import type { Locale } from '@/configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'
import { useData } from '../../useData'

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

type ErrorType = {
  message: string[]
}

type FormData = {
  username: string
  password: string
}

const Login = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState<ErrorType | null>(null)

  const { mutate: Login, isPending } = useData().set.auth.login

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

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

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = ({ username, password }: FormData) => {
    setErrorState(null)

    Login(
      { username, password },
      {
        onSuccess: data => {
          const loginToken = data?.data?.login_details?.data?.token

          if (typeof loginToken !== 'string' || !loginToken) {
            setErrorState({ message: ['The authentication service did not return a login token.'] })

            return
          }

          localStorage.setItem('login_token', loginToken)

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
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && <MaskImg alt='mask' src={authBackground} />}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}`}</Typography>
            <Typography>Sign in to manage your SSO applications and access policies.</Typography>
          </div>
          <form
            noValidate
            autoComplete='off'
            action={() => {}}
            onSubmit={form.onSubmit(handleSubmit)}
            className='flex flex-col gap-6'
          >
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
                        onClick={handleClickShowPassword}
                        onMouseDown={event => event.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
              error={Boolean(form.errors.password || errorState)}
              helperText={form.errors.password || errorState?.message?.[0]}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Remember me' />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/forgot-password', locale as Locale)}
              >
                Forgot password?
              </Typography>
            </div>
            <Button fullWidth variant='contained' type='submit' disabled={isPending}>
              {isPending ? 'Signing in…' : 'Login'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/register', locale as Locale)} color='primary.main'>
                Create an account
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
