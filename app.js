const qs=selector=>document.querySelector(selector),all=selector=>[...document.querySelectorAll(selector)];
const stage=qs('#iso-stage'),svg=stage.querySelector('svg'),world=qs('#world-objects'),progress=qs('#progress');
const still=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 800px)');
let model=createModel(),position=0,target=0,current=-1,playing=false,userActed=false,visible=false,frame=0,last=0,dwell=0,pulse=0,zoom=1,camera=narrow.matches?'auto':'all',panX=0,panY=0,lastOrder='',lastAnnouncement=-1;
let view={cx:500,cy:335,w:1000,h:670};
const hoverHolds=new Set();
const nodes=G.items.map(item=>({...item,node:qs(`[data-item="${item.index}"]`)}));
const signalNodes=all('[data-signal]');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const say=text=>{qs('#announcement').textContent=text;};
let narrationArmed=false;
const speechKey=()=>`${model.secure}:${model.response}:${target}`;
const narrator=createNarrator({
 onState(state){
  qs('#narration-toggle').setAttribute('aria-pressed',String(state.enabled));
  qs('#narration-toggle').textContent=state.enabled?'◖ Desactivar voz':'◖ Activar voz';
  qs('#narration-options').hidden=qs('#narration-transcript').hidden=!state.enabled;
  qs('#announcement').setAttribute('aria-live',state.enabled?'off':'polite');
  if(state.message)qs('#narration-status').textContent=state.message;
 },
 onComplete(){dwell=0;run();},
 onFailure(){narrationArmed=false;playing=false;controls();}
});
function cancelNarration(message='Narración pausada. Pulsa Reproducir o Repetir etapa.'){
 narrationArmed=false;
 if(narrator.enabled)narrator.stop(message);
}
function narrateSettled(){
 if(!narrator.enabled||!narrationArmed||Math.abs(position-target)>.003)return;
 narrationArmed=false;
 narrator.speak(narrationText(model,model.at(target)),speechKey());
}
function repeatNarration(){
 if(!narrator.enabled)return;
 userActed=true;dwell=0;narrator.stop();narrationArmed=true;
 position=target;render();run();
}
function loadVoices(){
 const select=qs('#narration-voice'),selected=narrator.voiceURI;
 select.replaceChildren(new Option('Español automático',''));
 narrator.voices().forEach(voice=>select.add(new Option(`${voice.name} · ${voice.lang}${voice.localService?' · local':''}`,voice.voiceURI)));
 select.value=selected;
}
qs('#narration-toggle').disabled=!narrator.supported;
if(!narrator.supported)qs('#narration-status').textContent='Este navegador no dispone de síntesis de voz. Puedes seguir las explicaciones escritas.';
qs('#narration-toggle').onclick=()=>{
 userActed=true;playing=false;dwell=0;narrationArmed=false;
 narrator.setEnabled(!narrator.enabled);controls();
 if(narrator.enabled){loadVoices();target=Math.round(position);repeatNarration();}
};
qs('#narration-repeat').onclick=repeatNarration;
qs('#narration-voice').onchange=event=>{narrator.configure({voiceURI:event.target.value});repeatNarration();};
qs('#narration-rate').onchange=event=>{narrator.configure({rate:event.target.value});repeatNarration();};
if(narrator.supported){loadVoices();speechSynthesis.addEventListener('voiceschanged',loadVoices);}
function controls(){
 if(still.matches)playing=false;
 qs('#play').disabled=still.matches;qs('#play').title=still.matches?'Recorrido automático desactivado por la preferencia de movimiento reducido. Usa las etapas.':'';
 qs('#play').setAttribute('aria-pressed',String(playing));qs('#play-label').textContent=still.matches?'Paso a paso':playing?'Pausar':'Reproducir';qs('#play-icon').textContent=still.matches?'→':playing?'Ⅱ':'▶';
 all('[data-camera]').forEach(button=>{const selected=button.dataset.camera===camera;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 qs('#zoom-value').value=zoom+'×';qs('#less-zoom').disabled=zoom<=1;qs('#more-zoom').disabled=zoom>=4;
}
function go(index,{manual=true}={}){
 cancelNarration();narrationArmed=narrator.enabled;
 target=clamp(Math.round(index),0,14);dwell=0;panX=panY=0;
 if(manual){playing=false;userActed=true;controls();}
 if(still.matches||!visible){position=target;render();}
 run();
}
function setPlaying(value){
 playing=value&&!still.matches;userActed=true;dwell=0;
 cancelNarration();
 if(playing){
  hoverHolds.clear();
  if(position>13.98)go(0,{manual:false});
  narrationArmed=narrator.enabled;narrateSettled();
 }
 controls();run();
}
function rebuildScenario(){
 cancelNarration();narrationArmed=narrator.enabled;
 model=createModel({secure:qs('[data-security="true"]').getAttribute('aria-pressed')==='true',response:qs('[data-message="response"]').getAttribute('aria-pressed')==='true'});
 position=target=0;current=-1;lastAnnouncement=-1;playing=false;userActed=true;dwell=pulse=0;panX=panY=0;
 qs('#http-message').textContent=model.message.replace(/\r/g,'');
 const stops=[['HTTP',model.sizes.http],...(model.secure?[['TLS',model.sizes.tls]]:[]),['TCP',model.sizes.tcp],['IPv4',model.sizes.ip],['Ethernet',model.sizes.ethernet]];
 qs('#size-chain').style.gridTemplateColumns=`repeat(${stops.length},1fr)`;qs('#size-chain').replaceChildren();
 stops.forEach(([name,size])=>{const cell=document.createElement('div');cell.className='size-stop';const label=document.createElement('span');label.textContent=name;const number=document.createElement('strong');number.textContent=size+' ';const unit=document.createElement('small');unit.textContent='B';number.append(unit);cell.append(label,number);qs('#size-chain').append(cell);});
 qs('#size-note').textContent=model.secure?'Ejemplo sin padding TLS ni opciones TCP/IP. El FCS Ethernet está incluido; preámbulo/SFD e IFG quedan fuera de estos tamaños.':'HTTP sin cifrar. TCP e IPv4 no tienen opciones. El FCS está incluido; preámbulo/SFD e IFG quedan fuera de estos tamaños.';
 makeTimeline();render();controls();run();
}
function chooseGroup(selector,button,attribute){
 all(selector).forEach(item=>{const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));});rebuildScenario();
}
all('[data-message]').forEach(button=>button.onclick=()=>chooseGroup('[data-message]',button));
all('[data-security]').forEach(button=>button.onclick=()=>chooseGroup('[data-security]',button));
function makeTimeline(){
 const timeline=qs('#timeline');timeline.replaceChildren();
 model.frames.forEach(f=>{const button=document.createElement('button');button.textContent=f.medium?'↔':f.layer;button.classList.toggle('medium-step',f.medium);button.dataset.step=f.index;button.setAttribute('aria-label',`${f.index+1} de 15. ${f.medium?'Señales en el medio':f.owner+', capa '+f.layer+', '+f.name}`);button.onclick=()=>go(f.index);timeline.append(button);});
 const nav=qs('#layer-nav');nav.replaceChildren();
 for(let layer=7;layer>=1;layer--){const button=document.createElement('button');button.textContent=layer;button.title=model.names[layer];button.dataset.navLayer=layer;button.setAttribute('aria-label','Capa '+layer+': '+model.names[layer]);button.onclick=()=>{const at=model.at(position);go(at.receiving?layer+7:7-layer);};nav.append(button);}
}
function showInfo(f){
 qs('#narration-text').textContent=narrationText(model,f);
 const detail=model.descriptions[f.layer];
 qs('#phase').textContent=f.phase.toUpperCase();qs('#endpoint').textContent=f.owner;qs('#layer-number').textContent=f.medium?'↔':f.layer;qs('#layer-title').textContent=f.medium?'El medio físico':f.name;
 qs('#layer-role').textContent=f.medium?'Solo las señales cruzan entre los equipos.':detail.role;
 qs('#explanation').textContent=f.medium?'La trama se transmite por el enlace como señales. En el otro extremo se recuperan sus bits. Las capas superiores no saltan directamente de un equipo al otro.':f.receiving?detail.rx:detail.tx;
 qs('#operation-label').textContent=f.medium?'EN EL CANAL DE SEÑAL':f.receiving?'EN ESTA ESTACIÓN DEL DESTINO':'EN ESTA ESTACIÓN DEL ORIGEN';
 qs('#mechanism').textContent=detail.mechanism;qs('#protocol').textContent=detail.pdu;
 qs('#fields').textContent=f.layer===2?`${model.endpoints.sourceMAC} → ${model.endpoints.destinationMAC} · EtherType 0x0800 · 14 B + 4 B FCS`:detail.field;
 qs('#pdu').textContent=f.unit;qs('#byte-count').textContent=f.layer===1?`${model.sizes.bits} bits de trama`:`${f.size} B`;
 progress.value=f.index;progress.setAttribute('aria-valuetext',`${f.index+1} de 15: ${f.owner}, ${f.medium?'medio físico':'capa '+f.layer+' '+f.name}`);
 qs('#step-count').replaceChildren(document.createTextNode(String(f.index+1).padStart(2,'0')+' '));const total=document.createElement('span');total.textContent='/ 15';qs('#step-count').append(total);
 qs('#previous').disabled=f.index===0;qs('#next').disabled=f.index===14;
 all('[data-step]').forEach(button=>{const i=Number(button.dataset.step);button.classList.toggle('selected',i===f.index);button.classList.toggle('visited',i<f.index);if(i===f.index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
 all('[data-nav-layer]').forEach(button=>{const selected=Number(button.dataset.navLayer)===f.layer;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
 const currentEnd=f.medium?null:f.receiving?(model.response?'L':'R'):(model.response?'R':'L');
 all('.station').forEach(item=>{const active=item.dataset.end===currentEnd&&Number(item.dataset.layer)===f.layer;item.classList.toggle('selected',active);if(item.hasAttribute('role'))item.setAttribute('aria-pressed',String(active));});
 const titles={http:'Un mensaje con significado.',tls:'HTTP dentro de un registro TLS.',tcp:'Un segmento para los procesos.',ip:'Un paquete con direcciones IP.',ethernet:'Una trama para este enlace.'};
 const descriptions={http:'El método y la ruta, o el estado y el cuerpo, siguen siendo información de la aplicación.',tls:'Los bytes HTTP se protegen. La vista del mensaje original de al lado es lógica: no representa texto legible en el enlace.',tcp:'La cabecera TCP identifica los procesos mediante puertos y sitúa los bytes dentro del flujo.',ip:'La cabecera IPv4 identifica los equipos. Su contenido es el segmento TCP.',ethernet:'La cabecera MAC y el FCS envuelven el paquete IPv4 para este enlace local.'};
 qs('#payload-title').textContent=f.medium?'La trama se convierte en señales.':titles[f.envelope];qs('#payload-description').textContent=f.medium?`${model.sizes.ethernet} B de trama corresponden a ${model.sizes.bits} bits antes de la codificación física. Los destellos son representativos.`:descriptions[f.envelope];
 qs('#message-visibility').textContent=model.secure&&f.shells.includes('tls')?'Vista lógica · en la red está cifrado':model.secure?(f.receiving?'Bytes recuperados en el destino':'Antes de proteger los bytes'):'HTTP visible en claro';
 const extras={http:model.sizes.http,tls:22,tcp:20,ip:20,ethernet:18},labels={http:'HTTP',tls:'TLS',tcp:'TCP',ip:'IPv4',ethernet:'Ethernet'};
 const envelopes=qs('#envelopes');envelopes.replaceChildren();
 [...f.shells].reverse().forEach((shell,index)=>{const tag=document.createElement('div');tag.className='envelope'+(index===0?' outer':'');const name=document.createElement('b');name.textContent=labels[shell];const size=document.createElement('span');size.textContent=(shell==='http'?'':'+ ')+extras[shell]+' B';tag.append(name,size);envelopes.append(tag);});
}
function cameraGoal(f){
 let mode=camera;
 if(mode==='auto')mode=f.medium?'all':f.receiving?(model.response?'L':'R'):(model.response?'R':'L');
 const focusEnd=f.receiving?(model.response?'L':'R'):(model.response?'R':'L');
 const center=zoom>1?G.points[mode==='all'?focusEnd:mode][f.layer-1]:mode==='all'?[500,335]:[G.centres[mode][0],335];
 return {cx:center[0]+panX,cy:center[1]+panY,w:(mode==='all'?1000:520)/zoom,h:670/zoom};
}
function render(dt=1/60){
 const f=model.at(position);
 if(f.index!==current){current=f.index;showInfo(f);}
 const sender=model.response?'R':'L',receiver=model.response?'L':'R';
 const outgoingShare=1-clamp(position/6,0,1),incomingShare=clamp((position-8)/6,0,1);
 const actualShares={[sender]:outgoingShare,[receiver]:incomingShare};
 const showSender=position<6.75,showReceiver=position>7.75;
 const sheets=position<7?model.at(Math.min(6,position)).shells:model.at(Math.max(8,position)).shells;
 nodes.forEach(item=>{
  let dz=0;
  if(item.car){
   dz=actualShares[item.car]*192;
   const compact=!model.secure&&['tcp','ip','ethernet'].includes(item.shell)?-1.8:0;dz+=compact;
   item.node.setAttribute('transform',`translate(${(G.zVector[0]*dz).toFixed(3)} ${(G.zVector[1]*dz).toFixed(3)})`);
   if(item.shell){
    const shown=(item.car===sender?showSender:showReceiver)&&sheets.includes(item.shell);
    item.node.style.display=shown?'':'none';
    item.node.querySelector('.iso-solid').toggleAttribute('data-lit',shown&&item.shell===sheets[sheets.length-1]);
   }
  }
  item.sort=item.key+G.zDepth*dz;
 });
 const order=[...nodes].sort((a,b)=>a.sort-b.sort),key=order.map(n=>n.index).join(',');
 if(key!==lastOrder){for(const item of order)world.append(item.node);lastOrder=key;}
 const strength=position>=5.8&&position<=8.2?Math.max(0,1-Math.abs(position-7)/1.6):0;
 signalNodes.forEach((node,i)=>{const centre=model.response?16-(pulse%1)*16:(pulse%1)*16;const intensity=strength*Math.exp(-(((i-centre)/2)**2));node.style.fill=intensity>.1?'var(--anatomy-lit)':'';node.style.fillOpacity=intensity>.1?String(.35+intensity*.65):'1';});
 const goal=cameraGoal(f),follow=still.matches?1:1-Math.exp(-dt/.2);
 for(const key of ['cx','cy','w','h'])view[key]+=(goal[key]-view[key])*follow;
 svg.setAttribute('viewBox',`${(view.cx-view.w/2).toFixed(2)} ${(view.cy-view.h/2).toFixed(2)} ${view.w.toFixed(2)} ${view.h.toFixed(2)}`);
 stage.style.touchAction=zoom>1?'none':'pan-y';
 const moving=Math.abs(position-target)>.015;
 qs('[data-readout]').textContent=moving?`Traslado · ${f.owner} · L${f.layer}`:f.medium?`Señales · ${model.sizes.bits} bits de trama`:`${f.owner} · L${f.layer} · ${f.size} B`;
 if(!moving&&lastAnnouncement!==f.index){lastAnnouncement=f.index;say(`${f.owner}. ${f.medium?'Medio físico':'Capa '+f.layer+', '+f.name}. ${f.size} bytes de ${f.envelope==='http'?'mensaje HTTP':'unidad del ejemplo'}.`);}
 narrateSettled();
 return Math.max(...['cx','cy','w','h'].map(key=>Math.abs(view[key]-goal[key])))>.05;
}
function tick(now){
 const dt=last?Math.min((now-last)/1000,1/30):1/60;last=now;
 if(still.matches&&playing){playing=false;cancelNarration();controls();}
 if(playing&&(narrator.enabled||!hoverHolds.size)&&!still.matches){
   pulse+=dt*.5;
   const ready=!narrator.enabled||narrator.isComplete(speechKey());
   if(ready&&position===target)dwell+=dt;
   if(ready&&dwell>(narrator.enabled?.65:2.8)&&position===target){
    dwell=0;
    if(target>=14&&narrator.enabled){playing=false;controls();qs('#narration-status').textContent='Recorrido narrado completo. Puedes volver a reproducirlo.';}
    else if(target>=14){position=target=0;current=-1;}
    else{target++;narrationArmed=narrator.enabled;}
    panX=panY=0;
   }
 }
 position=still.matches?target:position+(target-position)*(1-Math.exp(-dt/.23));
 if(Math.abs(target-position)<.003)position=target;
 const cameraMoving=render(dt);
 const needs=position!==target||cameraMoving||(playing&&(narrator.enabled||!hoverHolds.size)&&!still.matches);
 frame=visible&&needs?requestAnimationFrame(tick):0;
}
function run(){if(!frame&&visible){last=0;frame=requestAnimationFrame(tick);}}
qs('#play').onclick=()=>setPlaying(!playing);qs('#next').onclick=()=>go(Math.round(position)+1);qs('#previous').onclick=()=>go(Math.round(position)-1);qs('#restart').onclick=()=>go(0);
progress.addEventListener('input',()=>go(Number(progress.value)));
all('[data-camera]').forEach(button=>button.onclick=()=>{camera=button.dataset.camera;panX=panY=0;controls();render();run();});
function magnify(value){zoom=clamp(value,1,4);panX=panY=0;controls();render();run();}
qs('#more-zoom').onclick=()=>magnify(zoom+.5);qs('#less-zoom').onclick=()=>magnify(zoom-.5);
stage.addEventListener('click',event=>{const station=event.target.closest('.station');if(station){const l=Number(station.dataset.layer),isSource=station.dataset.end===(model.response?'R':'L');go(isSource?7-l:l+7);}});
stage.addEventListener('keydown',event=>{
 const station=event.target.closest('.station');
 if(station&&(event.key==='Enter'||event.key===' ')){event.preventDefault();station.dispatchEvent(new MouseEvent('click',{bubbles:true}));return;}
 if(['ArrowRight','ArrowLeft','Home','End',' ','+','=','-'].includes(event.key))event.preventDefault();
 switch(event.key){case 'ArrowRight':go(Math.round(position)+1);break;case 'ArrowLeft':go(Math.round(position)-1);break;case 'Home':go(0);break;case 'End':go(14);break;case ' ':setPlaying(!playing);break;case '+':case '=':magnify(zoom+.5);break;case '-':magnify(zoom-.5);break;}
});
let drag=null;
stage.addEventListener('pointerdown',event=>{if(zoom<=1||event.target.closest('.station')||event.button!==0)return;drag={x:event.clientX,y:event.clientY,panX,panY};stage.setPointerCapture(event.pointerId);playing=false;userActed=true;cancelNarration();controls();});
stage.addEventListener('pointermove',event=>{if(!drag)return;const box=svg.getBoundingClientRect(),unit=Math.min(box.width/view.w,box.height/view.h);panX=clamp(drag.panX-(event.clientX-drag.x)/unit,-450,450);panY=clamp(drag.panY-(event.clientY-drag.y)/unit,-350,350);render();run();});
const drop=()=>{drag=null;};stage.addEventListener('pointerup',drop);stage.addEventListener('pointercancel',drop);stage.addEventListener('lostpointercapture',drop);
for(const element of [stage,qs('.inspector')]){element.addEventListener('pointerenter',()=>hoverHolds.add(element));element.addEventListener('pointerleave',()=>{hoverHolds.delete(element);run();});}
stage.addEventListener('focusin',()=>hoverHolds.add('focus'));stage.addEventListener('focusout',event=>{if(!stage.contains(event.relatedTarget)){hoverHolds.delete('focus');run();}});
function themeLabel(){qs('#theme').setAttribute('aria-label',`Cambiar a tema ${document.body.dataset.theme==='light'?'oscuro':'claro'}`);}
qs('#theme').onclick=()=>{document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';themeLabel();};
still.addEventListener('change',()=>{if(still.matches){playing=false;cancelNarration();position=target;controls();render();}run();});
new IntersectionObserver(entries=>{visible=entries[entries.length-1].isIntersecting;if(visible)run();else if(narrator.enabled&&narrator.state.busy){playing=false;cancelNarration('Narración pausada al salir del dibujo.');controls();}},{rootMargin:'150px 0px'}).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&narrator.enabled){playing=false;cancelNarration('Narración pausada al ocultar la página.');controls();}});
window.addEventListener('pagehide',()=>{narrationArmed=false;narrator.stop();});
rebuildScenario();userActed=false;themeLabel();controls();
if(still.matches){view=cameraGoal(model.at(0));render();}
setTimeout(()=>{if(!userActed&&!still.matches){playing=true;dwell=0;controls();run();}},1400);
