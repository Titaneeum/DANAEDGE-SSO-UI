import type { ReactNode } from 'react'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'

type DashCardColor = 'primary' | 'success' | 'info' | 'warning' | 'error'

type DashCardProps = {
  title: string
  value: number | string
  icon: ReactNode
  color?: DashCardColor
  loading?: boolean
}

const DashCard = ({ title, value, icon, color = 'primary', loading = false }: DashCardProps) => {
  return (
    <Card className='group relative h-full overflow-hidden rounded-xl border border-solid border-divider shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md'>
      <CardContent className='relative flex min-bs-[124px] items-center justify-between gap-4 !p-5 sm:!p-6'>
        <div className='flex min-is-0 flex-col gap-2'>
          <Typography variant='body2' color='text.secondary' className='font-medium'>
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant='text' width={72} height={42} />
          ) : (
            <Typography variant='h3' className='font-bold tracking-tight' color='text.primary'>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          )}
        </div>

        <div
          className='flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl sm:size-14 sm:text-[28px]'
          style={{
            color: `var(--mui-palette-${color}-main)`,
            backgroundColor: `var(--mui-palette-${color}-lightOpacity)`
          }}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

export default DashCard
