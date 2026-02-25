import { Box } from '@mui/material'

export type StickerName =
  | 'flower'
  | 'sparkles'
  | 'warning'
  | 'circle'
  | 'sprout'
  | 'weatherSun'
  | 'weatherSunCloud'
  | 'weatherCloud'
  | 'weatherRain'
  | 'weatherStorm'

const MAP: Record<StickerName, { emoji: string; label: string }> = {
  flower: { emoji: '🌸', label: '日常习惯' },
  sparkles: { emoji: '✨', label: '加分/完成' },
  warning: { emoji: '⚠️', label: '扣分项' },
  circle: { emoji: '⚪', label: '未评/无' },
  sprout: { emoji: '🌱', label: '学习习惯' },
  weatherSun: { emoji: '☀️', label: '满分/完成' },
  weatherSunCloud: { emoji: '🌤', label: '半分/完成一半' },
  weatherCloud: { emoji: '☁️', label: '默认/未评' },
  weatherRain: { emoji: '🌧', label: '扣分一半' },
  weatherStorm: { emoji: '⛈', label: '完全扣分' },
}

export function Sticker(props: { name: StickerName; size?: number }) {
  const { name, size = 18 } = props
  const it = MAP[name]
  return (
    <Box
      component="span"
      role="img"
      aria-label={it.label}
      title={it.label}
      sx={{
        fontSize: size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateY(1px)',
        userSelect: 'none',
      }}
    >
      {it.emoji}
    </Box>
  )
}

