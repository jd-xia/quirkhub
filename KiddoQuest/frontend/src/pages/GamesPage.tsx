import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'
import { useAuth } from '../auth/AuthContext'

type PointsBalance = { childId: number; balance: number }
type PlayTimeLog = {
  id: number
  changeType: 'REDEEM_FROM_POINTS' | 'CONSUME_GAME' | 'MANUAL_ADJUST'
  minutesChange: number
  balanceMinutes: number
  description: string
  relatedId: number | null
  createTime: string
}
type PlayTimeSummary = { childId: number; balanceMinutes: number; recentLogs: PlayTimeLog[] }

const MINUTES_PER_POINT = 1

type CardCell = {
  id: number
  emoji: string
  pairId: number
  state: 'DOWN' | 'UP' | 'DONE'
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function memoryDeck(sizePairs = 8): CardCell[] {
  const pool = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦄', '🐰', '🐯', '🐷', '🐙', '🐧', '🦁', '🐨', '🐹', '🐻']
  const pick = shuffle(pool).slice(0, sizePairs)
  const cards: CardCell[] = []
  let id = 1
  pick.forEach((e, idx) => {
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
  })
  return shuffle(cards)
}

export function GamesPage() {
  const { role, session } = useAuth()
  const qc = useQueryClient()

  const isChild = role === 'CHILD'
  const childId = session?.userId ?? 0

  const pointsQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['points', 'balance', childId],
    queryFn: async () => (await http.get<PointsBalance>(`/points/${childId}`)).data,
  })

  const playtimeQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['playtime', 'summary', childId],
    queryFn: async () => (await http.get<PlayTimeSummary>(`/playtime/${childId}/summary`)).data,
  })

  const points = pointsQ.data?.balance ?? 0
  const balanceMinutes = playtimeQ.data?.balanceMinutes ?? 0

  const [redeemMinutes, setRedeemMinutes] = useState(30)
  const redeemCost = useMemo(() => Math.ceil(redeemMinutes / MINUTES_PER_POINT), [redeemMinutes])

  const [err, setErr] = useState<string | null>(null)

  const redeemMut = useMutation({
    mutationFn: async () => (await http.post<PlayTimeLog>(`/playtime/${childId}/redeem`, { minutes: redeemMinutes })).data,
    onSuccess: async () => {
      setErr(null)
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '兑换失败'),
  })

  const consumeMut = useMutation({
    mutationFn: async (payload: { minutes: number; game: string }) =>
      (await http.post<PlayTimeLog>(`/playtime/${childId}/consume`, { minutes: payload.minutes, game: payload.game })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
  })

  // memory game
  const [useMinutes, setUseMinutes] = useState<5 | 10 | 15>(10)
  const [playing, setPlaying] = useState(false)
  const [leftSec, setLeftSec] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const tickRef = useRef<number | null>(null)

  const [deck, setDeck] = useState<CardCell[]>(() => memoryDeck(8))
  const [flips, setFlips] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const doneCount = useMemo(() => deck.filter((c) => c.state === 'DONE').length, [deck])
  const finished = doneCount === deck.length

  function resetGame() {
    setDeck(memoryDeck(8))
    setFlips([])
    setMoves(0)
  }

  function stopAndConsume() {
    if (!playing) return
    setPlaying(false)
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null

    const usedMin = Math.max(1, Math.ceil(elapsedSec / 60))
    consumeMut.mutate({ minutes: usedMin, game: '记忆翻牌' })
  }

  useEffect(() => {
    if (!playing) return
    tickRef.current = window.setInterval(() => {
      setLeftSec((s) => Math.max(0, s - 1))
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    if (leftSec <= 0) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSec, playing])

  useEffect(() => {
    if (playing && finished) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, playing])

  function start() {
    if (!isChild) {
      setErr('只有孩子端可以玩游戏')
      return
    }
    if (balanceMinutes <= 0) {
      setErr('没有可用游戏时间，请先用积分兑换时间')
      return
    }
    if (useMinutes > balanceMinutes) {
      setErr('可用时间不足，请降低本次时长或先兑换时间')
      return
    }
    setErr(null)
    resetGame()
    setElapsedSec(0)
    setLeftSec(useMinutes * 60)
    setPlaying(true)
  }

  function flipCard(id: number) {
    if (!playing) return
    if (flips.length >= 2) return
    const idx = deck.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (deck[idx].state !== 'DOWN') return

    const next = [...deck]
    next[idx] = { ...next[idx], state: 'UP' }
    const nextFlips = [...flips, id]
    setDeck(next)
    setFlips(nextFlips)

    if (nextFlips.length === 2) {
      setMoves((m) => m + 1)
      const [aId, bId] = nextFlips
      const a = next.find((c) => c.id === aId)!
      const b = next.find((c) => c.id === bId)!
      const match = a.pairId === b.pairId
      window.setTimeout(() => {
        setDeck((cur) => {
          const curNext = [...cur]
          for (let i = 0; i < curNext.length; i++) {
            const c = curNext[i]
            if (c.id !== aId && c.id !== bId) continue
            curNext[i] = match ? { ...c, state: 'DONE' } : { ...c, state: 'DOWN' }
          }
          return curNext
        })
        setFlips([])
      }, match ? 220 : 520)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="游戏平台" subtitle="用积分兑换游戏时间，然后开始玩小游戏！" sticker="weatherSunCloud" tone="teal" />

      {role !== 'CHILD' ? <Alert severity="info">家长端可查看说明；孩子端才能兑换/开始游戏。</Alert> : null}
      {err ? <Alert severity="error">{err}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间兑换</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                兑换比例：1 积分 = {MINUTES_PER_POINT} 分钟（每月兑换次数有限制）
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.25}>
                <ToggleButtonGroup
                  exclusive
                  value={redeemMinutes}
                  onChange={(_, v) => (v ? setRedeemMinutes(v) : null)}
                  size="small"
                  sx={{ flexWrap: 'wrap' }}
                >
                  {[15, 30, 45, 60, 90].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip icon={<Sticker name="sparkles" size={16} />} label={`我的积分：${points}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                  <Chip
                    icon={<Sticker name="weatherSun" size={16} />}
                    label={`需要：-${redeemCost} 积分`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                  />
                  <Chip
                    icon={<Sticker name="weatherCloud" size={16} />}
                    label={`可玩时间：${balanceMinutes} 分钟`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.18)' }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SportsEsportsRoundedIcon />}
                  disabled={!isChild || redeemMut.isPending || points < redeemCost}
                  onClick={() => redeemMut.mutate()}
                >
                  兑换 {redeemMinutes} 分钟
                </Button>

                <Typography variant="caption" color="text.secondary">
                  兑换成功会增加你的“可玩时间余额”，并同步扣除积分。
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间流水（最近）</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {(playtimeQ.data?.recentLogs ?? []).slice(0, 8).map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 3,
                      border: '1px solid rgba(15,23,42,0.08)',
                      bgcolor: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Sticker name={l.minutesChange > 0 ? 'weatherSun' : 'weatherStorm'} size={18} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {l.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(l.createTime).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${l.minutesChange > 0 ? '+' : ''}${l.minutesChange}m`}
                      sx={{
                        fontWeight: 1000,
                        bgcolor: l.minutesChange > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                        border: '1px solid',
                        borderColor: l.minutesChange > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.18)',
                      }}
                    />
                  </Box>
                ))}
                {(playtimeQ.data?.recentLogs ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    还没有时间流水。
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>小游戏：记忆翻牌</Typography>
                <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`步数：${moves}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherSunCloud" size={16} />}
                  label={playing ? `剩余：${formatSeconds(leftSec)}` : '未开始'}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  本次时长：
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={useMinutes}
                  onChange={(_, v) => (v ? setUseMinutes(v) : null)}
                  size="small"
                  disabled={playing}
                >
                  {[5, 10, 15].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={resetGame} disabled={playing}>
                  换一局
                </Button>
                {!playing ? (
                  <Button variant="contained" startIcon={<SportsEsportsRoundedIcon />} onClick={start} disabled={!isChild}>
                    开始
                  </Button>
                ) : (
                  <Button color="error" variant="outlined" onClick={stopAndConsume}>
                    结束并结算
                  </Button>
                )}
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1,
                }}
              >
                {deck.map((c) => {
                  const show = c.state === 'UP' || c.state === 'DONE'
                  const done = c.state === 'DONE'
                  return (
                    <Button
                      key={c.id}
                      variant="outlined"
                      onClick={() => flipCard(c.id)}
                      disabled={!playing || done}
                      sx={{
                        height: 76,
                        borderRadius: 4,
                        fontSize: 26,
                        fontWeight: 1000,
                        bgcolor: done ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.72)',
                        borderColor: done ? 'rgba(34,197,94,0.22)' : 'rgba(15,23,42,0.10)',
                      }}
                    >
                      {show ? c.emoji : '❔'}
                    </Button>
                  )
                })}
              </Box>

              {finished ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  通关啦！本局用时 {formatSeconds(elapsedSec)}，步数 {moves}。系统已自动结算游戏时间。
                </Alert>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  规则：翻开两张相同的牌就算一对。时间到或通关都会自动结算（按已用分钟扣除）。
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

/*
import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'
import { useAuth } from '../auth/AuthContext'

type PointsBalance = { childId: number; balance: number }
type PlayTimeLog = {
  id: number
  changeType: 'REDEEM_FROM_POINTS' | 'CONSUME_GAME' | 'MANUAL_ADJUST'
  minutesChange: number
  balanceMinutes: number
  description: string
  relatedId: number | null
  createTime: string
}
type PlayTimeSummary = { childId: number; balanceMinutes: number; recentLogs: PlayTimeLog[] }

const MINUTES_PER_POINT = 1

type CardCell = {
  id: number
  emoji: string
  pairId: number
  state: 'DOWN' | 'UP' | 'DONE'
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function memoryDeck(sizePairs = 8): CardCell[] {
  const pool = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦄', '🐰', '🐯', '🐷', '🐙', '🐧', '🦁', '🐨', '🐹', '🐻']
  const pick = shuffle(pool).slice(0, sizePairs)
  const cards: CardCell[] = []
  let id = 1
  pick.forEach((e, idx) => {
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
  })
  return shuffle(cards)
}

export function GamesPage() {
  const { role, session } = useAuth()
  const qc = useQueryClient()

  const isChild = role === 'CHILD'
  const childId = session?.userId ?? 0

  const pointsQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['points', 'balance', childId],
    queryFn: async () => (await http.get<PointsBalance>(`/points/${childId}`)).data,
  })

  const playtimeQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['playtime', 'summary', childId],
    queryFn: async () => (await http.get<PlayTimeSummary>(`/playtime/${childId}/summary`)).data,
  })

  const points = pointsQ.data?.balance ?? 0
  const balanceMinutes = playtimeQ.data?.balanceMinutes ?? 0

  const [redeemMinutes, setRedeemMinutes] = useState(30)
  const redeemCost = useMemo(() => Math.ceil(redeemMinutes / MINUTES_PER_POINT), [redeemMinutes])

  const [err, setErr] = useState<string | null>(null)

  const redeemMut = useMutation({
    mutationFn: async () => (await http.post<PlayTimeLog>(`/playtime/${childId}/redeem`, { minutes: redeemMinutes })).data,
    onSuccess: async () => {
      setErr(null)
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '兑换失败'),
  })

  const consumeMut = useMutation({
    mutationFn: async (payload: { minutes: number; game: string }) =>
      (await http.post<PlayTimeLog>(`/playtime/${childId}/consume`, { minutes: payload.minutes, game: payload.game })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
  })

  // memory game
  const [useMinutes, setUseMinutes] = useState<5 | 10 | 15>(10)
  const [playing, setPlaying] = useState(false)
  const [leftSec, setLeftSec] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const tickRef = useRef<number | null>(null)

  const [deck, setDeck] = useState<CardCell[]>(() => memoryDeck(8))
  const [flips, setFlips] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const doneCount = useMemo(() => deck.filter((c) => c.state === 'DONE').length, [deck])
  const finished = doneCount === deck.length

  function resetGame() {
    setDeck(memoryDeck(8))
    setFlips([])
    setMoves(0)
  }

  function stopAndConsume() {
    if (!playing) return
    setPlaying(false)
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null

    const usedMin = Math.max(1, Math.ceil(elapsedSec / 60))
    consumeMut.mutate({ minutes: usedMin, game: '记忆翻牌' })
  }

  useEffect(() => {
    if (!playing) return
    tickRef.current = window.setInterval(() => {
      setLeftSec((s) => Math.max(0, s - 1))
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    if (leftSec <= 0) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSec, playing])

  useEffect(() => {
    if (playing && finished) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, playing])

  function start() {
    if (!isChild) {
      setErr('只有孩子端可以玩游戏')
      return
    }
    if (balanceMinutes <= 0) {
      setErr('没有可用游戏时间，请先用积分兑换时间')
      return
    }
    if (useMinutes > balanceMinutes) {
      setErr('可用时间不足，请降低本次时长或先兑换时间')
      return
    }
    setErr(null)
    resetGame()
    setElapsedSec(0)
    setLeftSec(useMinutes * 60)
    setPlaying(true)
  }

  function flipCard(id: number) {
    if (!playing) return
    if (flips.length >= 2) return
    const idx = deck.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (deck[idx].state !== 'DOWN') return

    const next = [...deck]
    next[idx] = { ...next[idx], state: 'UP' }
    const nextFlips = [...flips, id]
    setDeck(next)
    setFlips(nextFlips)

    if (nextFlips.length === 2) {
      setMoves((m) => m + 1)
      const [aId, bId] = nextFlips
      const a = next.find((c) => c.id === aId)!
      const b = next.find((c) => c.id === bId)!
      const match = a.pairId === b.pairId
      window.setTimeout(() => {
        setDeck((cur) => {
          const curNext = [...cur]
          for (let i = 0; i < curNext.length; i++) {
            const c = curNext[i]
            if (c.id !== aId && c.id !== bId) continue
            curNext[i] = match ? { ...c, state: 'DONE' } : { ...c, state: 'DOWN' }
          }
          return curNext
        })
        setFlips([])
      }, match ? 220 : 520)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="游戏平台" subtitle="用积分兑换游戏时间，然后开始玩小游戏！" sticker="weatherSunCloud" tone="teal" />

      {role !== 'CHILD' ? <Alert severity="info">家长端可查看说明；孩子端才能兑换/开始游戏。</Alert> : null}
      {err ? <Alert severity="error">{err}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间兑换</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                兑换比例：1 积分 = {MINUTES_PER_POINT} 分钟（每月兑换次数有限制）
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.25}>
                <ToggleButtonGroup
                  exclusive
                  value={redeemMinutes}
                  onChange={(_, v) => (v ? setRedeemMinutes(v) : null)}
                  size="small"
                  sx={{ flexWrap: 'wrap' }}
                >
                  {[15, 30, 45, 60, 90].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip icon={<Sticker name="sparkles" size={16} />} label={`我的积分：${points}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                  <Chip
                    icon={<Sticker name="weatherSun" size={16} />}
                    label={`需要：-${redeemCost} 积分`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                  />
                  <Chip
                    icon={<Sticker name="weatherCloud" size={16} />}
                    label={`可玩时间：${balanceMinutes} 分钟`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.18)' }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SportsEsportsRoundedIcon />}
                  disabled={!isChild || redeemMut.isPending || points < redeemCost}
                  onClick={() => redeemMut.mutate()}
                >
                  兑换 {redeemMinutes} 分钟
                </Button>

                <Typography variant="caption" color="text.secondary">
                  兑换成功会增加你的“可玩时间余额”，并同步扣除积分。
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间流水（最近）</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {(playtimeQ.data?.recentLogs ?? []).slice(0, 8).map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 3,
                      border: '1px solid rgba(15,23,42,0.08)',
                      bgcolor: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Sticker name={l.minutesChange > 0 ? 'weatherSun' : 'weatherStorm'} size={18} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {l.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(l.createTime).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${l.minutesChange > 0 ? '+' : ''}${l.minutesChange}m`}
                      sx={{
                        fontWeight: 1000,
                        bgcolor: l.minutesChange > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                        border: '1px solid',
                        borderColor: l.minutesChange > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.18)',
                      }}
                    />
                  </Box>
                ))}
                {(playtimeQ.data?.recentLogs ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    还没有时间流水。
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>小游戏：记忆翻牌</Typography>
                <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`步数：${moves}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherSunCloud" size={16} />}
                  label={playing ? `剩余：${formatSeconds(leftSec)}` : '未开始'}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  本次时长：
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={useMinutes}
                  onChange={(_, v) => (v ? setUseMinutes(v) : null)}
                  size="small"
                  disabled={playing}
                >
                  {[5, 10, 15].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={resetGame} disabled={playing}>
                  换一局
                </Button>
                {!playing ? (
                  <Button variant="contained" startIcon={<SportsEsportsRoundedIcon />} onClick={start} disabled={!isChild}>
                    开始
                  </Button>
                ) : (
                  <Button color="error" variant="outlined" onClick={stopAndConsume}>
                    结束并结算
                  </Button>
                )}
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1,
                }}
              >
                {deck.map((c) => {
                  const show = c.state === 'UP' || c.state === 'DONE'
                  const done = c.state === 'DONE'
                  return (
                    <Button
                      key={c.id}
                      variant="outlined"
                      onClick={() => flipCard(c.id)}
                      disabled={!playing || done}
                      sx={{
                        height: 76,
                        borderRadius: 4,
                        fontSize: 26,
                        fontWeight: 1000,
                        bgcolor: done ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.72)',
                        borderColor: done ? 'rgba(34,197,94,0.22)' : 'rgba(15,23,42,0.10)',
                      }}
                    >
                      {show ? c.emoji : '❔'}
                    </Button>
                  )
                })}
              </Box>

              {finished ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  通关啦！本局用时 {formatSeconds(elapsedSec)}，步数 {moves}。系统已自动结算游戏时间。
                </Alert>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  规则：翻开两张相同的牌就算一对。时间到或通关都会自动结算（按已用分钟扣除）。
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

import { Alert, Box, Button, Card, CardContent, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'
import { useAuth } from '../auth/AuthContext'

type PointsBalance = { childId: number; balance: number }
type PlayTimeLog = {
  id: number
  changeType: 'REDEEM_FROM_POINTS' | 'CONSUME_GAME' | 'MANUAL_ADJUST'
  minutesChange: number
  balanceMinutes: number
  description: string
  relatedId: number | null
  createTime: string
}
type PlayTimeSummary = { childId: number; balanceMinutes: number; recentLogs: PlayTimeLog[] }

const MINUTES_PER_POINT = 1

type CardCell = {
  id: number
  emoji: string
  pairId: number
  state: 'DOWN' | 'UP' | 'DONE'
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function memoryDeck(sizePairs = 8): CardCell[] {
  const pool = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦄', '🐰', '🐯', '🐷', '🐙', '🐧', '🦁', '🐨', '🐹', '🐻']
  const pick = shuffle(pool).slice(0, sizePairs)
  const cards: CardCell[] = []
  let id = 1
  pick.forEach((e, idx) => {
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
  })
  return shuffle(cards)
}

export function GamesPage() {
  const { role, session } = useAuth()
  const qc = useQueryClient()

  const isChild = role === 'CHILD'
  const childId = session?.userId ?? 0

  const pointsQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['points', 'balance', childId],
    queryFn: async () => (await http.get<PointsBalance>(`/points/${childId}`)).data,
  })

  const playtimeQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['playtime', 'summary', childId],
    queryFn: async () => (await http.get<PlayTimeSummary>(`/playtime/${childId}/summary`)).data,
  })

  const points = pointsQ.data?.balance ?? 0
  const balanceMinutes = playtimeQ.data?.balanceMinutes ?? 0

  const [redeemMinutes, setRedeemMinutes] = useState(30)
  const redeemCost = useMemo(() => Math.ceil(redeemMinutes / MINUTES_PER_POINT), [redeemMinutes])

  const [err, setErr] = useState<string | null>(null)

  const redeemMut = useMutation({
    mutationFn: async () => (await http.post<PlayTimeLog>(`/playtime/${childId}/redeem`, { minutes: redeemMinutes })).data,
    onSuccess: async () => {
      setErr(null)
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '兑换失败'),
  })

  const consumeMut = useMutation({
    mutationFn: async (payload: { minutes: number; game: string }) =>
      (await http.post<PlayTimeLog>(`/playtime/${childId}/consume`, { minutes: payload.minutes, game: payload.game })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
  })

  // memory game
  const [useMinutes, setUseMinutes] = useState<5 | 10 | 15>(10)
  const [playing, setPlaying] = useState(false)
  const [leftSec, setLeftSec] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const tickRef = useRef<number | null>(null)

  const [deck, setDeck] = useState<CardCell[]>(() => memoryDeck(8))
  const [flips, setFlips] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const doneCount = useMemo(() => deck.filter((c) => c.state === 'DONE').length, [deck])
  const finished = doneCount === deck.length

  function resetGame() {
    setDeck(memoryDeck(8))
    setFlips([])
    setMoves(0)
  }

  function stopAndConsume() {
    if (!playing) return
    setPlaying(false)
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null

    const usedMin = Math.max(1, Math.ceil(elapsedSec / 60))
    consumeMut.mutate({ minutes: usedMin, game: '记忆翻牌' })
  }

  useEffect(() => {
    if (!playing) return
    tickRef.current = window.setInterval(() => {
      setLeftSec((s) => Math.max(0, s - 1))
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    if (leftSec <= 0) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSec, playing])

  useEffect(() => {
    if (playing && finished) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, playing])

  function start() {
    if (!isChild) {
      setErr('只有孩子端可以玩游戏')
      return
    }
    if (balanceMinutes <= 0) {
      setErr('没有可用游戏时间，请先用积分兑换时间')
      return
    }
    if (useMinutes > balanceMinutes) {
      setErr('可用时间不足，请降低本次时长或先兑换时间')
      return
    }
    setErr(null)
    resetGame()
    setElapsedSec(0)
    setLeftSec(useMinutes * 60)
    setPlaying(true)
  }

  function flipCard(id: number) {
    if (!playing) return
    if (flips.length >= 2) return
    const idx = deck.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (deck[idx].state !== 'DOWN') return

    const next = [...deck]
    next[idx] = { ...next[idx], state: 'UP' }
    const nextFlips = [...flips, id]
    setDeck(next)
    setFlips(nextFlips)

    if (nextFlips.length === 2) {
      setMoves((m) => m + 1)
      const [aId, bId] = nextFlips
      const a = next.find((c) => c.id === aId)!
      const b = next.find((c) => c.id === bId)!
      const match = a.pairId === b.pairId
      window.setTimeout(() => {
        setDeck((cur) => {
          const curNext = [...cur]
          for (let i = 0; i < curNext.length; i++) {
            const c = curNext[i]
            if (c.id !== aId && c.id !== bId) continue
            curNext[i] = match ? { ...c, state: 'DONE' } : { ...c, state: 'DOWN' }
          }
          return curNext
        })
        setFlips([])
      }, match ? 220 : 520)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="游戏平台" subtitle="用积分兑换游戏时间，然后开始玩小游戏！" sticker="weatherSunCloud" tone="teal" />

      {role !== 'CHILD' ? <Alert severity="info">家长端可查看说明；孩子端才能兑换/开始游戏。</Alert> : null}
      {err ? <Alert severity="error">{err}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间兑换</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                兑换比例：1 积分 = {MINUTES_PER_POINT} 分钟（每月兑换次数有限制）
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.25}>
                <ToggleButtonGroup
                  exclusive
                  value={redeemMinutes}
                  onChange={(_, v) => (v ? setRedeemMinutes(v) : null)}
                  size="small"
                  sx={{ flexWrap: 'wrap' }}
                >
                  {[15, 30, 45, 60, 90].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip icon={<Sticker name="sparkles" size={16} />} label={`我的积分：${points}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                  <Chip
                    icon={<Sticker name="weatherSun" size={16} />}
                    label={`需要：-${redeemCost} 积分`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                  />
                  <Chip
                    icon={<Sticker name="weatherCloud" size={16} />}
                    label={`可玩时间：${balanceMinutes} 分钟`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.18)' }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SportsEsportsRoundedIcon />}
                  disabled={!isChild || redeemMut.isPending || points < redeemCost}
                  onClick={() => redeemMut.mutate()}
                >
                  兑换 {redeemMinutes} 分钟
                </Button>

                <Typography variant="caption" color="text.secondary">
                  兑换成功会增加你的“可玩时间余额”，并同步扣除积分。
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间流水（最近）</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {(playtimeQ.data?.recentLogs ?? []).slice(0, 8).map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 3,
                      border: '1px solid rgba(15,23,42,0.08)',
                      bgcolor: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Sticker name={l.minutesChange > 0 ? 'weatherSun' : 'weatherStorm'} size={18} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {l.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(l.createTime).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${l.minutesChange > 0 ? '+' : ''}${l.minutesChange}m`}
                      sx={{
                        fontWeight: 1000,
                        bgcolor: l.minutesChange > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                        border: '1px solid',
                        borderColor: l.minutesChange > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.18)',
                      }}
                    />
                  </Box>
                ))}
                {(playtimeQ.data?.recentLogs ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    还没有时间流水。
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>小游戏：记忆翻牌</Typography>
                <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`步数：${moves}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherSunCloud" size={16} />}
                  label={playing ? `剩余：${formatSeconds(leftSec)}` : '未开始'}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  本次时长：
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={useMinutes}
                  onChange={(_, v) => (v ? setUseMinutes(v) : null)}
                  size="small"
                  disabled={playing}
                >
                  {[5, 10, 15].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" startIcon={<RestartAltRoundedIcon />} onClick={resetGame} disabled={playing}>
                  换一局
                </Button>
                {!playing ? (
                  <Button variant="contained" startIcon={<SportsEsportsRoundedIcon />} onClick={start} disabled={!isChild}>
                    开始
                  </Button>
                ) : (
                  <Button color="error" variant="outlined" onClick={stopAndConsume}>
                    结束并结算
                  </Button>
                )}
              </Stack>

              <Box
                sx={{
                  mt: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1,
                }}
              >
                {deck.map((c) => {
                  const show = c.state === 'UP' || c.state === 'DONE'
                  const done = c.state === 'DONE'
                  return (
                    <Button
                      key={c.id}
                      variant="outlined"
                      onClick={() => flipCard(c.id)}
                      disabled={!playing || done}
                      sx={{
                        height: 76,
                        borderRadius: 4,
                        fontSize: 26,
                        fontWeight: 1000,
                        bgcolor: done ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.72)',
                        borderColor: done ? 'rgba(34,197,94,0.22)' : 'rgba(15,23,42,0.10)',
                      }}
                    >
                      {show ? c.emoji : '❔'}
                    </Button>
                  )
                })}
              </Box>

              {finished ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  通关啦！本局用时 {formatSeconds(elapsedSec)}，步数 {moves}。系统已自动结算游戏时间。
                </Alert>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  规则：翻开两张相同的牌就算一对。时间到或通关都会自动结算（按已用分钟扣除）。
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'
import { useAuth } from '../auth/AuthContext'

type PointsBalance = { childId: number; balance: number }
type PlayTimeLog = {
  id: number
  changeType: 'REDEEM_FROM_POINTS' | 'CONSUME_GAME' | 'MANUAL_ADJUST'
  minutesChange: number
  balanceMinutes: number
  description: string
  relatedId: number | null
  createTime: string
}
type PlayTimeSummary = { childId: number; balanceMinutes: number; recentLogs: PlayTimeLog[] }

const MINUTES_PER_POINT = 1

type GameKey = 'MEMORY' | 'ESSAY' | 'DICTATION'

type EssaySubmission = {
  id: string
  promptTitle: string
  promptHint: string
  content: string
  length: number
  createTime: string
}

const ESSAY_STORAGE_KEY = 'kiddoquest:essay:submissions:v1'

function loadEssaySubmissions(): EssaySubmission[] {
  try {
    const raw = localStorage.getItem(ESSAY_STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as EssaySubmission[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveEssaySubmissions(items: EssaySubmission[]) {
  localStorage.setItem(ESSAY_STORAGE_KEY, JSON.stringify(items.slice(0, 50)))
}

type DictationResult = {
  id: string
  text: string
  input: string
  ok: boolean
}

type DictationSession = {
  id: string
  total: number
  correct: number
  createTime: string
}

const DICTATION_STORAGE_KEY = 'kiddoquest:dictation:sessions:v1'

function loadDictationSessions(): DictationSession[] {
  try {
    const raw = localStorage.getItem(DICTATION_STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as DictationSession[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function saveDictationSessions(items: DictationSession[]) {
  localStorage.setItem(DICTATION_STORAGE_KEY, JSON.stringify(items.slice(0, 30)))
}

function normalize(s: string) {
  return (s ?? '')
    .trim()
    .replace(/[\s，。！？!?,.、；;：“”""'‘’（）()【】\[\]《》<>]/g, '')
    .toLowerCase()
}

function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

function speakZh(text: string, rate = 0.9) {
  if (!canSpeak()) return false
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = rate
    u.pitch = 1.05
    u.volume = 1
    window.speechSynthesis.speak(u)
    return true
  } catch {
    return false
  }
}

type CardCell = {
  id: number
  emoji: string
  pairId: number
  state: 'DOWN' | 'UP' | 'DONE'
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function memoryDeck(sizePairs = 8): CardCell[] {
  const pool = ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦄', '🐰', '🐯', '🐷', '🐙', '🐧', '🦁', '🐨', '🐹', '🐻']
  const pick = shuffle(pool).slice(0, sizePairs)
  const cards: CardCell[] = []
  let id = 1
  pick.forEach((e, idx) => {
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
    cards.push({ id: id++, emoji: e, pairId: idx, state: 'DOWN' })
  })
  return shuffle(cards)
}

export function GamesPage() {
  const { role, session } = useAuth()
  const qc = useQueryClient()

  const isChild = role === 'CHILD'
  const childId = session?.userId ?? 0

  const pointsQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['points', 'balance', childId],
    queryFn: async () => (await http.get<PointsBalance>(`/points/${childId}`)).data,
  })

  const playtimeQ = useQuery({
    enabled: isChild && childId > 0,
    queryKey: ['playtime', 'summary', childId],
    queryFn: async () => (await http.get<PlayTimeSummary>(`/playtime/${childId}/summary`)).data,
  })

  const points = pointsQ.data?.balance ?? 0
  const balanceMinutes = playtimeQ.data?.balanceMinutes ?? 0

  const [redeemMinutes, setRedeemMinutes] = useState(30)
  const redeemCost = useMemo(() => Math.ceil(redeemMinutes / MINUTES_PER_POINT), [redeemMinutes])

  const [err, setErr] = useState<string | null>(null)

  const redeemMut = useMutation({
    mutationFn: async () => (await http.post<PlayTimeLog>(`/playtime/${childId}/redeem`, { minutes: redeemMinutes })).data,
    onSuccess: async () => {
      setErr(null)
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '兑换失败'),
  })

  const consumeMut = useMutation({
    mutationFn: async (payload: { minutes: number; game: string }) =>
      (await http.post<PlayTimeLog>(`/playtime/${childId}/consume`, { minutes: payload.minutes, game: payload.game })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
  })

  const submitEssayMut = useMutation({
    mutationFn: async (payload: { minutesUsed: number; promptTitle: string; content: string }) =>
      (await http.post(`/games/essay/submit`, payload)).data as { awardedPoints: number; pointsBalance: number; playtimeBalanceMinutes: number },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '提交失败'),
  })

  const submitDictationMut = useMutation({
    mutationFn: async (payload: { minutesUsed: number; total: number; correct: number }) =>
      (await http.post(`/games/dictation/submit`, payload)).data as { awardedPoints: number; pointsBalance: number; playtimeBalanceMinutes: number },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['points'] })
      await qc.invalidateQueries({ queryKey: ['playtime'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '提交失败'),
  })

  const [game, setGame] = useState<GameKey>('MEMORY')

  // session timer state (shared)
  const [useMinutes, setUseMinutes] = useState<5 | 10 | 15>(10)
  const [playing, setPlaying] = useState(false)
  const [leftSec, setLeftSec] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const tickRef = useRef<number | null>(null)

  const sessionGameLabel = useMemo(() => {
    if (game === 'MEMORY') return '记忆翻牌'
    if (game === 'ESSAY') return '小作文'
    return '听写'
  }, [game])

  // memory game
  const [deck, setDeck] = useState<CardCell[]>(() => memoryDeck(8))
  const [flips, setFlips] = useState<number[]>([])
  const [moves, setMoves] = useState(0)

  const doneCount = useMemo(() => deck.filter((c) => c.state === 'DONE').length, [deck])
  const memoryFinished = doneCount === deck.length

  // essay game
  const ESSAY_PROMPTS = useMemo(
    () => [
      { title: '我的一天', hint: '写 5~8 句：早上/中午/下午/晚上各发生了什么？最后一句写感受。' },
      { title: '我最喜欢的动物', hint: '写 5~7 句：它长什么样？做什么很可爱？我为什么喜欢它？' },
      { title: '一次帮助别人的经历', hint: '写 6~8 句：发生了什么？我怎么做？别人怎么说？我学到了什么？' },
      { title: '我想去的一个地方', hint: '写 6~9 句：那里有什么？我想做什么？我会带谁一起去？' },
      { title: '我的小目标', hint: '写 6~10 句：目标是什么？每天怎么做？遇到困难怎么办？' },
    ],
    []
  )
  const [essayPrompt, setEssayPrompt] = useState(() => ESSAY_PROMPTS[0])
  const [essayText, setEssayText] = useState('')
  const essayLen = useMemo(() => normalize(essayText).length, [essayText])
  const [essaySaved, setEssaySaved] = useState(false)
  const [essayHistory, setEssayHistory] = useState<EssaySubmission[]>(() => loadEssaySubmissions())

  // dictation game
  const DICT_BANK = useMemo(
    () => [
      '春天来了',
      '认真听讲',
      '按时睡觉',
      '我爱阅读',
      '小鸟在唱歌',
      '今天我很开心',
      '请把书放回原位',
      '每天坚持练习十分钟',
      '我会整理自己的书包',
      '遇到困难不放弃',
    ],
    []
  )
  const [dictItems, setDictItems] = useState<string[]>(() => shuffle(DICT_BANK).slice(0, 8))
  const [dictIdx, setDictIdx] = useState(0)
  const [dictInput, setDictInput] = useState('')
  const [dictResults, setDictResults] = useState<DictationResult[]>([])
  const [dictDone, setDictDone] = useState(false)
  const dictCorrect = useMemo(() => dictResults.filter((r) => r.ok).length, [dictResults])
  const [dictSessions, setDictSessions] = useState<DictationSession[]>(() => loadDictationSessions())

  function resetEssay() {
    const p = ESSAY_PROMPTS[Math.floor(Math.random() * ESSAY_PROMPTS.length)]
    setEssayPrompt(p)
    setEssayText('')
    setEssaySaved(false)
  }

  function resetDictation() {
    setDictItems(shuffle(DICT_BANK).slice(0, 8))
    setDictIdx(0)
    setDictInput('')
    setDictResults([])
    setDictDone(false)
  }

  function resetGame() {
    setDeck(memoryDeck(8))
    setFlips([])
    setMoves(0)
  }

  function stopAndConsume() {
    if (!playing) return
    setPlaying(false)
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null

    const usedMin = Math.max(1, Math.ceil(elapsedSec / 60))
    consumeMut.mutate({ minutes: usedMin, game: sessionGameLabel })
  }

  function stopTimerOnly() {
    if (!playing) return 0
    setPlaying(false)
    if (tickRef.current) window.clearInterval(tickRef.current)
    tickRef.current = null
    return Math.max(1, Math.ceil(elapsedSec / 60))
  }

  useEffect(() => {
    if (!playing) return
    tickRef.current = window.setInterval(() => {
      setLeftSec((s) => Math.max(0, s - 1))
      setElapsedSec((s) => s + 1)
    }, 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [playing])

  useEffect(() => {
    if (!playing) return
    if (leftSec <= 0) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftSec, playing])

  useEffect(() => {
    if (playing && game === 'MEMORY' && memoryFinished) stopAndConsume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryFinished, playing, game])

  function start() {
    if (!isChild) {
      setErr('只有孩子端可以玩游戏')
      return
    }
    if (balanceMinutes <= 0) {
      setErr('没有可用游戏时间，请先用积分兑换时间')
      return
    }
    if (useMinutes > balanceMinutes) {
      setErr('可用时间不足，请降低本次时长或先兑换时间')
      return
    }
    setErr(null)
    if (game === 'MEMORY') resetGame()
    if (game === 'ESSAY') resetEssay()
    if (game === 'DICTATION') resetDictation()
    setElapsedSec(0)
    setLeftSec(useMinutes * 60)
    setPlaying(true)
  }

  function flipCard(id: number) {
    if (!playing) return
    if (game !== 'MEMORY') return
    if (flips.length >= 2) return
    const idx = deck.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (deck[idx].state !== 'DOWN') return

    const next = [...deck]
    next[idx] = { ...next[idx], state: 'UP' }
    const nextFlips = [...flips, id]
    setDeck(next)
    setFlips(nextFlips)

    if (nextFlips.length === 2) {
      setMoves((m) => m + 1)
      const [aId, bId] = nextFlips
      const a = next.find((c) => c.id === aId)!
      const b = next.find((c) => c.id === bId)!
      const match = a.pairId === b.pairId
      window.setTimeout(() => {
        setDeck((cur) => {
          const curNext = [...cur]
          for (let i = 0; i < curNext.length; i++) {
            const c = curNext[i]
            if (c.id !== aId && c.id !== bId) continue
            curNext[i] = match ? { ...c, state: 'DONE' } : { ...c, state: 'DOWN' }
          }
          return curNext
        })
        setFlips([])
      }, match ? 220 : 520)
    }
  }

  function submitEssay() {
    if (!playing || game !== 'ESSAY') return
    if (essayLen < 20) {
      setErr('再多写一点点吧：建议至少 20 个字（不含标点/空格）')
      return
    }
    const it: EssaySubmission = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      promptTitle: essayPrompt.title,
      promptHint: essayPrompt.hint,
      content: essayText.trim(),
      length: essayLen,
      createTime: new Date().toISOString(),
    }
    const next = [it, ...essayHistory]
    setEssayHistory(next)
    saveEssaySubmissions(next)
    setEssaySaved(true)
    const usedMin = stopTimerOnly()
    submitEssayMut.mutate({ minutesUsed: usedMin, promptTitle: essayPrompt.title, content: essayText.trim() })
  }

  function playCurrentDictation() {
    if (game !== 'DICTATION') return
    const t = dictItems[dictIdx] ?? ''
    const ok = speakZh(t)
    if (!ok) setErr('当前浏览器不支持朗读（speechSynthesis），可以改用家长口述。')
  }

  function checkDictation() {
    if (!playing || game !== 'DICTATION') return
    const text = dictItems[dictIdx] ?? ''
    const ok = normalize(dictInput) === normalize(text)
    const r: DictationResult = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      input: dictInput,
      ok,
    }
    const next = [...dictResults, r]
    setDictResults(next)
    setDictInput('')
    const nextIdx = dictIdx + 1
    if (nextIdx >= dictItems.length) {
      setDictDone(true)
      const sess: DictationSession = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        total: dictItems.length,
        correct: next.filter((x) => x.ok).length,
        createTime: new Date().toISOString(),
      }
      const sessions = [sess, ...dictSessions]
      setDictSessions(sessions)
      saveDictationSessions(sessions)
      const usedMin = stopTimerOnly()
      submitDictationMut.mutate({ minutesUsed: usedMin, total: dictItems.length, correct: next.filter((x) => x.ok).length })
    } else {
      setDictIdx(nextIdx)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="游戏平台" subtitle="先兑换游戏时间，再选择：记忆翻牌 / 小作文 / 听写。" sticker="weatherSunCloud" tone="teal" />

      {role !== 'CHILD' ? <Alert severity="info">家长端可查看玩法介绍；孩子端才能兑换/开始游戏。</Alert> : null}
      {err ? <Alert severity="error">{err}</Alert> : null}

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间兑换</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                兑换比例：1 积分 = {MINUTES_PER_POINT} 分钟
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1.25}>
                <ToggleButtonGroup
                  exclusive
                  value={redeemMinutes}
                  onChange={(_, v) => (v ? setRedeemMinutes(v) : null)}
                  size="small"
                  sx={{ flexWrap: 'wrap' }}
                >
                  {[15, 30, 45, 60, 90].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Chip icon={<Sticker name="sparkles" size={16} />} label={`我的积分：${points}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                  <Chip
                    icon={<Sticker name="weatherSun" size={16} />}
                    label={`需要：-${redeemCost} 积分`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                  />
                  <Chip
                    icon={<Sticker name="weatherCloud" size={16} />}
                    label={`可玩时间：${balanceMinutes} 分钟`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.18)' }}
                  />
                </Stack>

                <Button
                  variant="contained"
                  startIcon={<SportsEsportsRoundedIcon />}
                  disabled={!isChild || redeemMut.isPending || points < redeemCost}
                  onClick={() => redeemMut.mutate()}
                >
                  兑换 {redeemMinutes} 分钟
                </Button>

                <Typography variant="caption" color="text.secondary">
                  兑换后会在积分流水中显示“兑换游戏时间”，并增加你的可玩时间余额。
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>时间流水（最近）</Typography>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {(playtimeQ.data?.recentLogs ?? []).slice(0, 8).map((l) => (
                  <Box
                    key={l.id}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 3,
                      border: '1px solid rgba(15,23,42,0.08)',
                      bgcolor: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Sticker name={l.minutesChange > 0 ? 'weatherSun' : 'weatherStorm'} size={18} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 900 }} noWrap>
                        {l.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(l.createTime).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${l.minutesChange > 0 ? '+' : ''}${l.minutesChange}m`}
                      sx={{
                        fontWeight: 1000,
                        bgcolor: l.minutesChange > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                        border: '1px solid',
                        borderColor: l.minutesChange > 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.18)',
                      }}
                    />
                  </Box>
                ))}
                {(playtimeQ.data?.recentLogs ?? []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    还没有时间流水。
                  </Typography>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Tabs value={game} onChange={(_, v) => setGame(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1 }}>
                <Tab value="MEMORY" label="记忆翻牌" disabled={playing} />
                <Tab value="ESSAY" label="小作文" disabled={playing} />
                <Tab value="DICTATION" label="听写" disabled={playing} />
              </Tabs>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>
                  {game === 'MEMORY' ? '小游戏：记忆翻牌' : game === 'ESSAY' ? '小游戏：小作文闯关' : '小游戏：听写闯关'}
                </Typography>
                {game === 'MEMORY' ? (
                  <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`步数：${moves}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                ) : null}
                {game === 'ESSAY' ? (
                  <Chip size="small" icon={<Sticker name="flower" size={16} />} label={`字数：${essayLen}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                ) : null}
                {game === 'DICTATION' ? (
                  <Chip
                    size="small"
                    icon={<Sticker name="sparkles" size={16} />}
                    label={`进度：${Math.min(dictIdx + 1, dictItems.length)}/${dictItems.length} · 正确：${dictCorrect}`}
                    sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }}
                  />
                ) : null}
                <Box sx={{ flex: 1 }} />
                <Chip
                  size="small"
                  icon={<Sticker name="weatherSunCloud" size={16} />}
                  label={playing ? `剩余：${formatSeconds(leftSec)}` : '未开始'}
                  sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                />
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  本次时长：
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={useMinutes}
                  onChange={(_, v) => (v ? setUseMinutes(v) : null)}
                  size="small"
                  disabled={playing}
                >
                  {[5, 10, 15].map((m) => (
                    <ToggleButton key={m} value={m} sx={{ borderRadius: 999, px: 1.5, fontWeight: 950 }}>
                      {m} 分钟
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button
                  variant="outlined"
                  startIcon={<RestartAltRoundedIcon />}
                  onClick={() => {
                    if (game === 'MEMORY') resetGame()
                    if (game === 'ESSAY') resetEssay()
                    if (game === 'DICTATION') resetDictation()
                  }}
                  disabled={playing}
                >
                  换一局
                </Button>
                {!playing ? (
                  <Button variant="contained" startIcon={<SportsEsportsRoundedIcon />} onClick={start} disabled={!isChild}>
                    开始
                  </Button>
                ) : (
                  <Button color="error" variant="outlined" onClick={stopAndConsume}>
                    结束并结算
                  </Button>
                )}
              </Stack>

              {game === 'MEMORY' ? (
                <Box
                  sx={{
                    mt: 2,
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(4, 1fr)', sm: 'repeat(4, 1fr)' },
                    gap: 1,
                  }}
                >
                  {deck.map((c) => {
                    const show = c.state === 'UP' || c.state === 'DONE'
                    const done = c.state === 'DONE'
                    return (
                      <Button
                        key={c.id}
                        variant="outlined"
                        onClick={() => flipCard(c.id)}
                        disabled={!playing || done}
                        sx={{
                          height: 76,
                          borderRadius: 4,
                          fontSize: 26,
                          fontWeight: 1000,
                          bgcolor: done ? 'rgba(34,197,94,0.10)' : 'rgba(255,255,255,0.72)',
                          borderColor: done ? 'rgba(34,197,94,0.22)' : 'rgba(15,23,42,0.10)',
                        }}
                      >
                        {show ? c.emoji : '❔'}
                      </Button>
                    )
                  })}
                </Box>
              ) : null}

              {game === 'ESSAY' ? (
                <Box sx={{ mt: 2 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 4,
                      bgcolor:
                        'radial-gradient(240px 140px at 15% 0%, rgba(244,114,182,0.16), transparent 60%), radial-gradient(240px 140px at 90% 30%, rgba(79,70,229,0.12), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,255,255,0.65))',
                    }}
                  >
                    <CardContent>
                      <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>题目：{essayPrompt.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        提示：{essayPrompt.hint}
                      </Typography>
                      <TextField
                        fullWidth
                        value={essayText}
                        onChange={(e) => {
                          setEssayText(e.target.value)
                          setEssaySaved(false)
                        }}
                        placeholder="开始写吧：每写完一句就换行，会更清晰。"
                        multiline
                        minRows={8}
                        sx={{ mt: 1.5 }}
                        disabled={!playing}
                      />
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 1.25 }}>
                        <Chip size="small" icon={<Sticker name="flower" size={16} />} label={`字数：${essayLen}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                        <Chip size="small" icon={<Sticker name="sparkles" size={16} />} label={essaySaved ? '已提交' : '未提交'} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                        <Box sx={{ flex: 1 }} />
                        <Button variant="contained" onClick={submitEssay} disabled={!playing || essayLen < 10}>
                          提交并结算
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        提交后会保存到本机“最近作品”，并自动结算游戏时间。
                      </Typography>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 4, mt: 2, bgcolor: 'rgba(255,255,255,0.65)' }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>最近作品</Typography>
                      <Divider sx={{ my: 1.25 }} />
                      <Stack spacing={1}>
                        {essayHistory.slice(0, 5).map((s) => (
                          <Box
                            key={s.id}
                            sx={{
                              p: 1,
                              borderRadius: 3,
                              border: '1px solid rgba(15,23,42,0.08)',
                              bgcolor: 'rgba(255,255,255,0.70)',
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Sticker name="flower" size={18} />
                              <Typography sx={{ fontWeight: 950, flex: 1 }} noWrap>
                                {s.promptTitle}
                              </Typography>
                              <Chip size="small" label={`${s.length} 字`} sx={{ fontWeight: 950 }} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(s.createTime).toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                        {essayHistory.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            还没有作品。开始写第一篇吧！
                          </Typography>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ) : null}

              {game === 'DICTATION' ? (
                <Box sx={{ mt: 2 }}>
                  {!canSpeak() ? (
                    <Alert severity="warning" sx={{ mb: 1.5 }}>
                      当前浏览器不支持朗读（speechSynthesis）。你仍可玩听写：请家长口述题目。
                    </Alert>
                  ) : null}

                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 4,
                      bgcolor:
                        'radial-gradient(240px 140px at 15% 0%, rgba(20,184,166,0.16), transparent 60%), radial-gradient(240px 140px at 90% 30%, rgba(250,204,21,0.14), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,255,255,0.65))',
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>
                          第 {Math.min(dictIdx + 1, dictItems.length)} 题 / {dictItems.length}
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Button variant="outlined" onClick={playCurrentDictation} disabled={!playing || dictDone}>
                          播放题目
                        </Button>
                      </Stack>

                      <TextField
                        fullWidth
                        value={dictInput}
                        onChange={(e) => setDictInput(e.target.value)}
                        placeholder="听写在这里（可写完再点“判定”）"
                        sx={{ mt: 1.5 }}
                        disabled={!playing || dictDone}
                      />

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 1.25 }}>
                        <Chip size="small" icon={<Sticker name="sparkles" size={16} />} label={`正确：${dictCorrect}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                        <Chip size="small" icon={<Sticker name="sprout" size={16} />} label={`已做：${dictResults.length}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                        <Box sx={{ flex: 1 }} />
                        <Button variant="contained" onClick={checkDictation} disabled={!playing || !dictInput.trim() || dictDone}>
                          判定并下一题
                        </Button>
                      </Stack>

                      <Divider sx={{ my: 1.5 }} />
                      <Stack spacing={1}>
                        {dictResults.slice(-3).map((r) => (
                          <Alert key={r.id} severity={r.ok ? 'success' : 'error'} icon={<Sticker name={r.ok ? 'weatherSun' : 'weatherStorm'} size={18} />}>
                            {r.ok ? '正确！' : `不对哦：正确答案是「${r.text}」`}
                          </Alert>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card variant="outlined" sx={{ borderRadius: 4, mt: 2, bgcolor: 'rgba(255,255,255,0.65)' }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>最近听写成绩</Typography>
                      <Divider sx={{ my: 1.25 }} />
                      <Stack spacing={1}>
                        {dictSessions.slice(0, 6).map((s) => (
                          <Box
                            key={s.id}
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center',
                              p: 1,
                              borderRadius: 3,
                              border: '1px solid rgba(15,23,42,0.08)',
                              bgcolor: 'rgba(255,255,255,0.70)',
                            }}
                          >
                            <Sticker name="weatherSunCloud" size={18} />
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 950 }}>
                                {s.correct}/{s.total} 正确
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(s.createTime).toLocaleString()}
                              </Typography>
                            </Box>
                            <Chip size="small" label={`${Math.round((s.correct / Math.max(1, s.total)) * 100)}%`} sx={{ fontWeight: 950 }} />
                          </Box>
                        ))}
                        {dictSessions.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            还没有成绩。开始一局听写吧！
                          </Typography>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ) : null}

              {game === 'MEMORY' && memoryFinished ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  通关啦！本局用时 {formatSeconds(elapsedSec)}，步数 {moves}。系统已自动结算游戏时间。
                </Alert>
              ) : null}
              {game === 'MEMORY' && !memoryFinished ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  规则：翻开两张相同的牌就算一对。时间到或通关都会自动结算（按已用分钟扣除）。
                </Typography>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}
*/