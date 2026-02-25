import { createContext, useContext, useMemo, useState } from 'react'
import type { AuthLoginResponse, AuthSession, Role } from './types'
import { loadSession, saveSession } from './storage'
import { setToken } from '../api/http'

type AuthContextValue = {
  session: AuthSession | null
  isAuthed: boolean
  role: Role | null
  login: (resp: AuthLoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const s = loadSession()
    if (s?.token) setToken(s.token)
    return s
  })

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      isAuthed: !!session?.token,
      role: session?.role ?? null,
      login: (resp) => {
        const next: AuthSession = {
          token: resp.accessToken,
          role: resp.role,
          userId: resp.userId,
          displayName: resp.displayName,
        }
        setToken(next.token)
        saveSession(next)
        setSession(next)
      },
      logout: () => {
        setToken(null)
        saveSession(null)
        setSession(null)
      },
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

