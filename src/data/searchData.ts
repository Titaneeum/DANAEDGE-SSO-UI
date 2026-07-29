type SearchData = {
  id: string
  name: string
  url: string
  excludeLang?: boolean
  icon: string
  section: string
  shortcut?: string
}

const data: SearchData[] = [
  {
    id: 'dashboard',
    name: 'SSO Dashboard',
    url: '/dashboard',
    icon: 'tabler-layout-dashboard',
    section: 'Identity'
  }
]

export default data
