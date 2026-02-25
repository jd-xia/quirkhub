import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'
import type { AuthLoginResponse } from '../auth/types'
import { useAuth } from '../auth/AuthContext'
import { Sticker } from '../app/Sticker'

export function LoginPage() {
  const nav = useNavigate()
  const { login } = useAuth()

  const [account, setAccount] = useState('parent')
  const [password, setPassword] = useState('parent123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const resp = await http.post<AuthLoginResponse>('/auth/login', { account, password })
      login(resp.data)
      nav(resp.data.role === 'CHILD' ? '/points' : '/')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? '登录失败'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        backgroundImage:
          'radial-gradient(900px 320px at 20% 0%, rgba(79,70,229,0.18), transparent 60%), radial-gradient(700px 280px at 90% 10%, rgba(20,184,166,0.16), transparent 60%)',
      }}
    >
      <Card sx={{ width: 'min(560px, 100%)', borderRadius: 6, overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                p: 2,
                borderRadius: 4,
                background:
                  'radial-gradient(700px 220px at 10% 0%, rgba(244,114,182,0.22), transparent 60%), radial-gradient(500px 180px at 90% 10%, rgba(79,70,229,0.20), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.65))',
                border: '1px solid',
                borderColor: 'rgba(15,23,42,0.08)',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Sticker name="flower" size={22} />
                <Sticker name="sparkles" size={22} />
                <Sticker name="sprout" size={22} />
                <Sticker name="warning" size={22} />
                <Box sx={{ flex: 1 }} />
                <Sticker name="circle" size={22} />
              </Stack>
              <Typography variant="h4" sx={{ fontWeight: 1000, letterSpacing: -0.4, mt: 1 }}>
                KiddoQuest
              </Typography>
              <Typography sx={{ color: 'rgba(15,23,42,0.72)' }}>用贴纸打分，养成好习惯。</Typography>
            </Box>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField label="账号" value={account} onChange={(e) => setAccount(e.target.value)} autoFocus />
                <TextField
                  label="密码"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? '登录中...' : '登录'}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  默认账号：parent/parent123（家长），kid/kid123（孩子）
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

