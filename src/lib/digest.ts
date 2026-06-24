import type { Digest } from '../types/digest'

// build 時把 data/*.json 全部打包進來，使內容於預渲染與 client 皆可用
const modules = import.meta.glob<Digest>('/data/*.json', {
  eager: true,
  import: 'default',
})

// 依日期新到舊排序
const digests: Digest[] = Object.values(modules).sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
)

export function allDigests(): Digest[] {
  return digests
}

export function allDates(): string[] {
  return digests.map((d) => d.date)
}

export function latestDigest(): Digest | undefined {
  return digests[0]
}

export function digestByDate(date: string): Digest | undefined {
  return digests.find((d) => d.date === date)
}
