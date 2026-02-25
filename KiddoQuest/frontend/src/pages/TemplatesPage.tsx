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
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import AddIcon from '@mui/icons-material/Add'
import HistoryIcon from '@mui/icons-material/History'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'
import { EmptyState } from '../app/EmptyState'
import { Sticker } from '../app/Sticker'

type ScoreType = 'FULL' | 'HALF' | 'CHECKBOX' | 'CUSTOM'
type DimensionCategory = 'LEARNING' | 'LIFE' | 'BONUS' | 'PENALTY'

type Template = {
  id: number
  name: string
  description: string | null
  defaultPoint: number
  version: number
  status: 'ACTIVE' | 'DELETED'
  createTime: string
  updateTime: string
}

type TemplateVersion = {
  id: number
  templateId: number
  version: number
  snapshot: string
  createTime: string
}

type Item = { category: DimensionCategory; name: string; description?: string; earningPoint: number; scoreType: ScoreType }

type TemplateSnapshot = {
  name: string
  description: string | null
  defaultPoint: number
  items: Item[]
}

function safeParseSnapshot(snapshot: string): TemplateSnapshot | null {
  try {
    return JSON.parse(snapshot) as TemplateSnapshot
  } catch {
    return null
  }
}

function isSampleTemplate(name: string) {
  return name.startsWith('样板·')
}

