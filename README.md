# DIC2 · 多元線性回歸與特徵選擇分析

國立中興大學 **AIoT & Data Analytics** 課程 DIC2 作業。

本專案以 **Multiple Linear Regression（多元線性回歸）** 為核心，完成 **50 Startups** 與 **Boston Housing** 兩個資料集的分析，並加入五種 Feature Selection 方法比較、互動式模型結果、Live Prediction、Residual Analysis 與 Data Analytics Dashboard。

## Student

- 姓名：陳浩忻
- 學號：5115056032
- GitHub：`qpple654321`

## Live Demo

- **GitHub Pages**：https://qpple654321.github.io/AIoT-DIC2-MultipleLR/
- **GitHub Repository**：https://github.com/qpple654321/AIoT-DIC2-MultipleLR

## Assignment Topics

### 1. 50 Startups

以 `R&D Spend`、`Administration`、`Marketing Spend` 與 `State` 預測 `Profit`。

Feature Selection 方法：

1. Lasso（L1 Ranking）
2. Forward SFS
3. RFE
4. ElasticNet
5. Exhaustive Search

每一種方法皆可切換 `k = 1 ~ 5` 個特徵，並呈現：

- RMSE
- MAE
- R²
- Adjusted R²
- Selected Features
- Regression Equation
- Regression Coefficients
- Standard Error
- t-statistic
- p-value
- 95% Confidence Interval
- VIF
- Prediction / Residual Results
- Best model of each scheme
- All 25 feature-selection results
- Approx. 95% prediction range

### 2. Boston Housing

以 Boston Housing 數值特徵預測 `MEDV`，並建立 OLS Multiple Linear Regression baseline model。

網站亦保留 **Custom Dataset URL** 功能，可輸入其他公開 CSV URL 執行 OLS baseline analysis。

## Interactive Functions

### 模型比較 / Model Comparison

- 五種 Feature Selection 方法切換
- `k = 1 ~ 5` Feature Count 切換
- RMSE / R² Performance Curves
- KPI 指標
- Key Findings / Model Selection Summary
- Best Model of Each Scheme
- Startup Profit Live Predictor
- Approx. 95% prediction range
- Test-set Predictions / Residuals

### 特徵分析 / Feature Analysis

- Selected Feature Combination
- Fitted OLS Equation
- Regression Coefficients
- Standard Error
- t-statistic
- p-value
- 95% Confidence Interval
- VIF
- All 25 Feature Combinations

### 方法說明 / Methodology

- Lasso
- Forward SFS
- RFE
- ElasticNet
- Exhaustive Search
- CRISP-DM Experiment Flow
- Experiment Limitations / Validation Notes

## Additional UI Features

- 深色 Data Analytics Workbench 介面
- Light / Dark Theme 切換
- Responsive Layout
- URL Query Parameter 支援

例如可直接開啟指定方法、k 與分析頁面：

```text
?scheme=RFE&k=2&tab=features
```

## Dataset Sources

### 50 Startups

```text
https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv
```

### Boston Housing

```text
https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv
```

> Custom Dataset URL 受瀏覽器 CORS Policy 影響，來源需允許跨來源存取。

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

## Interpretation Notes

- RMSE / MAE 越低，代表預測誤差越小。
- R² 越接近 1，代表模型解釋能力越高。
- VIF 可用於觀察多重共線性。
- Feature Selection 的目的在於找出較具預測價值的特徵組合，不代表因果關係。
- 50 Startups 僅有 50 筆資料，test set 與不同資料切分下的結果可能有較大波動。
- 網站顯示的 Approx. 95% prediction range 以目前模型 RMSE × 1.96 做直觀近似，不等同完整 OLS prediction interval。

## Implementation Note

50 Startups 五種 Feature Selection 的統計模型資料採用課程公開 reference implementation 的結果；本專案重新實作：

- 前端互動
- Data Analytics Dashboard
- 方法 / k 切換
- KPI 與圖表
- Key Findings
- Live Predictor
- Approx. 95% prediction range
- URL Query Navigation
- Theme Switcher
- Boston Housing OLS baseline
- Custom Dataset URL workflow

因此網站主要用途為整理、比較與互動呈現 Multiple Linear Regression / Feature Selection 的分析成果。

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js
- Papa Parse
- GitHub Pages
- GitHub Actions

## Deployment

本專案使用 GitHub Actions 自動部署至 GitHub Pages。

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

## References

本作業功能架構參考課程示範與同學公開展示成果，再依作業需求重新整理為自己的 Data Analytics Workbench。

- Course Reference：https://huanchen1107.github.io/AIoT-DIC2-MultipleLR/
- Feature Selection Example：https://yotsubamomo.github.io/aiot-classwork/week06/
