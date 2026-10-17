import assert from 'node:assert/strict';
import {createNarrator,narrationText} from './narration.mjs';
import {createModel} from './model.mjs';
let active=null,cancelled=0,completed=[],failed=[],next=0;
const jobs=new Map();
const timers={setTimeout(fn,delay){const id=++next;jobs.set(id,{fn,delay});return id;},clearTimeout(id){jobs.delete(id);}};
class Utterance{constructor(text){this.text=text;}}
const synth={getVoices:()=>[{name:'English',lang:'en-US',voiceURI:'en',localService:true},{name:'Spanish',lang:'es-ES',voiceURI:'es',localService:false},{name:'Chilean',lang:'es-CL',voiceURI:'cl',localService:true}],cancel(){cancelled++;},resume(){},speak(u){active=u;}};
const n=createNarrator({synth,Utterance,timers,onComplete:key=>completed.push(key),onFailure:message=>failed.push(message)});
assert.equal(n.speak('No autoplay',0),false);assert.equal(active,null);
n.setEnabled(true);n.speak('Primera etapa',0);
assert.equal(active.voice.voiceURI,'cl');assert.equal(n.state.status,'pending');
active.onstart();assert.equal(n.state.status,'speaking');assert.equal(jobs.size,1);
const old=active;n.stop();n.speak('Segunda etapa',1);old.onend();old.onerror({error:'interrupted'});
assert.equal(n.state.key,'1');assert.equal(completed.length,0);assert.equal(failed.length,0);
active.onstart();active.onend();active.onend();assert.deepEqual(completed,['1']);assert.equal(n.isComplete(1),true);assert.equal(jobs.size,0);
n.configure({voiceURI:'es',rate:1.4});n.speak('Elegida',2);assert.equal(active.voice.voiceURI,'es');assert.equal(active.rate,1.4);
active.onerror({error:'not-allowed'});assert.equal(n.state.status,'error');assert.equal(failed.length,1);assert.equal(jobs.size,0);
n.speak('Timeout',3);const startJob=[...jobs.values()].find(j=>j.delay===10000);startJob.fn();assert.equal(n.state.status,'error');assert.equal(failed.length,2);
n.speak('Disable',4);const disabled=active;n.setEnabled(false);disabled.onend();assert.equal(n.enabled,false);assert.deepEqual(completed,['1']);assert.equal(jobs.size,0);assert.ok(cancelled>0);
const unsupported=createNarrator({synth:null,Utterance:null});unsupported.setEnabled(true);assert.equal(unsupported.supported,false);assert.equal(unsupported.enabled,false);
for(const secure of [false,true])for(const response of [false,true]){
 const m=createModel({secure,response});
 for(const f of m.frames){const text=narrationText(m,f);assert.ok(text.startsWith(`Etapa ${f.index+1} de quince.`));assert.ok(!/undefined|NaN/.test(text));if(f.medium)assert.ok(text.includes(`${m.sizes.bits} bits`));else if(f.layer!==1)assert.ok(text.includes(`${f.size} bytes`));}
 assert.ok(narrationText(m,m.at(14)).includes(response?'respuesta llegó al cliente':'petición llegó a la aplicación del servidor'));
}
console.log('PASS: narration opt-in, Spanish/local voice selection, rate, completion gating, stale callbacks, duplicate callbacks, cancellation, errors, startup timeout, unsupported browser, and 60 model-derived stage scripts.');
