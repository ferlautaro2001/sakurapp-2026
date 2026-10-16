# Changelog

Todos los cambios notables de SakurApp se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
A partir de esta entrega se utiliza [Versionado Semántico](https://semver.org/lang/es/)
con tres componentes. Se conservan las etiquetas históricas `v0` y `v0.1`, sin renombrarlas.

Este historial se reconstruyó a partir de los commits, las releases y el backlog oficial.
Las referencias a épicas e historias identifican el alcance relacionado; no implican que
todos sus criterios de aceptación estén cerrados.

## [Sin publicar]

Sin cambios registrados todavía.

## [0.2.0] - 2026-09-26

### Añadido

- Desglose de subtotal, descuento, porcentaje y total final en el resumen del pedido;
  el beneficio se presenta en verde y se distingue del intento sin premio.
  Relacionado con la [Épica 7: Comanda digital](https://github.com/ferlautaro2001/sakurapp-2026/issues/82),
  [US-7.1: Importe y tiempo estimado](https://github.com/ferlautaro2001/sakurapp-2026/issues/83)
  y [US-7.3: Seguimiento y juegos](https://github.com/ferlautaro2001/sakurapp-2026/issues/89).
- Acciones de edición y acceso al QR desde las tarjetas de mesa, y edición de capacidad
  y tipo de mesa para los perfiles habilitados.
  [Épica 4: Catálogo y mesas](https://github.com/ferlautaro2001/sakurapp-2026/issues/50),
  [US-4.3: Configuración y QR](https://github.com/ferlautaro2001/sakurapp-2026/issues/55)
  y [US-4.4: Tablero de mesas](https://github.com/ferlautaro2001/sakurapp-2026/issues/57).
- Cierre y reapertura de consultas con historial conservado y reapertura ante nuevos
  mensajes del cliente; indicadores de lectura basados en marcas de tiempo.
  [Épica 6: Menú y conversación](https://github.com/ferlautaro2001/sakurapp-2026/issues/76)
  y [US-6.2: Consulta al mozo](https://github.com/ferlautaro2001/sakurapp-2026/issues/79).
- Controles de cantidad en el detalle del producto para quienes pueden pedir y listado
  expandible de productos en los pedidos.
  [US-6.1: Exploración del menú](https://github.com/ferlautaro2001/sakurapp-2026/issues/77)
  y [US-7.1](https://github.com/ferlautaro2001/sakurapp-2026/issues/83).
- Presentación de premios por juego y efecto de impacto con pétalos en Ninja de Sakura.
  [US-7.3](https://github.com/ferlautaro2001/sakurapp-2026/issues/89).
- Script de apoyo a la auditoría responsive con rutas, seis tamaños de pantalla de
  320 a 430 px y detector de desbordes, recortes y dimensiones táctiles.
- Catálogo visual de los QR reales del sistema y de las doce mesas en el README.

### Cambiado

- Adaptación mobile del sistema de diseño y las pantallas de acceso, administración,
  cliente, mozo, metre, cocina y barra: tipografía y espaciado fluidos con `clamp()`,
  rejillas adaptables, zonas seguras, alturas dinámicas y controles táctiles de al menos
  44 px, con extensiones de área de toque donde corresponde.
  [Épica 0: Infraestructura y diseño](https://github.com/ferlautaro2001/sakurapp-2026/issues/20)
  y [US-0.2: Design System Sakura](https://github.com/ferlautaro2001/sakurapp-2026/issues/23).
- Orientación vertical declarada en Android; adaptación de juegos y sus superficies
  gráficas, incluido el seguimiento del tamaño de la cancha de Ninja de Sakura.
- Mayor legibilidad en tarjetas, formularios y devolución de pedidos; transiciones
  suaves en filtros y agrupación de filtros del salón.
- Detalle de producto unificado entre roles, indicador de disponibilidad más compacto
  y eliminación de flores decorativas sobre las fotos de productos.
- Fotos de registro y perfil circulares, centradas y con recorte para rellenar su marco;
  doce PNG de sushi normalizados. Avatar del encabezado ampliado a 48–56 px, con
  imagen a tamaño completo, nombre y rol más legibles. Logo del login ampliado.
  [Épica 1: Identidad y acceso](https://github.com/ferlautaro2001/sakurapp-2026/issues/27),
  [US-1.2: Login](https://github.com/ferlautaro2001/sakurapp-2026/issues/30) y
  [US-1.4: Identificación de sesión](https://github.com/ferlautaro2001/sakurapp-2026/issues/34).
- Pantalla de devolución centrada y modal enriquecido con íconos, conservando su texto.
  [US-7.2: Revisión y devolución](https://github.com/ferlautaro2001/sakurapp-2026/issues/86).
- Versiones de npm y Android alineadas con `0.2.0`; incremento del código de versión Android.
- Exclusión del material local de revisión y de la transcripción de sesión del repositorio.

### Corregido

- Escucha compartida de conversaciones que quedaba desconectada al salir de una pantalla:
  ahora se administra por referencias y cada consumidor libera su suscripción.
- Indicador de consulta que permanecía como no leída, nombres duplicados en la bandeja
  y disposición de los hilos respecto del encabezado.
- Miniaturas QR rotas: generación a partir del contenido de la mesa y recursos incluidos
  en la aplicación. Eliminación de leyendas explicativas redundantes del detalle.
- Destino del botón durante la revisión del pedido, que ahora invita a jugar mientras
  se espera en lugar de dirigir a las encuestas.
- Recortes del logotipo y precios por interlineado, palabras partidas en los rótulos
  «Elaboración» y «Comensales», y separación del contador en el título de pedidos.
- Objetivos táctiles reducidos por transformaciones en el carrusel y controles demasiado
  pequeños en la pantalla de QR. Decoraciones de juegos sin interceptar pulsaciones.

## [0.1] - 2026-09-12

### Añadido

- Aprobación y rechazo de clientes por dueño/supervisor, alta de empleados, correos
  institucionales con Brevo y notificaciones push con Firebase Cloud Messaging.
  [Épica 3: Aprobaciones y personal](https://github.com/ferlautaro2001/sakurapp-2026/issues/43):
  [US-3.1: Supervisión](https://github.com/ferlautaro2001/sakurapp-2026/issues/44),
  [US-3.2: Notificaciones](https://github.com/ferlautaro2001/sakurapp-2026/issues/46)
  y [US-3.3: Alta de personal](https://github.com/ferlautaro2001/sakurapp-2026/issues/48).
- Alta de platos y bebidas con tres fotografías, tiempo de elaboración y catálogo;
  creación de mesas con fotografía, QR y disponibilidad sincronizada.
  [Épica 4](https://github.com/ferlautaro2001/sakurapp-2026/issues/50):
  [US-4.1: Platos](https://github.com/ferlautaro2001/sakurapp-2026/issues/51),
  [US-4.2: Bebidas](https://github.com/ferlautaro2001/sakurapp-2026/issues/53),
  [US-4.3: Mesas y QR](https://github.com/ferlautaro2001/sakurapp-2026/issues/55)
  y [US-4.4: Disponibilidad](https://github.com/ferlautaro2001/sakurapp-2026/issues/57).
- Ingreso al salón por QR, registro en lista de espera, consulta de posición,
  panel del metre, asignación transaccional de mesas y validación del QR asignado.
  Consulta de encuestas anteriores con gráficos.
  [Épica 5: Control de salón](https://github.com/ferlautaro2001/sakurapp-2026/issues/68):
  [US-5.1: Ingreso](https://github.com/ferlautaro2001/sakurapp-2026/issues/69),
  [US-5.2: Espera](https://github.com/ferlautaro2001/sakurapp-2026/issues/71)
  y [US-5.3: Asignación](https://github.com/ferlautaro2001/sakurapp-2026/issues/73).
- Carta vinculada a la mesa con carrusel de fotografías y chat mesa–mozo en tiempo real,
  bandeja de consultas, identificación de remitentes, fecha y avisos push de respuesta.
  [Épica 6](https://github.com/ferlautaro2001/sakurapp-2026/issues/76),
  [US-6.1](https://github.com/ferlautaro2001/sakurapp-2026/issues/77)
  y [US-6.2](https://github.com/ferlautaro2001/sakurapp-2026/issues/79).
- Carrito con importes y tiempo estimado, envío al mozo, confirmación y derivación a
  cocina/barra, devolución con motivo, corrección y reenvío por el cliente.
  [Épica 7](https://github.com/ferlautaro2001/sakurapp-2026/issues/82),
  [US-7.1](https://github.com/ferlautaro2001/sakurapp-2026/issues/83),
  [US-7.2](https://github.com/ferlautaro2001/sakurapp-2026/issues/86)
  y [US-7.3](https://github.com/ferlautaro2001/sakurapp-2026/issues/89).
- Minijuegos Ninja de Sakura, Emparejando sushis y Tateti de sushis, vinculados a la
  espera y los descuentos del pedido ([US-7.3](https://github.com/ferlautaro2001/sakurapp-2026/issues/89)).
- Recarga en vivo en Android para desarrollo y procesamiento de notificaciones mediante Cloud Functions.

### Cambiado

- Rediseño integral Sakura, pantallas de destino por perfil y navegación reactiva con
  signals y sincronización en tiempo real en lugar de consultas periódicas.
- Registro con validación de CUIL, normalización de nombres, pantallas de solicitud
  enviada y estado de cuenta; correos institucionales personalizados.
  [Épica 2: Registro y hardware](https://github.com/ferlautaro2001/sakurapp-2026/issues/36)
  y [US-2.2: Registro y estado](https://github.com/ferlautaro2001/sakurapp-2026/issues/39).
- Navegación con botón físico de retroceso, avisos modales y sonidos de apertura/cierre.
- Notificaciones segmentadas por rol y ajustes del empaquetado Android.

### Corregido

- Fallo de arranque del APK, persistencia y redirección de sesión, ingreso de invitados
  y distribución del login en pantallas móviles.
- Reintento de cámara tras conceder permiso, selección de fotos en navegador y
  legibilidad del visor del escáner.
- Persistencia del registro en Data Connect, duplicación de números de mesa y
  sobreescritura de mesas durante la sincronización.
- Aprobación de registros con una sola confirmación y alineación de mensajes del chat.

### Seguridad

- Exclusión de `google-services.json` del seguimiento de Git y protección de rutas por perfil.

## [0] - 2026-08-29

Primera versión publicada, conservada bajo la etiqueta `v0`.

### Añadido

- Base Angular/Ionic/Capacitor, configuración de Firebase Data Connect y Cloud SQL,
  esquema de datos, SDK tipado, almacén con datos de contingencia y generación de entorno.
  [Épica 0](https://github.com/ferlautaro2001/sakurapp-2026/issues/20)
  y [US-0.1: Infraestructura](https://github.com/ferlautaro2001/sakurapp-2026/issues/21).
- Sistema de diseño Sakura con tokens, tipografía, imágenes, audio, botones, tarjetas,
  encabezados, formularios reactivos, avisos hápticos y carga centralizada.
  [US-0.2](https://github.com/ferlautaro2001/sakurapp-2026/issues/23)
  y [US-0.3: Feedback y formularios](https://github.com/ferlautaro2001/sakurapp-2026/issues/25).
- Splash animado, presentación institucional, login con ocho accesos rápidos,
  autenticación Firebase, guards de sesión y pantalla inicial con cierre de sesión confirmado.
  [Épica 1](https://github.com/ferlautaro2001/sakurapp-2026/issues/27):
  [US-1.1: Bienvenida](https://github.com/ferlautaro2001/sakurapp-2026/issues/28),
  [US-1.2: Login](https://github.com/ferlautaro2001/sakurapp-2026/issues/30),
  [US-1.3: Autenticación](https://github.com/ferlautaro2001/sakurapp-2026/issues/32)
  y [US-1.4: Sesión](https://github.com/ferlautaro2001/sakurapp-2026/issues/34).
- Servicios de cámara y lectura de DNI, registro de cliente, ingreso como invitado
  y pantallas de estado de cuenta, con integración de datos y fotografías.
  [Épica 2](https://github.com/ferlautaro2001/sakurapp-2026/issues/36):
  [US-2.1: Cámara y DNI](https://github.com/ferlautaro2001/sakurapp-2026/issues/37),
  [US-2.2: Registro](https://github.com/ferlautaro2001/sakurapp-2026/issues/39)
  y [US-2.3: Persistencia](https://github.com/ferlautaro2001/sakurapp-2026/issues/41).
- Proyecto Android integrado e instrucciones de instalación y configuración en el README.

[Sin publicar]: https://github.com/ferlautaro2001/sakurapp-2026/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ferlautaro2001/sakurapp-2026/compare/v0.1...v0.2.0
[0.1]: https://github.com/ferlautaro2001/sakurapp-2026/compare/v0...v0.1
[0]: https://github.com/ferlautaro2001/sakurapp-2026/releases/tag/v0
