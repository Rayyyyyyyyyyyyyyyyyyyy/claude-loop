export interface WeekInfo {
  /** ISO 週鍵，例如 2026-W26（跨年同一 ISO 週共用相同鍵） */
  key: string
  /** 該週週一 YYYY-MM-DD */
  start: string
  /** 該週週日 YYYY-MM-DD */
  end: string
}

const DAY = 24 * 60 * 60 * 1000
const fmt = (d: Date) => d.toISOString().slice(0, 10)

/** 以 ISO week（週一為起始）計算某日期所屬的週 */
export function isoWeek(dateStr: string): WeekInfo {
  const d = new Date(dateStr + 'T00:00:00Z')
  const dow = (d.getUTCDay() + 6) % 7 // 週一=0 ... 週日=6

  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() - dow)

  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)

  // ISO 週年與週數以該週的週四決定（避免跨年被拆組）
  const thursday = new Date(monday)
  thursday.setUTCDate(monday.getUTCDate() + 3)
  const isoYear = thursday.getUTCFullYear()
  const jan1 = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.floor((thursday.getTime() - jan1.getTime()) / (7 * DAY)) + 1

  return {
    key: `${isoYear}-W${String(week).padStart(2, '0')}`,
    start: fmt(monday),
    end: fmt(sunday),
  }
}
