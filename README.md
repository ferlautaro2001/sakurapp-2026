# 🌸 SakurApp - 2026
> **Trabajo Final Integrador (TFI)**  
> **Universidad Tecnológica Nacional - Facultad Regional Avellaneda (UTN FRA)**  
> **Grupo:** Sakura  
> **Repositorio:** `sakurapp-2026`

---

## Integrantes y Backlog

La planificación, fechas de inicio/finalización, branches y detalle de historias de usuario se gestionan centralizadamente en el **Backlog oficial de GitHub Projects**:

* 📌 **Tablero de Proyecto & Backlog:** [GitHub Projects - Tablero Sakura](https://github.com/users/ferlautaro2001/projects/2)
* 🎫 **Gestión de Incidencias & User Stories:** [Issues del Repositorio](https://github.com/ferlautaro2001/sakurapp-2026/issues)

### Integrantes, módulos y plazos

Cada fila deja asentado quién develops cada módulo, desde cuándo y hasta cuándo, y en qué
branch vive su trabajo. Si un integrante no llegara a terminar con la funcionalidad
comprometida, el plazo se cambia o el módulo se reasigna, y queda registrado acá.

| Integrante | Rol | Módulos (objetivos) a desarrollar | Fecha de inicio | Fecha de finalización | Branch |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Fernandez Di Bella, Lautaro Alfredo** (@ferlautaro2001) | Líder de proyecto | Épica 0 (Infraestructura, Data Connect, Design System) · US-1.4 (home y logout) · US-3.2 (push + correo corporativo) · US-4.3 (mesas y QR) · US-5.3 (asignación de mesa) · US-6.2 (consulta al mozo y chat) · integración de `main` y anotación en las revisiones semanales | 22-08-2026 | 17-10-2026 *(en curso: Épicas 8 a 15)* | `lauti` · `feat/setup-design-splash` · `feat/backend-data-auth` |
| **Graneros, Johann** (@johanngraneros) | Desarrollo | US-4.1 (alta de platos con 3 fotos) · US-4.4 (tablero de mesas) · US-6.1 (carta desde el QR de mesa) · US-7.1 (comanda digital con total acumulado) | 28-08-2026 | 12-09-2026 | `johann` |
| **Garcez, Gonzalo** (@gonzadjstaff-hue) | Desarrollo | US-3.3 (alta de personal con foto y lector de DNI) · US-4.2 (alta de bebidas y coctelería) · US-5.2 (lista de espera del metre) · US-7.3 (confirmación del pedido y derivación a sectores) | 29-08-2026 | 09-09-2026 | `gonzalo` · `feat/login-accesos-rapidos` |
| **Nagel Cano, Sabrina** (@sabrinanagel) | Desarrollo | US-3.1 (aprobación y rechazo de clientes) · US-5.1 (invitado y QR de ingreso) · US-7.2 (rechazo de la comanda y re-edición) | 29-08-2026 | 19-10-2026 | `sabrina` · `feat/registro-cliente-home` |

> **Estado de los plazos al 20-10-2026:** no hay módulos sin terminar ni plazos vencidos.
> Los módulos entregados hasta el punto 15 del enunciado están terminados y verificados.
> El trabajo que sigue (puntos 16 a 24) está asignado y anotado en las issues nuevas del
> backlog, con su responsable y su branch.

---

## Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Angular-DD0031?style=flat-square&logo=angular&logoColor=white" alt="angular"/>
  <img src="https://img.shields.io/badge/Ionic-3880FF?style=flat-square&logo=ionic&logoColor=white" alt="ionic"/>
  <img src="https://img.shields.io/badge/Capacitor-119EFF?style=flat-square&logo=capacitor&logoColor=white" alt="capacitor"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="firebase"/>
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="typescript"/>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="html5"/>
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="css3"/>
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="javascript"/>
</p>

* **Framework & UI:** Angular 22 (Standalone Components) & Ionic 9 (`@ionic/angular`)
* **Mobile Runtime & Hardware:** Capacitor 8 (Cámara, Lector de Códigos de Barra/QR, Hápticos, Notificaciones)
* **Backend & Autenticación:** Firebase Authentication & Cloud Firestore / Data Connect / SQL Connect
* **Lenguajes & Estilos:** TypeScript 6, HTML5, SCSS/CSS3, Tailwind CSS & Font Awesome

---

## Índice Visual de Pantallas

Todas las imágenes del proyecto están en la carpeta [`visuals/`](visuals/) y se indexan acá.

### Capturas de las pantallas

| # | Pantalla | Imagen |
| :--- | :--- | :---: |
| 01 | Splash animado | <img src="visuals/01-splash-dinamico.png" width="150" alt="Splash animado"/> |
| 02 | Presentación estática | <img src="visuals/02-presentacion-estatica.png" width="150" alt="Presentación estática"/> |
| 03 | Login con accesos rápidos | <img src="visuals/03-login.png" width="150" alt="Login"/> |
| 04 | Registro de cliente | <img src="visuals/04-registro-cliente.png" width="150" alt="Registro de cliente"/> |
| 05 | Registro enviado | <img src="visuals/05-registro-enviado.png" width="150" alt="Registro enviado"/> |
| 06 | Registro de invitado | <img src="visuals/06-registro-invitado.png" width="150" alt="Registro de invitado"/> |
| 07 | Cuenta pendiente de aprobación | <img src="visuals/07-estado-cuenta-pendiente.png" width="150" alt="Estado de cuenta pendiente"/> |
| 08 | Cuenta rechazada | <img src="visuals/08-estado-cuenta-rechazado.png" width="150" alt="Estado de cuenta rechazado"/> |
| 09 | Home de la sesión | <img src="visuals/09-home-sesion.png" width="150" alt="Home de la sesión"/> |
| 10 | Confirmación de cierre de sesión | <img src="visuals/10-cierre-sesion-modal.png" width="150" alt="Cierre de sesión"/> |
| 11 | Login con error de validación | <img src="visuals/11-login-error-validacion.png" width="150" alt="Login con error de validación"/> |

### Paleta de marca

| Imagen | Imagen |
| :---: | :---: |
| <img src="visuals/paleta.png" width="220" alt="Paleta de la marca"/> | Paleta de colores y tipografías de Sakura |

### Códigos QR

Los 18 códigos QR del sistema (ingreso al local, 12 mesas y 5 propinas) están indexados con su
contenido en el [catálogo de códigos QR](#catálogo-de-códigos-qr-del-sistema) de más abajo.

### Galería externa

El sitio con todas las capturas en alta resolución, de los flujos y componentes de la
aplicación, está en:

🔗 **https://sakupantallas.vercel.app/**

---

## Catálogo de Códigos QR del Sistema

Códigos QR funcionales requeridos por la cátedra para pruebas y corrección desde la aplicación:

| Tipo de QR | Propósito / Contenido | Código QR |
| :--- | :--- | :---: |
| **Ingreso al Local** | Registro en lista de espera y encuestas.<br>`SAKURAPP:INGRESO` | <img src="visuals/qr-ingreso-salon.png" width="130" alt="QR Ingreso al Local"/> |
| **Mesa 1 (Estándar)** | Capacidad: 2 personas.<br>`SAKURAPP:MESA:1:5789beaababa4871915f0a6daaab091f` | <img src="visuals/qr-mesa-1.png" width="130" alt="QR Mesa 1"/> |
| **Mesa 2 (Estándar)** | Capacidad: 4 personas.<br>`SAKURAPP:MESA:2:3c5e4358468348998b390045fcbd31d7` | <img src="visuals/qr-mesa-2.png" width="130" alt="QR Mesa 2"/> |
| **Mesa 3 (Mov. Reducida)** | Capacidad: 4 personas.<br>`SAKURAPP:MESA:3:b65214c7b54f4fd189e46a60d0bee9d5` | <img src="visuals/qr-mesa-3.png" width="130" alt="QR Mesa 3"/> |
| **Mesa 4 (VIP)** | Capacidad: 6 personas.<br>`SAKURAPP:MESA:4:94a7066ea3494bdcbedd1c2459845a15` | <img src="visuals/qr-mesa-4.png" width="130" alt="QR Mesa 4"/> |
| **Mesa 5 (VIP)** | Capacidad: 8 personas.<br>`SAKURAPP:MESA:5:2f7aaec4773e44eea0a4a520aff439d9` | <img src="visuals/qr-mesa-5.png" width="130" alt="QR Mesa 5"/> |
| **Mesa 6 (Estándar)** | Capacidad: 2 personas.<br>`SAKURAPP:MESA:6:26ebe315479c4e7ca161ad71cf6ebfb3` | <img src="visuals/qr-mesa-6.png" width="130" alt="QR Mesa 6"/> |
| **Mesa 7 (Estándar)** | Capacidad: 2 personas.<br>`SAKURAPP:MESA:7:7a9ea8a4452543fab7bb4f99c6229588` | <img src="visuals/qr-mesa-7.png" width="130" alt="QR Mesa 7"/> |
| **Mesa 8 (Estándar)** | Capacidad: 10 personas.<br>`SAKURAPP:MESA:8:7920ad78064f40c188a1ebc2942edc37` | <img src="visuals/qr-mesa-8.png" width="130" alt="QR Mesa 8"/> |
| **Mesa 9 (Estándar)** | Capacidad: 2 personas.<br>`SAKURAPP:MESA:9:548920e39c014878947a83ef04518674` | <img src="visuals/qr-mesa-9.png" width="130" alt="QR Mesa 9"/> |
| **Mesa 10 (Estándar)** | Capacidad: 4 personas.<br>`SAKURAPP:MESA:10:9374985bbe1b417cbe23641cbee50021` | <img src="visuals/qr-mesa-10.png" width="130" alt="QR Mesa 10"/> |
| **Mesa 11 (VIP)** | Capacidad: 10 personas.<br>`SAKURAPP:MESA:11:c7929488007148a691185152881a3311` | <img src="visuals/qr-mesa-11.png" width="130" alt="QR Mesa 11"/> |
| **Mesa 12 (VIP)** | Capacidad: 5 personas.<br>`SAKURAPP:MESA:12:de59b91d24cb4fdb86971a320f1d2223` | <img src="visuals/qr-mesa-12.png" width="130" alt="QR Mesa 12"/> |
| **Propina Excelente (20%)** | Registrar 20% de propina.<br>`SAKURAPP:PROPINA:20` | <img src="visuals/qr-propina-20.png" width="130" alt="QR Propina 20%"/> |
| **Propina Muy Bueno (15%)** | Registrar 15% de propina.<br>`SAKURAPP:PROPINA:15` | <img src="visuals/qr-propina-15.png" width="130" alt="QR Propina 15%"/> |
| **Propina Bueno (10%)** | Registrar 10% de propina.<br>`SAKURAPP:PROPINA:10` | <img src="visuals/qr-propina-10.png" width="130" alt="QR Propina 10%"/> |
| **Propina Regular (5%)** | Registrar 5% de propina.<br>`SAKURAPP:PROPINA:5` | <img src="visuals/qr-propina-5.png" width="130" alt="QR Propina 5%"/> |
| **Propina Malo (0%)** | Registrar 0% de propina.<br>`SAKURAPP:PROPINA:0` | <img src="visuals/qr-propina-0.png" width="130" alt="QR Propina 0%"/> |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js (v20+ recomendado)
* npm
* Android Studio (con Android SDK y emulador o dispositivo físico configurado)

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/ferlautaro2001/sakurapp-2026.git
cd sakurapp-2026
npm install
```

### 2. Variables de entorno
Copiar la plantilla de ejemplo para generar el archivo local `.env`:
```bash
cp .env.example .env
```
*(Completar con las credenciales de Firebase y Data Connect si es necesario).*

---

## 📱 Cómo Levantar en Android Studio

> [!NOTE]
> La plataforma nativa ya está completamente integrada en la carpeta `android/` del repositorio (no es necesario ejecutar `npx cap add android`).

### Opción A: Comando automático todo-en-uno (Recomendado)
Compila la web, inyecta las variables de entorno, sincroniza con Capacitor y abre Android Studio de forma automática:
```bash
npm run android
```

### Opción B: Paso a paso por consola
```bash
# 1. Compilar la aplicación web de Angular (dispara prebuild y set-env)
npm run build

# 2. Sincronizar el bundle compilado y plugins con Android nativo
npx cap sync android

# 3. Abrir el proyecto en Android Studio
npx cap open android
```

### Pasos dentro de Android Studio:
1. Al abrir, esperar unos segundos a que finalice la sincronización inicial de Gradle (**Gradle Sync**).
2. Seleccionar un emulador virtual (AVD) o tu dispositivo físico conectado con depuración USB.
3. Presionar el botón **Run 'app' (▶️)** en la barra superior (o presionar `Shift + F10`).

> [!TIP]
> **Generar APK debug por terminal:**
> Podés compilar directamente el archivo `.apk` sin abrir la interfaz gráfica de Android Studio ejecutando:
> ```bash
> npm run android:apk
> ```
> El instalable se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🌐 Ejecución en Navegador Web (Desarrollo)

Para probar la aplicación en el navegador localmente:
```bash
npm start
```
