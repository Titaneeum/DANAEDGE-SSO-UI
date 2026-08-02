// Third-party Imports
import styled from '@emotion/styled'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { commonLayoutClasses } from '@layouts/utils/layoutClasses'

type StyledMainProps = {
  isContentCompact: boolean
}

const StyledMain = styled.main<StyledMainProps>`
  padding: ${themeConfig.layoutPadding}px;
  min-inline-size: 0;

  @media (max-width: 1199px) {
    padding: 16px;
  }

  @media (max-width: 599px) {
    padding: 12px;
  }

  ${({ isContentCompact }) =>
    isContentCompact &&
    `
    margin-inline: auto;
    max-inline-size: ${themeConfig.compactContentWidth}px;
  `}

  &:has(.${commonLayoutClasses.contentHeightFixed}) {
    display: flex;
    overflow: hidden;
  }
`

export default StyledMain
