import assert from 'node:assert/strict';
import {createModel} from './model.mjs';
for(const secure of [false,true])for(const response of [false,true]){
  const m=createModel({secure,response});
  assert.equal(m.sizes.http,response?82:53);
  assert.equal(m.sizes.tls,m.sizes.http+(secure?22:0));
  assert.equal(m.sizes.tcp,m.sizes.tls+20);
  assert.equal(m.sizes.ip,m.sizes.tcp+20);
  assert.equal(m.sizes.ethernet,m.sizes.ip+18);
  assert.equal(m.sizes.bits,m.sizes.ethernet*8);
  assert.deepEqual(m.frames.slice(0,7).map(f=>f.layer),[7,6,5,4,3,2,1]);
  assert.deepEqual(m.frames.slice(8).map(f=>f.layer),[1,2,3,4,5,6,7]);
  assert.equal(m.frames[2].size,m.frames[1].size,'L5 must not invent a header');
  assert.equal(m.frames[12].size,m.frames[11].size,'RX L5 must not remove a fictitious header');
  assert.equal(m.frames[0].size,m.frames[14].size);
  assert.equal(m.frames[3].size,m.sizes.tcp);
  assert.equal(m.frames[9].size,m.sizes.ip);
  assert.equal(m.frames[10].size,m.sizes.tcp);
  assert.equal(m.frames[11].size,m.sizes.tls);
  assert.equal(m.frames[13].size,m.sizes.http);
  for(const f of m.frames){
    const parts={http:m.sizes.http,tls:22,tcp:20,ip:20,ethernet:18};
    assert.equal(f.shells.reduce((sum,shell)=>sum+parts[shell],0),f.size,'visible envelopes must match the byte count');
    assert.equal(f.shells.includes('tls'),secure&&f.envelope!=='http');
  }
  if(response){const [head,body]=m.message.split('\r\n\r\n');assert.ok(head.includes('Content-Length: 11'));assert.equal(new TextEncoder().encode(body).length,11);assert.equal(m.endpoints.destinationPort,51514);}
  else{assert.equal(m.endpoints.sourcePort,51514);assert.equal(m.endpoints.destinationPort,secure?443:80);}
}
console.log('PASS: 4 scenarios; HTTP message lengths; TLS/TCP/IPv4/Ethernet overhead; all 15 stages; direction and ports; envelope/byte agreement; no fictitious L5 header.');
