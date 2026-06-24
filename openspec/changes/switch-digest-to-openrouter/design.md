## Context

日報目前以 `@google/genai` 呼叫 Gemini，並啟用 Google Search grounding 取得即時新聞與可考究來源（`groundingMetadata.groundingChunks` / `groundingSupports`）。核心規則為「每則必附可考究來源，無來源即剔除」。本次改以 OpenRouter（OpenAI 相容）作為單一介面，保留全部既有規則，只替換供應商與來源取得方式。

## Goals / Non-Goals

**Goals:**

- 以 OpenRouter Chat Completions API 取代 `@google/genai`，模型可由環境變數切換。
- 即時檢索改用 OpenRouter web search，並從 `url_citation` annotations 取得可考究來源。
- 維持既有規則：四版各一次呼叫、至多 5 則、無來源即剔除、部分失敗容錯、四版皆空維持線上前一版、JSON schema 與輸出路徑不變、key 僅 server side。

**Non-Goals:**

- 不改變前端資料 schema（`Digest`/`DigestSection`/`DigestItem`/`DigestSource`）與 UI 結構。
- 不引入多步驟 agentic 研究；維持每版單次呼叫。
- 不更動排程時間與部署流程結構。

## Decisions

- **以原生 `fetch` 取代 SDK**：OpenRouter 為 OpenAI 相容介面，且 `annotations` 為非標準欄位，直接用 Node 22 內建 `fetch` 即可，避免新增 `openai` 依賴。替代方案：`openai` SDK——但對 annotations 型別支援不佳且增加依賴，故不採用。
- **web search 採用 `plugins: [{ id: 'web' }]` 而非 `openrouter:web_search` server tool**：plugin 對「不支援 tool-calling 的模型」也有效，由 OpenRouter 端執行檢索並注入結果，較適合預設的免費模型；兩者回傳的 `url_citation` annotations 格式相同。替代方案：server tool（官方推薦）——但要求模型支援 tool-calling，與免費模型相容性較差。
- **來源對應**：annotations 帶 `start_index`/`end_index`（相對於回應 content）。以各則項目文字在 content 中的位置區間與 annotation 區間做重疊比對，對應不到時退回整版去重來源——對應 Gemini 原本 `groundingSupports` 的行為。
- **預設模型 `openrouter/free`**：自動挑選可用免費模型，避免免費 slug 變動而失效；可由 `OPENROUTER_MODEL` 固定。

## Risks / Trade-offs

- [免費模型品質/格式遵循不穩定，某版可能常為 empty] → 既有「無來源即剔除/容錯」已能安全降級；可改設 `OPENROUTER_MODEL` 為穩定的便宜付費模型（如 `google/gemini-2.5-flash`）。
- [web search 仍有費用（Exa 約 $0.005/次，約每月 $0.6）] → 需於 OpenRouter 帳戶保留少量 credit；額度不足時該步驟失敗，容錯機制維持線上前一版。
- [annotation index 對應到 JSON content 較脆弱] → 失敗時退回整版來源，仍皆來自 annotations、可考究，不影響「無來源即剔除」鐵則。
- [web plugin 標示為 deprecated] → 仍可運作且 annotations 格式穩定；未來若移除，改用 server tool 並搭配支援 tool-calling 的模型即可。

## Migration Plan

1. 於 GitHub repo Secrets 新增 `OPENROUTER_API_KEY`（可選 variable `OPENROUTER_MODEL`），舊 `GEMINI_API_KEY` 可移除。
2. 合併後以 `workflow_dispatch` 手動觸發一次驗證端到端產生與部署。
3. Rollback：還原本次 commit 並恢復 `GEMINI_API_KEY` secret 即可回到 Gemini 版本。
