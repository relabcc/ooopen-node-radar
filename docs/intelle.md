# Intelle 雷達圖 (Radar Charts)

`intelle` 圖表會在背景圖 (`intelle-1.jpg` 或 `intelle-2.jpg`) 上繪製 10 維度的雷達多邊形。

## 呼叫端點 (Endpoint)

```
GET /?chartId=intelle-<n>&result=<json>
```
其中 `<n>` 可為 `1` 或 `2`（未來可擴充）。

伺服端（見 `src/index.js`）會偵測 `chartId` 以 `intelle` 開頭並轉交給 `src/intelle.js`。

## 輸入資料 (`result`)
以 `result` 查詢參數（URL 編碼後的 JSON）提供資料。支援的結構（依優先順序）：

1. `{"values": [n0, n1, ...]}` – 數字陣列（取前 10 個；不足以 0 補齊）。
2. `{"scores": [n0, n1, ...]}` – 陣列的替代名稱。
3. `{"scores": { key: value, ... }, "orders": [key0, key1, ...]}` – 物件 + 明確排序陣列（取前 10）。
4. `{"scores": { key: value, ... }}` – 單純物件：會依物件列舉順序取數字。

數值預期範圍 0–50（繪圖比例依據此範圍）。非數字會被忽略或轉為 0。

## Key 排序邏輯
當使用物件型 `scores` 且沒有提供 `values` 陣列時，系統會依 chartId 使用預設 key 順序：

Chart 1 (`chartId=intelle-1`):
```
['bFvA8r','psaC-r','-1OG2g','v9lAGL','wzwkeT','slXqQ7','n8WFDI','9UNOSA','mkvcta','ockkuf']
```
Chart 2 (`chartId=intelle-2`):
```
['_Ia9CU','g90ksj','fNJ8fm','Ov2l9G','JtBa2H','Fb2dGK','OixAU4','lgeHpP','n3UJTR','I19Po6']
```
若該 key 在 `scores` 不存在，其值視為 0。

若未來新增的 chartId 沒有對應預設 key，則會 fallback：先看 `orders` 陣列；若沒有則按物件本身列舉順序。

## 繪圖參數 (Rendering Options)
目前伺服端呼叫時固定設定：
- `showScores: true` （在頂點外顯示分數）
- `scoreColor: '#325591'`
- `scoreFontSize: 40`
- `scoreFontFamily: 'Arial'`

若直接呼叫 `getIntelleCanvas` 可自行覆寫：
```
getIntelleCanvas({
  result: { ... },
  chartId: '1',               // 或 '2'
  showScores: true|false,
  scoreColor: '#RRGGBB',
  scoreFontSize: 20,
  scoreFontFamily: 'Ropa Sans'
})
```

## 範例連結 (Example URLs)
（請在實際測試時確保 JSON 已 URL 編碼）

簡單陣列（chart 1）:
```
http://localhost:8000/?chartId=intelle-1&result={"values":[10,20,30,40,25,15,45,32,18,27]}
```
預設 key 排序的物件（chart 2；缺 key 會補 0）:
```
http://localhost:8000/?chartId=intelle-2&result={"scores":{"_Ia9CU":12,"g90ksj":28,"fNJ8fm":33,"Ov2l9G":21,"JtBa2H":50,"Fb2dGK":44,"OixAU4":38,"lgeHpP":9,"n3UJTR":25,"I19Po6":41}}
```
使用 `orders` 自訂排序（示例）:
```
http://localhost:8000/?chartId=intelle-1&result={"scores":{"a":5,"b":10,"c":15},"orders":["c","b","a"]}
```

（URL 編碼版本）
```
Chart1 Enc:
http://localhost:8000/?chartId=intelle-1&result=%7B%22values%22%3A%5B10%2C20%2C30%2C40%2C25%2C15%2C45%2C32%2C18%2C27%5D%7D
Chart2 Enc:
http://localhost:8000/?chartId=intelle-2&result=%7B%22scores%22%3A%7B%22_Ia9CU%22%3A12%2C%22g90ksj%22%3A28%2C%22fNJ8fm%22%3A33%2C%22Ov2l9G%22%3A21%2C%22JtBa2H%22%3A50%2C%22Fb2dGK%22%3A44%2C%22OixAU4%22%3A38%2C%22lgeHpP%22%3A9%2C%22n3UJTR%22%3A25%2C%22I19Po6%22%3A41%7D%7D
Orders Enc:
http://localhost:8000/?chartId=intelle-1&result=%7B%22scores%22%3A%7B%22a%22%3A5%2C%22b%22%3A10%2C%22c%22%3A15%7D%2C%22orders%22%3A%5B%22c%22%2C%22b%22%2C%22a%22%5D%7D
```

## 輸出 (Output)
回應為 `image/png`：包含背景圖、50% 透明度填色的多邊形與外框描邊。若啟用分數則會在各頂點外顯示並自動旋轉保持可讀。

## 備註與延伸建議
- 可加入數值範圍驗證（目前信任輸入）
- 可提供自動正規化選項
- 支援更多背景（如 `intelle-3.jpg`）及其 key 列表
- 額外圖例 / 標題疊加

---
最後更新：2025-09-12
