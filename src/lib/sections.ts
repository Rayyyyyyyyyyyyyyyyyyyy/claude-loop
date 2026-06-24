import type { SectionId } from '../types/digest'

export interface SectionMeta {
  id: SectionId
  title: string
  /** 給模型的主題範圍描述 */
  topic: string
}

/** 四個版面的固定順序與顯示標題（前端與產生腳本共用） */
export const SECTIONS: SectionMeta[] = [
  {
    id: 'ai-tech',
    title: 'AI / 科技',
    topic: '人工智慧、軟體、半導體與科技產業的當日重要新聞與趨勢',
  },
  {
    id: 'general',
    title: '綜合新聞',
    topic: '當日國際與重大綜合要聞（政治、社會、國際情勢）',
  },
  {
    id: 'finance',
    title: '財經 / 投資',
    topic: '當日全球與台灣的財經、股市、總體經濟與產業財報重點',
  },
  {
    id: 'taiwan',
    title: '台灣在地',
    topic: '當日台灣本地的重要時事與議題',
  },
]
