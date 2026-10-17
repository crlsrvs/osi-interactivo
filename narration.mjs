export function narrationText(model, frame) {
  const number=['cero','uno','dos','tres','cuatro','cinco','seis','siete'];
  const heading=`Etapa ${frame.index+1} de quince. `;
  let text;
  if(frame.medium){
    text=heading+`Transmisión por el medio físico. La trama Ethernet de ${model.sizes.ethernet} bytes se representa mediante señales en el enlace. Corresponde a ${model.sizes.bits} bits de trama antes de la codificación física. Los destellos de la máquina son representativos; no muestran cada bit real. Al otro extremo, ${model.destination.toLowerCase()==='cliente'?'el cliente':'el servidor'} recuperará la trama.`;
  }else{
    const d=model.descriptions[frame.layer];
    text=heading+`${frame.owner}. Capa ${number[frame.layer]}, ${frame.name.toLowerCase()}. `+(frame.receiving?d.rx:d.tx);
    if(frame.layer===6)text+=' La ubicación de TLS en esta estación es una simplificación didáctica del modelo OSI.';
    if(frame.layer===5)text+=' El tamaño de los datos se mantiene.';
    if(frame.layer!==1)text+=` Esta etapa entrega ${frame.size} bytes.`;
    if(frame.index===14)text+=model.response?' La respuesta llegó al cliente. El recorrido está completo.':' La petición llegó a la aplicación del servidor. El recorrido está completo.';
  }
  return text.replace(/HTTP\/1\.1/g,'hache te te pe, versión uno punto uno')
    .replace(/\bHTTPS\b/g,'hache te te pe seguro').replace(/\bHTTP\b/g,'hache te te pe')
    .replace(/\bTLS\b/g,'te ele ese').replace(/\bTCP\b/g,'te ce pe')
    .replace(/\bIPv4\b/g,'i pe versión cuatro').replace(/\bIP\b/g,'i pe')
    .replace(/\bOSI\b/g,'o ese i').replace(/\bFCS\b/g,'efe ce ese').replace(/\bJSON\b/g,'yeison')
    .replace(/GET \/capas/g,'get, barra capas');
}

// Browser speech controller. Dependencies can be supplied by deterministic
// tests; utterances are retained and late callbacks cannot affect a new step.
export function createNarrator({synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,onState=()=>{},onComplete=()=>{},onFailure=()=>{},timers=globalThis}={}){
  const supported=!!(synth&&Utterance);
  let enabled=false,generation=0,utterance=null,startTimer=null,endTimer=null;
  let status='idle',key=null,error='',voiceURI='',rate=1;
  const state=()=>({supported,enabled,status,key,error,busy:status==='pending'||status==='speaking'});
  const notify=message=>onState({...state(),message});
  function clearTimers(){if(startTimer!==null)timers.clearTimeout(startTimer);if(endTimer!==null)timers.clearTimeout(endTimer);startTimer=endTimer=null;}
  function stop(message=''){
    generation++;clearTimers();utterance=null;status='idle';key=null;error='';
    if(supported)synth.cancel();
    if(message)notify(message);
  }
  function voices(){return supported?synth.getVoices().filter(v=>/^es(?:[-_]|$)/i.test(v.lang)):[];}
  function selectedVoice(){const list=voices();return list.find(v=>v.voiceURI===voiceURI)||[...list].sort((a,b)=>Number(b.localService)-Number(a.localService)||Number(/^es-CL$/i.test(b.lang))-Number(/^es-CL$/i.test(a.lang)))[0]||null;}
  function speak(text,stepKey){
    if(!enabled||!supported)return false;
    stop();
    const token=generation;key=String(stepKey);status='pending';
    const u=new Utterance(text);utterance=u;
    const voice=selectedVoice();if(voice)u.voice=voice;
    u.lang=voice?.lang||'es-ES';u.rate=rate;u.pitch=1;u.volume=1;
    const fail=message=>{if(token!==generation)return;generation++;clearTimers();synth.cancel();utterance=null;status='error';error=message;notify(message);onFailure(message);};
    u.onstart=()=>{if(token!==generation)return;timers.clearTimeout(startTimer);startTimer=null;status='speaking';notify('Narrando esta etapa…');};
    u.onend=()=>{if(token!==generation)return;generation++;clearTimers();utterance=null;status='done';notify('Etapa narrada.');onComplete(key);};
    u.onerror=event=>{if(token!==generation)return;fail(event.error==='not-allowed'?'El navegador bloqueó la voz. Pulsa «Repetir etapa» para intentarlo.':'No se pudo completar la voz. Elige otra voz o pulsa «Repetir etapa».');};
    notify('Preparando la voz…');
    startTimer=timers.setTimeout(()=>fail('La voz no se inició. Elige otra voz o pulsa «Repetir etapa».'),10000);
    endTimer=timers.setTimeout(()=>fail('La voz no terminó. Puedes repetir la etapa o continuar sin narración.'),Math.max(30000,Math.min(180000,text.split(/\s+/).length*1100/rate+15000)));
    try{synth.resume();synth.speak(u);}catch{fail('La voz no está disponible. Elige otra o continúa sin narración.');return false;}
    return true;
  }
  return {
    supported,get enabled(){return enabled;},get state(){return state();},get voiceURI(){return voiceURI;},get rate(){return rate;},voices,
    setEnabled(value){stop();enabled=!!value&&supported;notify(enabled?'Voz activada.':'Voz desactivada.');},
    configure(options={}){if(options.voiceURI!==undefined)voiceURI=options.voiceURI;if(options.rate!==undefined)rate=Math.max(.5,Math.min(2,Number(options.rate)||1));},
    speak,stop,isComplete:stepKey=>status==='done'&&key===String(stepKey)
  };
}
