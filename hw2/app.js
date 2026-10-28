/* Steam Insights — browser-side analysis & SVG presentation; no data leaves the browser. */
(()=>{'use strict';
const $=id=>document.getElementById(id), C=window.HW2Core;
const state={parsed:null,dataset:null,result:null,mode:'price',filename:null,userFeatures:{},preferredTarget:null};
const PRESETS={
 'steam-price':{mode:'price',url:C.STEAM_URL,target:'price'},
 'steam-playtime':{mode:'playtime',url:C.STEAM_URL,target:'average_playtime'},
 'game-sales':{mode:'custom',url:'https://raw.githubusercontent.com/stephenbeese/Video-Game-Sales-Analysis/main/data/raw/video_game_sales.csv',target:'Global_Sales'},
 'startups':{mode:'custom',url:C.STARTUPS_URL,target:'Profit'}
};
function setActivePreset(value){
 document.querySelectorAll('[data-preset]').forEach(button=>{
  const active=button.dataset.preset===value;
  button.classList.toggle('is-active',active);
  button.setAttribute('aria-pressed',String(active));
 });
}
async function usePreset(name){
 const preset=PRESETS[name];if(!preset)return;
 $('problem-select').value=preset.mode;
 showProblem();
 state.preferredTarget=preset.target;
 if(preset.mode==='custom')$('custom-url').value=preset.url;
 else $('steam-url').value=preset.url;
 setActivePreset(name);
 await loadData();
 if(state.dataset)await train();
}

const comma=n=>Number(n).toLocaleString('en-US');
const fmt=(n,d=3)=>!Number.isFinite(Number(n))?'—':Number(n).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const short=n=>!Number.isFinite(n)?'—':Math.abs(n)>=1000000?`${(n/1000000).toFixed(1)}m`:Math.abs(n)>=10000?`${(n/1000).toFixed(1)}k`:Math.abs(n)>=100?Math.round(n).toLocaleString():Math.abs(n)>=1?n.toFixed(2):n.toFixed(3);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function status(msg,mode='idle'){ $('status-text').textContent=msg; $('status-dot').parentNode.className='status '+mode;}
function showProblem(){state.mode=$('problem-select').value;state.parsed=null;state.dataset=null;state.result=null;state.filename=null;state.preferredTarget=null;setActivePreset(null);
 $('steam-settings').hidden=state.mode==='custom';$('custom-settings').hidden=state.mode!=='custom';$('data-info').hidden=true;$('train-btn').disabled=true;$('upload-file').value='';hideResults();
 const p=state.mode==='price',c=state.mode==='custom';
 $('problem-title').innerHTML=c?'用你的資料，<br>建立自己的預測模型。':p?'一款遊戲的售價，<br>能從哪些條件推測？':'玩家會玩多久，<br>哪些遊戲特徵有關？';
 $('problem-desc').textContent=c?'貼上任意公開 CSV 網址或上傳本機資料，選擇數值 Target，立即進行多元線性回歸。':p?'透過發行時間、遊戲類型、平台、成就及玩家行為等資訊，以多元線性回歸預測 Steam 遊戲價格。':'根據遊戲價格、類型、平台與市場特徵，探索 Steam 遊戲平均遊玩時間的統計關聯。';
 status('尚未載入資料集');}
function hideResults(){ $('empty-results').hidden=false;$('results-content').hidden=true;$('predict-empty').hidden=false;$('predict-content').hidden=true;['metric-r2','metric-rmse','metric-coverage'].forEach(k=>$(k).textContent='—');}
async function loadData(){
 try{
  const mode=state.mode,file=$('upload-file').files[0];let content,url;
  state.parsed=null;state.dataset=null;state.result=null;$('data-info').hidden=true;hideResults();
  $('load-btn').disabled=true;$('train-btn').disabled=true;status('正在載入 CSV 資料…','busy');await new Promise(r=>setTimeout(r,32));
  if(file){if(file.size>30e6)throw Error('目前瀏覽器示範限制 CSV 檔案 30 MB 以下');content=await file.text();url=`本機上傳：${file.name}`;}
  else {url=mode==='custom'?$('custom-url').value.trim():$('steam-url').value.trim();if(!/^https?:\/\//i.test(url))throw Error('請輸入有效的 http(s) CSV URL，或上傳 CSV 檔案');
   const timeout=new AbortController(),tid=setTimeout(()=>timeout.abort(),30000);let resp;
   try{resp=await fetch(url,{signal:timeout.signal,cache:'default'});}catch(err){throw Error(`無法從網址載入 CSV（${err.name==='AbortError'?'連線逾時':'來源可能限制跨網域 CORS'}）。請改用本機 CSV 上傳。`);}finally{clearTimeout(tid);}
   if(!resp.ok)throw Error(`下載失敗：HTTP ${resp.status}；請確認 URL 指向原始 CSV`);content=await resp.text();if(content.length>35e6)throw Error('遠端 CSV 過大，請使用 30 MB 以下檔案');
  }
  const parsed=C.parseCSV(content);state.parsed=parsed;state.filename=url;
  if(mode==='custom'){
   const cols=C.inferColumns(parsed).filter(x=>x.type==='numeric');const select=$('target-select');select.innerHTML='<option value="">請選擇數值預測目標</option>'+cols.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');select.disabled=false;
   const preferred=[state.preferredTarget,'Global_Sales','Profit','profit','SalePrice','price','sales','target','y'].find(v=>v&&cols.some(c=>c.name===v));select.value=preferred||'';
   if(!select.value&&cols.length===1)select.value=cols[0].name;
   if(!cols.length)throw Error('找不到連續數值的 Target 欄位，無法執行回歸');
  }
  setDataset();
  if(mode==='custom'&&!$('target-select').value)status(`已載入 ${comma(parsed.rows.length)} 筆，請先選擇目標欄位`,'ok');else status(`已載入 ${comma(parsed.rows.length)} 筆真實資料，可以開始訓練`,'ok');
 }catch(err){status(err.message,'error');console.error(err);}finally{$('load-btn').disabled=false;}
}
function setDataset(){if(!state.parsed)return;try{
 state.dataset=state.mode==='custom'?($('target-select').value?C.makeGenericDataset(state.parsed,$('target-select').value):null):C.makeSteamDataset(state.parsed,state.mode);
 $('train-btn').disabled=!state.dataset;
 if(state.dataset){const d=state.dataset; $('data-info').hidden=false;$('data-rows').textContent=comma(d.entries.length);$('data-features').textContent=d.rawFeatureCount+' 個原始';$('data-target').textContent=d.target;const ys=d.entries.map(e=>e.y);$('data-mean').textContent=fmt(ys.reduce((a,b)=>a+b,0)/ys.length,2);$('data-missing').textContent=state.parsed.columns.filter(k=>state.parsed.rows.some(r=>String(r[k]??'').trim()==='')).length+' 欄';}
 if(state.mode==='custom'){
   const warn=state.dataset&&state.dataset.rawFeatureCount<14;
   $('custom-warning').hidden=!warn;
   $('custom-warning').textContent=warn?'這份資料原始特徵不足 14 個，只作為加分功能示範，不計為主要 Kaggle 題目。':'';
 }
 }catch(err){state.dataset=null;$('train-btn').disabled=true;status(err.message,'error');}}
async function train(){if(!state.dataset)return;$('train-btn').disabled=true;$('load-btn').disabled=true;status('正在執行模型訓練與 RFE…','busy');
 await new Promise(r=>setTimeout(r,80));
 try{const result=C.train(state.dataset,msg=>status(msg+'…','busy'));result.source=state.filename;state.result=result;render(result);status(`模型訓練完成｜${result.bestName}｜R² ${fmt(result.metrics.R2,4)}`,'ok');}
 catch(err){status('訓練失敗：'+err.message,'error');console.error(err);}finally{$('train-btn').disabled=!state.dataset;$('load-btn').disabled=false;}}
function render(r){
 $('empty-results').hidden=true;$('results-content').hidden=false;$('predict-empty').hidden=true;$('predict-content').hidden=false;
 $('metric-r2').textContent=fmt(r.metrics.R2,4);$('metric-rmse').textContent=fmt(r.metrics.RMSE,3);$('metric-coverage').textContent=fmt(r.coverage*100,1)+'%';$('rmse-unit').textContent=`均方根誤差 · ${r.unit}`;
 $('result-alert').hidden=!r.warning;if(r.warning)$('result-alert').textContent=r.warning;
 const rows=[...r.comparisons].sort((a,b)=>b.R2-a.R2);
 $('compare-body').innerHTML=rows.map(c=>`<tr class="${c.name===r.bestName?'best':''}"><td>${esc(c.name)}${c.name===r.bestName?' ★':''}</td><td>${c.features}</td><td>${fmt(c.MAE,3)}</td><td>${fmt(c.MSE,4)}</td><td>${fmt(c.RMSE,3)}</td><td>${fmt(c.R2,4)}</td><td>${fmt(c.Adjusted_R2,4)}</td></tr>`).join('');
 $('model-explain').textContent=`從 ${comma(r.originalRows)} 筆原始資料中取得 ${comma(r.validRows)} 筆有效資料，隨機抽取 ${comma(r.sampleCount)} 筆（seed=42）。訓練 ${comma(r.counts.train)}、驗證 ${comma(r.counts.validation)}、校準 ${comma(r.counts.calibration)}、測試 ${comma(r.counts.test)}。最佳模型 ${r.bestName}，測試集 MAE=${fmt(r.metrics.MAE,4)}、MSE=${fmt(r.metrics.MSE,5)}、RMSE=${fmt(r.metrics.RMSE,4)}、R²=${fmt(r.metrics.R2,4)}。區間半寬 ±${fmt(r.q,3)} ${r.unit}。`;
 renderScatter(r);renderSelection(r);renderIntervals(r);renderResiduals(r);renderFeatures(r);renderPredictFields(r);
}
function svgBase(inner,w=540,h=266){return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>${inner}</svg>`;}
function plotLayout(w=540,h=266){return {w,h,left:49,right:17,top:14,bottom:37,pw:w-66,ph:h-51};}
function niceTick(v){return Number.isFinite(v)?short(v):'—';}
function axes(l,maxX,minY,maxY,labelX,labelY){const x0=l.left,y0=l.top,y1=l.top+l.ph,x1=l.left+l.pw;let s='';
 for(let i=0;i<=4;i++){const x=x0+l.pw*i/4,y=y1-l.ph*i/4,vY=minY+(maxY-minY)*i/4;
 s+=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#e8eef4" stroke-dasharray="3 4"/><text x="${x0-9}" y="${y+4}" text-anchor="end" font-size="11" fill="#91a1b0">${niceTick(vY)}</text><text x="${x}" y="${y1+18}" text-anchor="middle" font-size="11" fill="#91a1b0">${niceTick(maxX*i/4)}</text>`;}
 s+=`<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#d6e0e9"/><text x="${(x0+x1)/2}" y="${l.h-4}" text-anchor="middle" font-size="11" fill="#8da0af">${esc(labelX)}</text>`;
 if(labelY)s+=`<text x="12" y="16" text-anchor="start" font-size="10" fill="#9aabba">${esc(labelY)}</text>`;return s;}
function percentile(arr,p=.98){const a=arr.filter(Number.isFinite).sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor(a.length*p))]||1;}
function renderScatter(r){const points=r.scatter,l=plotLayout(),max=Math.max(.01,percentile(points.flatMap(d=>[d.actual,d.predicted]),.99))*1.05;
 const x=v=>l.left+l.pw*Math.max(0,Math.min(1,v/max)),y=v=>l.top+l.ph*(1-Math.max(0,Math.min(1,v/max)));
 let s=axes(l,max,0,max,'實際值','預測值');s+=`<line x1="${x(0)}" y1="${y(0)}" x2="${x(max)}" y2="${y(max)}" stroke="#0e9a88" stroke-width="1.8" stroke-dasharray="6 5"/>`;
 for(const p of points){s+=`<circle cx="${x(p.actual)}" cy="${y(p.predicted)}" r="2.7" fill="#347b96" opacity=".34"/>`;} $('scatter-chart').innerHTML=svgBase(s);}
