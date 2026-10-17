export function createModel(options={}) {
  const secure=options.secure!==false,response=!!options.response;
  const body='{"ok":true}';
  const request='GET /capas HTTP/1.1\r\nHost: osi.local\r\nAccept: */*\r\n\r\n';
  const reply='HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 11\r\n\r\n'+body;
  const message=response?reply:request;
  const bytes=new TextEncoder().encode(message).length;
  const tls=secure?bytes+22:bytes,tcp=tls+20,ip=tcp+20,ethernet=ip+18;
  const sizes={http:bytes,tls,tcp,ip,ethernet,bits:ethernet*8};
  const source=response?'Servidor':'Cliente',destination=response?'Cliente':'Servidor';
  const endpoints={sourceIP:response?'192.0.2.20':'192.0.2.10',destinationIP:response?'192.0.2.10':'192.0.2.20',sourceMAC:response?'02:00:00:00:00:20':'02:00:00:00:00:10',destinationMAC:response?'02:00:00:00:00:10':'02:00:00:00:00:20',sourcePort:response?(secure?443:80):51514,destinationPort:response?51514:(secure?443:80)};
  const names={7:'Aplicación',6:'Presentación',5:'Sesión',4:'Transporte',3:'Red',2:'Enlace de datos',1:'Física'};
  const units={7:'Mensaje HTTP',6:secure?'Registro TLS':'Datos HTTP',5:secure?'Datos protegidos':'Datos HTTP',4:'Segmento TCP',3:'Paquete IPv4',2:'Trama Ethernet',1:'Señales físicas'};
  const tx=[bytes,tls,tls,tcp,ip,ethernet,ethernet];
  const rx=[ethernet,ip,tcp,tls,tls,bytes,bytes];
  const frames=Array.from({length:15},(_,index)=>{
    const medium=index===7,receiving=index>=8,layer=medium?1:receiving?index-7:7-index;
    const size=medium?ethernet:receiving?rx[index-8]:tx[index];
    // This is the result at each station: headers are added at TX and removed
    // at RX. The PHY serializes/recovers the same Ethernet frame bits.
    let envelope=medium?'ethernet':receiving?['ethernet','ip','tcp',secure?'tls':'http',secure?'tls':'http','http','http'][index-8]:['http',secure?'tls':'http',secure?'tls':'http','tcp','ip','ethernet','ethernet'][index];
    const shells=envelope==='ethernet'?['http',...(secure?['tls']:[]),'tcp','ip','ethernet']:envelope==='ip'?['http',...(secure?['tls']:[]),'tcp','ip']:envelope==='tcp'?['http',...(secure?['tls']:[]),'tcp']:envelope==='tls'?['http','tls']:['http'];
    const owner=medium?'Medio físico':receiving?destination:source;
    return {index,layer,medium,receiving,owner,size,envelope,shells,name:names[layer],unit:medium?'Señales físicas':receiving&&layer>1?({2:'Paquete IPv4',3:'Segmento TCP',4:secure?'Registro TLS':'Datos HTTP',5:secure?'Datos protegidos':'Datos HTTP',6:'Mensaje HTTP',7:'Mensaje HTTP'}[layer]):units[layer],phase:medium?'Transmisión':receiving?'Desencapsulación':'Encapsulación',side:medium?'medio':receiving?'destino':'origen'};
  });
  const descriptions={
    7:{role:'Da significado al intercambio.',tx:response?'El servidor construye un mensaje HTTP 200 OK con un cuerpo JSON.':'El cliente construye GET /capas y sus campos HTTP. El método, la ruta y los headers pertenecen al protocolo de aplicación.',rx:response?'El cliente interpreta el estado 200 y el cuerpo JSON. La respuesta ya tiene significado para la aplicación.':'El servidor interpreta el método GET y la ruta /capas. La petición llegó a la aplicación.',mechanism:'La primera estación introduce la hoja que contiene el mensaje.',pdu:'HTTP/1.1',field:response?'200 OK · JSON · Content-Length: 11':'GET /capas · Host: osi.local'},
    6:{role:'Representa y protege los datos.',tx:secure?'TLS protege los bytes HTTP en un registro cifrado y autenticado. La maquinaria añade una cubierta opaca.':'Los bytes HTTP se transportan sin TLS. La representación del mensaje se conserva; esta estación no inventa otra cabecera.',rx:secure?'TLS comprueba la autenticidad del registro y descifra los bytes HTTP. La cubierta se abre solo en el extremo autorizado.':'Se conservan los bytes HTTP recibidos. En este modo no hay registro TLS que descifrar.',mechanism:'La cubierta simboliza protección, no un algoritmo de cifrado real.',pdu:secure?'TLS 1.3 · AES-GCM':'Representación de bytes',field:secure?'5 B registro + 1 B tipo interno + 16 B etiqueta':'Sin TLS · 0 B adicionales'},
    5:{role:'Organiza el diálogo entre aplicaciones.',tx:'OSI separa el control del diálogo y su sincronización. En este ejemplo, la conexión ya está disponible; no aparece una cabecera de sesión adicional.',rx:'El intercambio continúa en su contexto existente. Esta estación no quita una cabecera ficticia de sesión.',mechanism:'El carro atraviesa un puesto de control sin recoger una lámina.',pdu:'Función conceptual OSI',field:'0 B adicionales · sin protocolo L5 separado'},
    4:{role:'Entrega bytes entre procesos.',tx:'TCP añade puertos y números de secuencia. Ofrece un flujo ordenado y fiable; una petición puede ocupar muchos segmentos en una conexión real.',rx:'TCP verifica y ordena los bytes recibidos y los entrega al proceso correspondiente. La cabecera TCP deja de formar parte de los datos entregados.',mechanism:'Se añade o se retira la lámina de transporte.',pdu:'TCP',field:`${endpoints.sourcePort} → ${endpoints.destinationPort} · cabecera de 20 B`},
    3:{role:'Lleva paquetes entre direcciones IP.',tx:'IPv4 añade direcciones de origen y destino. La red puede encaminar el paquete; este ejemplo mantiene ambos extremos en el mismo enlace.',rx:'IPv4 reconoce el destino y entrega el contenido al protocolo TCP. La cabecera IP se retira.',mechanism:'La lámina de red añade el destino lógico al conjunto.',pdu:'IPv4',field:`${endpoints.sourceIP} → ${endpoints.destinationIP}`},
    2:{role:'Entrega una trama en el enlace local.',tx:'Ethernet envuelve el paquete IP con direcciones MAC y un FCS para detectar errores en la trama. Las MAC corresponden a este enlace.',rx:'Ethernet comprueba el FCS y el destino MAC y entrega el paquete IPv4. La cabecera y el FCS no se entregan como datos IP.',mechanism:'La última cubierta corresponde al enlace, no a toda Internet.',pdu:'Ethernet II · sin VLAN',field:'14 B de cabecera + 4 B de FCS'},
    1:{role:'Convierte bits y señales físicas.',tx:'La interfaz física codifica los bits de la trama en señales sobre el medio. No añade otra envoltura de cabecera a la petición.',rx:'La interfaz receptora recupera bits a partir de las señales. La trama reconstruida pasa a la capa de enlace.',mechanism:'Los destellos representan señales; no son la codificación Ethernet real.',pdu:'Medio Ethernet',field:`${sizes.ethernet} B de trama = ${sizes.bits} bits antes de codificar`}
  };
  return {secure,response,message,sizes,endpoints,names,frames,source,destination,descriptions,at:index=>frames[Math.max(0,Math.min(14,Math.round(index)))]};
}
