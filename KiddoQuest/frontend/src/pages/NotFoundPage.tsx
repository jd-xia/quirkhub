import { Button, Card, CardContent, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const nav = useNavigate()
  return (
    <Stack spacing={2} sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <Card sx={{ width: 'min(560px, 100%)' }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: -0.3 }}>
              404
            </Typography>
            <Typography color="text.secondary">页面不存在，可能已被移动或删除。</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={() => nav('/')}>
                回到首页
              </Button>
              <Button variant="outlined" onClick={() => nav(-1)}>
                返回上一页
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

