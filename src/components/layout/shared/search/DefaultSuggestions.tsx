// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const DefaultSuggestions = ({ setOpen }: { setOpen: (value: boolean) => void }) => {
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-col gap-4 plb-14 pli-16'>
      <p className='text-xs uppercase text-textDisabled tracking-[0.8px]'>Identity platform</p>
      <Link
        href={getLocalizedUrl('/dashboard', locale as Locale)}
        className='flex items-center gap-2 hover:text-primary'
        onClick={() => setOpen(false)}
      >
        <i className='tabler-layout-dashboard text-xl' />
        <span>SSO Dashboard</span>
      </Link>
    </div>
  )
}

export default DefaultSuggestions
