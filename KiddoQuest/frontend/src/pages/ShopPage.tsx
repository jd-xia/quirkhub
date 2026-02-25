import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import HistoryIcon from '@mui/icons-material/History'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { Sticker } from '../app/Sticker'
import { useAuth } from '../auth/AuthContext'

type Role = 'PARENT' | 'CHILD'
type Child = { id: number; name: string; loginAccount: string }

type ShopItem = {
  id: number
  childId: number | null
  name: string
  description: string | null
  costPoints: number
  stock: number | null
  icon: string | null
  status: 'ACTIVE' | 'DELETED'
  createTime: string
  updateTime: string
}

type PointsBalance = { childId: number; balance: number }

type Purchase = {
  id: number
  childId: number
  itemId: number
  itemName: string
  itemIcon: string | null
  costPoints: number
  quantity: number
  totalCostPoints: number
  balanceAfter: number
  revoked: boolean
  createTime: string
}

function iconBox(emoji: string | null | undefined) {
  return (
    <Box
      sx={{
        width: 42,
        height: 42,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(15,23,42,0.10)',
        boxShadow: '0 10px 18px rgba(15,23,42,0.06)',
        flex: '0 0 auto',
        fontSize: 22,
      }}
    >
      {emoji?.trim() ? emoji : '🎁'}
    </Box>
  )
}

