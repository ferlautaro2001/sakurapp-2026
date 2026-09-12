const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

// Inicialización de Firebase Admin en el entorno de Cloud Functions
initializeApp();

const DATABASE_ID = "sakurapp";

/**
 * Cloud Function que se dispara automáticamente cuando se encola
 * un documento en 'notificaciones_cola'.
 * Busca los tokens FCM correspondientes en Firestore ('sakurapp') y despacha a Google FCM.
 */
exports.procesarColaPush = onDocumentCreated(
  {
    document: "notificaciones_cola/{notifId}",
    database: DATABASE_ID,
    region: "southamerica-east1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (!data || data.estado !== "PENDIENTE") {
      return;
    }

    const db = getFirestore(DATABASE_ID);
    const messaging = getMessaging();

    try {
      const tokensSet = new Set();

      // Prioridad 1: Destinatario por UID directo
      if (data.destinatarioUid) {
        const userDoc = await db.collection("usuarios").doc(data.destinatarioUid).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          if (u?.activo !== false && u?.estado !== "RECHAZADO") {
            if (u?.fcmToken && typeof u.fcmToken === "string") tokensSet.add(u.fcmToken);
            if (u?.pushToken && typeof u.pushToken === "string") tokensSet.add(u.pushToken);
          }
        }
      }
      // Prioridad 2: Destinatario por Email directo
      else if (data.destinatarioEmail) {
        const userByEmail = await db
          .collection("usuarios")
          .where("email", "==", data.destinatarioEmail.trim().toLowerCase())
          .get();

        userByEmail.forEach((docSnap) => {
          const u = docSnap.data();
          if (u.activo !== false && u.estado !== "RECHAZADO") {
            if (u.fcmToken && typeof u.fcmToken === "string") tokensSet.add(u.fcmToken);
            if (u.pushToken && typeof u.pushToken === "string") tokensSet.add(u.pushToken);
          }
        });
      }
      // Prioridad 3: Destinatario por Rol exclusivo
      else if (data.destinatarioRol) {
        let usuariosSnapshot;
        if (data.destinatarioRol === "CLIENTE") {
          usuariosSnapshot = await db
            .collection("usuarios")
            .where("perfil", "in", ["CLIENTE_REGISTRADO", "CLIENTE_ANONIMO"])
            .get();
        } else {
          usuariosSnapshot = await db
            .collection("usuarios")
            .where("perfil", "==", data.destinatarioRol)
            .get();
        }

        usuariosSnapshot.forEach((docSnap) => {
          const u = docSnap.data();
          if (u.activo !== false && u.estado !== "RECHAZADO") {
            if (u.fcmToken && typeof u.fcmToken === "string") {
              tokensSet.add(u.fcmToken);
            }
            if (u.pushToken && typeof u.pushToken === "string") {
              tokensSet.add(u.pushToken);
            }
          }
        });
      }

      const tokens = Array.from(tokensSet);

      if (tokens.length === 0) {
        console.log(`⚠️ No se encontraron tokens FCM registrados para ${JSON.stringify(data)}`);
        await snap.ref.update({
          estado: "SIN_TOKENS",
          procesadoEn: new Date().toISOString(),
          nota: "No hay dispositivos con token FCM activo registrados para este destinatario",
        });
        return;
      }

      // 4. Armar el mensaje FCM Multicast
      const mensaje = {
        notification: {
          title: data.titulo || "🌸 SakurApp",
          body: data.cuerpo || "",
        },
        data: {
          ruta: data.ruta || "",
          notifId: event.params.notifId,
          destinatarioRol: data.destinatarioRol || "",
          destinatarioUid: data.destinatarioUid || "",
          destinatarioEmail: data.destinatarioEmail || "",
          timestamp: new Date().toISOString(),
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(mensaje);
      console.log(`✅ [FCM Cloud Function] Despacho exitoso: ${response.successCount} enviados, ${response.failureCount} fallidos`);

      await snap.ref.update({
        estado: "ENVIADO",
        exitos: response.successCount,
        fallos: response.failureCount,
        tokensDestinatarios: tokens.length,
        procesadoEn: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error en Cloud Function procesarColaPush:", error);
      await snap.ref.update({
        estado: "ERROR",
        error: error.message || String(error),
        procesadoEn: new Date().toISOString(),
      });
    }
  }
);
