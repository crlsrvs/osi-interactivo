// Native-browser verification fallback: the same line-end checker used by the
// skill's CLI, applied to real DOM geometry in an offline copy of the page.
import {readFileSync,writeFileSync} from 'node:fs';
import {LINE_ENDS} from './vendor/anatomy/line-ends.mjs';
const page=readFileSync(new URL('./osi-interactivo.html',import.meta.url),'utf8');
const code=`
const lineCheck=(${LINE_ENDS});
const testResults=[];window.addEventListener('error',e=>testResults.push('FAIL runtime: '+e.message));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=(value,message)=>{if(!value)throw Error(message);testResults.push('PASS '+message);};
const read=s=>document.querySelector(s).textContent;
async function selectStep(index){document.querySelector('[data-step="'+index+'"]').click();for(let i=0;i<50;i++){await wait(70);if(Number(document.querySelector('#progress').value)===index&&!read('[data-readout]').includes('Traslado'))return;}throw Error('timeout stage '+index);}
async function verify(){
 try{
  document.querySelector('#restart').click();
  await selectStep(3);check(read('#byte-count')==='95 B','HTTPS request TCP = 95 B');
  await selectStep(5);check(read('#byte-count')==='133 B','HTTPS request Ethernet = 133 B');
  await selectStep(11);check(read('#byte-count')==='75 B','RX TCP delivers 75 B TLS');
  await selectStep(14);check(read('#byte-count')==='53 B','HTTP request restored = 53 B');
  document.querySelector('[data-security="false"]').click();await selectStep(5);check(read('#byte-count')==='111 B','HTTP request Ethernet = 111 B');
  document.querySelector('[data-message="response"]').click();await selectStep(5);check(read('#byte-count')==='140 B','HTTP response Ethernet = 140 B');
  document.querySelector('[data-security="true"]').click();await selectStep(5);check(read('#byte-count')==='162 B','HTTPS response Ethernet = 162 B');
  document.querySelector('[data-message="request"]').click();
  document.querySelector('[data-camera="all"]').click();
  for(const theme of ['light','dark']){
   document.body.dataset.theme=theme;
   for(const index of [0,3,6,7,11,14]){
    await selectStep(index);
    document.querySelector('.iso-plate').scrollIntoView({block:'center'});await wait(70);
    const result=lineCheck();
    check(result.problems.length===0,'line ends: '+result.problems.length+' · '+theme+' · stage '+index+' · '+result.ends+' ends');
    if(result.problems.length)testResults.push(JSON.stringify(result.problems));
   }
  }
 }catch(e){testResults.push('FAIL '+e.message);}
 document.body.dataset.theme='light';document.querySelector('#restart').click();
 const report=document.createElement('pre');report.id='verification-report';report.style='position:fixed;inset:20px;z-index:99999;overflow:auto;background:#fff;color:#142218;border:2px solid #142218;padding:25px;font:14px/1.8 monospace;white-space:pre-wrap';report.textContent=testResults.join('\\n');document.body.append(report);document.title=testResults.some(r=>r.startsWith('FAIL'))?'FAIL · OSI verification':'PASS · OSI verification';
}
setTimeout(verify,150);
`;
writeFileSync(new URL('./shots/verification.html',import.meta.url),page.replace('</body>',()=>'<script type="module">'+code+'</script></body>'));
console.log('Wrote shots/verification.html. Open in a browser; it exercises all scenarios and runs the skill line-end check in both palettes.');
