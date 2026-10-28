# Steam Insights — NCHU 資料探勘 HW2

**Interactive Multiple Linear Regression Dashboard**

這是可直接部署在 **GitHub Pages** 的純前端網站（HTML / CSS / JavaScript），不需要後端，也不需要 Python 套件。所有模型訓練、RFE 特徵選擇和預測計算都在瀏覽器完成。

## 一鍵使用公開資料（加分功能）

首頁提供 4 個「一鍵套用並訓練」快捷卡片：

| 快捷選項 | 使用的 CSV | 目標欄位 | 性質 |
|---|---|---|---|
| Steam 遊戲價格 | `steam.csv` | `price` | 正式 Problem 01，15 個原始輸入特徵 |
| Steam 遊玩時間 | `steam.csv` | `average_playtime` | 正式 Problem 02，14 個原始輸入特徵 |
| 全球遊戲銷量 | `video_game_sales.csv` | `Global_Sales` | 延伸實驗；避免區域銷量加總造成資料洩漏 |
| 50 Startups | `50_Startups.csv` | `Profit` | 老師提供的自訂資料示範；原始特徵數未達主作業要求 |

點選卡片會自動更新 Problem 下拉選單、CSV URL、Target，然後載入 CSV 並訓練模型，結果都是瀏覽器運算，並非預填成績。

**加總分 1 分**：主選單可切換 Steam 價格預測、Steam 平均遊玩時間預測兩種問題。

**加總分 2 分**：選擇「自訂資料集 · CSV URL / 上傳」後，可自行貼上任意公開 CSV（HTTP/HTTPS）網址、選擇數值 Target 或上傳本機 CSV。遠端網址需允許 CORS，且資料應有足夠的有效數值／低基數類別特徵以完成回歸；此限制不代表每一個任意 CSV 都能建立有效回歸模型。

來源：
- Steam CSV：https://raw.githubusercontent.com/yilinpotato/BigData-App/main/dataset/steam.csv
- Video Game Sales CSV：https://raw.githubusercontent.com/stephenbeese/Video-Game-Sales-Analysis/main/data/raw/video_game_sales.csv
- 50 Startups CSV：https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv

## 網站功能

- **兩種問題切換（加分 +1）**：Steam 遊戲價格 `price`；Steam 平均遊玩時間 `average_playtime`。
- **任意 CSV URL / 本機 CSV 上傳（加分 +2）**：自動辨識數值欄位，選擇回歸 Target。支援老師舉例的 `50_Startups.csv`（這只有 4 個原始特徵，僅為自訂資料功能展示）。
- **Feature Selection**：訓練資料內使用 RFE（遞迴特徵消除），比較不同特徵數量。
- **Linear Regression**：訓練多元 OLS 模型，另以 Ridge 比較。RFE 結果由驗證集 RMSE 決定。
- **Model Evaluation**：MAE、MSE、RMSE、R²、Adjusted R²，獨立測試集。
- **預測圖及區間**：實際值 vs. 預測值、特徵選擇比較、殘差、95% split conformal prediction intervals。
- **Deployment**：使用模型訓練後的轉換特徵，於網頁調整輸入值即時預測並輸出區間；模型結果可下載 JSON。
- **CRISP-DM**：Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment。

## 資料來源與欄位合規

- Kaggle 原始資料：https://www.kaggle.com/datasets/nikdavis/steam-store-games
- 公開 GitHub CSV：https://github.com/yilinpotato/BigData-App/blob/main/dataset/steam.csv
- 預設可讀取 raw URL：https://raw.githubusercontent.com/yilinpotato/BigData-App/main/dataset/steam.csv
- Steam Price Problem：原始資料 18 欄；不使用 `appid`（ID）、`name`（名稱）、`price`（Target），保留 **15 個原始輸入特徵**。
- Steam Playtime Problem：`average_playtime` 為 Target；同時移除 `appid`、`name`、`median_playtime`（高度直接相近欄位），保留 **14 個原始輸入特徵**。
- 為讓字串欄位可進入線性回歸，將部分平台、類型、評論數及時間等轉換為衍生數值特徵；**模型輸入維度不等於原始欄位數**，網站兩者分別計數。

