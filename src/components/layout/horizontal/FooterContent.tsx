'use client'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  // Hooks

  return (
    <div
      className={classnames(horizontalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()}, Powered`}</span>
        <span className='text-textSecondary'>{` by `}</span>
        <span className='text-primary font-semibold'>DanaEdge</span>
      </p>
    </div>
  )
}

export default FooterContent
