'use client'

import * as React from 'react'

import type { DialogProps } from '@mui/material'
import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material'

type JSONDialogProps = {
  open: boolean
  handleClose: () => void
  jsonString: string
  maxWidth?: DialogProps['maxWidth']
  fullWidth?: boolean
  codeMaxHeight?: number | string
}

const JSONDialog = ({
  open,
  handleClose,
  jsonString,
  maxWidth = 'md',
  fullWidth = true,
  codeMaxHeight = '70vh'
}: JSONDialogProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copied, setCopied] = React.useState(false)

  function prettyJson(input: string | object) {
    try {
      const obj = typeof input === 'string' ? JSON.parse(input) : input

      return JSON.stringify(obj, null, 2)
    } catch {
      return typeof input === 'string' ? input : String(input)
    }
  }

  const formatted = React.useMemo(() => prettyJson(jsonString), [jsonString])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
  }

  return (
    <Dialog
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          maxHeight: '90dvh',
          m: { xs: 1.5, sm: 4 },
          width: { xs: 'calc(100% - 24px)', sm: 'auto' }
        }
      }}
    >
      <DialogTitle />

      <DialogContent
        sx={{
          px: { xs: 1.5, sm: 3 },
          pb: { xs: 1.5, sm: 3 },
          overflow: 'hidden'
        }}
      >
        <JsonCodeBlock rawJson={formatted} onCopy={handleCopy} title='View Json' maxHeight={codeMaxHeight} />
      </DialogContent>
    </Dialog>
  )
}

export default JSONDialog

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const highlightJson = (json: string) => {
  const safe = escapeHtml(json)

  // order matters: keys, strings, numbers, booleans, null
  return (
    safe

      // keys: "foo":
      .replace(/(&quot;)([^&]*?)(&quot;)\s*:/g, `<span class="tok-key">$1$2$3</span><span class="tok-punc">:</span>`)

      // strings: "bar"
      .replace(/:\s*(&quot;)([^&]*?)(&quot;)/g, `: <span class="tok-str">$1$2$3</span>`)

      // numbers
      .replace(/:\s*(-?\d+(?:\.\d+)?)/g, `: <span class="tok-num">$1</span>`)

      // booleans
      .replace(/:\s*(true|false)/g, `: <span class="tok-bool">$1</span>`)

      // null
      .replace(/:\s*(null)/g, `: <span class="tok-null">$1</span>`)

      // punctuation/brackets
      .replace(/[{}[\],]/g, m => `<span class="tok-punc">${m}</span>`)
  )
}

export const JsonCodeBlock = ({
  title,
  rawJson,
  onCopy,
  maxHeight = 340
}: {
  title: string
  rawJson?: string
  onCopy?: () => void
  maxHeight?: number | string
}) => {
  const formatted = React.useMemo(() => {
    if (!rawJson) return ''

    try {
      // if rawJson is already JSON string, parse it
      const parsed = JSON.parse(rawJson)

      return JSON.stringify(parsed, null, 2)
    } catch {
      // fallback: show as-is
      return rawJson
    }
  }, [rawJson])

  const lines = React.useMemo(() => (formatted ? formatted.split('\n') : []), [formatted])

  const html = React.useMemo(() => (formatted ? highlightJson(formatted) : ''), [formatted])

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.10)',
        overflow: 'hidden',
        backgroundColor: 'rgba(17, 18, 24, 0.96)'
      }}
    >
      {/* Header bar */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, padding: 2 }}>
          {/* <Box sx={{ display: 'flex', gap: 0.6 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(255,96,92,0.9)' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(255,189,68,0.9)' }} />
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(0,202,78,0.9)' }} />
          </Box> */}
          <Typography sx={{ fontSize: 12, fontWeight: 900, opacity: 0.85 }} className='text-white'>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {onCopy && (
            <Button
              size='small'
              variant='contained'
              onClick={onCopy}
              startIcon={<i className='tabler-copy' />}
              sx={{ borderRadius: 999, textTransform: 'none' }}
              disabled={!rawJson}
            >
              Copy
            </Button>
          )}
        </Box>
      </Box>

      {/* Code area */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '38px minmax(520px, 1fr)', sm: '54px minmax(520px, 1fr)' },
          maxHeight,
          overflow: 'auto'
        }}
      >
        {/* Line numbers */}
        <Box
          sx={{
            py: 1.5,
            px: 1,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.35)',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 11,
            lineHeight: 1.75,
            textAlign: 'right',
            userSelect: 'none'
          }}
        >
          {lines.length > 0 ? lines.map((_, i) => <div key={i}>{i + 1}</div>) : <div>1</div>}
        </Box>

        {/* Highlighted content */}
        <Box
          sx={{
            py: 1.5,
            px: 2,
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 12,
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.86)',
            whiteSpace: 'pre',
            '& .tok-key': { color: 'rgba(118, 208, 255, 0.95)' }, // keys
            '& .tok-str': { color: 'rgba(181, 255, 202, 0.95)' }, // strings
            '& .tok-num': { color: 'rgba(255, 212, 121, 0.95)' }, // numbers
            '& .tok-bool': { color: 'rgba(255, 150, 226, 0.95)' }, // booleans
            '& .tok-null': { color: 'rgba(185, 185, 255, 0.95)' }, // null
            '& .tok-punc': { color: 'rgba(255,255,255,0.50)' } // punctuation
          }}
          dangerouslySetInnerHTML={{ __html: html || escapeHtml(rawJson || '-') }}
        />
      </Box>
    </Box>
  )
}
