export type Role = 'PARENT' | 'CHILD'

export type AuthLoginResponse = {
  accessToken: string
  role: Role
  userId: number
  displayName: string
}

export type AuthSession = {
  token: string
  role: Role
  userId: number
  displayName: string
}