⚠️ 這是歷史 Steam 商店資料（約 2019 年前後），並非目前 Steam 售價。評價和擁有者數等變數可受到遊戲發布後市場行為影響，結果僅供**橫斷面關聯及模型教學**，不代表上架前價格預測或因果推論。

## 執行

直接開啟 `index.html` 即可顯示頁面。某些瀏覽器在 `file://` 協定下會阻擋遠端 CSV 存取，建議用 VS Code Live Server、Python 本機伺服器或 GitHub Pages：

```bash
python -m http.server 8000
```

瀏覽 http://localhost:8000 。網站會自動下載並分析預設的 Steam CSV，若網路或 CORS 限制請點選上傳本機 CSV。CSV 上傳只在目前瀏覽器中進行，不會傳送到我們的伺服器。

### GitHub Pages

將 `index.html`、`style.css`、`app.js`、`core.js` 放在 GitHub Pages 啟用的目錄（例如 repo 的 `hw2/`），網址為 `https://<user>.github.io/<repo>/hw2/`。不需要安裝建置工具。

## 實作與統計細節

1. 固定隨機種子 42，最多抽取 12,000 筆，避免瀏覽器模型訓練過慢。
2. 60% 訓練、20% 驗證、10% 校準、10% 測試；中位數補值使用訓練集估計。
3. OLS／Ridge 使用 training only 標準化、帶截距之正规方程與高斯消去；RFE 以標準化係數絕對值反覆移除最小者。
4. 比較 14、18、完整衍生特徵數的 OLS，另提供 Ridge 基準模型；只從 OLS 候選中選最佳，以驗證集 RMSE 決定。
5. `average_playtime` 目標使用 `log1p` 轉換後回歸，再用 `expm1` 還原。
6. 使用校準集殘差絕對值有限樣本分位數建構 95% split conformal 區間，預測下界依非負目標裁切到 0。
7. 最終測試集只做一次評估，不根據測試結果挑選或調整模型。

> 重要限制：欄位語義、評價數與玩家數可能產生時間上的洩漏（若要做真正的上市前預測）；此範例研究的是同一時間截面的關聯。小型 CSV（如 50_Startups）校準集很少，覆蓋率會不穩定，不應當作可靠的統計保證。

## 真實 Steam 資料：模型實驗結果與圖表解讀（2026-10-28）

