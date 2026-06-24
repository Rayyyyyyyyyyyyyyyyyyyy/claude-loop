## Why

我想要一份「為自己策展」的每日日報:每天早上 07:30 前能在自己的網站看到當天的 AI/科技、綜合新聞、財經/投資、台灣在地四個版面，內容由 Gemini 搭配 Google Search grounding 自動研究產生，不需要我手動整理。目前沒有這樣的東西，而我已經有 Gemini API key、一個既有的 GitHub Pages 環境，以及剛建好的 Vite + Vue 專案，可以把它組起來。

## What Changes

- 新增「每日日報產生」流程:對四個版面各做一次 Gemini API 呼叫（含 Google Search grounding），產出含標題、摘要、分類與來源連結引用的結構化資料，存成 `data/YYYY-MM-DD.json`。
- 新增日報網站呈現:NYT 中文版風格（襯線標題、留白、低彩度、版面分區）的靜態網站，含 `/`（今日）、`/YYYY-MM-DD`（某日）、`/archive`（歷史索引）三種路由。
- 改為靜態預渲染:以 vite-ssg 在 build 時把所有日期的日報烤成靜態 HTML（SEO 友善、可翻閱歷史），取代目前單純 SPA 的渲染方式。
- 新增自動化:GitHub Actions cron 排程於 UTC 23:00（台北 07:00）執行「研究 → 產生 JSON → commit 回 repo → build → 部署 GitHub Pages」，預留約 30 分鐘緩衝讓內容在台北 07:30 前上線。
- 新增部署設定:在本 repo（claude-loop）啟用 GitHub Pages，Vite `base` 設為 `'/claude-loop/'`，發佈於 `https://rayyyy.github.io/claude-loop/`。既有的 user site `rayyyy.github.io` 作品集不受影響。
- 新增相依套件:`vite-ssg` 與 Gemini SDK `@google/genai`（以 yarn 管理）。
- 密鑰管理:`GEMINI_API_KEY` 存於 GitHub repo Secrets，Gemini 呼叫只在 CI（server side）發生，絕不出現在瀏覽器端。

## Capabilities

### New Capabilities
- `digest-generation`: 透過 Gemini API + Google Search grounding，對四個版面各做一次研究呼叫，產出當日結構化日報資料（標題、摘要、分類、來源引用）並寫入 `data/YYYY-MM-DD.json`。
- `digest-web`: 日報網站的呈現與路由 — NYT 中文版風格的版面、今日／某日／歷史歸檔頁，以 vite-ssg 靜態預渲染所有日期。
- `digest-automation`: GitHub Actions 排程與發佈流程 — 定時觸發、產生並 commit 當日資料、build、部署 GitHub Pages，以及 API key 的安全處理。

### Modified Capabilities
<!-- 尚無既有 spec，無需修改現有 capability。 -->

## Impact

- **新增程式碼**:Gemini 研究腳本（Node/TypeScript，CI 端執行）、日報資料的 TypeScript 型別與載入邏輯、Vue views/components（今日、某日、歸檔、版面區塊）、NYT 風格樣式。
- **設定變更**:`vite.config.ts` 加入 `base: '/claude-loop/'` 與 vite-ssg 設定；`package.json` build script 改用 vite-ssg；新增 `.github/workflows/` 排程 workflow。
- **資料**:新增 `data/` 目錄，逐日累積 `YYYY-MM-DD.json`，由 CI commit 回 repo。
- **相依套件**:新增 `vite-ssg`、`@google/genai`。
- **外部服務**:依賴 Gemini API（grounding 配額與成本）與 GitHub Actions／Pages。
- **密鑰**:需在 repo Secrets 設定 `GEMINI_API_KEY`。
- **不影響**:既有的 `rayyyy.github.io` 作品集 repo 完全不動。
