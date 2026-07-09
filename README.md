# ramen-style-today

行動版拉麵風格問卷 MVP。這個專案把 8 題自適應拉麵分類問卷直接實作成一個前端應用：使用者依序回答形式、輪廓、調味、主出汁、濃淡油脂、麵型、標誌元素與飲食排除，系統會回傳前三名風格與可解釋的命中理由。

## Current Scope

- 18 個前台風格的初版規則庫
- 54 個核心型別與每個核心型別對應的 5 種麵型變體
- Q1 驅動 Q2 分支，Q3 到 Q8 為共享題目
- Top 3 結果、信心分數、加扣分說明與硬過濾提示
- 店家 / 品項推薦層，會依 style / core type / noodle subtype 掛上官方公開頁面整理出的真實店家 / 品項資料
- Ramen Finder Map 收錄 30 間於 2026-07-09 核實的台中拉麵店，支援多類型篩選、官方資訊與 OpenStreetMap 定位
- 問卷、style taxonomy 與 catalog 都已改成 JSON-backed data files
- Vitest 已覆蓋 scorer fixtures、taxonomy hierarchy、catalog enrichment、問卷流程與結果頁元件
- 本機暫存作答進度

目前仍是 V1 基礎版，雖然已接入真實公開資料來源，但還沒有即時距離排序與後台維護介面。

## Run

```bash
npm install
npm run dev
```

production build:

```bash
npm run build
```

tests:

```bash
npm test
```

## Structure

- docs/spec.md: 目前凍結的產品與規則假設
- src/data/questions.json: 問卷題目、權重、Q2 分支與文案資料
- src/data/styles.json: 18 個 display styles 與 54 個 core types / noodle variants 資料
- src/data/catalog.json: 真實店家 / 品項與官方來源 URL
- public/ramen-map/data/taichung.json: 台中拉麵店、官方來源、OSM 座標與核實日期
- src/config/questions.ts / styles.ts / catalog.ts: JSON loader 與驗證層
- src/domain: 型別與簡單 schema 驗證
- src/lib/scoring: 計分與解釋產生器
- src/lib/catalog: scoring result enrichment，將結果掛到店家 / 品項推薦
- src/features: 問卷步驟與結果畫面元件
- src/__tests__ 與 src/**/*.test.tsx: scorer、catalog、taxonomy hierarchy、問卷流程與結果頁測試

## Next

1. 每 90 天重查台中店家官方頁面、營業狀態與地址；失效資料不得只改日期。
2. 在 catalog data 上再加來源更新流程，避免官方菜單變更後資料漂移。
3. 視需要補更完整的整體流程測試，例如 localStorage 恢復與多路徑回歸。 

## Map data sources

地圖底圖與地址座標使用 [OpenStreetMap](https://www.openstreetmap.org/copyright)
資料（© OpenStreetMap contributors，ODbL）。店家是否仍營業、名稱與拉麵類型以各店
官網或官方社群交叉核實。專案不儲存 Google Places 評分、評論數或營業資料。
