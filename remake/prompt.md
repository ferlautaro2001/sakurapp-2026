Los juegos ahora deberán comportarse así como en la-mesa:

  - la-mesa: tres juegos reales, disponibles durante la espera y después de confirmar el pedido; todavía no conecta premios, son los que ya están implementados, esos si te los podes copy y pastear tranquilo.

  

  Mi recomendación para conservar ambas virtudes:

  - Durante la espera de mesa, permitir los tres juegos en modo libre, sin consumir intento ni dar descuento.

  - Con un pedido confirmado, permitir elegir uno de los tres; la primera partida válida consume el intento del pedido y su resultado determina el premio.

  - Mantener la restricción de recompensa para cliente registrado.

  Si eso te sirve, no queda ninguna duda bloqueante.

  # Texto exacto para pasarle a Gemini

  Quiero que migres a este repositorio:

  C:\Users\Sunset\orca\workspaces\sakurapp-2026\plankton

  la UI, la UX y los flujos de usuario de este worktree de referencia:

  C:\Users\Sunset\Desktop\mesa2026\la-mesa

  El repositorio la-mesa es únicamente una referencia visual y de experiencia.

  No lo modifiques. No copies su arquitectura de persistencia.

  OBJETIVO

  Plankton debe conservar toda su lógica, backend y funcionalidades avanzadas,

  pero visualmente y en su recorrido debe comportarse como la-mesa, tomando

  también como referencia las 28 capturas de:

  C:\Users\Sunset\orca\workspaces\sakurapp-2026\plankton\remake

  Al terminar deben estar completos los flujos de:

  1. Cliente registrado.

  2. Cocinero.

  3. Mozo.

  4. Supervisor.

  No me preguntes por qué rol empezar. Primero hacé el inventario y después

  implementá todos los roles en fases, sin detenerte después del primero.

  REGLAS DE PRECEDENCIA

  Cuando ambos repositorios entren en conflicto:

  1. La lógica de dominio, persistencia, autenticación y sincronización de

     plankton siempre gana.

  2. La composición visual, jerarquía, navegación y experiencia de la-mesa gana.

  3. Los estados o features que sólo existen en plankton no se eliminan:

     se conservan y se diseñan usando el mismo lenguaje visual de la-mesa.

  4. El worktree la-mesa debe tratarse como read-only.

  NO COPIAR NI REEMPLAZAR

  No reemplaces ni copies completos desde la-mesa:

  - AlmacenService.

  - Servicios de pedidos, usuarios, mesas, espera, consultas o sesión.

  - Modelos y enums.

  - Guards.

  - Semillas.

  - AppComponent.

  - Configuración de Firebase.

  - Data Connect.

  - Variables de entorno.

  - package.json.

  - Configuración de Android o Capacitor.

  No sustituyas:

  - Firebase Authentication.

  - Firestore.

  - Data Connect/SQL.

  - Push notifications.

  - CarritoService.

  - ChatService.

  - La lógica actual de rechazo y corrección.

  - Los estados avanzados de Pedido.

  - Las pruebas existentes.

  No renombres colecciones, documentos, campos persistidos ni contratos de los

  servicios sólo para hacerlos coincidir con la-mesa.

  ICONOS

  No copies ni reemplaces iconos, avatares, logos o assets gráficos desde

  la-mesa. Conservá la iconografía y los assets actuales de plankton.

  Sí podés copiar su ubicación, tamaño, espaciado, contraste, badges y jerarquía.

  Para pantallas nuevas usá el componente de iconos y los assets ya presentes

  en plankton.

  QUÉ SIGNIFICA “TOCAR LO MÍNIMO POSIBLE LOS TS”

  Los templates y muchos estilos están inline en archivos .ts, por lo que está

  permitido modificar:

  - template.

  - styles.

  - imports de componentes de presentación.

  - Signals/computed exclusivamente necesarios para presentar estados existentes.

  - Handlers que deleguen en servicios actuales.

  - Navegación y rutas.

  - Adaptadores entre modelos actuales y componentes visuales.

  No reescribas métodos de dominio ni servicios existentes por comodidad.

  Sólo agregá lógica nueva en servicios cuando la pantalla realmente necesite

  una operación que plankton todavía no tenga, por ejemplo el avance de una

  comanda por Cocina o Barra.

  SISTEMA VISUAL

  tokens.css y global.scss ya son idénticos en ambos repositorios. No los

  reescribas innecesariamente.

  Tomá componentes.css de la-mesa como referencia visual para las clases

  compartidas, pero hacé un merge selectivo:

  - Las clases compartidas deben adoptar la apariencia de la-mesa.

  - Las clases exclusivas de plankton deben conservarse y adaptarse a esa misma

    gramática visual.

  - No elimines selectores usados por pantallas actuales.

  - Recuperá comportamientos presentes en la-mesa que faltan acá:

    lm-screen--florida, botones compactos, badges, pestañas, actionbars,

    modales, estados marcados y controles de cantidad.

  - Conservá las mejoras actuales necesarias para cámara, accesibilidad,

    fotos reales y funcionalidades nuevas, siempre que no contradigan las

    capturas de referencia.

  Portá o adaptá desde ui/:

  - lm-pestanas.

  - lm-area.

  - El globo numérico de lm-icono-boton.

  - lm-resumen-pedido.

  - lm-cantidad.

  - lm-renglon-pedido.

  - lm-fila-pedido.

  - lm-burbuja.

  No copies ui/pedidos.ts literalmente: adaptalo a los modelos de plankton.

  En particular, plankton usa estadoGlobal, productoNombre, totalFinal y

  CarritoService. Algunos PedidoItem no tienen tiempoElaboracion; obtenelo

  mediante ProductosService o un adaptador, sin romper el esquema persistido.

  NAVEGACIÓN

  Reimplementá la navegación contextual de la-mesa, pero usando las rutas y

  estados reales de plankton.

  La barra del cliente debe depender de:

  - Estado de la espera.

  - Si ya escaneó y vinculó la mesa.

  - Si está armando el carrito.

  - Estado global del pedido.

  - Si el pedido fue devuelto.

  - Si los juegos están habilitados.

  Comportamiento esperado:

  - Esperando mesa:

    Mi lugar / Juegos / Encuestas.

  - Mesa asignada pero no escaneada:

    Mi lugar / Juegos / Encuestas.

  - Mesa vinculada, sin pedido o editándolo:

    Mi mesa / Carta / Mi pedido.

  - Pedido enviado y esperando al mozo:

    mostrar únicamente el pedido; la barra puede desaparecer al quedar un

    solo destino.

  - Pedido devuelto:

    Mi mesa / Carta / Mi pedido, sin juegos de recompensa.

  - Confirmado, en preparación o listo:

    Mi pedido / Juegos.

  - Estados posteriores de plankton —entregado, recibido, cuenta, pago y

    cerrado— deben conservarse y recibir una navegación coherente.

  El mozo debe tener:

  - Mesas.

  - Pedidos.

  - Consultas.

  - Carta.

  Cocinero y cantinero deben tener:

  - Pedidos/comandas.

  - Carta.

  Supervisor y dueño deben tener:

  - Registros.

  - Mesas.

  - Códigos.

  - Correos.

  No uses una lista global de “rutas implementadas” para esconder funciones que

  deberían existir. Implementá las rutas faltantes. Si cambiás URLs, conservá

  compatibilidad mediante redirects o aliases para los enlaces actuales.

  FLUJO DEL CLIENTE

  Reproducí la secuencia visual y de interacción de la-mesa:

  1. Escaneo de ingreso.

  2. Espera con posición, personas delante, hora y actualización.

  3. Mesa asignada con notificación.

  4. Escaneo obligatorio del QR exacto de esa mesa.

  5. Confirmación de mesa vinculada.

  6. Carta.

  7. Pedido editable.

  8. Modal antes de enviarlo.

  9. Espera de revisión del mozo.

  10. Pedido devuelto y corrección, si corresponde.

  11. Estado por Cocina y Barra.

  12. Pedido listo.

  Carta:

  - Filtros Todos, Comidas, Bebidas y Postres.

  - Buscador.

  - Producto con foto, descripción, precio y tiempo.

  - Tocar la fila abre la ficha.

  - El + de la fila agrega directamente.

  - Al agregar, mostrar − cantidad + sin reacomodar el texto.

  - Mostrar el resumen fijo de total, demora y unidades.

  - “Elegí lo primero” deshabilitado cuando está vacío.

  - “Ver mi pedido” cuando hay productos.

  - Productos sin stock siguen visibles y claramente marcados.

  - Las restricciones de un pedido devuelto también deben verse en la carta.

  No obligues a entrar en la ficha sólo para agregar un producto.

  Pedido:

  - No presentes “carrito” y “pedido” como dos conceptos distintos para el

    usuario. Internamente puede seguir existiendo CarritoService.

  - La pantalla editable debe verse como “Mi pedido”.

  - Conservar el modal de confirmación antes del envío.

  - Mientras el mozo revisa, no permitir editar.

  - Si vuelve rechazado, mostrar:

    motivo, mozo, alcance, marcas amarillas/rojas, controles válidos y razón

    exacta por la que todavía no puede reenviar.

  - Nunca borrar automáticamente los productos marcados.

  - Conservar el atajo confirmado para quitar todos los rojos.

  - Mantener las reglas actuales de traba para reenviar.

  - Mostrar Cocina y Barra solamente cuando aplican.

  - Mostrar los estados avanzados de plankton sin reducirlos a los estados

    limitados de la-mesa.

  Consulta:

  - El acceso debe estar en el encabezado, junto al cierre de sesión, durante

    toda la estadía en mesa.

  - Mostrar badge real de mensajes sin leer.

  - No simular el contador.

  - Mantener ChatService, Firestore, tiempo real, push, hora, nombre del mozo,

    sugerencias rápidas y confirmación de envío actual.

  - Visualmente usar la sala limpia/florida de la-mesa.

  - No reemplazar el chat actual por ConsultasService local.

  Juegos:

  - Portar los tres juegos jugables de la-mesa:

    Ninja de Sakura, Emparejando sushis y Tateti de sushis.

  - No dejar tarjetas que lleven a pantallas inexistentes.

  - Durante la espera de mesa pueden jugarse en modo libre sin premio.

  - Con pedido confirmado, el primer juego elegible completado consume el

    único intento del pedido.

  - Integrar el resultado con la lógica de descuento existente en plankton.

  - El intento debe registrarse en el backend actual, no sólo en memoria.

  - Cliente anónimo no recibe descuento.

  - No reemplazar la lógica actual con el almacenamiento local de la-mesa.

  FLUJO DEL MOZO

  Pedidos:

  - Bandejas “Para revisar” y “En curso”.

  - Fila con mesa, cliente, hora, ítems, cantidad, demora y total.

  - Confirmar y Devolver dentro de la fila.

  - La fila abre el detalle completo.

  - Confirmar requiere modal.

  - Devolver abre una pantalla completa, no un modal pequeño.

  - Mantener las marcas:

    amarillo = bajar cantidad;

    rojo = retirar o reemplazar.

  - El motivo es obligatorio.

  - El alcance parcial/total se calcula según los renglones marcados.

  - Conservar la persistencia, notificaciones y reglas actuales de plankton.

  Consultas:

  - Crear la sección/bandeja de consultas del mozo usando

    ChatService.conversacionesActivas.

  - Mostrar mesa, cliente, vista previa, remitente y contador real sin leer.

  - Al tocar, abrir el chat existente de la mesa.

  - Mantener el chat rico actual; sólo adaptarlo a la composición visual de

    la-mesa.

  - La consulta puede contestarla cualquier mozo.

  Mesas:

  - Mantener capacidades, estados, tipo, accesibilidad, VIP y chat actual.

  - Visualmente usar la grilla de tarjetas iguales de la-mesa.

  - Las acciones deben vivir dentro de cada tarjeta.

  - No perder QR ni chat.

  - No hacer que tocar accidentalmente toda la tarjeta ejecute una acción

    destructiva.

  Carta:

  - Debe ser informativa para el mozo: sin controles para agregar al carrito.

  FLUJO DE COCINA Y BARRA

  Portar la pantalla sector/pedidos de la-mesa, adaptada a los Pedido de

  plankton:

  - Agrupar por mesa.

  - Mostrar sólo los ítems del sector correspondiente.

  - Filtros Todos, Pendientes, Preparando y Listos.

  - Estado pendiente.

  - Confirmación antes de empezar.

  - Estado en preparación.

  - Confirmación antes de marcar listo.

  - Estado listo.

  No copies avanzarSector de la-mesa porque persiste localmente.

  Implementá en el servicio actual una operación equivalente que:

  - Actualice estadoCocina o estadoBar.

  - Persista en Firestore.

  - Persista también en Data Connect/SQL.

  - Mantenga sincronizadas las señales actuales.

  - Recalcule estadoGlobal:

    CONFIRMADO mientras todos los sectores aplicables estén pendientes;

    EN_PREPARACION cuando alguno empezó o terminó pero todavía falta otro;

    LISTO solamente cuando todos los sectores aplicables estén LISTO.

  - Notifique al cliente cuando cambia cada sector.

  - Notifique a los mozos cuando todos los sectores terminaron.

  - Sea idempotente y rechace regresiones de estado inválidas.

  Si Data Connect no tiene una mutación para avanzar el sector, agregala al

  conector y regenerá los tipos; no hagas un cast ni un parche exclusivamente

  local.

  Actualizá SesionService.rutaInicio para que cocinero y cantinero aterricen en

  sus comandas, no directamente en Carta.

  FLUJO DEL SUPERVISOR

  Registros:

  - Usar el listado de la-mesa:

    título Registros pendientes, contador, buscador, pestañas y aceptar/rechazar

    dentro de cada fila.

  - Conservar la foto/ficha ampliada actual.

  - Agregar el flujo de resultado previo a mutar:

    aprobación con consecuencias claras;

    rechazo con motivo opcional o requerido según la regla actual.

  - El motivo debe llegar al CorreoService.enviarRechazo.

  - No perder Firebase, SQL, notificación push ni vibración actual.

  - Evitar doble resolución desde dos dispositivos.

  Correos:

  - Agregar la bandeja de correos automáticos de la-mesa.

  - Leer los CorreoEnviado que plankton ya guarda.

  - Mostrar asunto, destinatario, fecha, entregado/en bandeja y vista previa.

  - No sustituir el envío Brevo actual.

  Códigos:

  - Agregar la pantalla con pestañas Ingreso, Propinas y Mesas.

  - Usar QrService actual, que ya soporta los tres tipos.

  - Permitir compartir/imprimir.

  - Mostrar los cinco porcentajes actuales: 20, 15, 10, 5 y 0.

  - En Mesas, usar las mesas reales y sus QR persistidos.

  Mesas:

  - Mantener altas, edición, disponibilidad, fotos y QR de plankton.

  - Aplicar la grilla y jerarquía visual de la-mesa.

  RESPONSIVE Y ACCESIBILIDAD

  Validar como mínimo:

  - 360 × 640.

  - 375 × 812.

  - 702 × 1600, correspondiente a las capturas.

  En todas:

  - Encabezado y navegación no deben desplazarse con el cuerpo.

  - El actionbar debe quedar accesible.

  - No debe haber scroll horizontal.

  - No debe cortarse texto importante.

  - Ningún botón debe quedar debajo de la navegación de Android.

  - Área táctil mínima de 44–48 px.

  - Estados comunicados con texto además de color.

  - Inputs con label/aria-label.

  - Modales con foco y cierre coherentes.

  - Respetar safe-area-inset.

  - Mantener español rioplatense y voseo.

  FORMA DE TRABAJO

  Antes de modificar:

  1. Ejecutá y registrá el resultado de build y tests de plankton.

  2. Inventariá las rutas y pantallas actuales.

  3. Armá una tabla origen → destino para cada pantalla de la-mesa.

  4. Identificá componentes compartidos antes de duplicar CSS.

  Implementá en este orden:

  1. Componentes visuales compartidos.

  2. Navegación contextual y rutas/aliases.

  3. Cliente.

  4. Mozo.

  5. Cocina/Barra.

  6. Supervisor.

  7. Estados avanzados exclusivos de plankton.

  8. Responsive, accesibilidad y limpieza.

  Después de cada fase:

  - npm run build

  - npm test -- --watch=false

  No corrijas una falla borrando tests ni ocultando rutas.

  Al final entregame:

  - Archivos modificados.

  - Componentes nuevos.

  - Rutas agregadas o mantenidas como alias.

  - Lógica de dominio nueva y por qué fue necesaria.

  - Confirmación explícita de que no se reemplazó Firebase/Data Connect.

  - Resultado del build y tests.

  - Checklist manual de los cuatro flujos.

  - Funcionalidades previas que verificaste que no se perdieron.

  - Cualquier diferencia visual inevitable respecto de las 28 capturas.

  No consideres terminada la tarea con sólo cambiar colores o CSS. Deben

  funcionar las transiciones entre pantallas y los cuatro recorridos completos.

