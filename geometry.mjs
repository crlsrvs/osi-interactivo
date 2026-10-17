import * as k from './vendor/anatomy/iso-kit.mjs';
import * as A from './vendor/anatomy/audit.mjs';

export function buildGeometry({audit=false}={}) {
  const W=1000,H=670;
  const BASE={x:-205,y:-57,w:410,d:155,r:9};
  const P=k.fitProjection([...k.boxCorners(BASE,-16,0),...k.boxCorners({x:-170,y:-24,w:340,d:62,r:0},0,264)],W,H,{pad:52,azimuth:62,elevation:23});
  const R=A.recorder(P),S=k.solidSvg,L=k.lineSvg,D=k.dotsSvg;
  const at=p=>k.iso(p,P),items=[];
  function slab(name,plan,z,h,{tone='mid',car=null,shell=null,layer=null,end=null,detail='',lit=false,ground=false}={}){
    const paths=k.slabOf(plan,z,h,P,6,.65);
    const meta={name,ground};
    const shape=R.solid(A.slab(plan,z,h,meta,6));
    const svg=S(paths,{tone,crease:tone==='hi'?'lo':'faint',inner:detail,lit});
    const station=layer?` class="station" data-layer="${layer}" data-end="${end}"${name.endsWith('.head')?` role="button" tabindex="0" aria-label="${end==='L'?'Cliente':'Servidor'}, capa ${layer}. Seleccionar etapa."`:''}`:'';
    const item=R.put({name,at:[plan.x+plan.w/2,plan.y+plan.d/2,z+h/2],piece:car?'car-'+car:'',move:car?[0,0,192]:[0,0,0],svg:`<g${station}>${svg}</g>`,shapes:[shape],car,shell});
    items.push(item);return item;
  }
  const screw=(x,y,z,r=.9)=>L(k.ring(x,y,r,z,P,14),{tone:'lo'})+D([at([x,y,z])],{size:.38,tone:'mid'});
  const seams=(plan,z)=>L(k.sideSeam(plan,z,P,6),{tone:'faint'});
  const vent=(x,y,w,d,z)=>L(k.planOutline({x,y,w,d,r:d/2},z,P,5),{tone:'lo'});
  // The bench is the grounded assembly. Feet meet its bottom face exactly.
  slab('stand.bench',BASE,-10,10,{tone:'lo',ground:true,detail:L(k.planOutline(k.insetPlan(BASE,5),0,P,6),{tone:'faint'})+k.corners(BASE,13).map(([x,y])=>screw(x,y,0,1.5)).join('')});
  for(const [n,[x,y]] of k.corners(BASE,24).entries())slab('stand.foot.'+n,{x:x-9,y:y-8,w:18,d:16,r:3},-16,6,{tone:'lo'});
  const pedestals=[];
  for(const [end,x] of [['L',-125],['R',125]]){
    const pedestal={x:x-48,y:-35,w:96,d:73,r:4};pedestals.push(pedestal);
    slab(end+'.pedestal',pedestal,0,12,{tone:'mid',detail:seams(pedestal,8)+k.corners(pedestal,6).map(([sx,sy])=>screw(sx,sy,12)).join('')});
    // The rear channel supports each of the seven dies. The front guides
    // support the sliding carriage along its complete motion range.
    slab(end+'.spine',{x:x-39,y:-24,w:78,d:6,r:.8},12,240,{tone:'lo',detail:L(k.sideSeam({x:x-39,y:-24,w:78,d:6,r:.8},247,P,6),{tone:'faint'})});
    for(const sign of [-1,1]){
      slab(end+'.back-rib.'+sign,{x:x+sign*35-3,y:-18,w:6,d:6,r:.6},12,240,{tone:'mid'});
      slab(end+'.guide.'+sign,{x:x+sign*35-3,y:32,w:6,d:6,r:.5},12,240,{tone:'hi',detail:L(k.segment([x+sign*35,38,12],[x+sign*35,38,252],P),{tone:'faint'})});
    }
    const cap={x:x-40,y:-25,w:80,d:65,r:2};
    // A U-shaped crosshead would hide the upper packet. Two separate support
    // bars give the guides a real mount and leave the inspection opening clear.
    slab(end+'.cap.back',{x:x-40,y:-25,w:80,d:8,r:1},252,6,{tone:'mid',detail:screw(x-33,-21,258)+screw(x+33,-21,258)});
    for(const sign of [-1,1])slab(end+'.cap.arm.'+sign,{x:x+sign*35-3,y:-17,w:6,d:57,r:.5},252,6,{tone:'mid',detail:screw(x+sign*35,35,258)});
    for(let layer=1;layer<=7;layer++){
      const z=32+(layer-1)*32,plan={x:x-29,y:-18,w:58,d:24,r:1.1};
      slab(`${end}.${layer}.platen`,plan,z,3,{tone:'mid',layer,end,detail:L(k.planOutline(k.insetPlan(plan,2.7),z+3,P,6),{tone:'faint'})});
      const head={x:x-23,y:-16,w:46,d:12,r:1.1};
      const detail=seams(head,z+6)+screw(x-18,-10,z+10)+screw(x+18,-10,z+10)+vent(x-9,-13,18,1.4,z+10)+vent(x-7,-8,14,1.1,z+10);
      slab(`${end}.${layer}.head`,head,z+3,7,{tone:'hi',layer,end,detail});
    }
    const tray={x:x-32,y:9,w:64,d:29,r:1.1};
    slab(end+'.carriage',tray,27,5,{tone:'hi',car:end,detail:L(k.planOutline(k.insetPlan(tray,2.5),32,P,6),{tone:'lo'})+screw(x-26,15,32)+screw(x+26,15,32)});
    for(const sign of [-1,1])slab(end+'.shoe.'+sign,{x:sign===-1?x-32:x+29,y:32,w:3,d:6,r:.3},32,8,{tone:'mid',car:end,detail:screw(x+sign*30.5,35,40,.65)});
    const shellNames=['http','tls','tcp','ip','ethernet'];
    for(let index=0;index<shellNames.length;index++){
      const w=32+index*2.5,d=15+index*1.3,plan={x:x-w/2,y:21-d/2,w,d,r:1};
      slab(end+'.sheet.'+shellNames[index],plan,32+index*1.8,1.8,{tone:'hi',car:end,shell:shellNames[index],detail:L(k.planOutline(k.insetPlan(plan,1.5),33.8+index*1.8,P,6),{tone:'faint'})});
    }
    const socket={x:x-22,y:38,w:44,d:28,r:1.3};
    slab(end+'.encoder',socket,0,22,{tone:'mid',detail:seams(socket,17)+screw(x-15,57,22)+screw(x+15,57,22)+vent(x-9,48,18,3,22)});
    slab(end+'.port-lip',{x:x-20,y:38,w:40,d:6,r:.5},22,5,{tone:'hi',detail:vent(x-15,39.5,30,2,27)});
  }
  const channel={x:-147,y:66,w:294,d:14,r:1};
  let channelDetails=L(k.planOutline(k.insetPlan(channel,2),8,P,6),{tone:'lo'});
  const windows=[];
  for(let i=0;i<17;i++){
    const p={x:-112+i*14,y:70,w:7,d:6,r:.6},d=k.planOutline(p,8.02,P,5);
    channelDetails+=`<path class="signal-window" d="${d}" data-signal="${i}"/>`;
    windows.push(d);
  }
  slab('medium.channel',channel,0,8,{tone:'mid',detail:channelDetails});
  const plate={x:-29,y:-46,w:58,d:17,r:2};
  slab('stand.label',plate,0,.8,{tone:'lo',detail:L(k.planOutline(k.insetPlan(plate,1.6),.8,P,6),{tone:'faint'})+screw(-24,-37.5,.8,.6)+screw(24,-37.5,.8,.6)+k.faceTextSvg(k.topMatrix([0,-35],.8,P,'x'),'OSI',{size:5,tone:'mid',anchor:'middle'})});
  // Depth is solved for independent carriage positions, including all
  // intermediate heights. Each recorded slab is the slab actually drawn.
  const poses=[];
  for(let l=0;l<=8;l++)for(let r=0;r<=8;r++)poses.push({label:`L${l}/8 R${r}/8`,shares:{'car-L':l/8,'car-R':r/8}});
  A.settle(R,P,{states:poses});
  const sorted=[...items].sort((a,b)=>a.key-b.key);
  const halo=`<path class="iso-halo" d="${k.haloOf(BASE,-16,16,P)}"/>`;
  const objects=sorted.map(item=>`<g data-item="${items.indexOf(item)}">${item.svg}</g>`).join('');
  const svg=k.figureSvg({width:W,height:H,label:'Banco isométrico de encapsulación. Dos magazines con siete estaciones, guías verticales y un carro cada uno. El origen baja de aplicación a física; las señales cruzan el canal de la bancada; el destino sube hasta aplicación.',body:halo+`<g id="world-objects">${objects}</g>`});
  if(audit)A.auditOrExit(R,P,{frames:poses,apart:true});
  const V=A.cameraBasis(P).V;
  const zero=at([0,0,0]),up=at([0,0,1]);
  return {svg,P,W,H,solidCount:R.solids.length,zVector:[up[0]-zero[0],up[1]-zero[1]],zDepth:V[2],items:items.map((item,index)=>({index,key:item.key,car:item.car,shell:item.shell,lift:item.move.reduce((v,n,i)=>v+n*V[i],0)})),centres:{L:at([-125,20,136]),R:at([125,20,136])},points:{L:Array.from({length:7},(_,i)=>at([-125,20,32+i*32])),R:Array.from({length:7},(_,i)=>at([125,20,32+i*32]))}};
}
