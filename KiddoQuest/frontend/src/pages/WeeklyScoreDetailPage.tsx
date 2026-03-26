import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  TextField,
  LinearProgress,
  Switch,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'

type DimensionCategory = 'LEARNING' | 'LIFE' | 'BONUS' | 'PENALTY'

type WeeklyScoreItem = {
  id: number
  category: DimensionCategory
  dimensionName: string
  day: number
  score: number
  maxScore: number
  remark: string | null
}

type WeeklyScore = {
  id: number
  templateVersionId: number
  childId: number
  weekStartDate: string
  weekEndDate: string
  status: 'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'LOCKED'
  totalScore: number
  createTime: string
  items: WeeklyScoreItem[]
}

type WeekReflection = {
  highlights: string
  improvements: string
  nextGoals: string
  note: string
}

function catLabel(c: DimensionCategory) {
  switch (c) {
    case 'LEARNING':
      return '学习习惯'
    case 'LIFE':
      return '生活习惯'
    case 'BONUS':
      return '加分项'
    case 'PENALTY':
      return '扣分项'
  }
}

function catSticker(c: DimensionCategory) {
  switch (c) {
    case 'LEARNING':
      return <Sticker name="sprout" />
    case 'LIFE':
      return <Sticker name="flower" />
    case 'BONUS':
      return <Sticker name="sparkles" />
    case 'PENALTY':
      return <Sticker name="warning" />
  }
}

function catStickerName(c: DimensionCategory) {
  switch (c) {
    case 'LEARNING':
      return 'sprout' as const
    case 'LIFE':
      return 'flower' as const
    case 'BONUS':
      return 'sparkles' as const
    case 'PENALTY':
      return 'warning' as const
  }
}

const CAT_ORDER: DimensionCategory[] = ['LEARNING', 'LIFE', 'BONUS', 'PENALTY']
const DAY_CN = ['一', '二', '三', '四', '五', '六', '日'] as const

type WeatherState = 'SUN' | 'SUN_CLOUD' | 'CLOUD' | 'RAIN' | 'STORM'
const ICON_REMARK_PREFIX = 'ICON:'

function normalizeRemark(r: string | null) {
  return (r ?? '').trim()
}

function halfScore(maxScore: number) {
  return Math.max(1, Math.floor(maxScore / 2))
}

function normalizeStateForCategory(cat: DimensionCategory, state: WeatherState): WeatherState {
  if (cat === 'PENALTY') {
    if (state === 'RAIN' || state === 'STORM' || state === 'CLOUD') return state
    return 'CLOUD'
  }
  // LEARNING/LIFE/BONUS
  if (state === 'SUN' || state === 'SUN_CLOUD' || state === 'CLOUD') return state
  return 'CLOUD'
}

function readIconState(it: WeeklyScoreItem): WeatherState {
  const r = normalizeRemark(it.remark)
  if (r.startsWith(ICON_REMARK_PREFIX)) {
    const v = r.slice(ICON_REMARK_PREFIX.length).toUpperCase()
    // New weather states
    if (v === 'SUN' || v === 'SUN_CLOUD' || v === 'CLOUD' || v === 'RAIN' || v === 'STORM') return normalizeStateForCategory(it.category, v as any)

    // Legacy states mapping (backward compatible)
    if (v === 'UP') return 'SUN'
    if (v === 'SPROUT') return 'SUN_CLOUD'
    if (v === 'NONE') return 'CLOUD'
    if (v === 'DOWN') return it.category === 'PENALTY' ? 'STORM' : 'CLOUD'
    if (v === 'WARN') return 'CLOUD'
  }

  // Derive from score
  if (it.category === 'PENALTY') {
    if (it.score <= -it.maxScore) return 'STORM'
    if (it.score < 0) return 'RAIN'
    return 'CLOUD'
  }
  if (it.score >= it.maxScore) return 'SUN'
  if (it.score > 0) return 'SUN_CLOUD'
  return 'CLOUD'
}

function stateToUpdate(it: WeeklyScoreItem, state: WeatherState) {
  const stateShown = normalizeStateForCategory(it.category, state)
  const remark = `${ICON_REMARK_PREFIX}${stateShown}`

  if (it.category === 'PENALTY') {
    if (stateShown === 'STORM') return { score: -it.maxScore, remark }
    if (stateShown === 'RAIN') return { score: -halfScore(it.maxScore), remark }
    return { score: 0, remark } // CLOUD
  }

  if (stateShown === 'SUN') return { score: it.maxScore, remark }
  if (stateShown === 'SUN_CLOUD') return { score: halfScore(it.maxScore), remark }
  return { score: 0, remark } // CLOUD
}

