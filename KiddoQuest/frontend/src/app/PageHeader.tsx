import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { StickerName } from './Sticker'
import { Sticker } from './Sticker'

type Tone = 'purple' | 'teal' | 'amber' | 'pink'

function toneBg(tone: Tone) {
  switch (tone) {
    case 'teal':
      return 'radial-gradient(900px 250px at 10% 0%, rgba(20,184,166,0.40), transparent 55%), radial-gradient(650px 220px at 90% 20%, rgba(250,204,21,0.35), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))'
    case 'amber':
      return 'radial-gradient(900px 250px at 10% 0%, rgba(245,158,11,0.35), transparent 55%), radial-gradient(650px 220px at 90% 20%, rgba(244,114,182,0.35), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))'
    case 'pink':
      return 'radial-gradient(900px 250px at 10% 0%, rgba(244,114,182,0.38), transparent 55%), radial-gradient(650px 220px at 90% 20%, rgba(79,70,229,0.30), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))'
    case 'purple':
    default:
      return 'radial-gradient(900px 250px at 10% 0%, rgba(79,70,229,0.38), transparent 55%), radial-gradient(650px 220px at 90% 20%, rgba(20,184,166,0.30), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.45))'
  }
}

export function PageHeader(props: { title: string; subtitle?: string; actions?: ReactNode; sticker?: StickerName; tone?: Tone }) {
  const { title, subtitle, actions, sticker, tone = 'purple' } = props

  const deco: StickerName[] =
    tone === 'amber'
      ? ['weatherSun', 'weatherSunCloud', 'weatherCloud', 'sparkles', 'flower', 'sprout']
      : tone === 'teal'
        ? ['flower', 'sprout', 'sparkles', 'weatherCloud', 'weatherRain', 'weatherSun']
        : tone === 'pink'
          ? ['flower', 'sparkles', 'sprout', 'weatherSunCloud', 'weatherCloud', 'circle']
          : ['sparkles', 'sprout', 'flower', 'weatherSun', 'weatherCloud', 'circle']

  return (
    <Card
      sx={{
        borderRadius: 5,
        overflow: 'hidden',
        bgcolor: 'transparent',
        borderColor: 'rgba(15,23,42,0.08)',
      }}
    >
      <CardContent
        sx={{
          background: toneBg(tone),
          position: 'relative',
          py: 2.5,
          px: { xs: 2, md: 2.5 },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.55,
            backgroundImage:
              'radial-gradient(circle at 14px 14px, rgba(15,23,42,0.08) 1.2px, transparent 1.2px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
            maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          }}
        />

        {/* floating stickers */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.9,
          }}
        >
          {[
            { x: '6%', y: '12%', r: -12, s: 26, o: 0.45, i: 0 },
            { x: '18%', y: '62%', r: 10, s: 22, o: 0.35, i: 1 },
            { x: '52%', y: '10%', r: 8, s: 26, o: 0.30, i: 2 },
            { x: '72%', y: '52%', r: -8, s: 22, o: 0.33, i: 3 },
            { x: '88%', y: '16%', r: 14, s: 26, o: 0.28, i: 4 },
            { x: '92%', y: '72%', r: -6, s: 22, o: 0.22, i: 5 },
          ].map((p) => (
            <Box
              key={p.i}
              sx={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                transform: `rotate(${p.r}deg)`,
                opacity: p.o,
                filter: 'blur(0.1px)',
              }}
            >
              <Sticker name={deco[p.i % deco.length]} size={p.s} />
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {sticker ? (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'rgba(255,255,255,0.75)',
                border: '1px solid',
                borderColor: 'rgba(15,23,42,0.10)',
                boxShadow: '0 8px 20px rgba(15,23,42,0.08)',
                flex: '0 0 auto',
              }}
            >
              <Sticker name={sticker} size={22} />
            </Box>
          ) : null}

          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 240 }}>
            <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: -0.3 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography sx={{ color: 'rgba(15,23,42,0.70)', maxWidth: 920 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Stack>

          {actions ? <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{actions}</Box> : null}
        </Box>
      </CardContent>
    </Card>
  )
}

