## 1. 產生腳本改用 OpenRouter

- [x] 1.1 將 `scripts/generate-digest.ts` 由 `@google/genai` 改為以 `fetch` 呼叫 OpenRouter Chat Completions API
- [x] 1.2 加入 web search（`plugins: [{ id: 'web', max_results }]`）與 `OPENROUTER_MODEL`（預設 `openrouter/free`）
- [x] 1.3 改從 `message.annotations[].url_citation` 取得來源，並以 `start_index`/`end_index` 對應到各則項目（退回整版去重來源）
- [x] 1.4 保留既有規則：至多 5 則、無來源即剔除、整版無來源標記 empty、部分失敗容錯、四版皆空非零 exit
- [x] 1.5 讀取 `OPENROUTER_API_KEY`，缺少時報錯退出

## 2. CI 與設定

- [x] 2.1 `.github/workflows/daily-digest.yml`：`GEMINI_API_KEY` → `OPENROUTER_API_KEY`，新增可選 `OPENROUTER_MODEL`
- [x] 2.2 `package.json` / `yarn.lock` 移除 `@google/genai` 依賴

## 3. 前端與文案

- [x] 3.1 `src/App.vue` 抬頭說明文字 Gemini → OpenRouter
- [x] 3.2 `src/lib/sections.ts` 註解措辭由「給 Gemini」改為「給模型」

## 4. 驗證

- [x] 4.1 腳本型別檢查通過、缺 key 時正確報錯退出
- [ ] 4.2 設定 `OPENROUTER_API_KEY` secret 後，以 `workflow_dispatch` 手動觸發驗證端到端產生與部署
