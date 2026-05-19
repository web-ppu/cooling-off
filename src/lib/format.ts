export function formatKRW(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`
}

export function formatCoolingEndsAt(isoDate: string): string {
  const d = new Date(isoDate)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}월 ${day}일 ${hour}:${min}부터 결정 가능`
}

export function formatRemainingShort(ms: number): string {
  if (ms <= 0) return '종료'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  if (days > 0) return `${days}일 ${hours}시간`
  if (hours > 0) return `${hours}시간 ${mins}분`
  return `${mins}분`
}

export function formatReadyAt(isoDate: string): string {
  const d = new Date(isoDate)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hour = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${month}월 ${day}일 ${hour}:${min}`
}

export function formatRemainingMs(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  const hh = String(hours).padStart(2, '0')
  const mm = String(mins).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  if (days > 0) return `${days}일 ${hh}:${mm}:${ss}`
  return `${hh}:${mm}:${ss}`
}