> 本段是 **GPT 輔助分析內容**。使用 Kaggle [Steam Store Games](https://www.kaggle.com/datasets/nikdavis/steam-store-games) 的 [公開 CSV 鏡像](https://raw.githubusercontent.com/yilinpotato/BigData-App/main/dataset/steam.csv)，並以本專案現有 `core.js` 演算法重新計算，**並非虛構成績、示意數字或改動後的網站結果**。獨立圖表另提供 12 張 PNG 與可列印 PDF，未嵌入或修改網站頁面。

### 實驗設定與計算方法

| 項目 | 實際設定 |
|---|---|
| 原始資料 | 27,075 筆、18 欄 |
| Steam Price | Target = `price`，15 個原始輸入特徵，轉換後 23 維 |
| Steam Playtime | Target = `average_playtime`，14 個原始輸入特徵，轉換後 22 維 |
| 抽樣 | 固定隨機種子 42，12,000 筆 |
| 資料切分 | Train 7,200 / Validation 2,400 / Calibration 1,200 / Test 1,200 |
| 建模 | 多元 OLS、RFE 遞迴特徵消除；Ridge 作比較 |
| 模型選擇 | **只在驗證集**依 RMSE 選擇最佳 OLS；不使用測試集挑模型 |
| 預測區間 | 校準集殘差建構 95% split conformal prediction interval |
| 結果評估 | 最終獨立測試集的 MAE、MSE、RMSE、R² 與預測區間覆蓋率 |

### 結果摘要

| 指標 | Steam 遊戲價格 | Steam 平均遊玩時間 |
|---|---:|---:|
| 最佳 OLS | RFE18 | 全部 22 維 |
| 驗證集 R² | 0.2178 | -0.0251 |
| 驗證集 RMSE | £5.7466 | 1,269.46 分 |
| 測試集 MAE | £4.3755 | 129.97 分 |
| **測試集 RMSE** | **£13.3182** | **800.11 分** |
| **測試集 R²** | **0.0420** | **-0.3423** |
| 95% 區間覆蓋率 | 94.33% | 94.92% |
| 95% 區間半寬 | ±£9.81 | ±398.59 分 |

**說明**：兩種預測目標的單位不同，不應拿 £13.32 與 800 分鐘直接比模型優劣。價格驗證集 R² 0.2178，但測試集只有 0.0420，代表最終泛化表現低於驗證結果。遊玩時間的負 R² 代表測試集平方誤差大於用該測試集均值作常數預測的基準，必須如實報告。

### 為何會有這樣的預測結果？

**價格預測的異常值影響**：完整 Steam 資料售價中位數為 **£3.99**，第 99 百分位為 **£32.99**，最大達 **£421.99**。獨立測試集中有一款售價 £421.99 的遊戲，模型預測約 £5.83，單筆絕對誤差達 **£416.16**。由於 RMSE 對大誤差採平方懲罰，這筆資料大幅影響最終 RMSE。這是一個可以查證的原因，但不能推論「所有誤差都來自這一筆」。

分價格區間觀察，測試集 **£20–50** 的 MAE 約 **£19.13**（38 筆），而 **£2–5** 的 MAE 約 **£2.32**（350 筆），表示模型對較昂貴遊戲有明顯低估現象。售價也取決於品牌與市場策略，這些因素未必能以既有欄位捕捉。

**遊玩時間的零值與長尾分布**：測試集 **920 / 1,200 筆（76.7%）為 0 分鐘**，全資料中位數同樣為 0，原始資料最大值高達 **190,625 分鐘**。獨立測試集中一筆實際 17,954 分鐘的樣本，模型只預測約 14.49 分鐘。極端長尾與大量零值使單一 OLS 模型難以同時掌握常見樣本及極端樣本。不應假設每個 0 分鐘都代表玩家真的未遊玩，必須先釐清 SteamSpy 資料的統計定義與資料品質。

**特徵係數的意義**：價格模型中的 `log_positive_ratings`、`log_owners`、遊玩時間等有較大的標準化係數，但「正負係數」只表示給定其他欄位時的條件相關，不證明因果。部分評價與擁有者資料在遊戲上市後才可觀測，無法直接宣稱這是上市前售價預測。

**預測區間不等於精確預測**：兩題的 95% 覆蓋率都接近 95%，但遊玩時間區間半寬約 ±398.59 分鐘，代表即使覆蓋率足夠，預測區間仍可能非常寬、實用性有限。

### 優化方案：哪些已驗證？哪些只是待測假設？

| 改善方向 | 狀態與證據 | 後續做法 |
|---|---|---|
| 價格 `log1p(price)` 轉換 | **已實測，但未改善**：相同驗證集 RMSE 由 £5.7466 變成 £6.1038 | 不應為了高分直接宣稱 log 轉換有效；可再測不同損失函數 |
| 檢查極端售價 | 尚未正式驗證改善 | 先調查極端值來源；如使用 Winsorize 或限制研究母體，僅依 Train 決定門檻並清楚註明 |
| 確認 0 分鐘的欄位語義 | 尚未正式驗證改善 | 檢查是否為缺失或不完整觀測；不可任意刪除並直接比較分數 |
| 分群預測 | 待驗證 | 分 Free/Paid、不同遊戲類型或發行年份；各群重新留出驗證、測試集 |
| 新特徵工程 | 待驗證 | 檢查評價比例、發行時間、遊戲類型編碼、價格級距；避免使用會洩漏結果的欄位 |
| 更穩健的回歸 | 待驗證 | 保留 OLS 為主模型，比較 Ridge、Lasso、Huber 等，**只用 Validation 選擇** |
| 檢查模型假設 | 待補充正式檢定 | 分析殘差 vs. 擬合值、Q–Q 圖、異質變異、多重共線性、非線性與獨立性 |

**「結果更漂亮」的正確方式**：讓圖表的座標、單位、實際樣本數與誤差來源清晰，加入每個價格區間的 MAE，呈現實驗前後的驗證集比較；不隱藏負 R²、不用 Test 反覆調參，也不把待驗證的方法寫成已經成功。

### 獨立製作的 12 張圖表及建議說明

以下是獨立報告附件中的圖名與其研究目的；**圖表檔案獨立交付，未改動 GitHub Pages 的 UI**。

| 圖號 | 圖表 | 報告可解釋的問題 |
|---|---|---|
| 01 | 價格：驗證集模型 RMSE 比較 | 為何採用 OLS RFE18 |
| 02 | 價格：實際值 vs. 預測值 | 哪些價格範圍偏高估或低估 |
| 03 | 價格：不同價位的 MAE | 高價遊戲與離群值如何影響誤差 |
| 04 | 價格：95% 預測區間 | 估計不確定性與區間寬度 |
| 05 | 價格：主要標準化係數 | 哪些可觀測特徵與價格相關 |
| 06 | 價格：log1p 前後實驗 | 為何不能假設所有目標轉換都有改善 |
| 07 | 遊玩時間：零值分布 | 為何 0 分鐘及長尾特性是挑戰 |
| 08 | 遊玩時間：實際值 vs. 預測值 | 長尾資料、極端值的預測失準 |
| 09 | 遊玩時間：不同時數 MAE | 誤差主要集中在哪些時長 |
| 10 | 兩種模型：95% PI 覆蓋率 | 高覆蓋率是否真的等於高準確度 |
| 11 | 從 CSV 到模型的實作流程圖 | Data Preparation、RFE、Evaluation 與 Deployment 如何銜接 |
| 12 | 模型優化路線圖 | 如何優先改善資料品質、特徵與評估 |

**註**：散佈圖使用從獨立測試集抽選的 **50 筆展示樣本**，不是全部 1,200 筆；整體 R²、RMSE 與覆蓋率均以完整 1,200 筆測試集計算。這些圖表是獨立分析附件，不應誤認為網站直接提供的新增功能。

### CRISP-DM 與結果對應

1. **Business Understanding**：界定價格（英鎊）與遊玩時間（分鐘）的研究問題，說明不是即時售價或上市前預測。
2. **Data Understanding**：27,075 筆歷史 Steam 資料、特徵數與零值／長尾分布。
3. **Data Preparation**：處理非數值欄位、衍生特徵、固定種子切分、訓練集補值。
4. **Modeling**：OLS + RFE 與 Ridge 比較，以驗證 RMSE 選模型。
5. **Evaluation**：獨立 Test 的 MAE、RMSE、R²、殘差與 95% PI，分析極端值造成的誤差。
6. **Deployment**：GitHub Pages 可直接選兩種 Problem、貼上 CSV、即時訓練與手動輸入特徵預測。

## 文件與誠信說明

- **GPT 輔助內容**：系統設計、前端網站、回歸程式及 UI 由 ChatGPT 協助撰寫；實際數字以網站讀入資料後動態計算為準。
- **NotebookLM 摘要**：需實際使用 NotebookLM 研究來源並撰寫至少 100 字後才加入，未實際使用不可聲稱已完成。
- GPT 對話 PDF 與報告在最新作業說明中屬 optional，但 AI 使用說明段仍載明 NotebookLM 要求，建議正式繳交前向老師確認或補上。

## 檔案

```text
hw2/
├── index.html   # UI 和 CRISP-DM 六階段
├── style.css    # 響應式視覺設計
├── app.js       # CSV 載入、圖表與互動
├── core.js      # CSV/特徵工程/OLS/RFE/評估/預測區間
└── README.md    # 研究流程、資料來源、使用與部署
```

## 引用

- Kaggle: Steam Store Games (nikdavis), https://www.kaggle.com/datasets/nikdavis/steam-store-games
- GitHub mirror: yilinpotato/BigData-App, https://github.com/yilinpotato/BigData-App
- Custom CSV example: Avik-Jain/100-Days-Of-ML-Code, https://github.com/Avik-Jain/100-Days-Of-ML-Code
