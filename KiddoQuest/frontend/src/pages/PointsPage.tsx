import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { http } from '../api/http'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'

type Child = { id: number; name: string; loginAccount: string }

type PointsLog = {
  id: number
  changeType: 'SCORE_SETTLEMENT' | 'MANUAL_REWARD' | 'PENALTY' | 'REWARD_REDEEM' | 'GAME_REWARD'
  scoreChange: number
  balance: number
  description: string
  relatedId: number | null
  createTime: string
}

type PointsSummary = {
  childId: number
  balance: number
  recentLogs: PointsLog[]
}

function changeTypeLabel(t: PointsLog['changeType']) {
  switch (t) {
    case 'SCORE_SETTLEMENT':
      return '周结算'
    case 'MANUAL_REWARD':
      return '手动奖励'
    case 'PENALTY':
      return '手动扣分'
    case 'REWARD_REDEEM':
      return '兑换'
    case 'GAME_REWARD':
      return '游戏奖励'
  }
}

function changeTypeSticker(t: PointsLog['changeType']) {
  switch (t) {
    case 'SCORE_SETTLEMENT':
      return 'sparkles'
    case 'MANUAL_REWARD':
      return 'weatherSun'
    case 'PENALTY':
      return 'weatherStorm'
    case 'REWARD_REDEEM':
      return 'sprout'
    case 'GAME_REWARD':
      return 'weatherSunCloud'
  }
}

export function PointsPage() {
  const { session, role } = useAuth()
  const qc = useQueryClient()

  const childrenQ = useQuery({
    enabled: role === 'PARENT',
    queryKey: ['children'],
    queryFn: async () => (await http.get<Child[]>('/children')).data,
  })

  const defaultChildId = role === 'CHILD' ? session?.userId ?? null : null
  const [childId, setChildId] = useState<number | ''>(defaultChildId ?? '')

  const summaryQ = useQuery({
    enabled: !!childId,
    queryKey: ['points', 'summary', childId],
    queryFn: async () => (await http.get<PointsSummary>(`/points/${childId}/summary`)).data,
  })

  const [adjustAmount, setAdjustAmount] = useState<number>(10)
  const [adjustDesc, setAdjustDesc] = useState<string>('手动奖励')

  const [editOpen, setEditOpen] = useState(false)
  const [editLog, setEditLog] = useState<PointsLog | null>(null)
  const [editAmount, setEditAmount] = useState<number>(0)
  const [editDesc, setEditDesc] = useState<string>('')

  const adjustMut = useMutation({
    mutationFn: async () =>
      (
        await http.post(`/points/${childId}/adjust`, {
          changeType: adjustAmount >= 0 ? 'MANUAL_REWARD' : 'PENALTY',
          scoreChange: adjustAmount,
          description: adjustDesc,
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['points', 'summary', childId] })
    },
  })

  const updateMut = useMutation({
    mutationFn: async () =>
      (
        await http.put(`/points/${childId}/logs/${editLog?.id}`, {
          scoreChange: editAmount,
          description: editDesc,
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['points', 'summary', childId] })
      setEditOpen(false)
      setEditLog(null)
    },
  })

  const childOptions = useMemo(() => childrenQ.data ?? [], [childrenQ.data])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="积分中心"
        subtitle={role === 'CHILD' ? '查看我的积分余额与最近变动。' : '查看积分余额、记录，并支持家长手动调整。'}
        sticker="sparkles"
        tone="purple"
      />

      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>选择孩子</InputLabel>
                <Select
                  label="选择孩子"
                  value={childId}
                  onChange={(e) => setChildId(e.target.value as any)}
                  disabled={role === 'CHILD'}
                >
                  {role === 'CHILD' ? (
                    <MenuItem value={session?.userId ?? ''}>我</MenuItem>
                  ) : (
                    childOptions.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}（{c.loginAccount}）
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                当前余额
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                {summaryQ.data?.balance ?? 0}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {role === 'PARENT' ? (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              手动调整（家长）
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="积分变化（可为负）"
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={7}>
                <TextField fullWidth label="原因" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ height: '56px' }}
                  disabled={!childId || adjustMut.isPending}
                  onClick={() => adjustMut.mutate()}
                >
                  调整
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            最近记录
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={1.25}>
            {(summaryQ.data?.recentLogs ?? []).map((l) => {
              const positive = l.scoreChange >= 0
              const canEdit =
                role === 'PARENT' &&
                l.relatedId == null &&
                (l.changeType === 'MANUAL_REWARD' || l.changeType === 'PENALTY')
              return (
                <Card
                  key={l.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    borderColor: positive ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.18)',
                    bgcolor: positive ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.04)',
                  }}
                >
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'rgba(255,255,255,0.75)',
                          border: '1px solid',
                          borderColor: 'rgba(15,23,42,0.10)',
                        }}
                      >
                        <Sticker name={changeTypeSticker(l.changeType) as any} size={18} />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>{changeTypeLabel(l.changeType)}</Typography>
                          <Chip
                            size="small"
                            label={new Date(l.createTime).toLocaleString()}
                            sx={{ bgcolor: 'rgba(255,255,255,0.60)', fontWeight: 900 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {l.description}
                        </Typography>
                      </Box>

                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          sx={{ fontWeight: 1100, letterSpacing: -0.3 }}
                          color={positive ? 'success.dark' : 'error.dark'}
                        >
                          {positive ? `+${l.scoreChange}` : l.scoreChange}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 900 }}>
                          余额 {l.balance}
                        </Typography>
                        {canEdit ? (
                          <Box sx={{ mt: 0.75 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setEditLog(l)
                                setEditAmount(l.scoreChange)
                                setEditDesc(l.description ?? '')
                                setEditOpen(true)
                              }}
                            >
                              修改
                            </Button>
                          </Box>
                        ) : null}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => (setEditOpen(false), setEditLog(null))} fullWidth maxWidth="sm">
        <DialogTitle>修改手动调整记录</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="积分变化（可为负）"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(Number(e.target.value))}
            />
            <TextField fullWidth label="原因" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              说明：修改后会自动重算该条记录及其后续记录的“余额”。
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => (setEditOpen(false), setEditLog(null))}>
            取消
          </Button>
          <Button
            variant="contained"
            disabled={!childId || !editLog || updateMut.isPending || !String(editDesc ?? '').trim()}
            onClick={() => updateMut.mutate()}
          >
            保存修改
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

