import {mkdirSync,copyFileSync,writeFileSync} from 'node:fs';
const root=new URL('./',import.meta.url),dist=new URL('./dist/',root);
mkdirSync(dist,{recursive:true});
copyFileSync(new URL('osi-interactivo.html',root),new URL('index.html',dist));
copyFileSync(new URL('osi-interactivo.html',root),new URL('osi-interactivo.html',dist));
copyFileSync(new URL('osi-interactivo-dark.html',root),new URL('osi-interactivo-dark.html',dist));
writeFileSync(new URL('.nojekyll',dist),'');
console.log('Prepared dist/: index.html and both standalone variants.');
