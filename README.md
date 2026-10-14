# AIoT DIC2 — Multiple Linear Regression Dashboard

國立中興大學 AIoT & Data Analytics 課程 DIC2 作業。

本專案實作 **Multiple Linear Regression（多元線性回歸）**，同一個 GitHub Pages 網站支援兩個指定題目：

1. **50 Startups** — 預測 `Profit`
2. **Boston Housing** — 預測 `MEDV`

另外加入自訂 Dataset URL / CSV 上傳功能，可以載入其他表格資料並自行選擇 Target 與 Features。

## Student

- 姓名：陳浩忻
- 學號：5115056032
- GitHub：`qpple654321`

## Assignment Requirements

### 基本題目
- 50 Startups Multiple Linear Regression
- Boston Housing Multiple Linear Regression

### 加分功能
- Problem 下拉選單，可切換 50 Startups / Boston Housing
- 可輸入任意公開 CSV Dataset URL
- 可上傳本機 CSV
- Target column 自選
- Feature columns 自選

## Default Datasets

### 50 Startups
`https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv`

預設 Target：`Profit`

預設 Features：R&D Spend、Administration、Marketing Spend、State。
`State` 會自動做 dummy / one-hot encoding。

### Boston Housing
`https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv`

預設 Target：`medv`，其餘數值欄位作為 Features。

## Model Workflow

```text
CSV Dataset
    ↓
Parse / Clean
    ↓
Select Target & Features
    ↓
Categorical → Dummy Encoding
    ↓
Seeded 80/20 Train-Test Split
    ↓
Feature Standardization
    ↓
Ordinary Least Squares
β = (XᵀX)⁻¹Xᵀy
    ↓
R² / RMSE / MAE / Coefficients / Residuals
```

## Features

- Client-side Multiple Linear Regression
- 80/20 train-test split（固定 seed = 42）
- Ordinary Least Squares
- Categorical dummy encoding
- R² Score / RMSE / MAE
- Regression coefficient ranking
- Actual vs Predicted scatter plot
- Residual plot
- Dataset preview
- Custom CSV URL
- Local CSV upload
- Responsive dashboard
- 不需要後端與 API key

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Papa Parse
- Chart.js
- GitHub Pages

## Run Locally

```bash
python -m http.server 8000
```

開啟 `http://localhost:8000`。

## GitHub Pages

到 `Settings → Pages → Build and deployment → Source → GitHub Actions`。
本專案已附上 `.github/workflows/pages.yml`。

## Notes

任意 Dataset URL 受瀏覽器 CORS 政策影響。若來源不允許跨來源讀取，可先下載 CSV，再使用頁面內的 CSV 上傳功能。
