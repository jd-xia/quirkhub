import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5' },
    secondary: { main: '#14b8a6' },
    background: {
      default: '#f6f7fb',
      paper: '#ffffff',
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  components: {
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: 'rgba(15,23,42,0.08)',
          boxShadow: '0 10px 24px rgba(15,23,42,0.06), 0 1px 0 rgba(15,23,42,0.03)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': { paddingBottom: 20 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 14, fontWeight: 900 },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #4f46e5, #14b8a6)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 900,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 42,
        },
        indicator: {
          height: 4,
          borderRadius: 999,
          background: 'linear-gradient(90deg, rgba(79,70,229,1), rgba(20,184,166,1))',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 42,
          textTransform: 'none',
          fontWeight: 950,
          borderRadius: 999,
          marginRight: 6,
        },
      },
    },
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(15,23,42,0.08)',
          overflow: 'hidden',
          '&:before': { display: 'none' },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 52,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.70))',
          '&.Mui-expanded': { minHeight: 52 },
        },
        content: {
          margin: '12px 0',
          '&.Mui-expanded': { margin: '12px 0' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 18 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: 'rgba(79,70,229,0.06)',
          fontWeight: 950,
        },
      },
    },
  },
})