function renderSelection(r){const vals=r.comparisons,l=plotLayout(),left=45,right=15,barW=(l.w-left-right)/vals.length;
 let s='';for(let i=0;i<=4;i++){const y=l.top+l.ph*(1-i/4);s+=`<line x1="${left}" y1="${y}" x2="${l.w-right}" y2="${y}" stroke="#e6edf3" stroke-dasharray="3 4"/><text x="${left-9}" y="${y+4}" fill="#93a1b1" font-size="10" text-anchor="end">${(i/4).toFixed(2)}</text>`;}
 vals.forEach((v,i)=>{const x=left+i*barW+barW*.17,bw=barW*.64,ratio=Math.max(0,Math.min(1,v.R2)),h=l.ph*ratio;
 s+=`<rect x="${x}" y="${l.top+l.ph-h}" width="${bw}" height="${h}" rx="5" fill="${v.name===r.bestName?'#0f9688':'#8caebc'}"/><text x="${x+bw/2}" y="${l.top+l.ph-h-8}" text-anchor="middle" font-size="11" font-weight="650" fill="#557185">${fmt(v.R2,2)}</text><text x="${x+bw/2}" y="${l.top+l.ph+18}" text-anchor="middle" font-size="10" fill="#8194a5">${esc(v.name.includes('Ridge')?'Ridge':v.features+' f.')}</text>`;
 });$('selection-chart').innerHTML=svgBase(s);}
