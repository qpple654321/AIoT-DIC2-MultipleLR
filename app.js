const STARTUP_CSV=`R&D Spend,Administration,Marketing Spend,State,Profit
165349.2,136897.8,471784.1,New York,192261.83
162597.7,151377.59,443898.53,California,191792.06
153441.51,101145.55,407934.54,Florida,191050.39
144372.41,118671.85,383199.62,New York,182901.99
142107.34,91391.77,366168.42,Florida,166187.94
131876.9,99814.71,362861.36,New York,156991.12
134615.46,147198.87,127716.82,California,156122.51
130298.13,145530.06,323876.68,Florida,155752.6
120542.52,148718.95,311613.29,New York,152211.77
123334.88,108679.17,304981.62,California,149759.96
101913.08,110594.11,229160.95,Florida,146121.95
100671.96,91790.61,249744.55,California,144259.4
93863.75,127320.38,249839.44,Florida,141585.52
91992.39,135495.07,252664.93,California,134307.35
119943.24,156547.42,256512.92,Florida,132602.65
114523.61,122616.84,261776.23,New York,129917.04
78013.11,121597.55,264346.06,California,126992.93
94657.16,145077.58,282574.31,New York,125370.37
91749.16,114175.79,294919.57,Florida,124266.9
86419.7,153514.11,0,New York,122776.86
76253.86,113867.3,298664.47,California,118474.03
78389.47,153773.43,299737.29,New York,111313.02
73994.56,122782.75,303319.26,Florida,110352.25
67532.53,105751.03,304768.73,Florida,108733.99
77044.01,99281.34,140574.81,New York,108552.04
64664.71,139553.16,137962.62,California,107404.34
75328.87,144135.98,134050.07,Florida,105733.54
72107.6,127864.55,353183.81,New York,105008.31
66051.52,182645.56,118148.2,Florida,103282.38
65605.48,153032.06,107138.38,New York,101004.64
61994.48,115641.28,91131.24,Florida,99937.59
61136.38,152701.92,88218.23,New York,97483.56
63408.86,129219.61,46085.25,California,97427.84
55493.95,103057.49,214634.81,Florida,96778.92
46426.07,157693.92,210797.67,California,96712.8
46014.02,85047.44,205517.64,New York,96479.51
28663.76,127056.21,201126.82,Florida,90708.19
44069.95,51283.14,197029.42,California,89949.14
20229.59,65947.93,185265.1,New York,81229.06
38558.51,82982.09,174999.3,California,81005.76
28754.33,118546.05,172795.67,California,78239.91
27892.92,84710.77,164470.71,Florida,77798.83
23640.93,96189.63,148001.11,California,71498.49
15505.73,127382.3,35534.17,New York,69758.98
22177.74,154806.14,28334.72,California,65200.33
1000.23,124153.04,1903.93,New York,64926.08
1315.46,115816.21,297114.46,Florida,49490.75
0,135426.92,0,California,42559.73
542.05,51743.15,0,New York,35673.41
0,116983.8,45173.06,California,14681.4`;

const PRESETS={
 startup:{label:'50 Startups',url:'https://raw.githubusercontent.com/Avik-Jain/100-Days-Of-ML-Code/master/datasets/50_Startups.csv',target:'Profit',features:['R&D Spend','Administration','Marketing Spend','State'],desc:'50 Startups：以 R&D Spend、Administration、Marketing Spend、State 預測 Profit。'},
 boston:{label:'Boston Housing',url:'https://raw.githubusercontent.com/selva86/datasets/master/BostonHousing.csv',target:'medv',features:['crim','zn','indus','chas','nox','rm','age','dis','rad','tax','ptratio','b','lstat'],desc:'Boston Housing：使用 13 個住宅與區域特徵預測房價中位數 MEDV。'},
 custom:{label:'Custom Dataset',url:'',target:'',features:[],desc:'Custom Dataset：載入公開 CSV URL 或上傳本機 CSV，並自行選擇 Target 與 Features。'}
};