export function ShopPage() {
  const { role, session } = useAuth()
  const qc = useQueryClient()
  const isParent = (role as Role) === 'PARENT'
  const isChild = (role as Role) === 'CHILD'

  const childrenQ = useQuery({
    enabled: isParent,
    queryKey: ['children'],
    queryFn: async () => (await http.get<Child[]>('/children')).data,
  })

  const defaultChildId = isChild ? session?.userId ?? null : null
  const [childId, setChildId] = useState<number | ''>(defaultChildId ?? '')

  const itemsQ = useQuery({
    enabled: true,
    queryKey: ['shop', 'items', isParent ? childId || 'ALL' : session?.userId ?? 'ME'],
    queryFn: async () => {
      if (isParent) {
        const qs = childId ? `?childId=${childId}` : ''
        return (await http.get<ShopItem[]>(`/shop/items${qs}`)).data
      }
      return (await http.get<ShopItem[]>(`/shop/items`)).data
    },
  })

  const balanceQ = useQuery({
    enabled: isChild && !!session?.userId,
    queryKey: ['points', 'balance', session?.userId ?? ''],
    queryFn: async () => (await http.get<PointsBalance>(`/points/${session?.userId}`)).data,
  })

  const purchasesQ = useQuery({
    enabled: !!(isParent ? childId : session?.userId),
    queryKey: ['shop', 'purchases', isParent ? childId : session?.userId],
    queryFn: async () => {
      const cid = isParent ? childId : session?.userId
      return (await http.get<Purchase[]>(`/shop/purchases?childId=${cid}`)).data
    },
  })

  // parent dialogs
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [targetChildId, setTargetChildId] = useState<number | ''>('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [costPoints, setCostPoints] = useState(10)
  const [stock, setStock] = useState<number | ''>('')
  const [icon, setIcon] = useState('🎁')
  const [err, setErr] = useState<string | null>(null)

  const childOptions = useMemo(() => childrenQ.data ?? [], [childrenQ.data])

  const createOrUpdateMut = useMutation({
    mutationFn: async () => {
      const payload = {
        childId: targetChildId === '' ? null : targetChildId,
        name,
        description: description.trim() ? description : null,
        costPoints,
        stock: stock === '' ? null : Number(stock),
        icon: icon.trim() ? icon : null,
      }
      if (editId) return (await http.put(`/shop/items/${editId}`, payload)).data
      return (await http.post(`/shop/items`, payload)).data
    },
    onSuccess: async () => {
      setOpen(false)
      setEditId(null)
      await qc.invalidateQueries({ queryKey: ['shop'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '操作失败'),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: number) => (await http.delete(`/shop/items/${id}`)).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['shop'] })
    },
  })

  const redeemMut = useMutation({
    mutationFn: async (id: number) => (await http.post<Purchase>(`/shop/items/${id}/redeem`, { quantity: 1 })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['shop'] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '兑换失败'),
  })

  const revokeMut = useMutation({
    mutationFn: async (purchaseId: number) => (await http.post<Purchase>(`/shop/purchases/${purchaseId}/revoke`)).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['shop'] })
      await qc.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (e: any) => setErr(e?.response?.data?.message ?? '撤回失败'),
  })

  const items = itemsQ.data ?? []
  const balance = balanceQ.data?.balance ?? 0

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="商场中心"
        subtitle={isParent ? '家长上架奖励物品；孩子用积分兑换。' : '用积分兑换奖励物品，攒积分更有动力！'}
        sticker="weatherSun"
        tone="amber"
        actions={
          isParent ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setErr(null)
                setEditId(null)
                setTargetChildId('')
                setName('')
                setDescription('')
                setCostPoints(10)
                setStock('')
                setIcon('🎁')
                setOpen(true)
              }}
            >
              上架奖励
            </Button>
          ) : (
            <Chip
              icon={<Sticker name="sparkles" size={16} />}
              label={`我的积分：${balance}`}
              sx={{ fontWeight: 950, bgcolor: 'rgba(255,255,255,0.70)' }}
            />
          )
        }
      />

      {err ? <Alert severity="error">{err}</Alert> : null}

      {isParent ? (
        <Card>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>筛选孩子（可选）</InputLabel>
                  <Select label="筛选孩子（可选）" value={childId} onChange={(e) => setChildId(e.target.value as any)}>
                    <MenuItem value="">全部（含通用奖励）</MenuItem>
                    {childOptions.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}（{c.loginAccount}）
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  提示：奖励可以设置为“通用”（不选孩子）或“指定给某个孩子”。
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      <Grid container spacing={2}>
        {items.map((it) => (
          <Grid key={it.id} item xs={12} md={6} lg={4}>
            <Card
              sx={{
                background:
                  'radial-gradient(240px 140px at 15% 0%, rgba(250,204,21,0.18), transparent 60%), radial-gradient(240px 140px at 90% 30%, rgba(244,114,182,0.14), transparent 60%), linear-gradient(135deg, rgba(255,255,255,0.82), rgba(255,255,255,0.65))',
              }}
            >
              <CardContent>
                <Stack spacing={1.25}>
                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                    {iconBox(it.icon)}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 1000, letterSpacing: -0.2 }}>
                        {it.name}
                      </Typography>
                      {it.description ? (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                          {it.description}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                        <Chip
                          size="small"
                          icon={<Sticker name="weatherSun" size={14} />}
                          label={`${it.costPoints} 积分`}
                          sx={{ fontWeight: 950, bgcolor: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.16)' }}
                        />
                        <Chip
                          size="small"
                          icon={<ShoppingCartRoundedIcon fontSize="small" />}
                          label={it.stock == null ? '库存：不限' : `库存：${it.stock}`}
                          sx={{ fontWeight: 950, bgcolor: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.16)' }}
                        />
                      </Stack>
                    </Box>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                    {isParent ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setErr(null)
                            setEditId(it.id)
                            setTargetChildId(it.childId ?? '')
                            setName(it.name)
                            setDescription(it.description ?? '')
                            setCostPoints(it.costPoints)
                            setStock(it.stock == null ? '' : it.stock)
                            setIcon(it.icon ?? '🎁')
                            setOpen(true)
                          }}
                        >
                          编辑
                        </Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => deleteMut.mutate(it.id)}>
                          下架
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<ShoppingCartRoundedIcon />}
                        disabled={redeemMut.isPending || (it.stock != null && it.stock <= 0) || balance < it.costPoints}
                        onClick={() => redeemMut.mutate(it.id)}
                      >
                        兑换
                      </Button>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon fontSize="small" />
            <Typography sx={{ fontWeight: 1000 }}>最近兑换</Typography>
          </Box>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1}>
            {(purchasesQ.data ?? []).slice(0, 12).map((p) => (
              <Box
                key={p.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  p: 1,
                  borderRadius: 3,
                  border: '1px solid rgba(15,23,42,0.08)',
                  bgcolor: p.revoked ? 'rgba(148,163,184,0.08)' : 'rgba(255,255,255,0.65)',
                }}
              >
                {iconBox(p.itemIcon)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 950, letterSpacing: -0.2 }} color={p.revoked ? 'text.secondary' : 'text.primary'}>
                    {p.itemName} × {p.quantity}
                    {p.revoked ? '（已撤回）' : ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(p.createTime).toLocaleString()}
                  </Typography>
                </Box>
                {!p.revoked ? (
                  <Chip
                    size="small"
                    label={`-${p.totalCostPoints}`}
                    sx={{ fontWeight: 1000, bgcolor: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.18)' }}
                  />
                ) : null}
                {isParent && !p.revoked ? (
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    disabled={revokeMut.isPending}
                    onClick={() => revokeMut.mutate(p.id)}
                  >
                    撤回
                  </Button>
                ) : null}
              </Box>
            ))}
            {(purchasesQ.data ?? []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                还没有兑换记录。
              </Typography>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 1000 }}>{editId ? '编辑奖励' : '上架奖励'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>指定孩子（可选）</InputLabel>
              <Select label="指定孩子（可选）" value={targetChildId} onChange={(e) => setTargetChildId(e.target.value as any)}>
                <MenuItem value="">通用奖励</MenuItem>
                {childOptions.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}（{c.loginAccount}）
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="奖励名称" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="描述（可选）" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="积分价格"
                  type="number"
                  value={costPoints}
                  onChange={(e) => setCostPoints(Number(e.target.value))}
                  inputProps={{ min: 1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="库存（空=不限）"
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="图标（emoji）" value={icon} onChange={(e) => setIcon(e.target.value)} />
              </Grid>
            </Grid>
            <Alert severity="info" icon={<Sticker name="weatherSunCloud" size={18} />}>
              建议用 emoji 做图标，比如：🎁 🎬 🍦 🧸 📚 ⏰
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" startIcon={editId ? <EditIcon /> : <AddIcon />} onClick={() => createOrUpdateMut.mutate()} disabled={createOrUpdateMut.isPending}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

