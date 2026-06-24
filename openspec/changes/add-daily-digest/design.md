## Context

本 repo（claude-loop）已建立 Vite + Vue 3 + TypeScript 專案，並安裝 Vue Router 與 Pinia，套件管理用 yarn。我們要在此之上加入「個人每日日報」:CI 每日呼叫 Gemini（Google Search grounding）產生四版面內容，靜態預渲染後部署到本 repo 的 GitHub Pages（`https://rayyyy.github.io/claude-loop/`）。

關鍵限制:
- `GEMINI_API_KEY` 為密鑰，Gemini 呼叫只能在 CI（server side）發生，不可進入瀏覽器端 bundle。
- 發佈於 project page 子路徑 `/claude-loop/`，base path 必須正確。
- 內容要在台北 07:30 前上線，排程設於 UTC 23:00（台北 07:00），預留約 30 分鐘。
- 既有 user site `rayyyy.github.io` 作品集 repo 完全不動。
- 「研究」採單次 grounding/版（共四次呼叫），非多步驟 agent。

## Goals / Non-Goals

**Goals:**
- 每日自動產生四版面（AI/科技、綜合新聞、財經/投資、台灣在地）日報資料，含來源引用。
- 以 vite-ssg 靜態預渲染今日、單日、歷史歸檔頁，SEO 友善且可離線閱讀。
- NYT 中文版風格的閱讀體驗。
- 歷史日報以 commit 回 repo 的方式逐日累積。
- API key 全程不外洩。

**Non-Goals:**
- 不做多步驟／代理式深度研究（Deep Research 等級）。
- 不做使用者帳號、訂閱、推播或評論等互動功能。
- 不改動既有 `rayyyy.github.io` 作品集。
- 不做後端伺服器或資料庫（純靜態 + CI）。
- 初版不做全文搜尋、標籤過濾等進階瀏覽功能。

## Decisions

### 決策 1:研究方式 — 單次 grounding/版（4 次呼叫）

對四個版面各做一次 Gemini API 呼叫並啟用 Google Search grounding，由 grounding metadata 取得來源連結。
- **為何**:四個領域差異大，分開呼叫可讓各版主題聚焦、來源乾淨，品質明顯優於單次混合搜尋；grounding 呼叫成本低，4 次仍可接受。
- **替代方案**:(a) 一次呼叫產出四版 — 省配額但各版深度被稀釋；(b) 多步驟 agent — 最接近 Deep Research 但慢、貴、複雜。皆與「單次 grounding」需求不符。

### 決策 2:Gemini SDK 與模型

使用官方 `@google/genai` SDK，搭配支援 Google Search grounding 的 Gemini 模型，於產生腳本中以 grounding tool 取得帶引用的回應，並要求模型輸出固定 schema 的結構化結果。
- **為何**:官方 SDK 維護穩定、grounding 與結構化輸出皆受支援。
- **替代方案**:直接打 REST API — 可行但要自行處理 grounding metadata 解析與重試，徒增維護成本。
- **註**:實作時須以 SDK 文件確認當下建議的 grounded 模型 id 與結構化輸出方式（避免寫死過時 model id）。

### 決策 3:資料形狀 — 逐日 JSON 檔，commit 回 repo

每日資料存為 `data/YYYY-MM-DD.json`（台北時區判定日期），由 CI commit 回預設分支。前端在 build 時讀取 `data/` 全部檔案做預渲染。
- **為何**:檔案即資料庫，零基礎設施；commit 回 repo 讓歷史自動累積且可被 git 追蹤；build 時讀檔最適合 SSG。
- **替代方案**:(a) 用 GitHub Releases/Artifacts 存資料 — 讀取較麻煩；(b) 外部 KV/DB — 過度設計。

JSON schema（示意）:
```jsonc
{
  "date": "2026-06-24",
  "sections": [
    {
      "id": "ai-tech",            // ai-tech | general | finance | taiwan
      "title": "AI / 科技",
      "status": "ok",            // ok | error
      "items": [
        {
          "title": "...",
          "summary": "...",
          "category": "...",
          "sources": [ { "title": "...", "url": "https://..." } ]
        }
      ]
    }
  ]
}
```

### 決策 4:靜態預渲染 — vite-ssg

