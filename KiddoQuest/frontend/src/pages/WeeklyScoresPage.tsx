import {
  Box,
  Button,
  Card,
  CardContent,
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
import AddIcon from '@mui/icons-material/Add'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { http } from '../api/http'
import { mondayOfCurrentWeek, yyyyMmDd } from '../utils/date'
import { PageHeader } from '../app/PageHeader'
import { EmptyState } from '../app/EmptyState'

type Child = { id: number; name: string; loginAccount: string }

type Template = { id: number; name: string; version: number }
type TemplateVersion = { id: number; templateId: number; version: number; snapshot: string; createTime: string }

type WeeklyScore = {
  id: number
  templateVersionId: number
  childId: number
  weekStartDate: string
  weekEndDate: string
  status: 'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'LOCKED'
  totalScore: number
  createTime: string
  items: any[]
}

export function WeeklyScoresPage() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  const [childId, setChildId] = useState<number | ''>('')
  const [templateId, setTemplateId] = useState<number | ''>('')
  const [templateVersionId, setTemplateVersionId] = useState<number | ''>('')
  const [weekStartDate, setWeekStartDate] = useState<string>(yyyyMmDd(mondayOfCurrentWeek()))

  const childrenQ = useQuery({
    queryKey: ['children'],
    queryFn: async () => (await http.get<Child[]>('/children')).data,
  })

  const templatesQ = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await http.get<Template[]>('/templates')).data,
  })

  const versionsQ = useQuery({
    enabled: !!templateId,
    queryKey: ['templates', templateId, 'versions'],
    queryFn: async () => (await http.get<TemplateVersion[]>(`/templates/${templateId}/versions`)).data,
  })

  const scoresQ = useQuery({
    enabled: !!childId,
    queryKey: ['weekly-scores', childId],
    queryFn: async () => (await http.get<WeeklyScore[]>(`/weekly-scores?childId=${childId}`)).data,
  })

  const createMut = useMutation({
    mutationFn: async () =>
      (
        await http.post<WeeklyScore>('/weekly-scores', {
          templateVersionId,
          childId,
          weekStartDate,
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['weekly-scores', childId] })
      setOpen(false)
    },
  })

  const submitMut = useMutation({
    mutationFn: async (id: number) => (await http.post<WeeklyScore>(`/weekly-scores/${id}/submit`, {})).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['weekly-scores', childId] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
  })

  const revokeMut = useMutation({
    mutationFn: async (id: number) => (await http.post<WeeklyScore>(`/weekly-scores/${id}/revoke`, {})).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['weekly-scores', childId] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
  })

  const children = useMemo(() => childrenQ.data ?? [], [childrenQ.data])
  const templates = useMemo(() => templatesQ.data ?? [], [templatesQ.data])
  const versions = useMemo(() => versionsQ.data ?? [], [versionsQ.data])
  const scores = useMemo(() => scoresQ.data ?? [], [scoresQ.data])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="一周总结"
        subtitle="生成一周总结表、每日打卡，周末提交结算积分。"
        sticker="sparkles"
        tone="amber"
        actions={
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
            生成一周总结
          </Button>
        }
      />

      <Card>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>选择孩子</InputLabel>
                <Select label="选择孩子" value={childId} onChange={(e) => setChildId(e.target.value as any)}>
                  {children.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}（{c.loginAccount}）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                该孩子的一周总结列表
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {scores.length} 条
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {childId && scores.length === 0 ? (
        <EmptyState
          title="还没有一周总结"
          description="先生成一周总结表，然后每天用图标打卡，周末提交结算积分。"
          actionLabel="生成一周总结"
          onAction={() => setOpen(true)}
        />
      ) : (
        <Stack spacing={1}>
          {scores.map((s) => (
            <Card key={s.id}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 900, letterSpacing: -0.2 }}>
                    {s.weekStartDate} ~ {s.weekEndDate}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    状态：{s.status} · 每周总分：{s.totalScore}
                  </Typography>
                </Box>
                <Button variant="outlined" onClick={() => nav(`/weekly-scores/${s.id}`)}>
                  填写总结
                </Button>
                {s.status === 'SUBMITTED' ? (
                  <Button variant="outlined" color="warning" onClick={() => revokeMut.mutate(s.id)} disabled={revokeMut.isPending}>
                    撤回
                  </Button>
                ) : null}
                <Button
                  variant="outlined"
                  onClick={() => submitMut.mutate(s.id)}
                  disabled={s.status === 'SUBMITTED' || s.status === 'LOCKED'}
                >
                  提交（结算积分）
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>生成一周总结</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>孩子</InputLabel>
                <Select label="孩子" value={childId} onChange={(e) => setChildId(e.target.value as any)}>
                  {children.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}（{c.loginAccount}）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>模板</InputLabel>
                <Select
                  label="模板"
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value as any)
                    setTemplateVersionId('')
                  }}
                >
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}（v{t.version}）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!templateId}>
                <InputLabel>模板版本</InputLabel>
                <Select label="模板版本" value={templateVersionId} onChange={(e) => setTemplateVersionId(e.target.value as any)}>
                  {versions.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      v{v.version}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="周起始日期（YYYY-MM-DD）"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={() => createMut.mutate()}
            disabled={!childId || !templateVersionId || !weekStartDate || createMut.isPending}
          >
            生成
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

