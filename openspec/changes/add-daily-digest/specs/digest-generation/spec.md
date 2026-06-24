## ADDED Requirements

### Requirement: 四版面每日內容產生

系統 SHALL 對「AI/科技」、「綜合新聞」、「財經/投資」、「台灣在地」四個版面，各執行恰好一次 Gemini API 呼叫並啟用 Google Search grounding，為每個版面產出當日內容。每個版面 MUST 產出至多 5 則項目（以 5 則為目標），每則項目 MUST 含標題、摘要與分類。

#### Scenario: 四個版面皆成功產生

- **WHEN** 產生流程針對某一日期執行且四次 Gemini 呼叫皆成功
- **THEN** 產出的資料包含四個版面，且每個版面至少有一則、至多 5 則含標題與摘要的項目

#### Scenario: 超過 5 則時截斷

- **WHEN** 某版面從 Gemini 取得多於 5 則可用項目
- **THEN** 該版面只保留前 5 則，其餘不寫入當日資料

#### Scenario: 每版面恰好一次 grounding 呼叫

- **WHEN** 產生流程執行
- **THEN** 每個版面只對 Gemini 發出一次啟用 Google Search grounding 的呼叫（共四次），不進行多步驟反覆研究

### Requirement: 可考究來源為必備

每則日報項目 SHALL 附帶至少一個可考究的來源，且每個來源 MUST 具備可點擊、可驗證的 URL。系統 MUST 從 Gemini grounding 回傳的 grounding metadata 取得來源，而非自行杜撰連結。任何無法附上有效來源 URL 的項目 MUST NOT 被寫入當日資料。

#### Scenario: 項目附帶可考究來源

- **WHEN** 某則項目由帶有 grounding 來源的回應產生
- **THEN** 該項目資料含有一個以上的來源，每個來源具備有效且可點擊的 URL

#### Scenario: 無有效來源的項目被剔除

- **WHEN** 某則候選項目無法從 grounding metadata 取得任何有效來源 URL
- **THEN** 該項目不被寫入當日資料，且系統不杜撰任何虛構 URL 來補足

#### Scenario: 整版皆無可考究來源

- **WHEN** 某版面所有候選項目都無有效來源
- **THEN** 該版面項目為空，並標記為無內容（不以杜撰來源填充）

### Requirement: 結構化資料輸出

系統 SHALL 將當日四版面內容寫入 `data/YYYY-MM-DD.json`（日期以台北時區判定），檔案格式為固定 schema 的 JSON，包含日期、各版面與其項目陣列。重複針對同一日期執行時，系統 MUST 覆寫該日期的檔案而非新增重複檔案。

#### Scenario: 寫入當日 JSON 檔

- **WHEN** 產生流程於台北時間某日執行完成
- **THEN** 在 `data/` 目錄產生對應 `YYYY-MM-DD.json`，內容符合預期 schema 且可被 JSON parser 正確解析

#### Scenario: 同日重跑覆寫

- **WHEN** 同一日期的產生流程被執行第二次
- **THEN** 既有的 `data/YYYY-MM-DD.json` 被覆寫，且 `data/` 中該日期僅存在一個檔案

### Requirement: 部分失敗的容錯

當四個版面中有部分版面的 Gemini 呼叫失敗時，系統 SHALL 仍輸出成功版面的內容，並在資料中標記失敗版面，而非整個流程中止且不產出任何檔案。

#### Scenario: 單一版面失敗

- **WHEN** 四個版面中有一個版面的 Gemini 呼叫失敗、其餘三個成功
- **THEN** 仍寫出當日 JSON，包含三個成功版面的內容，並對失敗版面標記錯誤狀態

### Requirement: API key 僅於 server side 使用

系統 SHALL 僅在 CI（server side）環境讀取 `GEMINI_API_KEY` 環境變數進行 Gemini 呼叫。API key MUST NOT 出現在任何輸出的 `data/*.json`、前端 bundle 或部署到 Pages 的靜態檔案中。

#### Scenario: key 不外洩至產出物

- **WHEN** 產生流程完成並準備部署
- **THEN** 產出的 JSON 與前端 build 產物中皆不含 `GEMINI_API_KEY` 的值
