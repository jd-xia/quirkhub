export function yyyyMmDd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function mondayOfCurrentWeek() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = (day === 0 ? 6 : day - 1) // Mon=0
  const monday = new Date(now)
  monday.setDate(now.getDate() - diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

