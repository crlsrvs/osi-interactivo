import {readFileSync,writeFileSync} from 'node:fs';
const page=readFileSync(new URL('./osi-interactivo.html',import.meta.url),'utf8');
const fake=`<script>
window.voiceTest={utterances:[],active:null,cancels:0,auto:false};
class TestUtterance{constructor(text){this.text=text;}}
const v=window.voiceTest;
Object.defineProperty(window,'SpeechSynthesisUtterance',{value:TestUtterance});
Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'Español de prueba',lang:'es-CL',voiceURI:'test-cl',localService:true}],addEventListener(){},resume(){},cancel(){v.cancels++;v.active=null;},speak(u){v.active=u;v.utterances.push(u);u.onstart();if(v.auto)setTimeout(()=>u.onend(),80);}}});
</script>`;
const tests=`
const out=[];const q=s=>document.querySelector(s),v=window.voiceTest;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function check(value,message){if(!value)throw Error(message);out.push('PASS '+message);}
async function until(fn,message,timeout=7000){const start=Date.now();while(!fn()){if(Date.now()-start>timeout)throw Error(message);await wait(50);}}
async function run(){try{
q('#restart').click();q('#narration-toggle').click();check(v.utterances.length===1,'voice starts only on activation');
check(q('#narration-text').textContent===v.active.text,'transcript matches spoken stage');
q('#play').click();const first=v.active;await wait(3200);check(q('#progress').value==='0','long narration holds stage past silent 2.8 second timer');
first.onend();await until(()=>v.active!==first&&v.active,'no next narration');check(v.active.text.startsWith('Etapa 2 de quince.'),'advances only after completion, then narrates stage 2');
q('#play').click();check(v.active===null,'pause cancels active audio');const count=v.utterances.length;await wait(800);check(v.utterances.length===count,'pause prevents further speech');
q('[data-step="7"]').click();await until(()=>v.active,'manual narration missing');check(v.utterances.length===count+1&&v.active.text.startsWith('Etapa 8 de quince.'),'manual jump narrates destination only, skipping intermediate stages');
const stale=v.active;q('[data-message="response"]').click();check(v.active.text.includes('Servidor'),'scenario cancels previous speech and uses current sender');stale.onend();check(q('#progress').value==='0','stale completion cannot advance new scenario');
q('#narration-rate').value='1.4';q('#narration-rate').dispatchEvent(new Event('change'));check(v.active.rate===1.4,'rate change repeats stage at selected speed');
v.active.onerror({error:'not-allowed'});check(q('#play').getAttribute('aria-pressed')==='false'&&q('#narration-status').textContent.includes('bloqueó'),'speech error pauses and shows recovery action');
q('#narration-repeat').click();check(v.active,'repeat recovers from error');
q('#narration-toggle').click();check(!v.active&&q('#narration-options').hidden,'disable stops sound and hides controls');
q('[data-message="request"]').click();v.auto=true;q('#narration-toggle').click();q('#play').click();const start=v.utterances.length-1;
await until(()=>q('#progress').value==='14'&&q('#play').getAttribute('aria-pressed')==='false', 'complete narrated tour timed out',50000);
const tour=v.utterances.slice(start);check(tour.length===15,'complete tour speaks exactly 15 stages');
check(tour.every((u,i)=>u.text.startsWith('Etapa '+(i+1)+' de quince.')),'complete tour preserves order');
check(q('#narration-status').textContent.includes('completo'),'narrated tour stops after final stage');
const layout=()=>{const area=q('.narration-panel').getBoundingClientRect();return [...q('.narration-panel').querySelectorAll('button,select')].filter(n=>n.getBoundingClientRect().width).every(n=>{const r=n.getBoundingClientRect();return r.left>=area.left&&r.right<=area.right;});};
check(layout(),'narration controls fit their panel');
}catch(e){out.push('FAIL '+e.message);}
q('#narration-toggle').getAttribute('aria-pressed')==='true'&&q('#narration-toggle').click();
const report=document.createElement('pre');report.id='verification-report';report.style='position:fixed;inset:20px;z-index:99999;overflow:auto;background:white;color:#142218;border:2px solid;padding:25px;font:14px/1.8 monospace;white-space:pre-wrap';report.textContent=out.join('\\n');document.body.append(report);document.title=out.some(s=>s.startsWith('FAIL'))?'FAIL · Narration verification':'PASS · Narration verification';
}
setTimeout(run,200);
`;
writeFileSync(new URL('./shots/narration-verification.html',import.meta.url),page.replace('<script type="module">',()=>fake+'<script type="module">').replace('</body>',()=>'<script type="module">'+tests+'</script></body>'));
console.log('Wrote shots/narration-verification.html. Open in native browser; deterministic speech integration and full 15-stage tour.');
