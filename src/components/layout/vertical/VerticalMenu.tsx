// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'

// Component Imports
import { Menu, MenuItem, SubMenu } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const VerticalMenu = ({ scrollMenu }: Props) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { lang: locale } = useParams()
  const { isBreakpointReached } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href={`/${locale}/dashboard`} icon={<i className='tabler-gauge' />}>
          Dashboard
        </MenuItem>
        <SubMenu label='Admin User' icon={<i className='tabler-user-shield' />}>
          <MenuItem href={`/${locale}/user-login-attempt`} icon={<i className='tabler-login-2' />}>
            User Login Attempt
          </MenuItem>
          <MenuItem href={`/${locale}/admin-user-list`} icon={<i className='tabler-users-group' />}>
            Admin User List
          </MenuItem>
        </SubMenu>
        <SubMenu label='Permission' icon={<i className='tabler-shield-lock' />}>
          <SubMenu label='Route Permission' icon={<i className='tabler-route' />}>
            <MenuItem href={`/${locale}/route-permission-list`} icon={<i className='tabler-route-square' />}>
              Route Permission List
            </MenuItem>
            <MenuItem href={`/${locale}/unassigned-route-permission`} icon={<i className='tabler-route-off' />}>
              Unassigned Route Permission List
            </MenuItem>
          </SubMenu>
          <SubMenu label='Role' icon={<i className='tabler-user-cog' />}>
            <MenuItem href={`/${locale}/role-list`} icon={<i className='tabler-route-off' />}>
              Role List
            </MenuItem>
          </SubMenu>
        </SubMenu>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu
