# DIC2 · 多元線性回歸與特徵選擇分析

國立中興大學 **AIoT & Data Analytics** 課程 DIC2 作業。

本專案以 **Multiple Linear Regression（多元線性回歸）** 為核心，完成 50 Startups 與 Boston Housing 兩個資料集的分析，並加入五種 Feature Selection 方法比較與互動式資料分析介面。

## Student

- 姓名：陳浩忻
- 學號：5115056032
- GitHub：`qpple654321`

## Live Demo

- GitHub Pages：https://qpple654321.github.io/AIoT-DIC2-MultipleLR/
- GitHub Repository：https://github.com/qpple654321/AIoT-DIC2-MultipleLR

## Assignment Topics

### 1. 50 Startups

以 `R&D Spend`、`Administration`、`Marketing Spend` 與 `State` 預測 `Profit`。

除了 Multiple Linear Regression 外，加入以下五種 Feature Selection 方法進行比較：

1. Lasso（L1 Ranking）
2. Forward SFS
3. RFE
4. ElasticNet
5. Exhaustive Search

每一種方法皆可切換 `k = 1 ~ 5` 個特徵，並比較：

- RMSE
- MAE
- R²
- Adjusted R²
- Selected Features
- Regression Coefficients
- p-value
- 95% Confidence Interval
- VIF
- Prediction / Residual Results

### 2. Boston Housing

使用 Boston Housing 數值特徵預測 `MEDV`，並以 OLS Multiple Linear Regression 建立 baseline model。

## Main Functions

網站提供三個主要分析頁面：

### 模型比較

- 五種 Feature Selection 方法切換
- `k = 1 ~ 5` 特徵數切換
- RMSE / R² Performance Curves
- KPI 指標
- Best Model of Each Scheme
- Startup Profit Live Predictor
- Test-set Predictions / Residuals

### 特徵分析

- Selected Feature Combination
- Fitted OLS Equation
- Regression Coefficients
- Standard Error
- t-statistic
- p-value
- 95% Confidence Interval
- VIF
- All 25 Feature Combinations

### 方法說明

- Lasso
- Forward SFS
- RFE
- ElasticNet
- Exhaustive Search
- CRISP-DM Experiment Flow

## Dataset Support

內建兩組作業資料：

### 50 Startups

```text
https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv
```

### Boston Housing

```text
https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv
```

另外保留 **Custom Dataset URL** 功能，可輸入公開 CSV URL 執行 OLS baseline analysis。

> 注意：公開 Dataset URL 仍受瀏覽器 CORS Policy 影響。

## Model Workflow

```text
Dataset
   ↓
Data Understanding / Cleaning
   ↓
Feature Selection
   ↓
Lasso / Forward SFS / RFE / ElasticNet / Exhaustive Search
   ↓
k = 1 ~ 5 Feature Subsets
   ↓
OLS Multiple Linear Regression Refit
   ↓
RMSE / MAE / R² / Adjusted R²
   ↓
Coefficients / p-value / CI / VIF / Residual Analysis
```

OLS 核心公式：

```text
β = (XᵀX)⁻¹Xᵀy
```

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js
- Papa Parse
- GitHub Pages
- GitHub Actions

## UI Design

前端以 **Data Analytics Workbench** 為設計方向，採深色科技風介面，並將分析內容分為：

- Model Comparison
- Feature Analysis
- Methodology

讓模型指標、圖表、特徵組合與統計檢定結果可以在同一個網站中快速切換查看。

## Deployment

本專案使用 GitHub Actions 自動部署至 GitHub Pages。

Workflow：

```text
.github/workflows/pages.yml
```

每次更新 `main` branch 後會自動重新部署。

## Run Locally

```bash
python -m http.server 8000
```

瀏覽器開啟：

```text
http://localhost:8000
```

## Reference

本作業實作與介面設計參考課程範例與課堂同學展示方式，並重新整理為自己的 Data Analytics Dashboard。

50 Startups 五種 Feature Selection 的公開統計模型資料採用課程 reference implementation，前端互動、資料呈現、頁面架構以及 Boston Housing / Custom Dataset OLS 流程皆重新實作。