function renderIntervals(r){const pts=[...r.scatter].sort((a,b)=>a.actual-b.actual).filter((_,i)=>i%Math.max(1,Math.floor(r.scatter.length/40))===0).slice(0,40),l=plotLayout();
 const max=Math.max(1,percentile(pts.flatMap(d=>[d.hi,d.actual]),.99)*1.05),x=i=>l.left+l.pw*i/Math.max(1,pts.length-1),y=v=>l.top+l.ph*(1-Math.max(0,Math.min(1,v/max)));
 let s='';for(let i=0;i<=4;i++){const py=l.top+l.ph*(1-i/4);s+=`<line x1="${l.left}" y1="${py}" x2="${l.left+l.pw}" y2="${py}" stroke="#edf1f5" stroke-dasharray="3 4"/><text x="${l.left-8}" y="${py+3}" fill="#90a2af" text-anchor="end" font-size="10">${niceTick(max*i/4)}</text>`;}
 s+=`<text x="${l.left+l.pw/2}" y="${l.h-5}" text-anchor="middle" fill="#91a1b0" font-size="11">依實際值排序的測試樣本</text>`;
 for(let i=0;i<pts.length;i++){const p=pts[i],xx=x(i);s+=`<line x1="${xx}" y1="${y(p.lo)}" x2="${xx}" y2="${y(p.hi)}" stroke="#8fbfca" stroke-width="3" opacity=".75"/><circle cx="${xx}" cy="${y(p.predicted)}" r="2.5" fill="#236a88"/><circle cx="${xx}" cy="${y(p.actual)}" r="2.3" fill="#ed9a5c"/>`;}
 s+=`<rect x="${l.w-165}" y="10" width="8" height="8" fill="#236a88"/><text x="${l.w-153}" y="18" fill="#8da0ac" font-size="10">預測</text><rect x="${l.w-95}" y="10" width="8" height="8" fill="#ed9a5c"/><text x="${l.w-83}" y="18" fill="#8da0ac" font-size="10">真實</text>`;
 $('interval-chart').innerHTML=svgBase(s);}
