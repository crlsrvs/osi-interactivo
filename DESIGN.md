# Banco OSI — Figure

## Concepto

Una mesa de encapsulación con dos magazines de siete estaciones y un carro elevador en cada extremo. En el origen, el carro baja y recoge envolturas. El medio conduce señales, no sobres materiales. En el destino, el carro sube y retira envolturas. Es una metáfora mecánica de servicios y encapsulación, no hardware de red literal.

## Modelo técnico

- HTTP/1.1 sobre TCP/IPv4 y Ethernet II, con TLS 1.3 opcional. Cliente y servidor comparten un enlace Ethernet; las direcciones son de documentación y las MAC son locales.
- Conexiones TCP y TLS ya establecidas. No DNS, ARP, handshakes, ACK independientes, retransmisiones ni respuesta simultánea. La respuesta se puede explorar como un segundo recorrido inverso.
- Una petición corta cabe, por elección del ejemplo, en un registro TLS y un segmento TCP. No se afirma correspondencia general entre mensaje, registro, segmento y trama.
- OSI es un modelo de referencia. Internet no implementa siete módulos obligatorios; las funciones de las capas 5–7 se agrupan de distintas maneras. TLS se usa como ejemplo de representación/protección, no como asignación normativa exclusiva a L6. L5 no añade una cabecera inventada.
- Tamaños derivados del mensaje real: TCP sin opciones 20 B; IPv4 sin opciones 20 B; Ethernet II sin VLAN 14 B + FCS 4 B. TLS 1.3 con AES-GCM: 5 B de cabecera + 1 B de tipo interno + 16 B de etiqueta, sin relleno. No se cifra realmente; el contenido protegido se representa de forma simbólica.
- El contador físico representa bits de la trama antes de la codificación física. No incluye preámbulo/SFD, IFG ni overhead de codificación; los destellos son representativos.

## Piezas previstas

Base: bancada, cuatro pies, rebaje perimetral y tornillos.

Cada extremo: pedestal, montante trasero, dos nervios posteriores, dos guías frontales, travesaño superior, siete bandejas de estación, siete cabezales de sellado, un carro y dos patines, pilas de láminas de datos/envolturas. Las cabezas tienen ranuras cerradas, tornillos y costuras que resuelven en sus bordes.

Medio: dos conectores de base, dos labios de entrada, un canal de señal con ventanas de inspección. Piezas de control en el tablero y una placa grabada OSI. Aproximadamente 80 sólidos principales más detalles de superficie; un solo mecanismo explicativo, sin WebGL ni órbitas 3D.

## Validación

El modelo puro gobierna pasos, tamaños, láminas y lectura. Geometría registrada con las formas reales del kit y orden medida por el audit. Comprobar apoyos, penetraciones y orden; revisar ambas paletas, móvil de 390 px, selección, animación, pausa, teclado y movimiento reducido. Si Chrome headless sigue fallando por SIGABRT, usar la vista nativa para la revisión visual y documentar la limitación de las capturas automatizadas.

## Referencias primarias

- ITU-T X.200: https://www.itu.int/rec/T-REC-X.200-199407-I/en
- HTTP/1.1, RFC 9112: https://www.rfc-editor.org/rfc/rfc9112.html
- TLS 1.3, RFC 8446 §5: https://www.rfc-editor.org/rfc/rfc8446.html#section-5
- TCP, RFC 9293: https://www.rfc-editor.org/rfc/rfc9293.html
- IPv4, RFC 791: https://www.rfc-editor.org/rfc/rfc791.html
- IP sobre Ethernet, RFC 894: https://www.rfc-editor.org/rfc/rfc894.html
