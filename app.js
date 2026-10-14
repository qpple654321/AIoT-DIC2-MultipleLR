const $=s=>document.querySelector(s);
const fmt=(v,d=3)=>Number.isFinite(Number(v))?Number(v).toFixed(d):'—';
const money=v=>Number.isFinite(Number(v))?'$'+Number(v).toLocaleString(undefined,{maximumFractionDigits:0}):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const SCHEMES=['Lasso','Forward SFS','RFE','ElasticNet','Exhaustive'];
const LABELS={'Lasso':'Lasso (L1)','Forward SFS':'Forward SFS','RFE':'RFE','ElasticNet':'ElasticNet','Exhaustive':'Exhaustive Search'};
let scheme='Lasso',k=2,rmseChart=null,r2Chart=null;
const modelData=window.MODEL_DATA||{};

const problem=$('#problemSelect'),url=$('#datasetUrl'),status=$('#datasetStatus'),explorer=$('#featureExplorer'),baseline=$('#baselineExplorer');
const startupUrl='https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv';
const bostonUrl='https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv';
url.value=startupUrl;

function setStatus(t,type=''){status.textContent=t;status.className='status '+type;}
function getEntry(s=scheme,kk=k){return (modelData[s]||[]).find(x=>Number(x.k)===Number(kk));}
function bestEntry(s){const arr=modelData[s]||[];return arr.length?arr.reduce((a,b)=>Number(b.rmse)<Number(a.rmse)?b:a):null;}

function renderSchemeButtons(){
  $('#schemeButtons').innerHTML=SCHEMES.map(s=>`<button class="${s===scheme?'active':''}" data-scheme="${s}">${LABELS[s]}</button>`).join('');
  $('#schemeButtons').querySelectorAll('button').forEach(b=>b.onclick=()=>{scheme=b.dataset.scheme;renderAll();});
  $('#kButtons').innerHTML=[1,2,3,4,5].map(n=>`<button class="${n===k?'active':''}" data-k="${n}">${n}</button>`).join('');
  $('#kButtons').querySelectorAll('button').forEach(b=>b.onclick=()=>{k=Number(b.dataset.k);renderAll();});
}

