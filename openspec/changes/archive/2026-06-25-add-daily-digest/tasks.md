## 1. 相依套件與設定

- [x] 1.1 以 yarn 安裝 Gemini SDK:`yarn add @google/genai`
- [x] 1.2 以 yarn 安裝 SSG 工具:`yarn add -D vite-ssg`
- [x] 1.3 在 `vite.config.ts` 設定 `base: '/claude-loop/'`
- [x] 1.4 在 `vite.config.ts` 加入 vite-ssg 設定，並調整 `package.json` build script 改用 `vite-ssg build`
- [x] 1.5 確認 `src/main.ts` 改寫為 vite-ssg 的 `ViteSSG` 進入點（保留現有 Pinia、Vue Router 設定）

## 2. 資料模型與載入

- [x] 2.1 在 `src/types/digest.ts` 定義日報資料 TypeScript 型別（date、section、item、source）
- [x] 2.2 建立 `data/` 目錄並放入一份範例 `data/YYYY-MM-DD.json`（供本機開發與預渲染測試）
- [x] 2.3 實作載入邏輯:於 build 時讀取 `data/*.json`，提供「最新一期」與「所有日期清單」查詢
- [x] 2.4 定義四個版面常數（`ai-tech`、`general`、`finance`、`taiwan`）與其顯示標題

## 3. Gemini 產生腳本（server side）

- [x] 3.1 建立 `scripts/generate-digest.ts`，從環境變數讀取 `GEMINI_API_KEY`
- [x] 3.2 實作以台北時區（UTC+8）計算當日日期字串 `YYYY-MM-DD`
- [x] 3.3 針對四個版面各做一次 Gemini API 呼叫 + Google Search grounding（共 4 次），要求結構化輸出、每版最多 5 則（超過則截斷取前 5）
- [x] 3.4 從 grounding metadata 取出來源連結，組成每則項目的 `sources`;剔除無有效來源 URL 的項目（來源必備、不杜撰）
- [x] 3.5 加入每次呼叫的逾時與有限次數重試
- [x] 3.6 容錯:單版失敗標記 `status: error` 並保留其餘版面；四版全失敗則以非零 exit code 結束
- [x] 3.7 將結果寫入 `data/YYYY-MM-DD.json`（同日重跑覆寫，不產生重複檔）
- [x] 3.8 加上 npm script（如 `yarn generate`）以利本機與 CI 呼叫

## 4. 網站頁面與路由

- [x] 4.1 在 `src/router` 設定路由:`/`（今日）、`/:date(\\d{4}-\\d{2}-\\d{2})`（單日）、`/archive`（歸檔）
- [x] 4.2 實作版面區塊元件 `SectionBlock.vue`（版面標題 + 項目清單）與項目元件（標題、摘要、來源連結）
- [x] 4.3 實作 `HomeView`:顯示最新一期日報；無資料時顯示空狀態
- [x] 4.4 實作單日頁 `DigestView`:依日期顯示；查無資料顯示提示並提供回首頁/歸檔連結
- [x] 4.5 實作 `ArchiveView`:以「週」分組（ISO week，週一起始）列出所有日期，週與組內皆新到舊，每組顯示該週區間，連往對應單日頁
- [x] 4.6 加入頁首導覽（今日 / 歸檔）與「自動產生、附來源」之說明標示

## 5. NYT 風格樣式

- [x] 5.1 設定襯線（serif）標題字體與整體排版（留白、低彩度配色）
- [x] 5.2 設計版面分區的報紙感樣式（分區標題、分隔線、項目卡片）
- [x] 5.3 確保 responsive:行動裝置與桌面寬度皆可讀、不破版

## 6. 靜態預渲染

- [x] 6.1 設定 vite-ssg `includedRoutes`，由 `data/` 列出的日期動態產生所有 `/YYYY-MM-DD` 路由
- [x] 6.2 確認 build 後首頁、`/archive` 與每個日期頁皆產出含內文的靜態 HTML
- [x] 6.3 驗證 `base: '/claude-loop/'` 下資源與內部連結皆正確（無 404）

## 7. GitHub Actions 自動化

- [x] 7.1 在 GitHub repo Settings 設定 `GEMINI_API_KEY` Secret，並將 Pages 來源設為 GitHub Actions（部署前置，記錄於 PR 說明）
- [x] 7.2 建立 `.github/workflows/daily-digest.yml`:`schedule` cron `0 23 * * *` + `workflow_dispatch`
- [x] 7.3 workflow 步驟:checkout → setup node + yarn install → 跑 `yarn generate`（注入 Secret）
- [x] 7.4 將 `data/` 變更以自動化 bot 身分 commit 回預設分支（不覆寫其他日期）
- [x] 7.5 build（vite-ssg）→ 以官方 Pages action 上傳並部署
- [x] 7.6 確保產生整體失敗時中止 commit 與部署（線上維持前一版），workflow 標記失敗
- [x] 7.7 確認 workflow 觸發僅限 `schedule` 與 `workflow_dispatch`，避免 commit data 造成重複觸發

## 8. 驗證與上線

- [x] 8.1 本機以範例資料執行 `yarn build` 並預覽，確認四版面、單日、歸檔頁與 NYT 風格皆正常
- [x] 8.2 在 GitHub Actions 以 `workflow_dispatch` 手動跑一次，驗證 Gemini 產生 → commit → build → 部署端到端流程
- [x] 8.3 確認 `https://rayyyy.github.io/claude-loop/` 可正常瀏覽且連結無誤
- [x] 8.4 確認產出的 JSON 與前端 bundle 皆不含 `GEMINI_API_KEY`
- [x] 8.5 確認既有 `rayyyy.github.io` 作品集未受任何影響