function renderResiduals(r){const pts=r.scatter,l=plotLayout();const maxX=Math.max(.01,percentile(pts.map(x=>x.predicted),.99)*1.05),abs=Math.max(.01,percentile(pts.map(x=>Math.abs(x.residual)),.97)*1.2);
 const x=v=>l.left+l.pw*Math.max(0,Math.min(1,v/maxX)),y=v=>l.top+l.ph*(1-(Math.max(-abs,Math.min(abs,v))+abs)/(2*abs));
 let s=axes(l,maxX,-abs,abs,'預測值','殘差');s+=`<line x1="${l.left}" y1="${y(0)}" x2="${l.left+l.pw}" y2="${y(0)}" stroke="#0e9a88" stroke-dasharray="5 5" stroke-width="1.8"/>`;
 pts.forEach(p=>s+=`<circle cx="${x(p.predicted)}" cy="${y(p.residual)}" r="2.7" fill="#347b96" opacity=".38"/>`);$('residual-chart').innerHTML=svgBase(s);}
function renderFeatures(r){const feats=r.coefficients.slice(0,10),max=feats[0]?.importance||1;
 $('feature-bars').innerHTML=feats.map(f=>`<div class="feature-item" title="${esc(f.feature)}"><b>${esc(f.feature)}</b><div class="bar-bg"><div class="bar-fill" style="width:${(100*f.importance/max).toFixed(1)}%"></div></div><small>${fmt(f.coefficient,3)}</small></div>`).join('');}
