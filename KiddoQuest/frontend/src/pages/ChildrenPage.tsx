import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { http } from '../api/http'
import { PageHeader } from '../app/PageHeader'

type Child = {
  id: number
  name: string
  loginAccount: string
  avatar: string | null
  parentId: number
  createTime: string
}

export function ChildrenPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loginAccount, setLoginAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['children'],
    queryFn: async () => (await http.get<Child[]>('/children')).data,
  })

  const createMut = useMutation({
    mutationFn: async () =>
      (await http.post<Child>('/children', { name, loginAccount, password, avatar: null })).data,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['children'] })
      setOpen(false)
      setName('')
      setLoginAccount('')
      setPassword('')
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? e?.message ?? '创建失败'),
  })

  const delMut = useMutation({
    mutationFn: async (id: number) => {
      await http.delete(`/children/${id}`)
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['children'] })
    },
  })

  const children = useMemo(() => q.data ?? [], [q.data])

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="孩子管理"
        subtitle="为每个孩子创建独立账号。"
        sticker="flower"
        tone="teal"
        actions={
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => (setError(null), setOpen(true))}>
            新增孩子
          </Button>
        }
      />

      <Grid container spacing={2}>
        {children.map((c) => (
          <Grid item xs={12} md={6} lg={4} key={c.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      账号：{c.loginAccount}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => delMut.mutate(c.id)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>新增孩子</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField label="姓名" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="登录账号" value={loginAccount} onChange={(e) => setLoginAccount(e.target.value)} />
            <TextField label="初始密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

