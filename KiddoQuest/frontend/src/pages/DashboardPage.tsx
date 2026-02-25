import { Box, Card, CardContent, Chip, Divider, Skeleton, Stack, Tab, Tabs, Typography } from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'

type WeekTrendPoint = {
  weekStartDate: string
  totalScore: number
  status: 'DRAFT' | 'ACTIVE' | 'SUBMITTED' | 'LOCKED'
}

type CategoryTotals = { learning: number; life: number; bonus: number; penalty: number }
type Points30d = { days: number; earned: number; spent: number; net: number; redeemCount: number; redeemSpent: number }

type ItemTotal = {
  category: 'LEARNING' | 'LIFE' | 'BONUS' | 'PENALTY'
  dimensionName: string
  totalScore: number
}

type DashboardChildV2 = {
  childId: number
  childName: string
  pointsBalance: number
  pointsBalanceIncludingCurrentWeek: number
  weekStartDate: string
  weekTotalScore: number
  weekDayTotals: number[]
  weekCategoryTotals: CategoryTotals
  recentWeeks: WeekTrendPoint[]
  points30d: Points30d
  allTimeItemTotals: ItemTotal[]
}

type DashboardFamilyV2 = {
  weekStartDate: string
  children: DashboardChildV2[]
}

export function DashboardPage() {
  const [mode, setMode] = useState(0)
  const q = useQuery({
    queryKey: ['dashboard', 'family-v2'],
    queryFn: async () => (await http.get<DashboardFamilyV2>('/dashboard/family-v2')).data,
  })

  const stickers = ['flower', 'sprout', 'sparkles', 'circle', 'weatherRain', 'weatherStorm'] as const
  const children = q.data?.children ?? []

  const trendMax = useMemo(() => {
    const values = children.flatMap((c) => c.recentWeeks.map((w) => w.totalScore))
    return Math.max(10, ...values)
  }, [children])

  function dayPill(v: number, i: number) {
    const positive = v > 0
    const negative = v < 0
    const bg = positive ? 'rgba(34,197,94,0.10)' : negative ? 'rgba(239,68,68,0.10)' : 'rgba(148,163,184,0.12)'
    const bd = positive ? 'rgba(34,197,94,0.22)' : negative ? 'rgba(239,68,68,0.20)' : 'rgba(148,163,184,0.20)'
    const fg = positive ? 'success.dark' : negative ? 'error.dark' : 'text.secondary'
    return (
      <Box
        key={i}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 999,
          bgcolor: bg,
          border: '1px solid',
          borderColor: bd,
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 0.75,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 950, color: 'rgba(15,23,42,0.65)' }}>
          {['一', '二', '三', '四', '五', '六', '日'][i]}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 1100 }} color={fg as any}>
          {v > 0 ? `+${v}` : `${v}`}
        </Typography>
      </Box>
    )
  }

  function catStickerName(cat: ItemTotal['category']) {
    switch (cat) {
      case 'LEARNING':
        return 'sprout'
      case 'LIFE':
        return 'flower'
      case 'BONUS':
        return 'sparkles'
      case 'PENALTY':
        return 'warning'
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title="家庭大屏" subtitle="概览 / 趋势 / 分类 / 积分流 / 项目排行榜。" sticker="sparkles" tone="purple" />

      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Tabs value={mode} onChange={(_, v) => setMode(Number(v))} variant="scrollable" scrollButtons="auto">
            <Tab label="概览" />
            <Tab label="周趋势" />
            <Tab label="分类贡献" />
            <Tab label="积分流" />
            <Tab label="项目排行榜" />
          </Tabs>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {q.isPending
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="55%" height={32} />
                    <Skeleton variant="text" width="35%" />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="rounded" height={36} />
                      </Grid>
                      <Grid item xs={6}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="rounded" height={36} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))
          : children.map((c) => (
              <Grid item xs={12} md={6} lg={4} key={c.childId}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        background:
                          'linear-gradient(90deg, rgba(79,70,229,0.65), rgba(20,184,166,0.55), rgba(244,114,182,0.50))',
                        mb: 2,
                      }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 999,
                          display: 'grid',
                          placeItems: 'center',
                          border: '1px solid',
                          borderColor: 'rgba(15,23,42,0.10)',
                          bgcolor: 'rgba(255,255,255,0.78)',
                          boxShadow: '0 10px 22px rgba(15,23,42,0.08)',
                        }}
                      >
                        <Sticker name={stickers[c.childId % stickers.length]} size={20} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 1000, letterSpacing: -0.3 }}>
                          {c.childName}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          本周开始：{c.weekStartDate}
                        </Typography>
                      </Box>
                      <Chip label="本周" size="small" sx={{ bgcolor: 'rgba(79,70,229,0.10)' }} />
                    </Box>

                    {mode === 0 ? (
                      <>
                        <Grid container spacing={1.5} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderRadius: 4,
                                bgcolor: 'rgba(79,70,229,0.06)',
                                borderColor: 'rgba(79,70,229,0.18)',
                              }}
                            >
                              <CardContent sx={{ py: 1.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 900 }}>
                                  本周总分
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: -0.3 }}>
                                  {c.weekTotalScore}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={6}>
                            <Card
                              variant="outlined"
                              sx={{
                                borderRadius: 4,
                                bgcolor: 'rgba(20,184,166,0.06)',
                                borderColor: 'rgba(20,184,166,0.18)',
                              }}
                            >
                              <CardContent sx={{ py: 1.5 }}>
                                <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 900 }}>
                                  当前积分（未结算）
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 1000, letterSpacing: -0.3 }}>
                                  {c.pointsBalanceIncludingCurrentWeek ?? c.pointsBalance}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 950 }}>
                          本周每日总分
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>{(c.weekDayTotals ?? []).map(dayPill)}</Box>
                      </>
                    ) : null}

                    {mode === 1 ? (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 950 }}>
                          近 6 周趋势
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ mt: 1 }}>
                          {(c.recentWeeks ?? []).slice(-6).map((w) => {
                            const h = Math.max(8, Math.round((Math.max(0, w.totalScore) / trendMax) * 56))
                            const neg = w.totalScore < 0
                            const bg = neg
                              ? 'linear-gradient(180deg, rgba(239,68,68,0.65), rgba(239,68,68,0.20))'
                              : 'linear-gradient(180deg, rgba(79,70,229,0.65), rgba(20,184,166,0.20))'
                            return (
                              <Box key={w.weekStartDate} sx={{ width: 22 }}>
                                <Box
                                  title={`${w.weekStartDate}：${w.totalScore}`}
                                  sx={{
                                    height: h,
                                    borderRadius: 999,
                                    background: bg,
                                    border: '1px solid rgba(15,23,42,0.10)',
                                  }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontWeight: 900, color: 'rgba(15,23,42,0.65)' }}>
                                  {w.weekStartDate.slice(5)}
                                </Typography>
                              </Box>
                            )
                          })}
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Chip size="small" icon={<Sticker name="sparkles" size={16} />} label={`本周：${c.weekTotalScore}`} sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }} />
                      </>
                    ) : null}

                    {mode === 2 ? (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 950 }}>
                          本周分类贡献
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {[
                            { k: '学习', v: c.weekCategoryTotals?.learning ?? 0, s: 'sprout' },
                            { k: '生活', v: c.weekCategoryTotals?.life ?? 0, s: 'flower' },
                            { k: '加分', v: c.weekCategoryTotals?.bonus ?? 0, s: 'sparkles' },
                            { k: '扣分', v: c.weekCategoryTotals?.penalty ?? 0, s: 'warning' },
                          ].map((r) => (
                            <Box key={r.k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Sticker name={r.s as any} size={18} />
                              <Typography sx={{ fontWeight: 950, minWidth: 44 }}>{r.k}</Typography>
                              <Box sx={{ flex: 1 }} />
                              <Chip
                                size="small"
                                label={`${r.v > 0 ? `+${r.v}` : r.v}`}
                                sx={{
                                  fontWeight: 1000,
                                  bgcolor: r.v >= 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                                  border: '1px solid',
                                  borderColor: r.v >= 0 ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.20)',
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          完整项目累计排行请切换到「项目排行榜」。
                        </Typography>
                      </>
                    ) : null}

                    {mode === 3 ? (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 950 }}>
                          近 {c.points30d?.days ?? 30} 天积分流
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                          <Chip
                            size="small"
                            icon={<Sticker name="weatherSun" size={16} />}
                            label={`收入 +${c.points30d?.earned ?? 0}`}
                            sx={{ fontWeight: 950, bgcolor: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.20)' }}
                          />
                          <Chip
                            size="small"
                            icon={<Sticker name="weatherStorm" size={16} />}
                            label={`支出 -${c.points30d?.spent ?? 0}`}
                            sx={{ fontWeight: 950, bgcolor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.18)' }}
                          />
                          <Chip
                            size="small"
                            icon={<Sticker name="sparkles" size={16} />}
                            label={`净变化 ${c.points30d?.net ?? 0}`}
                            sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}
                          />
                          <Chip
                            size="small"
                            icon={<Sticker name="sprout" size={16} />}
                            label={`兑换 ${c.points30d?.redeemCount ?? 0} 次（-${c.points30d?.redeemSpent ?? 0}）`}
                            sx={{ fontWeight: 950, bgcolor: 'rgba(250,204,21,0.16)', border: '1px solid rgba(250,204,21,0.22)' }}
                          />
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          这个模式适合家长观察“积分是否够用/是否兑换过多”。
                        </Typography>
                      </>
                    ) : null}

                    {mode === 4 ? (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(15,23,42,0.65)', fontWeight: 950 }}>
                          全部项目累计排行（已结算周）
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          共 {(c.allTimeItemTotals ?? []).length} 个小项目，按累计分从高到低
                        </Typography>
                        <Stack spacing={0.6} sx={{ mt: 1.25, maxHeight: 420, overflow: 'auto' }}>
                          {(c.allTimeItemTotals ?? []).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              还没有已结算的数据（提交周总结结算后会显示）。
                            </Typography>
                          ) : (
                            (c.allTimeItemTotals ?? []).map((it, idx) => {
                              const pos = it.totalScore > 0
                              const neg = it.totalScore < 0
                              const bg = pos ? 'rgba(34,197,94,0.10)' : neg ? 'rgba(239,68,68,0.10)' : 'rgba(148,163,184,0.12)'
                              const bd = pos ? 'rgba(34,197,94,0.22)' : neg ? 'rgba(239,68,68,0.20)' : 'rgba(148,163,184,0.20)'
                              const fg = pos ? 'success.dark' : neg ? 'error.dark' : 'text.secondary'
                              return (
                                <Box
                                  key={`${it.category}|${it.dimensionName}`}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: 2,
                                    bgcolor: 'rgba(255,255,255,0.5)',
                                    border: '1px solid',
                                    borderColor: 'rgba(15,23,42,0.06)',
                                  }}
                                >
                                  <Typography variant="caption" sx={{ fontWeight: 1100, minWidth: 20, color: 'text.secondary' }}>
                                    {idx + 1}
                                  </Typography>
                                  <Sticker name={catStickerName(it.category) as any} size={18} />
                                  <Typography sx={{ fontWeight: 950, flex: 1, minWidth: 0 }} noWrap>
                                    {it.dimensionName}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={it.totalScore > 0 ? `+${it.totalScore}` : `${it.totalScore}`}
                                    sx={{ fontWeight: 1100, bgcolor: bg, border: '1px solid', borderColor: bd, color: fg as any }}
                                  />
                                </Box>
                              )
                            })
                          )}
                        </Stack>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          每个小项目在已提交结算的周里累计得到的分数（不按分类，统一按分数排序）。
                        </Typography>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
    </Stack>
  )
}