export function TemplatesPage() {
  const qc = useQueryClient()

  // create
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultPoint, setDefaultPoint] = useState(10)
  const [items, setItems] = useState<Item[]>([{ category: 'LIFE', name: '早睡早起', description: '', earningPoint: 1, scoreType: 'FULL' }])
  const [error, setError] = useState<string | null>(null)

  // versions
  const [verOpen, setVerOpen] = useState(false)
  const [verTpl, setVerTpl] = useState<Template | null>(null)

  // edit
  const [editOpen, setEditOpen] = useState(false)
  const [editTpl, setEditTpl] = useState<Template | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDefaultPoint, setEditDefaultPoint] = useState(10)
  const [editItems, setEditItems] = useState<Item[]>([])
  const [editError, setEditError] = useState<string | null>(null)
  const [editLoadedTplId, setEditLoadedTplId] = useState<number | null>(null)

  const listQ = useQuery({
    queryKey: ['templates'],
    queryFn: async () => (await http.get<Template[]>('/templates')).data,
  })

  const versionsQ = useQuery({
    enabled: !!verTpl,
    queryKey: ['templates', verTpl?.id, 'versions'],
    queryFn: async () => (await http.get<TemplateVersion[]>(`/templates/${verTpl!.id}/versions`)).data,
  })

  const editVersionsQ = useQuery({
    enabled: !!editTpl,
    queryKey: ['templates', editTpl?.id, 'versions', 'edit'],
    queryFn: async () => (await http.get<TemplateVersion[]>(`/templates/${editTpl!.id}/versions`)).data,
  })

  const createMut = useMutation({
    mutationFn: async () =>
      (
        await http.post<Template>('/templates', {
          name,
          description,
          defaultPoint,
          items,
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['templates'] })
      setOpen(false)
      setName('')
      setDescription('')
      setDefaultPoint(10)
      setItems([{ category: 'LIFE', name: '早睡早起', description: '', earningPoint: 1, scoreType: 'FULL' }])
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? e?.message ?? '创建失败'),
  })

  const updateMut = useMutation({
    mutationFn: async () =>
      (
        await http.put<Template>(`/templates/${editTpl!.id}`, {
          name: editName,
          description: editDescription,
          defaultPoint: editDefaultPoint,
          items: editItems,
        })
      ).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['templates'] })
      if (editTpl) await qc.invalidateQueries({ queryKey: ['templates', editTpl.id, 'versions'] })
      await qc.invalidateQueries({ queryKey: ['templates', editTpl?.id, 'versions', 'edit'] })
      setEditOpen(false)
      setEditTpl(null)
      setEditLoadedTplId(null)
    },
    onError: (e: any) => setEditError(e?.response?.data?.message ?? e?.message ?? '保存失败'),
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/templates/${id}`)
    },
    onSuccess: async () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })

  const rollbackMut = useMutation({
    mutationFn: async ({ id, version }: { id: number; version: number }) => {
      await http.post(`/templates/${id}/rollback`, { version })
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['templates'] })
      if (verTpl) await qc.invalidateQueries({ queryKey: ['templates', verTpl.id, 'versions'] })
      if (editTpl) await qc.invalidateQueries({ queryKey: ['templates', editTpl.id, 'versions', 'edit'] })
    },
  })

  const templates = useMemo(() => listQ.data ?? [], [listQ.data])

  const openEdit = (t: Template) => {
    setEditError(null)
    setEditTpl(t)
    setEditOpen(true)
  }

  useEffect(() => {
    if (!editTpl || !editOpen || !editVersionsQ.data) return
    if (editLoadedTplId === editTpl.id) return

    const latest = editVersionsQ.data[0]
    const snap = latest ? safeParseSnapshot(latest.snapshot) : null

    setEditName(snap?.name ?? editTpl.name)
    setEditDescription((snap?.description ?? editTpl.description ?? '') as any)
    setEditDefaultPoint(Number(snap?.defaultPoint ?? editTpl.defaultPoint ?? 10))
    const nextItems: Item[] =
      snap?.items?.map((x: any) => ({
        category: (x.category ?? 'LIFE') as any,
        name: String(x.name ?? ''),
        description: x.description ?? '',
        earningPoint: Number(x.earningPoint ?? 1),
        scoreType: (x.scoreType ?? 'FULL') as any,
      })) ?? []
    setEditItems(nextItems.length ? nextItems : [{ category: 'LIFE', name: '', description: '', earningPoint: 1, scoreType: 'FULL' }])
    if (!snap && latest) setEditError('读取模板快照失败（snapshot 格式不正确），已使用当前模板基础信息作为默认值。')
    setEditLoadedTplId(editTpl.id)
  }, [editLoadedTplId, editOpen, editTpl, editVersionsQ.data])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="模板管理"
        subtitle="创建可复用的习惯评分模板（带版本）。模板修改会生成新版本，用于未来生成一周总结。"
        sticker="sprout"
        tone="pink"
        actions={
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => (setError(null), setOpen(true))}>
            新建模板
          </Button>
        }
      />

      <Grid container spacing={2}>
        {templates.length === 0 ? (
          <Grid item xs={12}>
            <EmptyState
              title="还没有模板"
              description="先创建一个模板（包含学习/生活/加分/扣分维度），之后每周从模板生成一周总结。"
              actionLabel="新建模板"
              onAction={() => (setError(null), setOpen(true))}
            />
          </Grid>
        ) : (
          templates.map((t) => (
            <Grid item xs={12} md={6} lg={4} key={t.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 950, letterSpacing: -0.2 }}>
                          {t.name}
                        </Typography>
                        {isSampleTemplate(t.name) ? (
                          <Chip
                            size="small"
                            icon={<Sticker name="sparkles" size={14} />}
                            label="样板"
                            sx={{ bgcolor: 'rgba(250,204,21,0.18)', border: '1px solid', borderColor: 'rgba(250,204,21,0.28)' }}
                          />
                        ) : null}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        v{t.version} · 默认满分 {t.defaultPoint}
                      </Typography>
                    </Box>
                    <IconButton onClick={() => openEdit(t)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setVerTpl(t)
                        setVerOpen(true)
                      }}
                      aria-label="versions"
                    >
                      <HistoryIcon />
                    </IconButton>
                    <IconButton onClick={() => delMut.mutate(t.id)} aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>新建模板</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="模板名称" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="默认每日满分"
                  type="number"
                  fullWidth
                  value={defaultPoint}
                  onChange={(e) => setDefaultPoint(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="评分方式（先用 FULL）" fullWidth value="FULL" disabled />
              </Grid>
            </Grid>
            <TextField label="描述" fullWidth value={description} onChange={(e) => setDescription(e.target.value)} />

            <Divider />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900 }}>评分维度</Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setItems((xs) => [...xs, { category: 'LIFE', name: '', description: '', earningPoint: 1, scoreType: 'FULL' }])}
              >
                增加维度
              </Button>
            </Box>

            <Stack spacing={1}>
              {items.map((it, idx) => (
                <Grid container spacing={2} key={idx}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="分类"
                      fullWidth
                      select
                      value={it.category}
                      onChange={(e) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, category: e.target.value as any } : x)))}
                    >
                      <MenuItem value="LEARNING">学习习惯</MenuItem>
                      <MenuItem value="LIFE">生活习惯</MenuItem>
                      <MenuItem value="BONUS">加分项</MenuItem>
                      <MenuItem value="PENALTY">扣分项</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="维度名称"
                      fullWidth
                      value={it.name}
                      onChange={(e) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="描述（可选）"
                      fullWidth
                      value={it.description ?? ''}
                      onChange={(e) =>
                        setItems((xs) =>
                          xs.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <TextField
                      label="每日积分"
                      type="number"
                      fullWidth
                      value={it.earningPoint}
                      onChange={(e) =>
                        setItems((xs) =>
                          xs.map((x, i) => (i === idx ? { ...x, earningPoint: Number(e.target.value) } : x)),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton onClick={() => setItems((xs) => xs.filter((_, i) => i !== idx))} aria-label="remove">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={createMut.isPending || !name || items.length === 0}>
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={verOpen} onClose={() => setVerOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>版本历史 {verTpl ? `· ${verTpl.name}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {(versionsQ.data ?? []).map((v) => (
              <Card key={v.id} variant="outlined">
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 950 }}>v{v.version}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(v.createTime).toLocaleString()}
                    </Typography>
                  </Box>
                  <Button variant="outlined" onClick={() => verTpl && rollbackMut.mutate({ id: verTpl.id, version: v.version })}>
                    回滚到该版本（会生成新版本）
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditTpl(null)
          setEditLoadedTplId(null)
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>编辑模板 {editTpl ? `· ${editTpl.name}` : ''}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {editError ? <Alert severity="error">{editError}</Alert> : null}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="模板名称" fullWidth value={editName} onChange={(e) => setEditName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="默认每日满分"
                  type="number"
                  fullWidth
                  value={editDefaultPoint}
                  onChange={(e) => setEditDefaultPoint(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="评分方式（先用 FULL）" fullWidth value="FULL" disabled />
              </Grid>
            </Grid>

            <TextField label="描述" fullWidth value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />

            <Divider />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 900 }}>评分维度</Typography>
              <Box sx={{ flex: 1 }} />
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() =>
                  setEditItems((xs) => [...xs, { category: 'LIFE', name: '', description: '', earningPoint: 1, scoreType: 'FULL' }])
                }
              >
                增加维度
              </Button>
            </Box>

            <Stack spacing={1}>
              {editItems.map((it, idx) => (
                <Grid container spacing={2} key={idx}>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="分类"
                      fullWidth
                      select
                      value={it.category}
                      onChange={(e) =>
                        setEditItems((xs) => xs.map((x, i) => (i === idx ? { ...x, category: e.target.value as any } : x)))
                      }
                    >
                      <MenuItem value="LEARNING">学习习惯</MenuItem>
                      <MenuItem value="LIFE">生活习惯</MenuItem>
                      <MenuItem value="BONUS">加分项</MenuItem>
                      <MenuItem value="PENALTY">扣分项</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="维度名称"
                      fullWidth
                      value={it.name}
                      onChange={(e) =>
                        setEditItems((xs) => xs.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="描述（可选）"
                      fullWidth
                      value={it.description ?? ''}
                      onChange={(e) =>
                        setEditItems((xs) =>
                          xs.map((x, i) => (i === idx ? { ...x, description: e.target.value } : x)),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <TextField
                      label="每日积分"
                      type="number"
                      fullWidth
                      value={it.earningPoint}
                      onChange={(e) =>
                        setEditItems((xs) =>
                          xs.map((x, i) => (i === idx ? { ...x, earningPoint: Number(e.target.value) } : x)),
                        )
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton onClick={() => setEditItems((xs) => xs.filter((_, i) => i !== idx))} aria-label="remove">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditOpen(false)
              setEditTpl(null)
              setEditLoadedTplId(null)
            }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => updateMut.mutate()}
            disabled={!editTpl || !editName || editItems.length === 0 || updateMut.isPending}
          >
            保存（生成新版本）
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

