const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
db.settings({ databaseId: "sakurapp" });

const USUARIOS_SEMILLA = [
  { id: 'usr-1', uid: 'uid-1', nombre: 'Carlos', apellido: 'Ferreyra', dni: '28114905', cuil: '20-28114905-4', email: 'carlos@sakurapp.com.ar', clave: 'Duenio.2026', perfil: 'DUENO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-1.png' },
  { id: 'usr-2', uid: 'uid-2', nombre: 'Laura', apellido: 'Sosa', dni: '30442118', cuil: '27-30442118-9', email: 'laura@sakurapp.com.ar', clave: 'Supervisor.2026', perfil: 'SUPERVISOR', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-2.png' },
  { id: 'usr-3', uid: 'uid-3', nombre: 'Roberto', apellido: 'Aguirre', dni: '33907442', cuil: '20-33907442-1', email: 'roberto@sakurapp.com.ar', clave: 'Metre.2026', perfil: 'METRE', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-3.png' },
  { id: 'usr-4', uid: 'uid-4', nombre: 'Marcos', apellido: 'Ledesma', dni: '38220167', cuil: '20-38220167-6', email: 'marcos@sakurapp.com.ar', clave: 'Mozo.2026', perfil: 'MOZO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-4.png' },
  { id: 'usr-5', uid: 'uid-5', nombre: 'Ana', apellido: 'Beltrán', dni: '35771208', cuil: '27-35771208-3', email: 'ana@sakurapp.com.ar', clave: 'Cocina.2026', perfil: 'COCINERO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-5.png' },
  { id: 'usr-6', uid: 'uid-6', nombre: 'Juan', apellido: 'Duarte', dni: '31554890', cuil: '20-31554890-7', email: 'juan@sakurapp.com.ar', clave: 'Barra.2026', perfil: 'CANTINERO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-6.png' },
  { id: 'usr-7', uid: 'uid-7', nombre: 'Sofía', apellido: 'Gómez', dni: '44225858', cuil: '27-44225858-4', email: 'sofia@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-7.png' },
  { id: 'usr-8', uid: 'uid-8', nombre: 'Nicolás', apellido: null, dni: null, cuil: null, email: null, clave: null, perfil: 'CLIENTE_ANONIMO', estado: 'APROBADO', fotoUrl: 'assets/icon/sushis/sushi-8.png' },
  { id: 'usr-9', uid: 'uid-9', nombre: 'Martín', apellido: 'Quiroga', dni: '43118204', cuil: '20-43118204-8', email: 'martin@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'PENDIENTE', fotoUrl: 'assets/icon/sushis/sushi-9.png' },
  { id: 'usr-10', uid: 'uid-10', nombre: 'Valentina', apellido: 'Ríos', dni: '45302771', cuil: '27-45302771-5', email: 'valentina@correo.com.ar', clave: 'Cliente.2026', perfil: 'CLIENTE_REGISTRADO', estado: 'PENDIENTE', fotoUrl: 'assets/icon/sushis/sushi-10.png' },
];

async function sembrar() {
  console.log("🌸 Sembrando usuarios en Firestore ('sakurapp')...");
  const batch = db.batch();

  for (const u of USUARIOS_SEMILLA) {
    const ref = db.collection("usuarios").doc(u.uid);
    batch.set(ref, {
      ...u,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  await batch.commit();
  console.log(`✅ ${USUARIOS_SEMILLA.length} usuarios sembrados con éxito en Firestore ('sakurapp')!`);
}

sembrar()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error sembrando usuarios:", err);
    process.exit(1);
  });
