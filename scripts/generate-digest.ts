import { GoogleGenAI } from '@google/genai'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SECTIONS, type SectionMeta } from '../src/lib/sections'
import type { Digest, DigestItem, DigestSection, DigestSource } from '../src/types/digest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = resolve(root, 'data')

// 可依 @google/genai 文件調整為當下建議的 grounded 模型
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const MAX_ITEMS = 5
const TIMEOUT_MS = 60_000
const MAX_RETRIES = 3

/** 以台北時區（Asia/Taipei）取得 YYYY-MM-DD */
function taipeiDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('回應中找不到 JSON')
  return JSON.parse(raw.slice(start, end + 1))
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface RawItem {
  title?: string
  summary?: string
  category?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function groundingSources(candidate: any): {
  byIndex: (DigestSource | null)[]
  unique: DigestSource[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supports: any[]
} {
  const metadata = candidate?.groundingMetadata
  const chunks = metadata?.groundingChunks ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byIndex: (DigestSource | null)[] = chunks.map((c: any) =>
    c?.web?.uri ? { title: c.web.title ?? c.web.uri, url: c.web.uri } : null,
  )
  const seen = new Set<string>()
  const unique: DigestSource[] = []
  for (const s of byIndex) {
    if (s && !seen.has(s.url)) {
      seen.add(s.url)
      unique.push(s)
    }
  }
  return { byIndex, unique, supports: metadata?.groundingSupports ?? [] }
}

async function generateSection(ai: GoogleGenAI, meta: SectionMeta, date: string): Promise<DigestSection> {
  const prompt =
    `今天是 ${date}（台北時間）。請用繁體中文，針對「${meta.title}」版面，` +
    `透過 Google 搜尋彙整當日最重要的新聞，最多 ${MAX_ITEMS} 則。主題範圍：${meta.topic}。\n` +
    `請只輸出 JSON（不要任何其他文字），格式為：\n` +
    `{"items":[{"title":"標題","summary":"2-3 句中文摘要","category":"分類標籤"}]}`

  let lastErr: unknown
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await withTimeout(
        ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }] },
        }),
        TIMEOUT_MS,
      )

      const text = res.text ?? ''
      const parsed = extractJson(text) as { items?: RawItem[] }
      const rawItems = (parsed.items ?? []).slice(0, MAX_ITEMS)

      const candidate = res.candidates?.[0]
      const { byIndex, unique, supports } = groundingSources(candidate)

      // 整版皆無可考究來源 → 標記為空（不杜撰來源）
      if (unique.length === 0) {
        return { id: meta.id, title: meta.title, status: 'empty', items: [] }
      }

      // 嘗試將 grounding supports 的文字段落對應到各則項目，取得較精準的來源；
      // 對應不到時退回整版來源（仍皆來自 grounding metadata，可考究）。
      const sourcesForText = (textValue: string): DigestSource[] => {
        const idxs = new Set<number>()
        for (const sup of supports) {
          const seg: string = sup?.segment?.text ?? ''
          if (seg && (textValue.includes(seg) || seg.includes(textValue.slice(0, 24)))) {
            for (const i of sup?.groundingChunkIndices ?? []) idxs.add(i)
          }
        }
        const picked = [...idxs]
          .map((i) => byIndex[i])
          .filter((s): s is DigestSource => !!s)
        return picked.length ? picked : unique
      }

      const items: DigestItem[] = rawItems
        .filter((it) => it.title && it.summary)
        .map((it) => ({
          title: String(it.title),
          summary: String(it.summary),
          category: String(it.category ?? meta.title),
          sources: sourcesForText(`${it.title}。${it.summary}`),
        }))
        // 來源必備：剔除無有效來源的項目
        .filter((it) => it.sources.length > 0)

      if (items.length === 0) {
        return { id: meta.id, title: meta.title, status: 'empty', items: [] }
      }
      return { id: meta.id, title: meta.title, status: 'ok', items }
    } catch (err) {
      lastErr = err
      if (attempt < MAX_RETRIES) await sleep(1000 * attempt)
    }
  }
  throw lastErr
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('缺少 GEMINI_API_KEY 環境變數')
    process.exit(1)
  }

  const ai = new GoogleGenAI({ apiKey })
  const date = taipeiDate()

  const sections: DigestSection[] = []
  let okCount = 0

  for (const meta of SECTIONS) {
    try {
      const section = await generateSection(ai, meta, date)
      sections.push(section)
      if (section.status === 'ok') okCount++
      console.log(`[${meta.id}] ${section.status}（${section.items.length} 則）`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[${meta.id}] 失敗：${message}`)
      sections.push({ id: meta.id, title: meta.title, status: 'error', items: [], error: message })
    }
  }

  // 四版面皆無成功內容 → 不寫檔、以非零 exit code 結束（CI 後續步驟不執行，線上維持前一版）
  if (okCount === 0) {
    console.error('四版面皆無成功內容，中止產生。')
    process.exit(1)
  }

  const digest: Digest = { date, sections }
  mkdirSync(DATA_DIR, { recursive: true })
  const outPath = resolve(DATA_DIR, `${date}.json`)
  writeFileSync(outPath, JSON.stringify(digest, null, 2) + '\n', 'utf8')
  console.log(`已寫入 ${outPath}（成功版面：${okCount}/${SECTIONS.length}）`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
