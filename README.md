# ooopen-node-radar

使用 Express、node-canvas 與 d3-shape/d3-scale 產生 PNG 圖表的輕量服務。

## 概觀

此服務提供單一 GET 端點（`/`），依參數回傳下列其中一種 PNG 圖表：

- women-power-1：能力雷達圖（0–15）
- women-power-2：環境雷達圖（0–3）
- love-color：六邊雷達填色（0–12）

回應標頭包含 `Cache-Control`，並以 `image/png` 回傳影像。

## 先決條件

- 建議使用 Node.js 18 以上
- node-canvas 安裝說明：https://github.com/Automattic/node-canvas/wiki

## 安裝

```sh
npm install
```

## 執行

- 開發（自動重啟）：

```sh
npm run dev
```

- 正式：

```sh
npm start
```

伺服器預設啟動於 `http://localhost:8000`（可用環境變數 `PORT` 覆寫）。

## API

GET /

查詢參數（皆為字串）：

- chartId：可為 `women-power-1`、`women-power-2`、`love-color`
- factors：URL 編碼的 JSON（多維度測驗模組會用到）
- result：URL 編碼的 JSON

通用的 result 形狀：

```json
{
  "scores": { "<tagKey>": number }
}
```

### women-power-1（能力）

- 數值範圍：0–15
- `factors` 結構（簡化示意）：

```json
{
  "<factorId>": {
    "label": "能力",
    "tags": [
      { "key": "<tagKey>", "label": "目標力" },
      { "key": "<tagKey>", "label": "影響力" },
      { "key": "<tagKey>", "label": "恆毅力" },
      { "key": "<tagKey>", "label": "生活力" },
      { "key": "<tagKey>", "label": "知性力" },
      { "key": "<tagKey>", "label": "幸福力" },
      { "key": "<tagKey>", "label": "自信力" },
      { "key": "<tagKey>", "label": "品牌力" },
      { "key": "<tagKey>", "label": "營運力" },
      { "key": "<tagKey>", "label": "財務力" },
      { "key": "<tagKey>", "label": "驅動力" },
      { "key": "<tagKey>", "label": "聯盟力" }
    ]
  }
}
```

- `result.scores` 的鍵為 `"<factorId>:<tagKey>"`，值為 0–15 的數字。

請求範例（概念示意）：

```
GET /?chartId=women-power-1&factors=<url-encoded-json>&result=<url-encoded-json>
```

### women-power-2（環境）

- 數值範圍：0–3
- `factors` 中 `label` 為 `"環境"` 的條目，其 `tags` 會成為雷達圖各軸的順序來源。
- `result.scores` 的鍵為 `"<factorId>:<tagKey>"`，值為 0–3 的數字。

```
GET /?chartId=women-power-2&factors=<url-encoded-json>&result=<url-encoded-json>
```

### love-color

- 數值範圍：0–12
- 固定的 6 組鍵順序：
  - EEkWTo、MIgPHf、7X_gnx、6VsSRV、QAHco5、WAi_8M
- `result.scores` 應提供上述鍵。

JSON 範例：

```json
{
  "scores": {
    "EEkWTo": 5,
    "MIgPHf": 8,
    "7X_gnx": 6,
    "6VsSRV": 10,
    "QAHco5": 3,
    "WAi_8M": 12
  }
}
```

請求（概念示意）：

```
GET /?chartId=love-color&result=<url-encoded-json>
```

提示：在瀏覽器測試時，請將 JSON 以 URL 方式編碼。在 Node/JS 中可使用 `encodeURIComponent(JSON.stringify(obj))`。

## 檔案結構

- `server.js` — Express 伺服器於 `/` 輸出影像
- `src/index.js` — 路由與請求分派
- `src/women-power.js` — women-power 圖表的雷達圖繪製
- `src/love-color.js` — love-color 圖表的繪製
- `src/*.png` — 繪圖所需的背景資產