以 `vite-ssg` 在 build 階段預渲染所有路由。動態日期路由 `/YYYY-MM-DD` 透過 vite-ssg 的 `includedRoutes` 由 `data/` 目錄列出的日期動態產生。
- **為何**:vite-ssg 是 Vite + Vue 生態最直接的 SSG 方案，能沿用既有 Vue Router 設定，並支援由資料動態列舉要預渲染的路由。
- **替代方案**:(a) 純 SPA runtime 抓 JSON — 被需求排除（要 SEO 與離線可讀）;(b) 自寫 render 腳本 — 重造輪子。

### 決策 5:Base path 與部署

`vite.config.ts` 設 `base: '/claude-loop/'`；Vue Router 使用 `createWebHistory(import.meta.env.BASE_URL)`（既有設定已符合）。部署採 GitHub Actions 官方 Pages 部署流程（upload-pages-artifact + deploy-pages）。
- **為何**:project page 必須帶子路徑 base 才能正確解析資源；官方 Pages action 為現行建議做法，免維護 `gh-pages` 分支。

### 決策 6:CI 流程與排程

單一 workflow，cron `0 23 * * *`（UTC）＋ `workflow_dispatch`。步驟:checkout → setup node + yarn install → 跑產生腳本（注入 `GEMINI_API_KEY`）→ commit `data/` 變更回 repo → vite-ssg build → 上傳並部署 Pages。
- **為何**:單一 workflow 串接最單純，符合「07:30 前上線」且預留緩衝。
- **時區註**:cron 為 UTC，不隨日光節約調整；日期一律以台北時區（UTC+8）在腳本內判定，避免跨日錯置。

### 決策 7:容錯策略

- 單版失敗:標記該版 `status: error`，其餘版照常輸出（spec: digest-generation 部分失敗容錯）。
- 全部失敗:腳本以非零 exit code 結束 → 不 commit、不部署，線上維持前一版（spec: digest-automation 不破壞既有站點）。
- 每次 Gemini 呼叫加入有限次數重試與逾時保護。

## Risks / Trade-offs

- **Gemini grounding 的可用性／model id 變動** → 實作時以官方 SDK 文件確認當下 grounded 模型與用法，不在程式中寫死易過時的 id；加入錯誤處理與重試。
- **內容品質／幻覺風險** → 要求模型只根據 grounding 來源作答、來源連結一律取自 grounding metadata（不杜撰）；UI 明確標示為自動產生並附來源。
- **cron 不精準 + build 時間** → 排程提前至台北 07:00，預留 30 分鐘;若仍逼近，可再提前 cron 時間。
- **CI commit 觸發無限迴圈** → workflow 觸發限定為 `schedule` 與 `workflow_dispatch`（不掛 `push`），且 commit data 不應再次觸發建置。
- **資料量隨日累積變大、build 變慢** → 初期可接受;未來可限制預渲染最近 N 天、其餘走歸檔分頁或延後優化。
- **API 成本** → 每日 4 次 grounding 呼叫量小;仍建議留意配額與帳單。
- **時區邊界錯置** → 一律於腳本內以台北時區計算日期字串，避免用 runner 的 UTC 當日期。

## Migration Plan

1. 安裝相依:`yarn add @google/genai` 與 `yarn add -D vite-ssg`（依官方建議調整）。
2. 設定 `vite.config.ts` 的 `base` 與 vite-ssg；調整 `package.json` build script 為 vite-ssg build。
3. 加入產生腳本、資料型別、Vue views/components 與 NYT 風格樣式。
4. 在 GitHub repo Settings 設定 `GEMINI_API_KEY` Secret，並啟用 GitHub Pages（來源為 GitHub Actions）。
5. 新增 workflow，先以 `workflow_dispatch` 手動跑一次驗證端到端流程。
6. 確認 `https://rayyyy.github.io/claude-loop/` 正常後，依賴 cron 自動每日更新。

**Rollback**:本變更不動既有作品集 repo;若需停用，停用／刪除 workflow 即可，已產生的靜態站點可保留或下架，無資料庫狀態需回復。

## Resolved Questions

- **各版面每日項目數**:每版至多 5 則，以 5 則為目標。prompt 要求最多回傳 5 則；超過則截斷取前 5。
- **來源**:採「可考究來源為必備」— 每則項目必須附至少一個來自 grounding metadata 的有效、可點擊 URL；無法附上有效來源的項目一律剔除，不杜撰補足。
- **歸檔頁分組**:以「週」分組。週與組內日期皆新到舊排序，每組顯示該週區間;跨年的同一週不拆組。週的界定（週起始日）於實作時統一採 ISO week（週一為起始）。

## Open Questions

- 日報輸出語言固定繁體中文，但來源可含外文 — 摘要是否需註明原文語言?（初版預設不註明。）
