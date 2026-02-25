import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { Sticker } from './Sticker'

function DefaultIllustration() {
  return (
    <Box
      aria-hidden
      sx={{
        width: 'min(420px, 100%)',
        height: 220,
        borderRadius: 4,
        background:
          'radial-gradient(180px 130px at 25% 40%, rgba(79,70,229,0.24), transparent 70%), radial-gradient(220px 160px at 70% 30%, rgba(20,184,166,0.24), transparent 70%), linear-gradient(135deg, rgba(15,23,42,0.03), rgba(15,23,42,0.00))',
        border: '1px solid',
        borderColor: 'rgba(15,23,42,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              justifyContent: 'center',
              px: 2,
              py: 1,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'rgba(15,23,42,0.08)',
              bgcolor: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <Sticker name="flower" size={26} />
            <Sticker name="sprout" size={26} />
            <Sticker name="weatherSun" size={26} />
            <Sticker name="weatherSunCloud" size={26} />
            <Sticker name="weatherCloud" size={26} />
            <Sticker name="weatherRain" size={26} />
            <Sticker name="weatherStorm" size={26} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            轻松开始：先创建模板，再生成一周总结，每天用贴纸打卡
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export function EmptyState(props: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  illustration?: ReactNode
}) {
  const { title, description, actionLabel, onAction, illustration } = props

  return (
    <Card>
      <CardContent>
        <Stack spacing={2} alignItems="center" sx={{ py: 3, textAlign: 'center' }}>
          {illustration ?? <DefaultIllustration />}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.2 }}>
              {title}
            </Typography>
            {description ? (
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {description}
              </Typography>
            ) : null}
          </Box>
          {actionLabel && onAction ? (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}

