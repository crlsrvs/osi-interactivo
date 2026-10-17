import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
assert.equal(read('dist/index.html'),read('osi-interactivo.html'));
assert.deepEqual(readdirSync(new URL('./dist/',import.meta.url)).sort(),['.nojekyll','index.html','osi-interactivo-dark.html','osi-interactivo.html']);
for(const name of ['index.html','osi-interactivo.html','osi-interactivo-dark.html']){
 const html=read('dist/'+name);
 assert.ok(html.includes('<html lang="es">'));
 assert.ok(html.includes('id="narration-toggle"'));
 assert.ok(!/\/Users\/|file:\/\/\/|\/\* (?:MODEL_CODE|LIVE_CODE|NARRATION_CODE|APP_CSS|KIT_CSS|GEOMETRY_DATA) \*\//.test(html),'No local paths or unresolved placeholders');
 assert.ok(!/<script[^>]+src=|<link[^>]+rel="stylesheet"|<img[^>]+src="https?:/i.test(html),'No external rendering dependencies');
 const scripts=[...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1);
 for(const script of scripts)new Function(script[1]);
 console.log('PASS packaged page and embedded JavaScript: '+name);
}
