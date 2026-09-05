const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
db.settings({ databaseId: "sakurapp" });

console.log("🌸 [SakurApp Daemon] Escuchando 'notificaciones_cola' en Firestore ('sakurapp')...");
console.log("🌸 Presioná Ctrl+C para detener.\n");

db.collection("notificaciones_cola")
  .where("estado", "==", "PENDIENTE")
  .onSnapshot(async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === "added" || change.type === "modified") {
        const notifDoc = change.doc;
        const data = notifDoc.data();

        if (data.estado !== "PENDIENTE") continue;

        console.log(`📨 [Nueva notificación detectada] ID: ${notifDoc.id}`);
        console.log(`   Título: ${data.titulo}`);
        console.log(`   Cuerpo: ${data.cuerpo}`);
        console.log(`   Destinatario Rol: ${data.destinatarioRol || "N/A"} | UID: ${data.destinatarioUid || "N/A"}`);

        try {
          const tokensSet = new Set();

          if (data.destinatarioRol) {
            const usersSnap = await db
              .collection("usuarios")
              .where("perfil", "==", data.destinatarioRol)
              .get();

            usersSnap.forEach((uDoc) => {
              const u = uDoc.data();
              if (u.fcmToken) tokensSet.add(u.fcmToken);
              if (u.pushToken) tokensSet.add(u.pushToken);
            });
          }

          if (data.destinatarioUid) {
            const userDoc = await db.collection("usuarios").doc(data.destinatarioUid).get();
            if (userDoc.exists) {
              const u = userDoc.data();
              if (u.fcmToken) tokensSet.add(u.fcmToken);
              if (u.pushToken) tokensSet.add(u.pushToken);
            }
          }

          const tokens = Array.from(tokensSet);

          if (tokens.length === 0) {
            console.log(`   ⚠️ No se encontraron tokens FCM registrados para este destinatario.`);
            await notifDoc.ref.update({
              estado: "SIN_TOKENS",
              procesadoEn: new Date().toISOString(),
            });
            continue;
          }

          console.log(`   🚀 Enviando a ${tokens.length} token(s) vía Google FCM...`);
          const response = await admin.messaging().sendEachForMulticast({
            notification: {
              title: data.titulo || "🌸 SakurApp",
              body: data.cuerpo || "",
            },
            data: {
              ruta: data.ruta || "",
              notifId: notifDoc.id,
            },
            tokens,
          });

          console.log(`   ✅ Éxito: ${response.successCount} | Fallos: ${response.failureCount}`);
          await notifDoc.ref.update({
            estado: "ENVIADO",
            exitos: response.successCount,
            fallos: response.failureCount,
            procesadoEn: new Date().toISOString(),
          });
        } catch (err) {
          console.error(`   ❌ Error al procesar notificación:`, err);
          await notifDoc.ref.update({
            estado: "ERROR",
            error: err.message,
            procesadoEn: new Date().toISOString(),
          });
        }
      }
    }
  });