function isReviewed(remark: string, score: number) {
  const r = normalizeRemark(remark)
  return r.startsWith(ICON_REMARK_PREFIX) || score !== 0
}

function catTint(cat: DimensionCategory) {
  switch (cat) {
    case 'LEARNING':
      return {
        bg: 'rgba(79,70,229,0.07)',
        bd: 'rgba(79,70,229,0.18)',
        grad: 'radial-gradient(220px 120px at 10% 0%, rgba(79,70,229,0.20), transparent 60%), radial-gradient(260px 150px at 90% 30%, rgba(20,184,166,0.18), transparent 60%)',
      }
    case 'LIFE':
      return {
        bg: 'rgba(244,114,182,0.06)',
        bd: 'rgba(244,114,182,0.16)',
        grad: 'radial-gradient(240px 120px at 10% 0%, rgba(244,114,182,0.22), transparent 60%), radial-gradient(260px 150px at 85% 30%, rgba(79,70,229,0.16), transparent 60%)',
      }
    case 'BONUS':
      return {
        bg: 'rgba(250,204,21,0.10)',
        bd: 'rgba(250,204,21,0.22)',
        grad: 'radial-gradient(240px 120px at 10% 0%, rgba(250,204,21,0.26), transparent 60%), radial-gradient(260px 150px at 85% 30%, rgba(34,197,94,0.18), transparent 60%)',
      }
    case 'PENALTY':
      return {
        bg: 'rgba(239,68,68,0.06)',
        bd: 'rgba(239,68,68,0.18)',
        grad: 'radial-gradient(240px 120px at 10% 0%, rgba(239,68,68,0.18), transparent 60%), radial-gradient(260px 150px at 85% 30%, rgba(148,163,184,0.18), transparent 60%)',
      }
  }
}

