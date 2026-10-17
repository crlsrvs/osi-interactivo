# El viaje de una petición — laboratorio OSI

Sitio público previsto: https://crlsrvs.github.io/osi-interactivo/

Abre **osi-interactivo.html** en un navegador. Es un HTML autónomo, en español, con SVG, estilos y JavaScript embebidos; el contenido visual funciona sin conexión. La variante **osi-interactivo-dark.html** inicia en tema oscuro. Ambas incluyen el botón de cambio de tema.

## Explorar

- Reproduce el recorrido o selecciona una de las 15 etapas: siete en el origen, el medio y siete en el destino.
- Selecciona los cabezales de la máquina o los botones numerados de capas para leer su función, unidad entregada y tamaño.
- Alterna petición/respuesta y HTTP/HTTPS. La respuesta realiza el recorrido inverso y cambia los puertos y direcciones.
- Usa las vistas Todo, Cliente, Servidor o Seguir. El zoom llega a 4× y permite arrastrar el encuadre.
- Con el dibujo enfocado: ←/→ recorren etapas; Inicio/Fin van a los extremos; espacio reproduce o pausa; +/− controla el zoom.
- Sin voz, la reproducción automática se detiene al inspeccionar el dibujo; la preferencia de movimiento reducido desactiva el recorrido automático.

## Narración por voz

Pulsa **Activar voz** para escuchar la etapa actual; luego **Reproducir** inicia el recorrido narrado. Cada explicación termina antes de avanzar a la siguiente etapa. El recorrido con voz se detiene al llegar a la aplicación del destino.

Puedes elegir una voz en español, ajustar su velocidad y **Repetir etapa**. Seleccionar otra etapa o cambiar HTTP/HTTPS o petición/respuesta cancela la explicación anterior y narra la nueva selección. Pausar, ocultar la página o desactivar la voz detiene el audio. El texto de cada narración está disponible en un desplegable.

La síntesis usa las voces del navegador/sistema, sin API externa ni audio descargado por la página. La disponibilidad y calidad dependen del navegador y de las voces instaladas; las voces en línea pueden necesitar conexión. Si el navegador bloquea la voz, usa Repetir etapa. Con movimiento reducido se conserva la selección y narración manual de etapas.

## Exactitud

La máquina es una metáfora mecánica del modelo OSI. No representa hardware literal, no realiza peticiones reales y no implementa cifrado. El ejemplo usa HTTP/1.1, TLS 1.3 opcional, TCP/IPv4 y Ethernet en un solo enlace, con conexiones ya establecidas. La página explica las diferencias entre OSI y la pila real de Internet, las funciones agrupadas de L5–L7, la ausencia de una cabecera adicional de sesión y los límites del ejemplo de un solo segmento.

Los tamaños proceden de los bytes del mensaje: petición HTTP de 53 B; respuesta HTTP de 82 B. TLS añade 22 B en el caso elegido, TCP 20 B, IPv4 20 B y Ethernet 18 B incluyendo FCS. La cuenta física excluye preámbulo/SFD, IFG y codificación del medio.

Las referencias primarias a ITU-T y las RFC aparecen dentro del HTML y en `DESIGN.md`.

## Construir y verificar

```sh
node model.test.mjs
node narration.test.mjs
node build.mjs --audit
node build.mjs --dark
node verify.mjs
node verify-narration.mjs
```

El kit de Anatomy necesario para construir y auditar la figura está incluido en `vendor/anatomy/`, junto con su licencia MIT. No necesitas instalar la skill ni dependencias npm. El HTML final no necesita el kit.

`verify.mjs` produce `shots/verification.html`, una copia de prueba que se puede abrir en el navegador. Ejercita los cuatro casos y ejecuta el mismo comprobador de extremos de línea que usa la skill en seis etapas de ambos temas. Este modo de revisión permite verificar el DOM real cuando Chrome headless no puede arrancar en el entorno.

La auditoría registra las formas reales de 73 sólidos y mide el orden de dibujo en 81 combinaciones independientes de posición de los carros. Los objetos móviles reutilizan la geometría y se ordenan según la misma proyección durante la animación.

`narration.test.mjs` verifica el controlador de voz con temporizadores deterministas: selección de voz española, velocidad, cancelación, callbacks obsoletos, errores, timeout y los guiones de las 60 combinaciones de etapa y escenario. `verify-narration.mjs` genera una copia de prueba con síntesis simulada que comprueba la sincronización en el DOM real y el recorrido de 15 etapas completo. La prueba nativa de voz real confirmó los estados de inicio y fin de Chrome; no es una evaluación de calidad acústica.

## Publicación con GitHub Pages

Requiere Node.js 22 o superior. Para comprobar y empaquetar localmente:

```sh
npm test
npm run build
npm run check
```

`dist/index.html` es la entrada del sitio; las dos variantes autónomas también se incluyen. En Settings → Pages, el origen debe ser **GitHub Actions**. El workflow `.github/workflows/pages.yml` valida el modelo y la narración, audita la geometría, construye los dos temas y publica únicamente `dist/` después de cada push a `main`. Las pull requests ejecutan las comprobaciones sin publicar.

Para volver a una versión anterior, revierte el commit correspondiente y sube el cambio a `main`; el mismo workflow publicará esa versión. También puedes ejecutar el workflow manualmente desde Actions.

## Dependencias incluidas

Los archivos de `vendor/anatomy/` proceden del kit y comprobador de líneas de la skill Anatomy, bajo licencia MIT; se conserva el aviso original en `vendor/anatomy/LICENSE`. Se incluyen las dependencias transitivas del auditor para permitir builds reproducibles fuera del equipo original.
