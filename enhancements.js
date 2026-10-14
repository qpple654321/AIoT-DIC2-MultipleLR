(()=>{
  const link=document.createElement('link');link.rel='stylesheet';link.href='./enhancements.css';document.head.appendChild(link);
  const q=s=>document.querySelector(s);
  const params=new URLSearchParams(location.search);
  const validSchemes=['Lasso','Forward SFS','RFE','ElasticNet','Exhaustive'];
  const fmt2=v=>Number.isFinite(Number(v))?Number(v).toFixed(2):'—';

  function syncUrl(){
    const p=new URLSearchParams(location.search);
    if(typeof scheme!=='undefined')p.set('scheme',scheme);
    if(typeof k!=='undefined')p.set('k',String(k));
    const active=q('.nav-item.active');if(active)p.set('tab',active.dataset.tab);
    history.replaceState(null,'',location.pathname+'?'+p.toString());
  }
  function applyQuery(){
    const s=params.get('scheme'),kk=Number(params.get('k')),tab=params.get('tab');
    if(validSchemes.includes(s))scheme=s;
    if([1,2,3,4,5].includes(kk))k=kk;
    if(typeof renderAll==='function')renderAll();
    if(['results','features','methods'].includes(tab)&&typeof activateTab==='function')activateTab(tab);
  }

  const meta=q('.header-meta');
  if(meta){const b=document.createElement('button');b.className='theme-toggle';b.id='themeToggle';b.textContent='LIGHT / DARK';meta.prepend(b);b.onclick=()=>{document.body.classList.toggle('light-mode');localStorage.setItem('dic2-theme',document.body.classList.contains('light-mode')?'light':'dark');if(typeof renderCharts==='function')renderCharts();};}
  if(localStorage.getItem('dic2-theme')==='light')document.body.classList.add('light-mode');

  const kpis=q('#kpis');
  if(kpis){const sec=document.createElement('section');sec.className='panel data-panel';sec.id='keyFindings';sec.innerHTML='<div class="panel-head"><div><span class="label">KEY FINDINGS</span><h2>Model Selection Summary</h2><p>依目前五種方法與 k=1–5 結果，自動整理最佳組合與模型趨勢。</p></div><span class="chip cyan">auto summary</span></div><div class="insight-grid" id="insightGrid"></div>';kpis.insertAdjacentElement('afterend',sec);}

  const pred=q('.pred-out');
  if(pred){const d=document.createElement('div');d.id='predInterval';d.className='prediction-range';pred.appendChild(d);}

  const methodPanels=[...document.querySelectorAll('.tab-panel[data-panel="methods"] .panel')];
  if(methodPanels.length){const sec=document.createElement('section');sec.className='panel data-panel prose';sec.innerHTML='<div class="panel-head"><div><span class="label">LIMITATIONS & VALIDATION</span><h2>Experiment Notes</h2><p>解讀模型結果時需要注意的統計與資料限制。</p></div></div><div class="limitations"><article><b>Small sample size</b><p>50 Startups 僅 50 筆資料，test set 與不同切分下的指標可能有較大波動。</p></article><article><b>Feature selection ≠ causality</b><p>被選中的特徵代表在目前資料與模型下具預測價值，不代表因果關係。</p></article><article><b>Reference statistics</b><p>50 Startups 五方法統計結果沿用課程公開 reference model data；介面與第二題 OLS 流程為本專案重新實作。</p></article><article><b>Prediction range</b><p>網站顯示的 95% range 以 RMSE × 1.96 作近似，用於直觀展示，不等同完整 OLS prediction interval。</p></article></div><div class="query-note">可直接用網址開指定畫面，例如：<code>?scheme=RFE&amp;k=2&amp;tab=features</code></div>';methodPanels[methodPanels.length-1].insertAdjacentElement('afterend',sec);}

  function renderEnhancements(){
    if(typeof modelData==='undefined'||typeof scheme==='undefined'||typeof k==='undefined')return;
    const current=(modelData[scheme]||[]).find(x=>Number(x.k)===Number(k));
    const all=[];validSchemes.forEach(s=>(modelData[s]||[]).forEach(e=>all.push({scheme:s,...e})));
    const globalBest=all.length?all.reduce((a,b)=>Number(b.rmse)<Number(a.rmse)?b:a):null;
    const currentBest=(modelData[scheme]||[]).length?(modelData[scheme]||[]).reduce((a,b)=>Number(b.rmse)<Number(a.rmse)?b:a):null;
    const grid=q('#insightGrid');
    if(grid&&current&&globalBest&&currentBest){grid.innerHTML=`<div class="insight-card"><span>GLOBAL BEST RMSE</span><strong>${globalBest.scheme} · k=${globalBest.k}</strong><p>RMSE ${fmt2(globalBest.rmse)} · R² ${Number(globalBest.r2).toFixed(4)}</p></div><div class="insight-card"><span>CURRENT METHOD BEST</span><strong>${scheme} · k=${currentBest.k}</strong><p>${(currentBest.features||[]).join(' · ')}</p></div><div class="insight-card"><span>CURRENT SELECTION</span><strong>${scheme} · k=${current.k}</strong><p>${Number(current.rmse)<=Number(currentBest.rmse)*1.01?'Near best-performing region':'Higher error than this method’s best k'}</p></div>`;}
    const pi=q('#predInterval');const pv=q('#predValue');if(pi&&current&&pv){const center=Number(String(pv.textContent).replace(/[$,]/g,''));const margin=1.96*Number(current.rmse);pi.innerHTML=Number.isFinite(center)?`Approx. 95% prediction range: <b>${'$'+Math.max(0,center-margin).toLocaleString(undefined,{maximumFractionDigits:0})} – ${'$'+(center+margin).toLocaleString(undefined,{maximumFractionDigits:0})}</b>`:'Approx. 95% prediction range: —';}
    const rows=[...document.querySelectorAll('#bestBody tr')];if(rows.length&&globalBest){rows.forEach(r=>{r.classList.toggle('best-row',r.cells[0]?.textContent.includes(globalBest.scheme)&&Number(r.cells[1]?.textContent)===Number(globalBest.k));});}
    syncUrl();
  }

  document.addEventListener('click',e=>{if(e.target.closest('#schemeButtons button,#kButtons button,.nav-item'))setTimeout(renderEnhancements,0);});
  ['#inRD','#inAdmin','#inMkt','#inState'].forEach(s=>q(s)?.addEventListener('input',()=>setTimeout(renderEnhancements,0)));
  applyQuery();renderEnhancements();
})();