function renderPredictFields(r){state.userFeatures={};const fields=r.model.features;const container=$('predict-fields');
 container.innerHTML=fields.map(f=>{const v=r.fill[f]??0;state.userFeatures[f]=v;return `<div class="feature-field"><label for="feature-${esc(f)}" title="${esc(f)}">${esc(f)}</label><input type="number" inputmode="decimal" step="any" id="feature-${esc(f)}" data-feature="${esc(f)}" value="${Number(v).toPrecision(5)}"></div>`;}).join('');
 container.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{const v=Number(input.value);if(Number.isFinite(v))state.userFeatures[input.dataset.feature]=v;}));runPrediction();}
function runPrediction(){if(!state.result)return;const r=state.result;
 $('predict-fields').querySelectorAll('input').forEach(input=>{const v=Number(input.value);if(Number.isFinite(v)&&input.value.trim()!=='')state.userFeatures[input.dataset.feature]=v;});
 const y=C.predictModel(r.model,state.userFeatures),lo=r.problem==='custom'?y-r.q:Math.max(0,y-r.q),hi=y+r.q;
 $('predict-value').textContent=fmt(y,2);$('predict-unit').textContent=r.unit;$('predict-range').textContent=`${fmt(lo,2)} — ${fmt(hi,2)} ${r.unit}`;
 $('predict-note').textContent=`此區間使用校準集求得的 ±${fmt(r.q,2)} ${r.unit}；統計上的邊際覆蓋率目標為 95%，不表示單筆預測有 95% 機率正確。`;}
function resetFeatures(){if(!state.result)return;renderPredictFields(state.result);}
function exportResults(){if(!state.result)return;const result=state.result;const copy={...result,model:{...result.model},scatter:result.scatter};const blob=new Blob([JSON.stringify(copy,null,2)],{type:'application/json;charset=utf-8'}),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=`steam_hw2_${result.problem}_results.json`;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}
document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>usePreset(button.dataset.preset)));
['steam-url','custom-url'].forEach(id=>$(id).addEventListener('input',()=>{state.preferredTarget=null;setActivePreset(null);}));
$('upload-file').addEventListener('change',()=>{state.preferredTarget=null;setActivePreset(null);});
$('problem-select').addEventListener('change',showProblem);$('target-select').addEventListener('change',()=>{setDataset();if(state.dataset)status('目標欄位已設定，可以開始訓練','ok');});$('load-btn').addEventListener('click',loadData);$('train-btn').addEventListener('click',train);$('predict-btn').addEventListener('click',runPrediction);$('reset-features').addEventListener('click',resetFeatures);$('export-btn').addEventListener('click',exportResults);
window.addEventListener('error',e=>console.error('HW2 site error',e.message));
showProblem();
// Auto-load primary Kaggle source. If remote CORS/network fails, local upload remains available.
setTimeout(async()=>{await loadData();if(state.dataset&&state.mode==='price')await train();},200);
})();