const $=s=>document.querySelector(s);
const els={problem:$('#problemSelect'),url:$('#datasetUrl'),load:$('#loadBtn'),file:$('#fileInput'),status:$('#status'),target:$('#targetSelect'),features:$('#featureList'),train:$('#trainBtn'),shape:$('#shapeBadge'),preview:$('#previewTable'),desc:$('#datasetDescription'),r2:$('#r2Value'),rmse:$('#rmseValue'),mae:$('#maeValue'),samples:$('#sampleValue'),equation:$('#equationBox'),coefBody:$('#coefBody'),predBody:$('#predictionBody'),resultState:$('#resultState'),discussion:$('#discussionText')};
let rows=[],columns=[],predictionChart=null,residualChart=null;

const parseNum=v=>{const n=Number(String(v??'').replace(/[$,%\s,]/g,''));return Number.isFinite(n)?n:NaN};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const setStatus=(t,type='')=>{els.status.textContent=t;els.status.className='status '+type};
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;

function parseCsv(text){const p=Papa.parse(text,{header:true,skipEmptyLines:true});if(!p.data.length)throw new Error('CSV 沒有可用資料');columns=(p.meta.fields||[]).map(x=>x.trim());rows=p.data.map(r=>{const o={};Object.entries(r).forEach(([k,v])=>o[k.trim()]=typeof v==='string'?v.trim():v);return o});}
function isNumeric(c){const v=rows.slice(0,100).map(r=>r[c]).filter(x=>String(x??'').trim()!=='');return v.length>0&&v.filter(x=>Number.isFinite(parseNum(x))).length/v.length>.9;}

