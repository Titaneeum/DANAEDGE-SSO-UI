'use client'

import * as React from 'react'

import { Accordion, AccordionSummary, AccordionDetails, Box, Button, Chip, Stack, Typography } from '@mui/material'

interface CustomFiltersProps {
  title?: string

  /** Loading state for Apply button (shows spinner icon) */
  loading?: boolean

  /**
   * Simple list of active filter labels to display as chips.
   * Example: ["Start: 10/12/2025 10:00", "Status: SUCCESS"]
   */
  activeTags?: string[]

  /**
   * Called when user clicks "Clear Filter"
   */
  onClear?: () => void

  /**
   * All filter inputs (date pickers, selects, etc.)
   * This component does NOT know about your form library.
   */
  children: React.ReactNode

  /** Optional override for Apply button text */
  applyLabel?: string

  /** Optional override for Clear button text */
  clearLabel?: string
  defaultExpanded?: boolean
}

const CustomFilters: React.FC<CustomFiltersProps> = ({
  title = 'Filter',
  loading = false,
  activeTags = [],
  onClear,
  children,
  applyLabel = 'Apply Filter',
  clearLabel = 'Clear Filter',
  defaultExpanded = true
}) => {
  const activeCount = activeTags.length
  const hasAnyFilter = activeCount > 0

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary>
        <Stack direction='row' alignItems='center' spacing={2}>
          <i className='tabler-adjustments' />
          <Typography variant='h5'>{title}</Typography>

          {hasAnyFilter && <Chip size='small' color='primary' variant='outlined' label={`Active (${activeCount})`} />}
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {/* Parent defines <form>; this is just layout */}
        <div className='space-y-4'>
          {/* Filter inputs */}
          {children}

          {/* Active filter tags */}
          <Box className='flex flex-wrap gap-2'>
            {hasAnyFilter ? (
              activeTags.map(tag => <Chip key={tag} size='small' color='primary' variant='outlined' label={tag} />)
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No active filters.
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <div className='space-x-4'>
            {/* submit triggers outer <form> submit */}
            <Button
              className='w-40'
              type='submit'
              variant='contained'
              startIcon={loading ? <i className='tabler-loader animate-spin' /> : <i className='tabler-search' />}
            >
              {applyLabel}
            </Button>

            <Button type='button' onClick={onClear} variant='outlined' startIcon={<i className='tabler-x' />}>
              {clearLabel}
            </Button>
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  )
}

export default CustomFilters
