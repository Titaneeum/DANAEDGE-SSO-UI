'use client'

import Image from 'next/image'

import companyLogo from '../../../../public/images/logos/danaedgelogo.png'

import useVerticalNav from '@menu/hooks/useVerticalNav'

const Logo = () => {
  const { isHovered, isCollapsed, isBreakpointReached, transitionDuration } = useVerticalNav()
  const isCompact = isCollapsed && !isHovered && !isBreakpointReached

  return (
    <span
      className='flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white'
      style={{
        inlineSize: isCompact ? 34 : 120,
        blockSize: isCompact ? 34 : 48,
        padding: isCompact ? 3 : 4,
        transition: `inline-size ${transitionDuration}ms ease-in-out, block-size ${transitionDuration}ms ease-in-out, padding ${transitionDuration}ms ease-in-out`
      }}
    >
      <Image
        src={companyLogo}
        alt='Dana Edge'
        width={120}
        height={74}
        priority
        unoptimized
        className='block size-full object-contain'
        sizes={isCompact ? '34px' : '(max-width: 768px) 104px, 120px'}
      />
    </span>
  )
}

export default Logo
