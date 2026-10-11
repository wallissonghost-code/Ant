const $=s=>document.querySelector(s);
const recordBtn=$('#record'),stopBtn=$('#stop'),labelEl=$('#label'),stateEl=$('#state'),detail=$('#detail'),orb=$('#orb'),levelEl=$('#level'),samplesEl=$('#samples'),countEl=$('#count'),labelsEl=$('#labels'),exportBtn=$('#export'),micEl=$('#mic'),ctxEl=$('#ctx');
let stream=null,recorder=null,chunks=[],samples=[],audioCtx=null,analyser=null,raf=0,startedAt=0;

function setState(title,text,live=false){stateEl.textContent=title;detail.textContent=text;orb.classList.toggle('live',live)}
function updateStats(){countEl.textContent=samples.length+' AMOSTRAS';labelsEl.textContent=new Set(samples.map(x=>x.label)).size+' LABELS';exportBtn.disabled=!samples.length}
function render(){
 if(!samples.length){samplesEl.className='empty';samplesEl.textContent='Nenhuma amostra gravada.';return}
 samplesEl.className='';samplesEl.innerHTML='';
 [...samples].reverse().forEach((s,rev)=>{
  const i=samples.length-1-rev,row=document.createElement('div');row.className='sample';
  const name=document.createElement('span');name.innerHTML='<b></b><br><small></small>';name.querySelector('b').textContent=s.label;name.querySelector('small').textContent=(s.duration/1000).toFixed(2)+'s • '+Math.round(s.blob.size/1024)+' KB';
  const play=document.createElement('button');play.textContent='OUVIR';play.onclick=()=>{const u=URL.createObjectURL(s.blob),a=new Audio(u);a.onended=()=>URL.revokeObjectURL(u);a.play()};
  const del=document.createElement('button');del.textContent='X';del.onclick=()=>{samples.splice(i,1);render();updateStats()};
  row.append(name,play,del);samplesEl.append(row);
 })
}
async function meter(){
 if(!analyser)return;const data=new Uint8Array(analyser.fftSize);analyser.getByteTimeDomainData(data);let sum=0;
 for(const v of data){const n=(v-128)/128;sum+=n*n}
 const rms=Math.min(1,Math.sqrt(sum/data.length)*4);levelEl.style.width=(rms*100)+'%';orb.style.setProperty('--level',(.22+rms*.78).toFixed(2));raf=requestAnimationFrame(meter)
}
async function startRecording(){
 const label=labelEl.value.trim().toLowerCase();if(!label){setState('FALTA LABEL','Digite a palavra que você vai falar antes de gravar.');labelEl.focus();return}
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();const src=audioCtx.createMediaStreamSource(stream);analyser=audioCtx.createAnalyser();analyser.fftSize=512;src.connect(analyser);meter();
  const preferred=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(t=>MediaRecorder.isTypeSupported(t));recorder=new MediaRecorder(stream,preferred?{mimeType:preferred}:undefined);chunks=[];startedAt=performance.now();
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  recorder.onstop=()=>{const duration=performance.now()-startedAt,blob=new Blob(chunks,{type:recorder.mimeType||chunks[0]?.type||'audio/webm'});samples.push({id:'ant-voice-'+Date.now(),label,duration,blob,mime:blob.type,createdAt:Date.now()});render();updateStats();cleanup();setState('AMOSTRA SALVA','Áudio mantido apenas nesta sessão até você exportar.')};
  recorder.start();recordBtn.disabled=true;stopBtn.disabled=false;labelEl.disabled=true;micEl.textContent='MIC: LIVE';ctxEl.textContent='AUDIO: LOCAL';setState('GRAVANDO',`Fale: "${label}"`,true);
 }catch(e){cleanup();setState('FALHA NO MICROFONE',e.message)}
}
function cleanup(){cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(t=>t.stop());if(audioCtx&&audioCtx.state!=='closed')audioCtx.close();stream=null;audioCtx=null;analyser=null;recordBtn.disabled=false;stopBtn.disabled=true;labelEl.disabled=false;micEl.textContent='MIC: OFF';ctxEl.textContent='AUDIO: OFF';levelEl.style.width='0';orb.style.setProperty('--level','.2');orb.classList.remove('live')}
function stopRecording(){if(recorder&&recorder.state==='recording')recorder.stop()}
async function exportDataset(){
 const meta={format:'ANT-VOICE-DATASET',version:1,createdAt:new Date().toISOString(),count:samples.length,privacy:'user-exported-local-session',samples:[]};
 for(const s of samples){const bytes=new Uint8Array(await s.blob.arrayBuffer());let bin='';for(let i=0;i<bytes.length;i+=0x8000)bin+=String.fromCharCode(...bytes.subarray(i,i+0x8000));meta.samples.push({id:s.id,label:s.label,durationMs:Math.round(s.duration),mime:s.mime,audioBase64:btoa(bin)})}
 const blob=new Blob([JSON.stringify(meta)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ant-voice-dataset-v1-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);setState('DATASET EXPORTADO',samples.length+' amostras incluídas no arquivo local.')
}
recordBtn.onclick=startRecording;stopBtn.onclick=stopRecording;exportBtn.onclick=exportDataset;addEventListener('pagehide',cleanup);updateStats();