// Next Imports
import type { Metadata } from 'next'

// View Imports
import SsoDashboard from '@views/SsoDashboard'

export const metadata: Metadata = {
  title: 'SSO Dashboard',
  description: 'Monitor applications, identities and authentication activity'
}

const DashboardPage = () => <SsoDashboard />

export default DashboardPage