function renderDataset(){els.shape.textContent=`${rows.length} rows × ${columns.length} columns`;els.desc.textContent=PRESETS[els.problem.value].desc;const showCols=columns.slice(0,9),showRows=rows.slice(0,8);els.preview.innerHTML=`<table><thead><tr>${showCols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${showRows.map(r=>`<tr>${showCols.map(c=>`<td>${esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;renderControls();}

function renderControls(){const p=PRESETS[els.problem.value];els.target.innerHTML=columns.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');els.target.disabled=false;els.target.value=columns.includes(p.target)?p.target:(columns.find(isNumeric)||columns.at(-1));const preferred=new Set(p.features.filter(f=>columns.includes(f)));els.features.innerHTML=columns.map(c=>`<label class="feature-item"><input type="checkbox" value="${esc(c)}" ${preferred.size?(preferred.has(c)?'checked':''):(c!==els.target.value&&isNumeric(c)?'checked':'')}><span>${esc(c)}</span></label>`).join('');syncTarget();els.target.onchange=syncTarget;els.train.disabled=false;}
function syncTarget(){[...els.features.querySelectorAll('input')].forEach(ch=>{ch.disabled=ch.value===els.target.value;if(ch.disabled)ch.checked=false;});}
const selectedFeatures=()=>[...els.features.querySelectorAll('input:checked')].map(x=>x.value);

async function loadPreset(mode){els.problem.value=mode;const p=PRESETS[mode];els.url.value=p.url;els.desc.textContent=p.desc;if(mode==='startup'){parseCsv(STARTUP_CSV);setStatus('50 Startups loaded · built-in dataset','ok');renderDataset();train();return;}if(mode==='boston'){setStatus('Loading Boston Housing...','loading');try{const res=await fetch(p.url);if(!res.ok)throw new Error('HTTP '+res.status);parseCsv(await res.text());setStatus('Boston Housing loaded','ok');renderDataset();train();}catch(e){setStatus('Boston Housing 載入失敗：'+e.message,'error');}}}
async function loadUrl(){const url=els.url.value.trim();if(!url)return setStatus('請輸入 Dataset URL','error');setStatus('Loading custom CSV...','loading');try{const res=await fetch(url);if(!res.ok)throw new Error('HTTP '+res.status);parseCsv(await res.text());setStatus('Custom dataset loaded','ok');renderDataset();}catch(e){setStatus('載入失敗：'+e.message,'error');}}

function buildDesign(fs,target){const usable=rows.filter(r=>Number.isFinite(parseNum(r[target]))&&fs.every(f=>String(r[f]??'').trim()!==''));const enc=[];fs.forEach(f=>{if(isNumeric(f))enc.push({name:f,type:'n'});else{const cats=[...new Set(usable.map(r=>String(r[f])))];cats.slice(1).forEach(cat=>enc.push({name:`${f}=${cat}`,type:'d',field:f,cat}));}});const X=[],y=[];usable.forEach(r=>{const x=enc.map(e=>e.type==='n'?parseNum(r[e.name]):String(r[e.field])===e.cat?1:0);if(x.every(Number.isFinite)){X.push(x);y.push(parseNum(r[target]));}});return{X,y,names:enc.map(e=>e.name)};}
function shuffle(n,seed=42){const a=[...Array(n).keys()];let x=seed;const rnd=()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296};for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const T=A=>A[0].map((_,j)=>A.map(r=>r[j]));
function mm(A,B){const o=Array.from({length:A.length},()=>Array(B[0].length).fill(0));for(let i=0;i<A.length;i++)for(let k=0;k<B.length;k++)for(let j=0;j<B[0].length;j++)o[i][j]+=A[i][k]*B[k][j];return o;}
function inv(A){const n=A.length,M=A.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let i=0;i<n;i++){let p=i;for(let r=i+1;r<n;r++)if(Math.abs(M[r][i])>Math.abs(M[p][i]))p=r;[M[i],M[p]]=[M[p],M[i]];if(Math.abs(M[i][i])<1e-12)M[i][i]+=1e-8;const d=M[i][i];for(let j=0;j<2*n;j++)M[i][j]/=d;for(let r=0;r<n;r++)if(r!==i){const f=M[r][i];for(let j=0;j<2*n;j++)M[r][j]-=f*M[i][j];}}return M.map(r=>r.slice(n));}
function ols(X,y){const p=X[0].length,mu=[],sd=[];for(let j=0;j<p;j++){const c=X.map(r=>r[j]),m=mean(c),s=Math.sqrt(mean(c.map(v=>(v-m)**2)))||1;mu.push(m);sd.push(s);}const Z=X.map(r=>[1,...r.map((v,j)=>(v-mu[j])/sd[j])]),Xt=T(Z),XtX=mm(Xt,Z);for(let i=1;i<XtX.length;i++)XtX[i][i]+=1e-8;const bs=mm(inv(XtX),mm(Xt,y.map(v=>[v]))).map(r=>r[0]);const b=bs.slice(1).map((v,j)=>v/sd[j]),a=bs[0]-b.reduce((s,v,j)=>s+v*mu[j],0);return[a,...b];}
const predict=(X,b)=>X.map(r=>b[0]+r.reduce((s,v,j)=>s+v*b[j+1],0));
function calcMetrics(y,p){const mse=mean(y.map((v,i)=>(v-p[i])**2)),mae=mean(y.map((v,i)=>Math.abs(v-p[i]))),ym=mean(y),sst=y.reduce((s,v)=>s+(v-ym)**2,0),sse=y.reduce((s,v,i)=>s+(v-p[i])**2,0);return{r2:1-sse/(sst||1),rmse:Math.sqrt(mse),mae};}

function train(){const target=els.target.value,fs=selectedFeatures().filter(f=>f!==target);if(!fs.length)return setStatus('請至少選擇一個 Feature','error');const d=buildDesign(fs,target);if(d.X.length<12)return setStatus('有效資料不足','error');const order=shuffle(d.X.length),cut=Math.floor(order.length*.8),tr=order.slice(0,cut),te=order.slice(cut),Xtr=tr.map(i=>d.X[i]),ytr=tr.map(i=>d.y[i]),Xte=te.map(i=>d.X[i]),yte=te.map(i=>d.y[i]);try{const beta=ols(Xtr,ytr),pred=predict(Xte,beta),m=calcMetrics(yte,pred);renderResult(target,d.names,beta,yte,pred,m,Xtr.length,Xte.length);setStatus(`Model complete · ${Xtr.length} train / ${Xte.length} test`,'ok');}catch(e){setStatus('Regression failed：'+e.message,'error');}}

function f(v,d=3){return Number.isFinite(v)?v.toFixed(d):'--';}
function renderResult(target,names,beta,y,p,m,ntr,nte){els.r2.textContent=f(m.r2);els.rmse.textContent=f(m.rmse,2);els.mae.textContent=f(m.mae,2);els.samples.textContent=ntr+nte;els.resultState.textContent='Completed';els.equation.textContent=`${target} ≈ ${f(beta[0],3)} `+names.slice(0,8).map((n,i)=>`${beta[i+1]>=0?'+':'−'} ${Math.abs(beta[i+1]).toFixed(3)}·${n}`).join(' ')+(names.length>8?' …':'');const ranked=names.map((n,i)=>({n,b:beta[i+1]})).sort((a,b)=>Math.abs(b.b)-Math.abs(a.b));const ranks=new Map(ranked.map((x,i)=>[x.n,i+1]));els.coefBody.innerHTML=`<tr><td>Intercept</td><td>${f(beta[0],5)}</td><td>—</td></tr>`+names.map((n,i)=>`<tr><td>${esc(n)}</td><td>${f(beta[i+1],5)}</td><td>#${ranks.get(n)}</td></tr>`).join('');els.predBody.innerHTML=y.slice(0,10).map((v,i)=>`<tr><td>${i+1}</td><td>${f(v,2)}</td><td>${f(p[i],2)}</td><td>${f(v-p[i],2)}</td></tr>`).join('');els.discussion.textContent=`${PRESETS[els.problem.value].label} 模型已完成。Test R² = ${f(m.r2,3)}，RMSE = ${f(m.rmse,2)}，MAE = ${f(m.mae,2)}。R² 越接近 1 代表模型對測試資料的解釋能力越高；Residual 越接近 0 代表預測誤差越小。`;renderCharts(y,p,target);}
function renderCharts(y,p,target){if(predictionChart)predictionChart.destroy();if(residualChart)residualChart.destroy();const min=Math.min(...y,...p),max=Math.max(...y,...p),grid='#e4ecf3',tick='#66788a';predictionChart=new Chart($('#predictionChart'),{type:'scatter',data:{datasets:[{label:'Test samples',data:y.map((v,i)=>({x:v,y:p[i]})),backgroundColor:'#1f5f92'},{type:'line',label:'Ideal',data:[{x:min,y:min},{x:max,y:max}],borderColor:'#7aaed4',borderDash:[5,5],pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'Actual '+target},grid:{color:grid},ticks:{color:tick}},y:{title:{display:true,text:'Predicted '+target},grid:{color:grid},ticks:{color:tick}}}}});residualChart=new Chart($('#residualChart'),{type:'scatter',data:{datasets:[{label:'Residual',data:p.map((v,i)=>({x:v,y:y[i]-v})),backgroundColor:'#2e8b68'},{type:'line',label:'Zero',data:[{x:Math.min(...p),y:0},{x:Math.max(...p),y:0}],borderColor:'#d46b6b',borderDash:[5,5],pointRadius:0}]},options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'Predicted'},grid:{color:grid},ticks:{color:tick}},y:{title:{display:true,text:'Residual'},grid:{color:grid},ticks:{color:tick}}}}});}

els.problem.onchange=()=>{const mode=els.problem.value;const p=PRESETS[mode];els.url.value=p.url;els.desc.textContent=p.desc;if(mode==='startup')loadPreset('startup');else if(mode==='boston')loadPreset('boston');else{rows=[];columns=[];els.preview.innerHTML='<div class="placeholder">輸入 Dataset URL 或上傳 CSV</div>';els.shape.textContent='--';els.target.innerHTML='';els.target.disabled=true;els.features.innerHTML='<span class="muted">Waiting for dataset...</span>';els.train.disabled=true;setStatus('Custom mode：請載入 CSV');}};
els.load.onclick=loadUrl;els.file.onchange=e=>{const file=e.target.files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{parseCsv(r.result);setStatus(`${file.name} loaded`,'ok');renderDataset();}catch(err){setStatus(err.message,'error');}};r.readAsText(file);};els.train.onclick=train;

els.url.value=PRESETS.startup.url;loadPreset('startup');