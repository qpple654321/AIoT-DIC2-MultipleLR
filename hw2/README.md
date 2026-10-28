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
