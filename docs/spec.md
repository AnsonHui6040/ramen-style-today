# Ramen Style Today MVP Spec

## Goal

把報告中的 8 題手機版自適應問卷先落成可互動的風格分類器。V1 只處理「風格分類與可解釋結果」，不處理店家、品項、帳號、分析後台或協同過濾。

## Frozen Decisions

1. 技術棧先採 Vite + React + TypeScript，全部邏輯先在 client 端完成。
2. Q1 只決定 Q2 的選項集合，Q3 到 Q8 永遠出現。
3. Q4 與 Q7 不是可留白題，而是用「不確定 / 無特別」這類 sentinel 選項補齊答案。
4. Q8 只做硬過濾，不參與加權計分。
5. 結果頁先顯示 18 個前台風格中的 Top 3，但真正計分單位是 54 個 core types；每個結果同時攜帶 1 個 noodle subtype，供後續品項推薦掛接。
6. 店家 / 品項推薦不參與風格計分，只做 result enrichment。

## Question Model

| 問題 | 欄位 | 權重 | 說明 |
| --- | --- | ---: | --- |
| Q1 | form | 16 | soup / tsukemen / dry |
| Q2 | archetype | 16 | 依 Q1 切分清湯/白湯、昆布水/濃厚魚介/濃厚味噌、油そば/台灣まぜ/汁なし担々 |
| Q3 | tare | 15 | shoyu / shio / miso / spicy-sesame / none |
| Q4 | source | 18 | 多選最多 2，含 unsure |
| Q5 | body | 14 | light / balanced / rich / backfat-heavy / ultra-heavy |
| Q6 | noodle | 11 | thin-straight 到 extra-thick |
| Q7 | signature | 10 | 多選最多 2，含 no-preference |
| Q8 | exclusions | 0 | 硬過濾 |

## Implemented Display Styles

1. 醬油清湯
2. 鹽味清湯
3. 味噌
4. 豚骨
5. 雞清湯
6. 雞白湯
7. 鴨清湯
8. 鴨白湯
9. 魚介
10. 貝出汁
11. 家系
12. 二郎
13. 博多
14. 札幌
15. 昆布水沾麵
16. 濃厚魚介沾麵
17. 油そば
18. 台灣まぜ / 汁なし担々

## Implemented Core Hierarchy

- 18 個 display styles
- 每個 display style 自動展開為 3 個 core types：clean / standard / heavy
- 每個 core type 自動展開為 5 個 noodle variants
- scorer 會先對 54 個 core types 計分，再收斂成 display-style-level Top 3；每個結果保留命中的 core type 與 subtype metadata

## Scoring

每個 core type 都先吃一輪 question match，再套 bonus / penalty；最後再回收成 display style 結果。

```text
score(coreType) = sum(weight * matchRatio) + bonus - penalty
```

matchRatio 目前採固定四級：

- exact = 1.0
- adjacent = 0.6
- partial = 0.4
- miss = 0

bonus 目前每個風格上限 5 分，penalty 每個風格上限 15 分。

display style 結果會保留最佳命中的 core type 與 noodle subtype，讓結果頁不只是把使用者回答原樣拼接。

## Implemented Conflict Rules

- 家系 bonus 需要跨 form、archetype、tare、source、body、noodle、signature 的組合，不靠單一答案觸發。
- 二郎若同時出現柚子訊號，直接扣 15 分。
- 二郎若和淡麗鴨 / 貝 + light 的組合同時出現，也直接扣 15 分。
- 台灣まぜ / 汁なし担々 若選到 tare = none，會明顯降分。
- 貝出汁與鴨清湯若被極濃爆量 + 豆芽蒜背脂覆蓋，也會被明顯扣分。

## Implemented Tests

- scorer fixtures 已覆蓋家系、二郎、鴨貝、昆布水、台灣まぜ、硬過濾與 exclusive normalization
- taxonomy hierarchy tests 會驗證 18 display styles、54 core types 與每個 core type 的 5 個 noodle variants
- catalog tests 會驗證有資料與無資料兩種 enrichment 路徑
- UI tests 已覆蓋問卷從 intro 到結果的代表流程，以及 ResultsPanel 的推薦 / blocked lead 呈現

## Catalog Layer

- catalog 由 [src/data/catalog.json](src/data/catalog.json) 提供，資料內容來自官方公開菜單 / 店鋪頁面
- [src/config/catalog.ts](src/config/catalog.ts) 現在只負責 loader 與 schema 驗證
- enrich 流程位於 [src/lib/catalog/enricher.ts](src/lib/catalog/enricher.ts)
- item match 會依 styleId、coreTypeId、subtypeId 三層訊號給權重
- 結果頁目前每個 Top result 最多顯示 2 間店、每間店最多 2 個對應品項，並保留官方來源連結

## Current Gaps

1. 雖然已換成真實公開資料來源，但仍缺位置排序、供應狀態與更多台灣在地店家覆蓋。
2. exclusion 目前只依 style ingredient 最小集合做阻擋，還沒細拆到配料層級。
3. config 已抽成 JSON data files，但還沒有非工程角色可直接操作的更新工作流。
4. UI 已有元件級測試，但 localStorage 恢復、多分支整合流程仍可再補強。