function renderKpis(){const e=getEntry();if(!e)return;
  $('#kpis').innerHTML=[
    ['Scheme',LABELS[scheme],'feature selection'],['k',e.k,'selected features'],['RMSE',fmt(e.rmse,2),'lower is better'],['MAE',fmt(e.mae,2),'mean absolute error'],['R²',fmt(e.r2,4),'closer to 1 is better']
  ].map(x=>`<div class="kpi"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join('');
  $('#selectionHint').innerHTML=`Selected subset: <b>${(e.features||[]).map(esc).join(' · ')}</b>`;
}

function chartData(metric){return SCHEMES.map((s,i)=>({label:LABELS[s],data:(modelData[s]||[]).map(x=>({x:x.k,y:Number(x[metric])})),borderWidth:2,pointRadius:3,tension:.22}));}
function renderCharts(){
  if(rmseChart)rmseChart.destroy();if(r2Chart)r2Chart.destroy();
  const common={responsive:true,maintainAspectRatio:false,interaction:{mode:'nearest',intersect:false},plugins:{legend:{labels:{color:'#9ab5c8',boxWidth:12,font:{size:10}}}},scales:{x:{type:'linear',min:1,max:5,ticks:{stepSize:1,color:'#7795aa'},grid:{color:'#163047'}},y:{ticks:{color:'#7795aa'},grid:{color:'#163047'}}}};
  rmseChart=new Chart($('#rmseChart'),{type:'line',data:{datasets:chartData('rmse')},options:{...common,plugins:{...common.plugins,title:{display:true,text:'RMSE by Feature Count',color:'#dff7ff'}}}});
  r2Chart=new Chart($('#r2Chart'),{type:'line',data:{datasets:chartData('r2')},options:{...common,plugins:{...common.plugins,title:{display:true,text:'R² by Feature Count',color:'#dff7ff'}}}});
}

function renderModel(){const e=getEntry();if(!e)return;$('#modelTag').textContent=`${LABELS[scheme]} · k=${k}`;
  const cs=e.coefficients||[],intercept=cs.find(c=>String(c.feature).toLowerCase().includes('intercept'))||cs[0];
  const terms=cs.filter(c=>c!==intercept).map(c=>`${Number(c.coef)>=0?'+':'−'} ${Math.abs(Number(c.coef)).toFixed(4)}·${c.feature}`);
  $('#equation').textContent=`Profit ≈ ${fmt(intercept?.coef,4)} ${terms.join(' ')}`;
  $('#coefBody').innerHTML=cs.map(c=>`<tr><td>${esc(c.feature)}</td><td>${fmt(c.coef,6)}</td><td>${fmt(c.stderr,6)}</td><td>${fmt(c.tstat,3)}</td><td>${Number(c.pvalue)<.001?'&lt;0.001':fmt(c.pvalue,4)}</td><td>${Number.isFinite(Number(c.ci_lower))?`[${fmt(c.ci_lower,3)}, ${fmt(c.ci_upper,3)}]`:'—'}</td><td>${c.vif==null?'—':fmt(c.vif,3)}</td></tr>`).join('');
  $('#fitStats').textContent=`R² ${fmt(e.r2,4)} · Adjusted R² ${fmt(e.adj_r2,4)} · F ${fmt(e.f_stat,2)} · RMSE ${fmt(e.rmse,2)} · MAE ${fmt(e.mae,2)}`;
}

function valueForFeature(name){if(name==='R&D Spend')return Number($('#inRD').value)||0;if(name==='Administration')return Number($('#inAdmin').value)||0;if(name==='Marketing Spend')return Number($('#inMkt').value)||0;if(name==='State_Florida')return $('#inState').value==='Florida'?1:0;if(name==='State_New York')return $('#inState').value==='New York'?1:0;return 0;}
function renderPredictor(){const e=getEntry();if(!e)return;let y=0,items=[];(e.coefficients||[]).forEach(c=>{const isInt=String(c.feature).toLowerCase().includes('intercept'),v=isInt?1:valueForFeature(c.feature),part=Number(c.coef)*v;y+=part;items.push(`${c.feature}: ${money(part)}`);});$('#predValue').textContent=money(y);$('#predContrib').innerHTML=items.map(x=>`<div>${esc(x)}</div>`).join('');}
['#inRD','#inAdmin','#inMkt','#inState'].forEach(s=>$(s).addEventListener('input',renderPredictor));

function renderBest(){
  $('#bestBody').innerHTML=SCHEMES.map(s=>{const e=bestEntry(s);return e?`<tr><td>${LABELS[s]}</td><td>${e.k}</td><td>${(e.features||[]).map(esc).join(', ')}</td><td>${fmt(e.rmse,2)}</td><td>${fmt(e.mae,2)}</td><td>${fmt(e.r2,4)}</td></tr>`:'';}).join('');
}
function renderTests(){const e=getEntry();if(!e)return;$('#testBody').innerHTML=(e.outliers||[]).map(o=>`<tr><td>${o.rank}</td><td>${o.index}</td><td>${fmt(o.actual,2)}</td><td>${fmt(o.predicted,2)}</td><td>${fmt(o.residual,2)}</td><td>${fmt(o.abs_error,2)}</td><td>${fmt(o.pct_error,2)}%</td></tr>`).join('');}
function renderAllTable(){let html='';SCHEMES.forEach(s=>(modelData[s]||[]).forEach(e=>{html+=`<tr><td>${LABELS[s]}</td><td>${e.k}</td><td>${(e.features||[]).map(esc).join(', ')}</td><td>${fmt(e.rmse,2)}</td><td>${fmt(e.mae,2)}</td><td>${fmt(e.r2,4)}</td><td>${fmt(e.adj_r2,4)}</td></tr>`;}));$('#allBody').innerHTML=html;}
function renderAll(){renderSchemeButtons();renderKpis();renderCharts();renderModel();renderPredictor();renderBest();renderTests();renderAllTable();}

// --- second problem / custom OLS baseline ---
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
function mm(A,B){const o=Array.from({length:A.length},()=>Array(B[0].length).fill(0));for(let i=0;i<A.length;i++)for(let q=0;q<B.length;q++)for(let j=0;j<B[0].length;j++)o[i][j]+=A[i][q]*B[q][j];return o;}
function inv(A){const n=A.length,M=A.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;[M[i],M[p]]=[M[p],M[i]];if(Math.abs(M[i][i])<1e-10)M[i][i]+=1e-8;const d=M[i][i];for(let j=0;j<2*n;j++)M[i][j]/=d;for(let r=0;r<n;r++)if(r!==i){const f=M[r][i];for(let j=0;j<2*n;j++)M[r][j]-=f*M[i][j];}}return M.map(r=>r.slice(n));}
function seeded(n){const a=[...Array(n).keys()];let x=42;for(let i=n-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=Math.floor(x/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function olsBase(X,y){const Z=X.map(r=>[1,...r]),Xt=transpose(Z),XtX=mm(Xt,Z);for(let i=0;i<XtX.length;i++)XtX[i][i]+=1e-8;return mm(inv(XtX),mm(Xt,y.map(v=>[v]))).map(r=>r[0]);}
function predBase(X,b){return X.map(r=>b[0]+r.reduce((s,v,i)=>s+v*b[i+1],0));}
async function runBaseline(){const u=url.value.trim();if(!u)return setStatus('Please enter a public CSV URL.','error');setStatus('Loading dataset…');try{const res=await fetch(u);if(!res.ok)throw new Error('HTTP '+res.status);const p=Papa.parse(await res.text(),{header:true,skipEmptyLines:true});const rows=p.data,cols=(p.meta.fields||[]);const numeric=cols.filter(c=>{const vals=rows.slice(0,100).map(r=>Number(r[c])).filter(Number.isFinite);return vals.length>=Math.max(3,Math.floor(Math.min(100,rows.length)*.8));});if(numeric.length<2)throw new Error('Need at least two numeric columns');const target=numeric[numeric.length-1],features=numeric.slice(0,-1),clean=rows.map(r=>({x:features.map(f=>Number(r[f])),y:Number(r[target])})).filter(r=>r.x.every(Number.isFinite)&&Number.isFinite(r.y));const order=seeded(clean.length),cut=Math.floor(clean.length*.8),tr=order.slice(0,cut),te=order.slice(cut),Xtr=tr.map(i=>clean[i].x),ytr=tr.map(i=>clean[i].y),Xte=te.map(i=>clean[i].x),yte=te.map(i=>clean[i].y),b=olsBase(Xtr,ytr),pr=predBase(Xte,b),mse=mean(yte.map((v,i)=>(v-pr[i])**2)),ym=mean(yte),r2=1-yte.reduce((s,v,i)=>s+(v-pr[i])**2,0)/(yte.reduce((s,v)=>s+(v-ym)**2,0)||1);$('#baseRows').textContent=clean.length;$('#baseTarget').textContent=target;$('#baseR2').textContent=fmt(r2,4);$('#baseRmse').textContent=fmt(Math.sqrt(mse),3);$('#baseEquation').textContent=`${target} ≈ ${fmt(b[0],4)} `+features.slice(0,10).map((f,i)=>`${b[i+1]>=0?'+':'−'} ${Math.abs(b[i+1]).toFixed(4)}·${f}`).join(' ')+(features.length>10?' …':'');$('#basePreview').innerHTML=`<table class="data"><thead><tr>${cols.slice(0,8).map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(0,8).map(r=>`<tr>${cols.slice(0,8).map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;setStatus(`Loaded ${clean.length} usable rows · OLS complete`,'ok');}catch(e){setStatus('Load failed: '+e.message,'error');}}

problem.onchange=()=>{const mode=problem.value;if(mode==='startup'){explorer.classList.remove('hidden');baseline.classList.add('hidden');url.value=startupUrl;setStatus('Reference model data ready.','ok');}else{explorer.classList.add('hidden');baseline.classList.remove('hidden');url.value=mode==='boston'?bostonUrl:'';setStatus(mode==='boston'?'Boston Housing ready to load.':'Enter a public CSV URL.');if(mode==='boston')runBaseline();}};
$('#loadDatasetBtn').onclick=()=>problem.value==='startup'?setStatus('50 Startups reference results are already loaded.','ok'):runBaseline();

if(!SCHEMES.every(s=>Array.isArray(modelData[s]))){setStatus('Five-method model data failed to load. Please refresh the page.','error');}else{setStatus('Five-method reference model data ready.','ok');renderAll();}
