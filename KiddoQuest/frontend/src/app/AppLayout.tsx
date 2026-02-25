import {
  AppBar,
  Box,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ChildCareIcon from '@mui/icons-material/ChildCare'
import ChecklistIcon from '@mui/icons-material/Checklist'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import StarsIcon from '@mui/icons-material/Stars'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import SportsEsportsRoundedIcon from '@mui/icons-material/SportsEsportsRounded'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useMemo, useState } from 'react'
import type { StickerName } from './Sticker'
import { Sticker } from './Sticker'
import type React from 'react'

const drawerWidth = 260

export function AppLayout() {
  const nav = useNavigate()
  const loc = useLocation()
  const { session, logout, role } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items: Array<{ label: string; icon: React.ReactNode; sticker?: StickerName; path: string }> =
    role === 'CHILD'
      ? [
          { label: '游戏平台', icon: <SportsEsportsRoundedIcon />, sticker: 'weatherSunCloud' as StickerName, path: '/games' },
          { label: '商场中心', icon: <StorefrontRoundedIcon />, sticker: 'weatherSun' as StickerName, path: '/shop' },
          { label: '积分中心', icon: <StarsIcon />, sticker: 'sparkles' as StickerName, path: '/points' },
        ]
      : [
          { label: '家庭大屏', icon: <DashboardIcon />, sticker: 'sparkles' as StickerName, path: '/' },
          { label: '孩子管理', icon: <ChildCareIcon />, sticker: 'flower' as StickerName, path: '/children' },
          { label: '模板管理', icon: <ChecklistIcon />, sticker: 'sprout' as StickerName, path: '/templates' },
          { label: '一周总结', icon: <FactCheckIcon />, sticker: 'sparkles' as StickerName, path: '/weekly-scores' },
          { label: '游戏平台', icon: <SportsEsportsRoundedIcon />, sticker: 'weatherSunCloud' as StickerName, path: '/games' },
          { label: '商场中心', icon: <StorefrontRoundedIcon />, sticker: 'weatherSun' as StickerName, path: '/shop' },
          { label: '积分中心', icon: <StarsIcon />, sticker: 'sparkles' as StickerName, path: '/points' },
        ]

  const selectedPath = useMemo(() => {
    if (loc.pathname.startsWith('/weekly-scores')) return '/weekly-scores'
    if (loc.pathname.startsWith('/templates')) return '/templates'
    if (loc.pathname.startsWith('/children')) return '/children'
    if (loc.pathname.startsWith('/games')) return '/games'
    if (loc.pathname.startsWith('/shop')) return '/shop'
    if (loc.pathname.startsWith('/points')) return '/points'
    return '/'
  }, [loc.pathname])

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 950, letterSpacing: -0.2 }}>
          导航
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', p: 1, flex: 1 }}>
        <List sx={{ py: 0 }}>
          {items.map((it) => (
            <ListItemButton
              key={it.path}
              selected={selectedPath === it.path}
              onClick={() => {
                nav(it.path)
                setMobileOpen(false)
              }}
              sx={{
                my: 0.5,
                border: '1px solid',
                borderColor: selectedPath === it.path ? 'rgba(79,70,229,0.25)' : 'transparent',
                bgcolor: selectedPath === it.path ? 'rgba(79,70,229,0.10)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {it.sticker ? (
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(255,255,255,0.75)',
                      border: '1px solid',
                      borderColor: 'rgba(15,23,42,0.10)',
                    }}
                  >
                    <Sticker name={it.sticker} size={16} />
                  </Box>
                ) : (
                  it.icon
                )}
              </ListItemIcon>
              <ListItemText primary={it.label} primaryTypographyProps={{ fontWeight: 800 }} />
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Divider />
      <Box sx={{ p: 1 }}>
        <List sx={{ py: 0 }}>
          <ListItemButton
            onClick={() => {
              logout()
              nav('/login')
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="退出登录" primaryTypographyProps={{ fontWeight: 800 }} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1, display: { xs: 'inline-flex', md: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            KiddoQuest
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {session?.displayName ?? ''} {role ? `(${role})` : ''}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRightColor: 'rgba(15,23,42,0.08)',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          bgcolor: 'background.default',
          backgroundImage:
            'radial-gradient(1200px 400px at 20% 0%, rgba(79,70,229,0.10), transparent 60%), radial-gradient(900px 350px at 90% 10%, rgba(20,184,166,0.10), transparent 60%)',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}

