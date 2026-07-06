// ============================================================
// CONFIGURACIÓN DE FIREBASE
// ============================================================
// Reemplaza los valores de abajo con los que te da la consola
// de Firebase para tu proyecto. Ver guía: FIREBASE-SETUP.md
//
// Este archivo se incluye tanto en index.html (para MOSTRAR
// las propiedades) como en admin.html (para AGREGAR/EDITAR/
// BORRAR propiedades). Solo necesitas configurarlo una vez.
// ============================================================


const firebaseConfig = {
  apiKey: "AIzaSyCiKC_FvnF_5w9prDqVs8yXgqaHO0B8kjg",
  authDomain: "emma-inmobiliaria.firebaseapp.com",
  projectId: "emma-inmobiliaria",
  storageBucket: "emma-inmobiliaria.firebasestorage.app",
  messagingSenderId: "719940565998",
  appId: "1:719940565998:web:e57349757ab8fd0e68ecff"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Tu red está cortando la conexión "en streaming" que Firestore intenta usar
// por defecto (se ve en el panel Network: muchas reconexiones seguidas, cada
// una con un gsessionid distinto, sin llegar nunca a completar el guardado).
// Esta línea obliga a usar "long polling" clásico en vez de dejar que el SDK
// lo detecte solo, lo cual es más lento por petición pero mucho más estable
// en redes restrictivas.
db.settings({ experimentalForceLongPolling: true });
