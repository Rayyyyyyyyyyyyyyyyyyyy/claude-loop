export type SectionId = 'ai-tech' | 'general' | 'finance' | 'taiwan'

export type SectionStatus = 'ok' | 'empty' | 'error'

export interface DigestSource {
  title: string
  url: string
}

export interface DigestItem {
  title: string
  summary: string
  category: string
  sources: DigestSource[]
}

export interface DigestSection {
  id: SectionId
  title: string
  status: SectionStatus
  items: DigestItem[]
  error?: string
}

export interface Digest {
  /** YYYY-MM-DD（以台北時區判定） */
  date: string
  sections: DigestSection[]
}
