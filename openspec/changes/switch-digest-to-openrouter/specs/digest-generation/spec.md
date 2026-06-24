## MODIFIED Requirements

### Requirement: 四版面每日內容產生

系統 SHALL 對「AI/科技」、「綜合新聞」、「財經/投資」、「台灣在地」四個版面，各執行恰好一次 OpenRouter Chat Completions API 呼叫並啟用 web search plugin，為每個版面產出當日內容。使用的模型 SHALL 可由 `OPENROUTER_MODEL` 環境變數設定，預設為 `openrouter/free`。每個版面 MUST 產出至多 5 則項目（以 5 則為目標），每則項目 MUST 含標題、摘要與分類。

#### Scenario: 四個版面皆成功產生

- **WHEN** 產生流程針對某一日期執行且四次 OpenRouter 呼叫皆成功
- **THEN** 產出的資料包含四個版面，且每個版面至少有一則、至多 5 則含標題與摘要的項目

#### Scenario: 超過 5 則時截斷

- **WHEN** 某版面從模型回應取得多於 5 則可用項目
- **THEN** 該版面只保留前 5 則，其餘不寫入當日資料

#### Scenario: 每版面恰好一次 web search 呼叫

- **WHEN** 產生流程執行
- **THEN** 每個版面只對 OpenRouter 發出一次啟用 web search plugin 的呼叫（共四次），不進行多步驟反覆研究

### Requirement: 可考究來源為必備

每則日報項目 SHALL 附帶至少一個可考究的來源，且每個來源 MUST 具備可點擊、可驗證的 URL。系統 MUST 從 OpenRouter 回應的 `url_citation` annotations 取得來源，而非自行杜撰連結。任何無法附上有效來源 URL 的項目 MUST NOT 被寫入當日資料。

#### Scenario: 項目附帶可考究來源

- **WHEN** 某則項目由帶有 `url_citation` annotations 的回應產生
- **THEN** 該項目資料含有一個以上的來源，每個來源具備有效且可點擊的 URL

#### Scenario: 無有效來源的項目被剔除

- **WHEN** 某則候選項目無法從 `url_citation` annotations 取得任何有效來源 URL
- **THEN** 該項目不被寫入當日資料，且系統不杜撰任何虛構 URL 來補足

#### Scenario: 整版皆無可考究來源

- **WHEN** 某版面回應未含任何 `url_citation` annotations
- **THEN** 該版面項目為空，並標記為無內容（不以杜撰來源填充）

### Requirement: 部分失敗的容錯

當四個版面中有部分版面的 OpenRouter 呼叫失敗時，系統 SHALL 仍輸出成功版面的內容，並在資料中標記失敗版面，而非整個流程中止且不產出任何檔案。

#### Scenario: 單一版面失敗

- **WHEN** 四個版面中有一個版面的 OpenRouter 呼叫失敗、其餘三個成功
- **THEN** 仍寫出當日 JSON，包含三個成功版面的內容，並對失敗版面標記錯誤狀態

### Requirement: API key 僅於 server side 使用

系統 SHALL 僅在 CI（server side）環境讀取 `OPENROUTER_API_KEY` 環境變數進行 OpenRouter 呼叫。API key MUST NOT 出現在任何輸出的 `data/*.json`、前端 bundle 或部署到 Pages 的靜態檔案中。

#### Scenario: key 不外洩至產出物

- **WHEN** 產生流程完成並準備部署
- **THEN** 產出的 JSON 與前端 build 產物中皆不含 `OPENROUTER_API_KEY` 的值
