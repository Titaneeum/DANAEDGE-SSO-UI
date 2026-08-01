'use client'

import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

export type SSOClientIdentifier = 'MFS_DEFAULT' | 'MAIN_PS'

export const DEFAULT_SSO_CLIENT_IDENTIFIER: SSOClientIdentifier = 'MFS_DEFAULT'

type SSOClientSwitcherProps = {
  value: SSOClientIdentifier
  onChange: (value: SSOClientIdentifier) => void
  disabled?: boolean
}

const SSOClientSwitcher = ({ value, onChange, disabled = false }: SSOClientSwitcherProps) => {
  return (
    <ToggleButtonGroup
      exclusive
      size='small'
      color='primary'
      value={value}
      disabled={disabled}
      aria-label='SSO client'
      onChange={(_, nextValue: SSOClientIdentifier | null) => {
        if (nextValue) onChange(nextValue)
      }}
      sx={{
        '& .MuiToggleButton-root': {
          px: 2,
          py: 1,
          textTransform: 'none'
        },
        '& .MuiToggleButton-root.Mui-selected': {
          color: 'primary.contrastText',
          backgroundColor: 'primary.main'
        },
        '& .MuiToggleButton-root.Mui-selected:hover': {
          color: 'primary.contrastText',
          backgroundColor: 'primary.dark'
        }
      }}
    >
      <ToggleButton value='MFS_DEFAULT' aria-label='Merchant Facing System'>
        Merchant Facing System
      </ToggleButton>
      <ToggleButton value='MAIN_PS' aria-label='Payment Switch'>
        Payment Switch
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default SSOClientSwitcher
