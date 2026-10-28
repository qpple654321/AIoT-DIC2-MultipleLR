/* NCHU HW2 — zero-dependency CSV / linear regression engine.
 * License: MIT. All data splits and feature selection operate on TRAIN only.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HW2Core = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';
  const STEAM_URL = 'https://raw.githubusercontent.com/yilinpotato/BigData-App/main/dataset/steam.csv';
  const STARTUPS_URL = 'https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv';
  const STEAM_COLUMNS = ['appid','name','release_date','english','developer','publisher','platforms','required_age','categories','genres','steamspy_tags','achievements','positive_ratings','negative_ratings','average_playtime','median_playtime','owners','price'];
  function parseCSV(text) {
    if (typeof text !== 'string' || !text.trim()) throw Error('CSV 內容為空');
    text = text.replace(/^\uFEFF/, '');
    const rows = []; let cell = '', row = [], quoted = false;
    for (let i=0;i<text.length;i++) {
      const ch=text[i];
      if (ch==='"') { if (quoted && text[i+1]==='"') {cell+='"'; i++;} else quoted=!quoted; }
      else if (ch===',' && !quoted) { row.push(cell);cell=''; }
      else if ((ch==='\n'||ch==='\r') && !quoted) {
        if (ch==='\r'&&text[i+1]==='\n') i++;
        row.push(cell);cell='';
        if (row.some(v=>v!=='')) rows.push(row);
        row=[];
      } else cell+=ch;
    }
    if (quoted) throw Error('CSV 引號不成對，請確認檔案格式');
    if (cell || row.length) {row.push(cell); if (row.some(v=>v!==''))rows.push(row);}
    if(rows.length<2)throw Error('CSV 沒有有效資料列');
    const cols=rows[0].map((s,i)=>s.trim() || `column_${i+1}`);
    const body=rows.slice(1).map(c=>Object.fromEntries(cols.map((h,i)=>[h,c[i]??''])));
    return {columns:cols,rows:body};
  }
  function num(v) {if (v===null || v===undefined || String(v).trim()==='')return NaN;const n=Number(String(v).replace(/,/g,'').trim());return Number.isFinite(n)?n:NaN;}
  function cleanNum(v, def=0) {const n=num(v);return Number.isFinite(n)?n:def;}
  function countParts(s) {return String(s||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean).length;}
  function ownsMid(s) {const a=String(s||'').match(/[\d,]+/g);if(!a||!a.length)return 0;const vals=a.map(x=>Number(x.replace(/,/g,'')));return vals.reduce((x,y)=>x+y,0)/vals.length;}
  function isYes(s) {return /^(1|true|yes)$/i.test(String(s||'').trim())?1:0;}
  function has(s, word){return String(s||'').toLowerCase().split(/[;,]/).some(v=>v.trim()===word.toLowerCase())?1:0;}
  function steamVector(row, problem) {
    const g=String(row.genres||'');const c=String(row.categories||'');const p=String(row.platforms||'');
    const vec={
      release_year: cleanNum(String(row.release_date||'').slice(0,4),2010),
      english: isYes(row.english),
      developer_count: countParts(row.developer), publisher_count:countParts(row.publisher),
      platform_windows:has(p,'windows'),platform_mac:has(p,'mac'),platform_linux:has(p,'linux'),
      required_age:cleanNum(row.required_age),
      categories_count:countParts(c),category_multiplayer:Number(/multi-player/i.test(c)),
      genres_count:countParts(g),genre_action:has(g,'Action'),genre_indie:has(g,'Indie'),
      genre_rpg:has(g,'RPG'),genre_strategy:has(g,'Strategy'),genre_simulation:has(g,'Simulation'),
      tags_count:countParts(row.steamspy_tags),achievements:Math.log1p(Math.max(0,cleanNum(row.achievements))),
      log_positive_ratings:Math.log1p(Math.max(0,cleanNum(row.positive_ratings))),
      log_negative_ratings:Math.log1p(Math.max(0,cleanNum(row.negative_ratings))),
      log_owners:Math.log1p(Math.max(0,ownsMid(row.owners)))
    };
    if(problem==='price'){
      vec.log_average_playtime=Math.log1p(Math.max(0,cleanNum(row.average_playtime)));
      vec.log_median_playtime=Math.log1p(Math.max(0,cleanNum(row.median_playtime)));
    } else {
      vec.price=cleanNum(row.price);
    }
    return vec;
  }
  function makeSteamDataset(parsed, problem){
    const missing=STEAM_COLUMNS.filter(c=>!parsed.columns.includes(c));
    if(missing.length)throw Error(`Steam CSV 缺少欄位：${missing.join(', ')}`);
    const target=problem==='price'?'price':'average_playtime';
    const rawFeatureCount=problem==='price'?15:14;
    const entries=[];
    for(const r of parsed.rows){
      const y=num(r[target]);if(!Number.isFinite(y)||y<0)continue;
      entries.push({x:steamVector(r,problem), y, name:r.name||String(r.appid||'')});
    }
    if(entries.length<80) throw Error('有效的 Steam 資料不足 80 筆');
    return {label:problem==='price'?'Steam 遊戲價格預測':'Steam 平均遊玩時間預測',target,unit:problem==='price'?'英鎊 (£)':'分鐘',rawFeatureCount,featureNames:Object.keys(entries[0].x),entries,originalRows:parsed.rows.length,source:STEAM_URL,kaggle:'https://www.kaggle.com/datasets/nikdavis/steam-store-games',problem};
  }
  function inferColumns(parsed){
    const all=parsed.columns; const rows=parsed.rows.slice(0,Math.min(500,parsed.rows.length));
    return all.map(name=>{
      const observed=rows.map(r=>String(r[name]??'').trim()).filter(Boolean);
      const numericRate=observed.length?observed.filter(s=>Number.isFinite(num(s))).length/observed.length:0;
      const unique=[...new Set(observed)];
      return {name,type:numericRate>=0.85?'numeric':'category',unique:unique.length,filled:observed.length};
    });
  }
  function makeGenericDataset(parsed,target){
    if(!parsed.columns.includes(target))throw Error('請選擇 CSV 中存在的目標欄位');
    const desc=inferColumns(parsed);const chosen=[];
    // Global_Sales is approximately the sum of four regional sales fields.
    // Never include those components as predictors for the sales demo.
    const leakColumns=target.toLowerCase()==='global_sales'?new Set(['na_sales','eu_sales','jp_sales','other_sales']):new Set();
    for(const d of desc){
      if(d.name===target || leakColumns.has(d.name.toLowerCase()) || /^(id|index|name|title|url|url_.*|.*_id)$/i.test(d.name))continue;
      if(d.type==='numeric')chosen.push({column:d.name,type:'numeric'});
      else if(d.unique>=2 && d.unique<=8 && d.filled>=Math.min(parsed.rows.length,10)) {
        const vs=[...new Set(parsed.rows.map(r=>String(r[d.name]??'').trim()).filter(Boolean))].sort().slice(1);
        for(const v of vs)chosen.push({column:d.name,type:'category',value:v});
      }
      if(chosen.length>=38)break;
    }
    if(!chosen.length)throw Error('找不到可供回歸的有效特徵。請選擇含數值/低基數類別特徵的資料。');
    const features=chosen.map(x=>x.type==='numeric'?x.column:`${x.column}=${x.value}`);
    const entries=[];
    for(const r of parsed.rows){const y=num(r[target]);if(!Number.isFinite(y))continue;
      const x={};for(let i=0;i<chosen.length;i++){
        const f=chosen[i];x[features[i]]=f.type==='numeric'?num(r[f.column]):Number(String(r[f.column]??'').trim()===f.value);
      }
      entries.push({x,y,name:String(r.name||r.Name||'row '+(entries.length+1))});
    }
    if(entries.length<30)throw Error('有效資料不足 30 筆；目前至少需 30 筆才能執行四組資料切分。');
    return {label:`自訂 CSV：預測 ${target}`,target,unit:'原始目標單位',rawFeatureCount:new Set(chosen.map(x=>x.column)).size,featureNames:features,entries,originalRows:parsed.rows.length,source:'使用者指定 CSV',kaggle:null,problem:'custom'};
  }
  function rand(seed=42){let s=seed>>>0;return ()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;};}
  function shuffledIndex(n, seed=42) {const v=Array.from({length:n},(_,i)=>i),rng=rand(seed);for(let i=n-1;i>0;i--){const j=Math.floor(rng()*(i+1));[v[i],v[j]]=[v[j],v[i]];}return v;}
  function splitData(entries, maxRows=12000){
    let indices=shuffledIndex(entries.length,42);
    const used=Math.min(entries.length,maxRows);
    indices=indices.slice(0,used);
    const nTrain=Math.floor(used*.6),nVal=Math.floor(used*.2),nCal=Math.floor(used*.1);
    return {train:indices.slice(0,nTrain),validation:indices.slice(nTrain,nTrain+nVal),calibration:indices.slice(nTrain+nVal,nTrain+nVal+nCal),test:indices.slice(nTrain+nVal+nCal),sampled:used};
  }
  function fitImputer(dataset, trainIndices){
    const specs={};
    for(const f of dataset.featureNames){
      const vals=trainIndices.map(i=>dataset.entries[i].x[f]).filter(Number.isFinite).sort((a,b)=>a-b);
      const median=vals.length?vals[Math.floor(vals.length/2)]:0;
      specs[f]=median;
    }
    return specs;
  }
  function applyImputer(dataset,fill){
    for(const e of dataset.entries)for(const f of dataset.featureNames)if(!Number.isFinite(e.x[f]))e.x[f]=fill[f];
  }
  function solve(A,b){
    const n=b.length, a=A.map((row,i)=>row.concat(b[i]));
    for(let j=0;j<n;j++){
      let k=j;for(let i=j+1;i<n;i++)if(Math.abs(a[i][j])>Math.abs(a[k][j]))k=i;
      if(k!==j)[a[k],a[j]]=[a[j],a[k]];
      if(Math.abs(a[j][j])<1e-12)a[j][j]=1e-12;
      const div=a[j][j];for(let t=j;t<=n;t++)a[j][t]/=div;
      for(let i=0;i<n;i++){if(i===j)continue;const w=a[i][j];if(!w)continue;for(let t=j;t<=n;t++)a[i][t]-=w*a[j][t];}
    }
    return a.map(r=>r[n]);
  }
  function fitLinear(dataset,idx,selected,alpha=0,targetTransform='identity'){
    const n=idx.length, d=selected.length, means=[], scales=[], y=[];
    if(n<=d+1)throw Error('訓練資料筆數不足以支援選取的特徵數量');
    for(const f of selected){let sum=0;for(const i of idx)sum+=dataset.entries[i].x[f];const m=sum/n;means.push(m);let ss=0;for(const i of idx){const t=dataset.entries[i].x[f]-m;ss+=t*t;}scales.push(Math.sqrt(ss/n)||1);}
    let ym=0;for(const i of idx){const v=dataset.entries[i].y;y.push(targetTransform==='log1p'?Math.log1p(Math.max(0,v)):v);ym+=y[y.length-1];}ym/=n;
    const A=Array.from({length:d},()=>Array(d).fill(0)),b=Array(d).fill(0);
    for(let t=0;t<n;t++){
      const x=selected.map((f,j)=>(dataset.entries[idx[t]].x[f]-means[j])/scales[j]);
      for(let j=0;j<d;j++){b[j]+=x[j]*(y[t]-ym);for(let k=0;k<=j;k++)A[j][k]+=x[j]*x[k];}
    }
    for(let j=0;j<d;j++){for(let k=0;k<j;k++)A[k][j]=A[j][k];A[j][j]+=alpha*n+1e-7;}
    const coefficients=solve(A,b);
    return {features:selected,means,scales,coefficients,intercept:ym,alpha,targetTransform,nonnegative:dataset.problem!=='custom'};
  }
  function predictModel(model,x){
    let z=model.intercept;model.features.forEach((f,j)=>z+=model.coefficients[j]*(x[f]-model.means[j])/model.scales[j]);
    const y=model.targetTransform==='log1p'?Math.expm1(Math.min(20,z)):z;
    return Number.isFinite(y)?(model.nonnegative?Math.max(0,y):y):NaN;
  }
  function evaluate(dataset,indices,model){
    const real=indices.map(i=>dataset.entries[i].y),pred=indices.map(i=>predictModel(model,dataset.entries[i].x));
    const n=real.length, mean=real.reduce((a,b)=>a+b,0)/n;
    let ae=0,se=0,ss=0;
    for(let i=0;i<n;i++){ae+=Math.abs(real[i]-pred[i]);se+=(real[i]-pred[i])**2;ss+=(real[i]-mean)**2;}
    const mse=se/n,r2=ss===0?(se===0?1:0):1-se/ss,p=model.features.length;
    return {MAE:ae/n,MSE:mse,RMSE:Math.sqrt(mse),R2:r2,Adjusted_R2:n>p+1?1-(1-r2)*(n-1)/(n-p-1):null,real,pred,n};
  }
  function rfe(dataset,train,desired,transform){
    let chosen=[...dataset.featureNames];
    while(chosen.length>desired){
      const model=fitLinear(dataset,train,chosen,0,transform);
      const ranking=chosen.map((f,i)=>({f,importance:Math.abs(model.coefficients[i])})).sort((a,b)=>a.importance-b.importance);
      const drop=ranking[0].f;chosen=chosen.filter(f=>f!==drop);
    }
    return chosen;
  }
  function conformal(model,dataset,indices,level=.95){
    const errors=indices.map(i=>Math.abs(dataset.entries[i].y-predictModel(model,dataset.entries[i].x))).sort((a,b)=>a-b);
    const rank=Math.ceil((errors.length+1)*level),q=errors[Math.min(errors.length-1,Math.max(0,rank-1))];return q;
  }
  function train(dataset,onProgress=()=>{}){
    const parts=splitData(dataset.entries);if(parts.train.length<15)throw Error('有效資料不足以分配訓練/驗證/校準/測試集');
    const fill=fitImputer(dataset,parts.train);applyImputer(dataset,fill);
    const d=dataset.featureNames.length;
    if(d<1)throw Error('沒有可用的特徵');
    const transform=dataset.problem==='playtime'?'log1p':'identity';
    const targets=[14,18,d].filter((x,i,a)=>x<=d&&a.indexOf(x)===i).sort((a,b)=>a-b);
    if(!targets.includes(d))targets.push(d);
    const comparisons=[],models=[];
    for(const [j,k] of targets.entries()){
      onProgress(`RFE 特徵選擇：${k}/${d}`);
      const cols=k===d?[...dataset.featureNames]:rfe(dataset,parts.train,k,transform);
      const model=fitLinear(dataset,parts.train,cols,0,transform),val=evaluate(dataset,parts.validation,model);
      const name=k===d?'LinearRegression_All':`LinearRegression_RFE${k}`;
      comparisons.push({name,features:cols.length,MAE:val.MAE,MSE:val.MSE,RMSE:val.RMSE,R2:val.R2,Adjusted_R2:val.Adjusted_R2});models.push({name,model,val});
    }
    onProgress('Ridge 作為基準模型比較');
    const ridge=fitLinear(dataset,parts.train,dataset.featureNames,0.02,transform),rv=evaluate(dataset,parts.validation,ridge);
    comparisons.push({name:'Ridge_Comparison',features:d,MAE:rv.MAE,MSE:rv.MSE,RMSE:rv.RMSE,R2:rv.R2,Adjusted_R2:rv.Adjusted_R2});
    models.sort((a,b)=>a.val.RMSE-b.val.RMSE);
    const best=models[0],test=evaluate(dataset,parts.test,best.model), q=conformal(best.model,dataset,parts.calibration);
    const coverage=test.pred.filter((x,i)=>Math.abs(test.real[i]-x)<=q).length/test.n;
    const coeff=best.model.features.map((f,i)=>({feature:f,coefficient:best.model.coefficients[i],importance:Math.abs(best.model.coefficients[i])})).sort((a,b)=>b.importance-a.importance);
    const subset=shuffledIndex(test.n,13).slice(0,Math.min(420,test.n)).map(i=>({actual:test.real[i],predicted:test.pred[i],lo:dataset.problem==='custom'?test.pred[i]-q:Math.max(0,test.pred[i]-q),hi:test.pred[i]+q,residual:test.real[i]-test.pred[i]}));
    const summary={
      label:dataset.label,problem:dataset.problem,target:dataset.target,unit:dataset.unit,source:dataset.source,
      kaggle:dataset.kaggle,originalRows:dataset.originalRows,validRows:dataset.entries.length,
      rawFeatureCount:dataset.rawFeatureCount,encodedFeatureCount:d,
      sampleCount:parts.sampled,counts:{train:parts.train.length,validation:parts.validation.length,calibration:parts.calibration.length,test:parts.test.length},
      bestName:best.name,model:best.model,fill,comparisons,metrics:{MAE:test.MAE,MSE:test.MSE,RMSE:test.RMSE,R2:test.R2,Adjusted_R2:test.Adjusted_R2},
      q,coverage,coefficients:coeff,scatter:subset,selectionMethod:'RFE on training only; choose by validation RMSE; test untouched',
      transform,seed:42,
      warning:dataset.rawFeatureCount<14?'此資料集原始特徵少於 14，僅可作為加分功能展示，不符合主要 Kaggle 題目要求。':(parts.test.length<30?'測試集筆數較少，指標與預測區間覆蓋率的變動可能較大。':null),
      note:'線性模型是描述性關聯，並非因果推斷；Steam 2019 歷史資料不代表即時價格。'
    };
    return summary;
  }
  return {parseCSV,makeSteamDataset,makeGenericDataset,inferColumns,train,predictModel,STEAM_URL,STARTUPS_URL,STEAM_COLUMNS,splitData,fitLinear,evaluate,conformal,solve,rfe};
});
