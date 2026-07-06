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

// Algunas redes (ciertos proveedores de internet, antivirus, redes de
// oficina) bloquean silenciosamente el método de conexión por defecto de
// Firestore, causando que guardar/cargar se quede "trabado" sin mostrar
// ningún error. Esta línea fuerza un modo de conexión más compatible.
db.settings({ experimentalAutoDetectLongPolling: true });
