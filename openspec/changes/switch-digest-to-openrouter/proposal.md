## Why

目前日報內容綁定單一供應商 Gemini（`@google/genai` + Google Search grounding），模型選擇與成本受限於 Google。改用 OpenRouter（OpenAI 相容 API）後，可用單一介面切換 400+ 模型（含免費模型），在不改動日報核心規則的前提下取得模型彈性與成本控制。

## What Changes

- 內容產生改以 OpenRouter Chat Completions API（OpenAI 相容）呼叫模型，取代 `@google/genai` SDK。
- 即時新聞檢索由 Gemini 的 Google Search grounding 改為 OpenRouter 的 web search plugin（`plugins: [{ id: 'web' }]`），對任何模型皆適用。
- 可考究來源改從回應的 `url_citation` annotations（`url`/`title`/`start_index`/`end_index`）取得，取代 Gemini 的 grounding metadata。
- 模型可由 `OPENROUTER_MODEL` 環境變數設定，預設為 `openrouter/free`（自動挑選可用免費模型）。
- **BREAKING**: CI 密鑰由 `GEMINI_API_KEY` 改為 `OPENROUTER_API_KEY`；移除 `@google/genai` 依賴。
- 「無來源即剔除」「部分失敗容錯」「四版皆空則維持線上前一版」「結構化 JSON 輸出」「API key 僅 server side 使用」等既有規則維持不變。

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `digest-generation`: 內容產生與來源檢索的供應商由 Gemini grounding 改為 OpenRouter web search，來源來自 `url_citation` annotations；server side 讀取的 key 改為 `OPENROUTER_API_KEY`。
- `digest-automation`: CI workflow 的產生步驟改呼叫 OpenRouter，注入的密鑰由 `GEMINI_API_KEY` 改為 `OPENROUTER_API_KEY`。

## Impact

- 程式碼：`scripts/generate-digest.ts`（改用 fetch 呼叫 OpenRouter）、`src/lib/sections.ts`（註解）、`src/App.vue`（抬頭說明文字）。
- CI/設定：`.github/workflows/daily-digest.yml`（密鑰名稱與可選 `OPENROUTER_MODEL`）；GitHub repo Secrets 需新增 `OPENROUTER_API_KEY`。
- 依賴：`package.json` / `yarn.lock` 移除 `@google/genai`。
- 成本：免費模型免 token 費，但 web search（Exa）約 $0.005/次，每日四版面約每月 $0.6，需於 OpenRouter 帳戶保留少量 credit。
