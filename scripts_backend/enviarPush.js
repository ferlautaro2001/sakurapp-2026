const admin = require("firebase-admin");
const path = require("path");

// Cargar la clave de cuenta de servicio ubicada en la misma carpeta
const serviceAccount = require("./serviceAccountKey.json");

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Conectar a la base de datos Firestore personalizada 'sakurapp'
const db = admin.firestore();
db.settings({ databaseId: "sakurapp" });

/**
 * Normaliza el nombre del rol a mayúsculas según los enums de SakurApp
 */
function normalizarRol(rolInput) {
  const r = (rolInput || "SUPERVISOR").toUpperCase();
  if (r === "ADMIN") return "SUPERVISOR";
  return r;
}

/**
 * Busca en Firestore todos los usuarios con ese rol y despacha la notificación a sus tokens FCM
 */
async function enviarNotificacionPorRol(rolAEnviar, tituloPersonalizado, cuerpoPersonalizado) {
  const rolNormalizado = normalizarRol(rolAEnviar);
  const titulo = tituloPersonalizado || `🌸 SakurApp · Aviso a ${rolNormalizado}`;
  const cuerpo = cuerpoPersonalizado || `Notificación enviada al equipo con rol: ${rolNormalizado}`;

  console.log(`\n========================================`);
  console.log(`🔍 Buscando usuarios con rol: ${rolNormalizado} en Firestore ('sakurapp')...`);

  try {
    const usuariosSnapshot = await db
      .collection("usuarios")
      .where("perfil", "==", rolNormalizado)
      .get();

    if (usuariosSnapshot.empty) {
      console.log(`⚠️ No se encontraron usuarios con el perfil '${rolNormalizado}'.`);
      return;
    }

    const tokensSet = new Set();
    const usuariosEncontrados = [];

    usuariosSnapshot.forEach((doc) => {
      const data = doc.data();
      usuariosEncontrados.push(`${data.nombre || "Usuario"} (${data.email || doc.id})`);
      if (data.fcmToken && typeof data.fcmToken === "string") {
        tokensSet.add(data.fcmToken);
      }
      if (data.pushToken && typeof data.pushToken === "string") {
        tokensSet.add(data.pushToken);
      }
    });

    console.log(`👥 Usuarios con rol ${rolNormalizado}: ${usuariosEncontrados.join(", ")}`);

    const tokens = Array.from(tokensSet);

    if (tokens.length === 0) {
      console.log(`⚠️ Se encontraron ${usuariosEncontrados.length} usuario(s), pero NINGUNO tiene token FCM registrado.`);
      console.log(`👉 Para registrar un token: abrí el APK en tu celular e iniciá sesión con este perfil.`);
      return;
    }

    console.log(`📱 Tokens FCM únicos encontrados: ${tokens.length}`);

    // Configurar el mensaje Multicast
    const mensaje = {
      notification: {
        title: titulo,
        body: cuerpo,
      },
      data: {
        rol: rolNormalizado,
        timestamp: new Date().toISOString(),
      },
      tokens,
    };

    console.log(`🚀 Despachando notificación a Google FCM...`);
    const response = await admin.messaging().sendEachForMulticast(mensaje);

    console.log(`\n🎉 RESULTADO DEL ENVÍO:`);
    console.log(`   ✅ Notificaciones entregadas exitosamente: ${response.successCount}`);
    console.log(`   ❌ Fallos: ${response.failureCount}`);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.warn(`   ⚠️ Fallo en token [${idx}]:`, resp.error?.message);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error al enviar la notificación:", error);
  } finally {
    console.log(`========================================\n`);
  }
}

// Parámetros por línea de comandos: node enviarPush.js [rol] [titulo] [cuerpo]
// Ejemplos:
//   node enviarPush.js
//   node enviarPush.js cocinero "Nuevo pedido" "Mesa 3 pidió 2 piezas de sushi"
//   node enviarPush.js supervisor "Aviso urgente" "Revisar lista de espera"
const rolArgumento = process.argv[2] || "SUPERVISOR";
const tituloArgumento = process.argv[3];
const cuerpoArgumento = process.argv[4];

enviarNotificacionPorRol(rolArgumento, tituloArgumento, cuerpoArgumento)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