export function WeeklyScoreDetailPage() {
  const { id } = useParams()
  const scoreId = Number(id)
  const nav = useNavigate()
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['weekly-score', scoreId],
    enabled: Number.isFinite(scoreId) && scoreId > 0,
    queryFn: async () => (await http.get<WeeklyScore>(`/weekly-scores/${scoreId}`)).data,
  })

  const [scores, setScores] = useState<Record<number, number>>({})
  const [remarks, setRemarks] = useState<Record<number, string>>({})
  const [dirty, setDirty] = useState<Record<number, true>>({})
  const baseRef = useRef<{ scores: Record<number, number>; remarks: Record<number, string> }>({ scores: {}, remarks: {} })

  const [reflection, setReflection] = useState<WeekReflection>({
    highlights: '',
    improvements: '',
    nextGoals: '',
    note: '',
  })

  useEffect(() => {
    if (!q.data) return
    const next: Record<number, number> = {}
    const nextRemarks: Record<number, string> = {}
    for (const it of q.data.items) {
      next[it.id] = it.score
      nextRemarks[it.id] = normalizeRemark(it.remark)
    }
    setScores(next)
    setRemarks(nextRemarks)
    setDirty({})
    baseRef.current = { scores: next, remarks: nextRemarks }
  }, [q.data?.id])

  useEffect(() => {
    if (!Number.isFinite(scoreId) || scoreId <= 0) return
    try {
      const raw = localStorage.getItem(`kiddoquest.weeklyReflection.${scoreId}`)
      if (!raw) {
        setReflection({ highlights: '', improvements: '', nextGoals: '', note: '' })
        return
      }
      const parsed = JSON.parse(raw) as Partial<WeekReflection>
      setReflection({
        highlights: String(parsed.highlights ?? ''),
        improvements: String(parsed.improvements ?? ''),
        nextGoals: String(parsed.nextGoals ?? ''),
        note: String(parsed.note ?? ''),
      })
    } catch {
      setReflection({ highlights: '', improvements: '', nextGoals: '', note: '' })
    }
  }, [scoreId])

  useEffect(() => {
    if (!Number.isFinite(scoreId) || scoreId <= 0) return
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(`kiddoquest.weeklyReflection.${scoreId}`, JSON.stringify(reflection))
      } catch {
        // ignore
      }
    }, 500)
    return () => window.clearTimeout(t)
  }, [reflection, scoreId])

  const isLocked = q.data?.status === 'SUBMITTED' || q.data?.status === 'LOCKED'

  const saveMut = useMutation({
    mutationFn: async (items: Array<{ id: number; score: number; remark: string }>) =>
      (await http.put<WeeklyScore>(`/weekly-scores/${scoreId}/items`, { items })).data,
    onSuccess: async (data) => {
      qc.setQueryData(['weekly-score', scoreId], data)
      const next: Record<number, number> = {}
      const nextRemarks: Record<number, string> = {}
      for (const it of data.items) {
        next[it.id] = it.score
        nextRemarks[it.id] = normalizeRemark(it.remark)
      }
      setScores(next)
      setRemarks(nextRemarks)
      setDirty({})
      baseRef.current = { scores: next, remarks: nextRemarks }
      await qc.invalidateQueries({ queryKey: ['weekly-scores'] })
    },
  })

  const submitMut = useMutation({
    mutationFn: async () => (await http.post<WeeklyScore>(`/weekly-scores/${scoreId}/submit`, {})).data,
    onSuccess: async (data) => {
      qc.setQueryData(['weekly-score', scoreId], data)
      await qc.invalidateQueries({ queryKey: ['weekly-scores'] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
  })

  const revokeMut = useMutation({
    mutationFn: async () => (await http.post<WeeklyScore>(`/weekly-scores/${scoreId}/revoke`, {})).data,
    onSuccess: async (data) => {
      qc.setQueryData(['weekly-score', scoreId], data)
      await qc.invalidateQueries({ queryKey: ['weekly-scores'] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
  })

  useEffect(() => {
    if (isLocked) return
    const ids = Object.keys(dirty).map((x) => Number(x)).filter((x) => Number.isFinite(x))
    if (ids.length === 0) return

    const timer = window.setTimeout(() => {
      const items = ids.map((itemId) => ({ id: itemId, score: scores[itemId] ?? 0, remark: remarks[itemId] ?? '' }))
      saveMut.mutate(items)
    }, 800)

    return () => window.clearTimeout(timer)
  }, [dirty, isLocked, remarks, saveMut, scores])

  const grouped = useMemo(() => {
    const items = q.data?.items ?? []
    const byCat = new Map<DimensionCategory, Map<string, WeeklyScoreItem[]>>()
    for (const it of items) {
      const m = byCat.get(it.category) ?? new Map<string, WeeklyScoreItem[]>()
      const arr = m.get(it.dimensionName) ?? []
      arr.push(it)
      m.set(it.dimensionName, arr)
      byCat.set(it.category, m)
    }
    for (const [, m] of byCat) for (const [, arr] of m) arr.sort((a, b) => a.day - b.day)
    return byCat
  }, [q.data?.items])

  const weekReviewed = useMemo(() => {
    let reviewed = 0
    let total = 0
    for (const it of q.data?.items ?? []) {
      total += 1
      const r = remarks[it.id] ?? it.remark ?? ''
      const s = scores[it.id] ?? it.score
      if (isReviewed(r, s)) reviewed += 1
    }
    return { reviewed, total, pct: total ? Math.round((reviewed / total) * 100) : 0 }
  }, [q.data?.items, remarks, scores])

  const weekCatTotals = useMemo(() => {
    const out: Record<DimensionCategory, number> = { LEARNING: 0, LIFE: 0, BONUS: 0, PENALTY: 0 }
    for (const it of q.data?.items ?? []) {
      const s = scores[it.id] ?? it.score
      out[it.category] += s
    }
    return out
  }, [q.data?.items, scores])

  const dayTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0] // day 1..7
    for (const it of q.data?.items ?? []) {
      const s = scores[it.id] ?? it.score
      const idx = (it.day ?? 1) - 1
      if (idx >= 0 && idx < 7) totals[idx] += s
    }
    return totals
  }, [q.data?.items, scores])

  const bestWorstDay = useMemo(() => {
    const arr = dayTotals.map((v, i) => ({ v, i }))
    arr.sort((a, b) => b.v - a.v)
    const best = arr[0] ?? { v: 0, i: 0 }
    const worst = arr[arr.length - 1] ?? { v: 0, i: 0 }
    return { best, worst }
  }, [dayTotals])

  const setCell = (itemId: number, value: number, remark: string) => {
    setScores((prev) => ({ ...prev, [itemId]: value }))
    setRemarks((prev) => ({ ...prev, [itemId]: remark }))
    const baseScore = baseRef.current.scores[itemId]
    const baseRemark = baseRef.current.remarks[itemId] ?? ''
    if (baseScore === value && baseRemark === remark) {
      setDirty((prev) => {
        const { [itemId]: _, ...rest } = prev
        return rest
      })
    } else {
      setDirty((prev) => ({ ...prev, [itemId]: true }))
    }
  }

  const [day, setDay] = useState<number>(1)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(false)

  useEffect(() => {
    if (!q.data) return
    // Default to "today" if within this week; otherwise Monday.
    const start = new Date(q.data.weekStartDate + 'T00:00:00')
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / (24 * 3600 * 1000))
    const nextDay = diff >= 0 && diff <= 6 ? diff + 1 : 1
    setDay((prev) => (prev >= 1 && prev <= 7 ? prev : nextDay))
  }, [q.data?.weekStartDate])

  const dayTotal = dayTotals[day - 1] ?? 0

  const suggestHighlights = () => {
    if (!q.data) return ''
    const totals = new Map<string, number>()
    for (const it of q.data.items) {
      if (it.category === 'PENALTY') continue
      const s = scores[it.id] ?? it.score
      const k = `${it.category}|${it.dimensionName}`
      totals.set(k, (totals.get(k) ?? 0) + s)
    }
    const top = Array.from(totals.entries())
      .map(([k, v]) => ({ k, v }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 3)
    if (!top.length) return '1) 坚持每天打卡\n2) 和爸爸妈妈一起复盘\n3) 下周继续加油'
    return top
      .map((x, idx) => {
        const [, name] = x.k.split('|')
        const v = x.v
        return `${idx + 1}) ${name}（+${v}）`
      })
      .join('\n')
  }

  const dayView = useMemo(() => {
    const out: Array<{
      cat: DimensionCategory
      dims: Array<{
        name: string
        item: WeeklyScoreItem
        state: WeatherState
        score: number
      }>
      catTotal: number
      reviewedCount: number
      totalCount: number
    }> = []

    for (const cat of CAT_ORDER) {
      const dimsMap = grouped.get(cat)
      if (!dimsMap) continue

      const dims: Array<{ name: string; item: WeeklyScoreItem; state: WeatherState; score: number }> = []
      let catTotal = 0
      let reviewedCount = 0
      let totalCount = 0

      const dimNames = Array.from(dimsMap.keys()).sort((a, b) => a.localeCompare(b))
      for (const dn of dimNames) {
        const arr = dimsMap.get(dn) ?? []
        const it = arr.find((x) => x.day === day)
        if (!it) continue
        totalCount += 1
        const state = readIconState({
          ...it,
          score: scores[it.id] ?? it.score,
          remark: (remarks[it.id] ?? it.remark ?? '') as any,
        })
        const stateShown = normalizeStateForCategory(cat, state)
        const score = stateToUpdate(it, stateShown).score
        const r = remarks[it.id] ?? it.remark ?? ''
        const s = scores[it.id] ?? it.score
        const reviewed = isReviewed(r, s)
        if (reviewed) reviewedCount += 1
        if (onlyUnreviewed && reviewed) continue
        dims.push({ name: dn, item: it, state: stateShown, score })
        catTotal += score
      }

      if (dims.length) out.push({ cat, dims, catTotal, reviewedCount, totalCount })
    }

    return out
  }, [day, grouped, onlyUnreviewed, remarks, scores])

  const applyBulk = (updates: Array<{ id: number; score: number; remark: string }>) => {
    if (!updates.length) return
    const sPatch: Record<number, number> = {}
    const rPatch: Record<number, string> = {}
    const dPatch: Record<number, true> = {}
    for (const u of updates) {
      sPatch[u.id] = u.score
      rPatch[u.id] = u.remark
      dPatch[u.id] = true
    }
    setScores((prev) => ({ ...prev, ...sPatch }))
    setRemarks((prev) => ({ ...prev, ...rPatch }))
    setDirty((prev) => ({ ...prev, ...dPatch }))
  }

  const setAllCloudForDay = () => {
    const updates: Array<{ id: number; score: number; remark: string }> = []
    for (const it of q.data?.items ?? []) {
      if (it.day !== day) continue
      const u = stateToUpdate(it, 'CLOUD')
      updates.push({ id: it.id, score: u.score, remark: u.remark })
    }
    applyBulk(updates)
  }

  const copyFromYesterday = () => {
    if (day <= 1) return
    const prevDay = day - 1
    const all = q.data?.items ?? []
    const byKey = new Map<string, WeeklyScoreItem>()
    for (const it of all) {
      byKey.set(`${it.category}|${it.dimensionName}|${it.day}`, it)
    }
    const updates: Array<{ id: number; score: number; remark: string }> = []
    for (const it of all) {
      if (it.day !== day) continue
      const prev = byKey.get(`${it.category}|${it.dimensionName}|${prevDay}`)
      if (!prev) continue
      const prevState = readIconState({
        ...prev,
        score: scores[prev.id] ?? prev.score,
        remark: (remarks[prev.id] ?? prev.remark ?? '') as any,
      })
      const u = stateToUpdate(it, prevState)
      updates.push({ id: it.id, score: u.score, remark: u.remark })
    }
    applyBulk(updates)
  }

  if (!Number.isFinite(scoreId) || scoreId <= 0) {
    return (
      <Stack spacing={2}>
        <Typography>参数错误</Typography>
        <Button variant="outlined" onClick={() => nav('/weekly-scores')}>
          返回
        </Button>
      </Stack>
    )
  }

  const ws = q.data

  const reviewRemain = (weekReviewed.total ?? 0) - (weekReviewed.reviewed ?? 0)
  const kidHint =
    isLocked ? null
      : reviewRemain <= 0 ? '全部打卡完成，太棒啦～'
      : reviewRemain <= 3 ? `再完成 ${reviewRemain} 项就全部打卡啦，加油～`
      : `每天选一天，用 ☀️🌤☁️ 给表现打打分～`

  return (
    <Stack spacing={3}>
      <PageHeader
        title="一周总结 · 填写"
        subtitle={ws ? `${ws.weekStartDate} ～ ${ws.weekEndDate} · 选一天，给表现打打分` : '加载中…'}
        sticker="sparkles"
        tone="amber"
        actions={
          <>
            {ws ? <Chip label={`状态：${ws.status}`} size="small" /> : null}
            <Button component={RouterLink} to="/weekly-scores" variant="outlined" size="medium">
              返回列表
            </Button>
            {ws?.status === 'SUBMITTED' ? (
              <Button variant="outlined" color="warning" onClick={() => revokeMut.mutate()} disabled={revokeMut.isPending}>
                撤回
              </Button>
            ) : null}
            <Button variant="contained" onClick={() => submitMut.mutate()} disabled={!ws || isLocked || submitMut.isPending}>
              提交（结算积分）
            </Button>
          </>
        }
      />

      {/* 本周成绩单 - KIDS 风格区块 */}
      <Card
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'rgba(251,191,36,0.22)',
          background:
            'radial-gradient(320px 160px at 8% 0%, rgba(251,191,36,0.12), transparent 55%), radial-gradient(280px 140px at 92% 10%, rgba(244,114,182,0.10), transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.92), rgba(255,251,235,0.88))',
        }}
      >
        <CardContent sx={{ py: 2, px: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Sticker name="sparkles" size={22} />
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2, fontSize: '1.1rem' }}>
                本周成绩单
              </Typography>
              {kidHint ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                  {kidHint}
                </Typography>
              ) : null}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 200,
                  py: 1.5,
                  px: 2,
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'rgba(251,191,36,0.28)',
                  bgcolor: 'rgba(255,255,255,0.65)',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap">
                  <Typography sx={{ fontWeight: 900, letterSpacing: -0.2 }}>本周总分</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 1100, letterSpacing: -0.5, color: 'primary.main' }}>
                    {ws?.totalScore ?? 0}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 800 }}>
                  {isLocked ? '已提交，不可再修改' : saveMut.isPending ? '自动保存中…' : Object.keys(dirty).length ? '等待自动保存…' : '已保存'}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Chip
                  size="small"
                  icon={<Sticker name="flower" size={14} />}
                  label={`完成 ${weekReviewed.pct}%（${weekReviewed.reviewed}/${weekReviewed.total}）`}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.75)' }}
                />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherSun" size={14} />}
                  label={`最棒：周${DAY_CN[bestWorstDay.best.i]} ${bestWorstDay.best.v > 0 ? `+${bestWorstDay.best.v}` : bestWorstDay.best.v}`}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(34,197,94,0.12)', border: '1px solid', borderColor: 'rgba(34,197,94,0.24)' }}
                />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherCloud" size={14} />}
                  label={`加油：周${DAY_CN[bestWorstDay.worst.i]} ${bestWorstDay.worst.v > 0 ? `+${bestWorstDay.worst.v}` : bestWorstDay.worst.v}`}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(251,191,36,0.12)', border: '1px solid', borderColor: 'rgba(251,191,36,0.22)' }}
                />
              </Stack>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={weekReviewed.pct}
              sx={{
                height: 12,
                borderRadius: 999,
                bgcolor: 'rgba(15,23,42,0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, rgba(251,191,36,0.55), rgba(244,114,182,0.45), rgba(34,197,94,0.40))',
                },
              }}
            />

            <Divider sx={{ borderColor: 'rgba(251,191,36,0.18)' }} />

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`学习 +${weekCatTotals.LEARNING}`} sx={{ fontWeight: 950 }} />
              <Chip size="small" icon={<Sticker name="flower" size={16} />} label={`生活 +${weekCatTotals.LIFE}`} sx={{ fontWeight: 950 }} />
              <Chip size="small" icon={<Sticker name="sparkles" size={16} />} label={`加分 +${weekCatTotals.BONUS}`} sx={{ fontWeight: 950 }} />
              <Chip
                size="small"
                icon={<Sticker name="warning" size={16} />}
                label={`扣分 ${weekCatTotals.PENALTY}`}
                sx={{ fontWeight: 950 }}
              />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1.25,
                alignItems: 'end',
                p: 1.5,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'rgba(251,191,36,0.18)',
                bgcolor: 'rgba(255,255,255,0.62)',
                background:
                  'radial-gradient(220px 120px at 10% 0%, rgba(250,204,21,0.14), transparent 60%), radial-gradient(260px 150px at 85% 20%, rgba(79,70,229,0.12), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.55))',
              }}
            >
              {(() => {
                const maxAbs = Math.max(1, ...dayTotals.map((v) => Math.abs(v)))
                return dayTotals.map((v, i) => {
                  const positive = v > 0
                  const negative = v < 0
                  const h = 12 + Math.round((Math.abs(v) / maxAbs) * 42)
                  const bg = positive ? 'linear-gradient(180deg, rgba(34,197,94,0.55), rgba(34,197,94,0.20))' : negative ? 'linear-gradient(180deg, rgba(239,68,68,0.55), rgba(239,68,68,0.18))' : 'linear-gradient(180deg, rgba(148,163,184,0.55), rgba(148,163,184,0.22))'
                  const bd = positive ? 'rgba(34,197,94,0.22)' : negative ? 'rgba(239,68,68,0.20)' : 'rgba(148,163,184,0.22)'
                  const fg = positive ? 'success.dark' : negative ? 'error.dark' : 'text.secondary'
                  return (
                    <Box key={i} sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          height: h,
                          borderRadius: 999,
                          border: '1px solid',
                          borderColor: bd,
                          background: bg,
                          boxShadow: '0 10px 20px rgba(15,23,42,0.06)',
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 950, color: 'rgba(15,23,42,0.70)' }}>
                        周{DAY_CN[i]}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 1100 }} color={fg as any}>
                        {v > 0 ? `+${v}` : v}
                      </Typography>
                    </Box>
                  )
                })
              })()}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 选一天来打分 - KIDS 风格 */}
      <Card
        sx={{
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'rgba(244,114,182,0.20)',
          background:
            'radial-gradient(240px 120px at 12% 0%, rgba(244,114,182,0.12), transparent 55%), radial-gradient(260px 140px at 88% 20%, rgba(79,70,229,0.10), transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.92), rgba(253,242,248,0.88))',
        }}
      >
        <CardContent sx={{ py: 2, px: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Sticker name="flower" size={22} />
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2, fontSize: '1.1rem' }}>
                选一天来打分
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                点下面的「周一到周日」，用 ☀️ 满分、🌤 半分、☁️ 未评来标记～
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <Tabs
                value={day - 1}
                onChange={(_, v) => setDay(Number(v) + 1)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  flex: 1,
                  minWidth: 280,
                  '& .MuiTab-root': { fontWeight: 950, textTransform: 'none', minHeight: 44 },
                  '& .MuiTabs-indicator': { height: 4, borderRadius: 999 },
                }}
              >
                {Array.from({ length: 7 }).map((_, i) => {
                  const v = dayTotals[i] ?? 0
                  const label = `周${DAY_CN[i]} ${v > 0 ? `+${v}` : v}`
                  return <Tab key={i} label={label} /> 
                })}
              </Tabs>

              <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'none', md: 'flex' }, opacity: 0.9 }} alignItems="center">
                <Sticker name="weatherSun" size={20} />
                <Sticker name="weatherSunCloud" size={20} />
                <Sticker name="weatherCloud" size={20} />
              </Stack>

              <Chip
                icon={<Sticker name="sparkles" size={16} />}
                label={`今天总分：${dayTotal > 0 ? `+${dayTotal}` : dayTotal}`}
                sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.75)', border: '1px solid', borderColor: 'rgba(244,114,182,0.22)' }}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={<Switch checked={onlyUnreviewed} onChange={(e) => setOnlyUnreviewed(e.target.checked)} size="small" />}
                label={<Typography variant="body2" sx={{ fontWeight: 800 }}>只看未评</Typography>}
              />
              <Box sx={{ flex: 1 }} />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button variant="outlined" size="medium" onClick={copyFromYesterday} disabled={isLocked || day <= 1}>
                  复制昨天
                </Button>
                <Button variant="outlined" size="medium" startIcon={<Sticker name="weatherCloud" size={18} />} onClick={setAllCloudForDay} disabled={isLocked}>
                  本日清空
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* 每天的表现 - 分类折叠 */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
          <Sticker name="sprout" size={18} />
          <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2, fontSize: '0.95rem' }}>
            每天的表现
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            展开每一项，用天气图标打分
          </Typography>
        </Box>
      <Stack spacing={1}>
        {dayView.map(({ cat, dims, catTotal, reviewedCount, totalCount }) => {
          const tint = catTint(cat)
          const pct = totalCount ? Math.round((reviewedCount / totalCount) * 100) : 0
          return (
          <Accordion
            key={cat}
            defaultExpanded
            sx={{
              borderColor: tint.bd,
              background: `${tint.grad}, linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58))`,
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ position: 'relative' }}>
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-10deg)',
                  opacity: 0.16,
                  filter: 'blur(0.2px)',
                }}
              >
                <Sticker name={catStickerName(cat)} size={44} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                {catSticker(cat)}
                <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>{catLabel(cat)}</Typography>
                <Chip
                  size="small"
                  label={`${dims.length} 项`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.60)', fontWeight: 950 }}
                />
                <Box sx={{ flex: 1 }} />
                <Chip size="small" label={`已评 ${reviewedCount}/${totalCount}`} sx={{ bgcolor: tint.bg, border: '1px solid', borderColor: tint.bd, fontWeight: 950 }} />
                <Chip
                  size="small"
                  label={`当日小计：${catTotal > 0 ? `+${catTotal}` : catTotal}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.60)', fontWeight: 950 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5 }}>
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: 'rgba(15,23,42,0.06)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 999,
                      background: `linear-gradient(90deg, ${tint.bd}, rgba(20,184,166,0.35))`,
                    },
                  }}
                />
              </Box>
              <Stack spacing={1}>
                {dims.map(({ name, item, state, score }) => {
                  const badge = score > 0 ? `+${score}` : score < 0 ? `${score}` : '0'
                  return (
                    <Card
                      key={item.id}
                      variant="outlined"
                      sx={{
                        borderRadius: 4,
                        bgcolor: 'rgba(255,255,255,0.72)',
                        borderColor: 'rgba(15,23,42,0.10)',
                      }}
                    >
                      <CardContent sx={{ py: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                          <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography sx={{ fontWeight: 950, letterSpacing: -0.2 }}>{name}</Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <ToggleButtonGroup
                              exclusive
                              size="small"
                              value={state}
                              onChange={(_, v) => {
                                if (!v) return
                                const u = stateToUpdate(item, v)
                                setCell(item.id, u.score, u.remark)
                              }}
                              disabled={isLocked}
                              sx={{
                                bgcolor: 'background.paper',
                                borderRadius: 999,
                                p: 0.25,
                                border: '1px solid',
                                borderColor: 'divider',
                                '& .MuiToggleButtonGroup-grouped': {
                                  border: 0,
                                  mx: 0.25,
                                  borderRadius: 999,
                                  px: 0.75,
                                  py: 0.25,
                                  minWidth: 0,
                                },
                              }}
                            >
                              {cat === 'PENALTY' ? (
                                <>
                                  <ToggleButton
                                    value="STORM"
                                    sx={{
                                      color: state === 'STORM' ? 'error.dark' : 'text.secondary',
                                      bgcolor: state === 'STORM' ? 'rgba(239,68,68,0.16)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title={`全扣（-${item.maxScore}）`} arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherStorm" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton
                                    value="RAIN"
                                    sx={{
                                      color: state === 'RAIN' ? '#1d4ed8' : 'text.secondary',
                                      bgcolor: state === 'RAIN' ? 'rgba(59,130,246,0.14)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title={`半扣（-${halfScore(item.maxScore)}）`} arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherRain" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton
                                    value="CLOUD"
                                    sx={{
                                      color: state === 'CLOUD' ? 'text.primary' : 'text.secondary',
                                      bgcolor: state === 'CLOUD' ? 'rgba(148,163,184,0.18)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title="默认（0）" arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherCloud" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                </>
                              ) : (
                                <>
                                  <ToggleButton
                                    value="SUN"
                                    sx={{
                                      color: state === 'SUN' ? '#a16207' : 'text.secondary',
                                      bgcolor: state === 'SUN' ? 'rgba(250,204,21,0.22)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title={`满分（+${item.maxScore}）`} arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherSun" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton
                                    value="SUN_CLOUD"
                                    sx={{
                                      color: state === 'SUN_CLOUD' ? 'primary.dark' : 'text.secondary',
                                      bgcolor: state === 'SUN_CLOUD' ? 'rgba(79,70,229,0.14)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title={`半分（+${halfScore(item.maxScore)}）`} arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherSunCloud" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                  <ToggleButton
                                    value="CLOUD"
                                    sx={{
                                      color: state === 'CLOUD' ? 'text.primary' : 'text.secondary',
                                      bgcolor: state === 'CLOUD' ? 'rgba(148,163,184,0.18)' : 'transparent',
                                    }}
                                  >
                                    <Tooltip title="默认（0）" arrow>
                                      <Box sx={{ display: 'grid', placeItems: 'center', px: 0.25 }}>
                                        <Sticker name="weatherCloud" size={16} />
                                      </Box>
                                    </Tooltip>
                                  </ToggleButton>
                                </>
                              )}
                            </ToggleButtonGroup>

                            <Box
                              sx={{
                                minWidth: 52,
                                px: 1,
                                py: 0.5,
                                borderRadius: 999,
                                border: '1px solid',
                                borderColor:
                                  score > 0
                                    ? 'rgba(34,197,94,0.22)'
                                    : score < 0
                                      ? 'rgba(239,68,68,0.20)'
                                      : 'rgba(148,163,184,0.20)',
                                bgcolor:
                                  score > 0
                                    ? 'rgba(34,197,94,0.10)'
                                    : score < 0
                                      ? 'rgba(239,68,68,0.10)'
                                      : 'rgba(148,163,184,0.12)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 1100, letterSpacing: -0.2 }}
                                color={score > 0 ? 'success.dark' : score < 0 ? 'error.dark' : 'text.secondary'}
                              >
                                {badge}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )})}
      </Stack>
      </Box>

      {/* 周总结小卡 - KIDS 风格 */}
      <Card
        sx={{
          borderRadius: 5,
          border: '1px solid',
          borderColor: 'rgba(34,197,94,0.18)',
          background:
            'radial-gradient(280px 140px at 10% 0%, rgba(34,197,94,0.10), transparent 55%), radial-gradient(260px 150px at 90% 20%, rgba(250,204,21,0.12), transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.92), rgba(240,253,244,0.88))',
        }}
      >
        <CardContent sx={{ py: 2, px: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Sticker name="sparkles" size={22} />
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2, fontSize: '1.1rem' }}>
                周总结小卡
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
                写一写本周亮点、要改进的、下周小目标～
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setReflection((prev) => ({ ...prev, highlights: prev.highlights.trim() ? prev.highlights : suggestHighlights() }))}
                disabled={isLocked}
              >
                从数据生成亮点
              </Button>
              <Button size="small" variant="outlined" onClick={() => setReflection({ highlights: '', improvements: '', nextGoals: '', note: '' })} disabled={isLocked}>
                清空
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              这些文字只保存在本机浏览器（不提交到服务器）。提交结算后本页将锁定。
            </Typography>

            <TextField
              label="本周亮点（建议 3 条）"
              value={reflection.highlights}
              onChange={(e) => setReflection((prev) => ({ ...prev, highlights: e.target.value }))}
              placeholder="例如：1) 主动完成作业
2) 自己整理书包
3) 和同学友好相处"
              multiline
              minRows={3}
              disabled={isLocked}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              label="需要改进（建议 1-2 条）"
              value={reflection.improvements}
              onChange={(e) => setReflection((prev) => ({ ...prev, improvements: e.target.value }))}
              placeholder="例如：睡前刷牙偶尔忘记；情绪上来时先深呼吸 3 次"
              multiline
              minRows={2}
              disabled={isLocked}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              label="下周小目标（最多 3 条）"
              value={reflection.nextGoals}
              onChange={(e) => setReflection((prev) => ({ ...prev, nextGoals: e.target.value }))}
              placeholder="例如：1) 每天阅读 20 分钟
2) 放学后先写作业再玩
3) 周末帮忙做一次家务"
              multiline
              minRows={2}
              disabled={isLocked}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />

            <TextField
              label="家长寄语 / 孩子自评"
              value={reflection.note}
              onChange={(e) => setReflection((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="例如：你这周很努力，爸爸妈妈看到了。下周我们一起把“早睡”做好。"
              multiline
              minRows={2}
              disabled={isLocked}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

