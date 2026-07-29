// MUI Imports
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const metrics = [
  {
    label: 'Connected apps',
    value: '12',
    detail: '2 added this month',
    icon: 'tabler-apps',
    color: 'primary' as const
  },
  {
    label: 'Active identities',
    value: '2,480',
    detail: '98.7% provisioned',
    icon: 'tabler-users',
    color: 'info' as const
  },
  {
    label: 'SSO success rate',
    value: '99.94%',
    detail: 'Last 30 days',
    icon: 'tabler-shield-check',
    color: 'success' as const
  },
  {
    label: 'Security alerts',
    value: '3',
    detail: '1 needs attention',
    icon: 'tabler-alert-triangle',
    color: 'warning' as const
  }
]

const applications = [
  { name: 'Google Workspace', protocol: 'SAML 2.0', users: '2,186', icon: 'tabler-brand-google', color: '#4285f4' },
  { name: 'Microsoft 365', protocol: 'OpenID Connect', users: '1,942', icon: 'tabler-brand-windows', color: '#00a4ef' },
  { name: 'GitHub Enterprise', protocol: 'SAML 2.0', users: '624', icon: 'tabler-brand-github', color: '#24292f' },
  { name: 'Slack', protocol: 'SAML 2.0', users: '1,730', icon: 'tabler-brand-slack', color: '#611f69' }
]

const activity = [
  { title: 'Google Workspace sign-in', meta: 'Aisyah Rahman · Kuala Lumpur', time: '2 min ago', state: 'Success' },
  { title: 'New device challenge', meta: 'Daniel Wong · Johor Bahru', time: '8 min ago', state: 'Verified' },
  { title: 'Microsoft 365 sign-in', meta: 'Nur Izzati · Penang', time: '14 min ago', state: 'Success' },
  { title: 'Blocked sign-in attempt', meta: 'Unknown device · Singapore', time: '21 min ago', state: 'Blocked' }
]

const SsoDashboard = () => {
  return (
    <Stack spacing={6}>
      <Card
        sx={{
          overflow: 'hidden',
          color: 'common.white',
          background:
            'linear-gradient(120deg, var(--mui-palette-primary-dark) 0%, var(--mui-palette-primary-main) 52%, #7367f0 100%)'
        }}
      >
        <CardContent sx={{ p: { xs: 6, md: 8 }, '&:last-child': { pb: { xs: 6, md: 8 } } }}>
          <Grid container spacing={6} alignItems='center'>
            <Grid size={{ xs: 12, md: 8 }}>
              <Chip
                size='small'
                label='Identity platform'
                sx={{ mb: 3, color: 'common.white', bgcolor: 'rgba(255,255,255,.16)' }}
              />
              <Typography variant='h3' color='inherit' sx={{ mb: 2 }}>
                One secure identity. Every application.
              </Typography>
              <Typography sx={{ maxWidth: 650, mb: 5, color: 'rgba(255,255,255,.78)' }}>
                Monitor access, manage connected applications and keep every sign-in protected from one place.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant='contained' color='inherit' startIcon={<i className='tabler-plus' />}>
                  Connect application
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<i className='tabler-shield-cog' />}
                  sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,.45)' }}
                >
                  Review policies
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 5,
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.16)'
                }}
              >
                <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 3 }}>
                  <Typography color='inherit' fontWeight={600}>
                    System status
                  </Typography>
                  <Chip size='small' label='Operational' color='success' />
                </Stack>
                <Typography variant='h4' color='inherit'>
                  99.99%
                </Typography>
                <Typography variant='body2' sx={{ color: 'rgba(255,255,255,.7)' }}>
                  Authentication uptime
                </Typography>
                <LinearProgress
                  variant='determinate'
                  value={99.99}
                  color='success'
                  sx={{ mt: 3, height: 6, borderRadius: 4, bgcolor: 'rgba(255,255,255,.15)' }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={6}>
        {metrics.map(metric => (
          <Grid key={metric.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
                  <Box>
                    <Typography color='text.secondary' variant='body2'>
                      {metric.label}
                    </Typography>
                    <Typography variant='h4' sx={{ my: 1 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {metric.detail}
                    </Typography>
                  </Box>
                  <Avatar variant='rounded' sx={{ bgcolor: `${metric.color}.lightOpacity`, color: `${metric.color}.main` }}>
                    <i className={metric.icon} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 5 }}>
                <Box>
                  <Typography variant='h5'>Connected applications</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Applications using your identity provider
                  </Typography>
                </Box>
                <Button size='small' endIcon={<i className='tabler-arrow-right' />}>
                  View all
                </Button>
              </Stack>
              <Stack divider={<Divider flexItem />} spacing={0}>
                {applications.map(application => (
                  <Stack
                    key={application.name}
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    sx={{ py: 3 }}
                  >
                    <Stack direction='row' spacing={3} alignItems='center'>
                      <Avatar variant='rounded' sx={{ bgcolor: application.color, color: 'common.white' }}>
                        <i className={application.icon} />
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{application.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {application.protocol}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography fontWeight={600}>{application.users}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        assigned users
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h5'>Authentication activity</Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 5 }}>
                Latest events across your organisation
              </Typography>
              <Stack spacing={4}>
                {activity.map(event => (
                  <Stack key={`${event.title}-${event.time}`} direction='row' spacing={3}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: event.state === 'Blocked' ? 'error.lightOpacity' : 'success.lightOpacity',
                        color: event.state === 'Blocked' ? 'error.main' : 'success.main'
                      }}
                    >
                      <i className={event.state === 'Blocked' ? 'tabler-shield-x' : 'tabler-shield-check'} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction='row' justifyContent='space-between' spacing={2}>
                        <Typography fontWeight={600} noWrap>
                          {event.title}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
                          {event.time}
                        </Typography>
                      </Stack>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {event.meta}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default SsoDashboard
