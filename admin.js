// ============================================================
// PANEL DE ADMINISTRACIÓN — lógica de login y CRUD de propiedades
// (usa `db` de js/firebase-config.js, que ya está cargado antes que este archivo)
// ============================================================
const auth = firebase.auth();

// ---------- Helpers ----------
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}
function formatPrecio(precio, operacion) {
  const n = Number(precio) || 0;
  const formateado = '$' + n.toLocaleString('es-MX') + ' MXN';
  return operacion === 'renta' ? formateado + '/mes' : formateado;
}

// Redimensiona y comprime la imagen en el navegador para poder guardarla
// directamente en Firestore (sin necesitar Firebase Storage, que ahora
// requiere plan de pago). Devuelve una promesa con un data URL JPEG.
function comprimirImagen(file, maxDim = 1280, calidad = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Referencias del DOM ----------
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');
const btnLogout = document.getElementById('btn-logout');

const propForm = document.getElementById('prop-form');
const propId = document.getElementById('prop-id');
const fTitulo = document.getElementById('f-titulo');
const fPrecio = document.getElementById('f-precio');
const fOperacion = document.getElementById('f-operacion');
const fTipo = document.getElementById('f-tipo');
const fColonia = document.getElementById('f-colonia');
const fCiudad = document.getElementById('f-ciudad');
const fM2c = document.getElementById('f-m2c');
const fM2t = document.getElementById('f-m2t');
const fMapa = document.getElementById('f-mapa');
const fResumen = document.getElementById('f-resumen');
const fFicha = document.getElementById('f-ficha');
const fImagen = document.getElementById('f-imagen');
const imgPreview = document.getElementById('img-preview');
const formTitle = document.getElementById('form-title');
const btnGuardar = document.getElementById('btn-guardar');
const btnCancelar = document.getElementById('btn-cancelar');
const formMsg = document.getElementById('form-msg');
const listEl = document.getElementById('prop-list');

const propiedadesCache = {};

// ---------- Login / logout ----------
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginMsg.className = 'msg';
  loginMsg.textContent = 'Ingresando…';
  auth.signInWithEmailAndPassword(email, password)
    .catch(() => {
      loginMsg.className = 'msg error';
      loginMsg.textContent = 'Correo o contraseña incorrectos.';
    });
});

btnLogout.addEventListener('click', () => auth.signOut());

auth.onAuthStateChanged(user => {
  loginScreen.style.display = user ? 'none' : 'block';
  adminPanel.style.display = user ? 'block' : 'none';
  if (user) {
    loginMsg.textContent = '';
    document.getElementById('login-password').value = '';
  }
});

// ---------- Vista previa de imagen ----------
fImagen.addEventListener('change', () => {
  const file = fImagen.files[0];
  if (!file) { return; }
  imgPreview.style.display = 'none';
  delete imgPreview.dataset.compressed;
  comprimirImagen(file).then(dataUrl => {
    imgPreview.src = dataUrl;
    imgPreview.style.display = 'block';
    imgPreview.dataset.compressed = dataUrl;
  }).catch(() => {
    formMsg.className = 'msg error';
    formMsg.textContent = 'No se pudo procesar esa imagen. Intenta con otra.';
  });
});

// ---------- Guardar (crear o actualizar) ----------
propForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnGuardar.disabled = true;
  formMsg.className = 'msg';
  formMsg.textContent = 'Guardando…';

  try {
    const data = {
      titulo: fTitulo.value.trim(),
      precio: Number(fPrecio.value) || 0,
      operacion: fOperacion.value,
      tipo: fTipo.value,
      colonia: fColonia.value.trim(),
      ciudad: fCiudad.value.trim() || 'Oaxaca de Juárez',
      m2Construccion: fM2c.value ? Number(fM2c.value) : null,
      m2Terreno: fM2t.value ? Number(fM2t.value) : null,
      mapaUrl: fMapa.value.trim(),
      resumen: fResumen.value.trim(),
      fichaTecnica: fFicha.value,
    };

    if (fImagen.files[0]) {
      data.imagenUrl = imgPreview.dataset.compressed || await comprimirImagen(fImagen.files[0]);
    }

    const id = propId.value;
    if (id) {
      await db.collection('propiedades').doc(id).update(data);
    } else {
      if (!data.imagenUrl) data.imagenUrl = '';
      data.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('propiedades').add(data);
    }

    formMsg.className = 'msg success';
    formMsg.textContent = '✅ Propiedad guardada.';
    resetForm();
  } catch (err) {
    console.error('Error al guardar propiedad:', err);
    formMsg.className = 'msg error';
    formMsg.textContent = '❌ Ocurrió un error al guardar. Intenta de nuevo.';
  } finally {
    btnGuardar.disabled = false;
  }
});

function resetForm() {
  propForm.reset();
  propId.value = '';
  fCiudad.value = 'Oaxaca de Juárez';
  imgPreview.style.display = 'none';
  delete imgPreview.dataset.compressed;
  formTitle.textContent = 'Agregar propiedad';
  btnGuardar.textContent = 'Guardar propiedad';
  btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', resetForm);

// ---------- Lista de propiedades (tiempo real) ----------
db.collection('propiedades').orderBy('fechaCreacion', 'desc').onSnapshot(snapshot => {
  if (snapshot.empty) {
    listEl.innerHTML = '<p>Aún no has agregado propiedades.</p>';
    return;
  }
  listEl.innerHTML = '';
  snapshot.forEach(doc => {
    const p = doc.data();
    propiedadesCache[doc.id] = p;
    const item = document.createElement('div');
    item.className = 'prop-item card';
    item.innerHTML = `
      <img src="${escapeHtml(p.imagenUrl || '')}" alt="" />
      <div class="info">
        <h4>${escapeHtml(p.titulo || '(sin título)')}</h4>
        <small>${p.operacion === 'renta' ? 'Renta' : 'Venta'} · ${escapeHtml(capitalize(p.tipo || ''))} · ${formatPrecio(p.precio, p.operacion)}</small>
      </div>
      <div class="acciones">
        <button class="btn small" type="button" data-editar="${doc.id}">✏️ Editar</button>
        <button class="btn small danger" type="button" data-eliminar="${doc.id}">🗑️ Eliminar</button>
      </div>
    `;
    listEl.appendChild(item);
  });
}, err => {
  console.error('Error cargando propiedades:', err);
  listEl.innerHTML = '<p>No se pudieron cargar las propiedades.</p>';
});

listEl.addEventListener('click', (e) => {
  const btnEd = e.target.closest('[data-editar]');
  if (btnEd) { cargarParaEditar(btnEd.dataset.editar); return; }
  const btnEl = e.target.closest('[data-eliminar]');
  if (btnEl) { eliminarPropiedad(btnEl.dataset.eliminar); }
});

function cargarParaEditar(id) {
  const p = propiedadesCache[id];
  if (!p) return;
  propId.value = id;
  fTitulo.value = p.titulo || '';
  fPrecio.value = p.precio || '';
  fOperacion.value = p.operacion || 'venta';
  fTipo.value = p.tipo || 'casa';
  fColonia.value = p.colonia || '';
  fCiudad.value = p.ciudad || 'Oaxaca de Juárez';
  fM2c.value = p.m2Construccion ?? '';
  fM2t.value = p.m2Terreno ?? '';
  fMapa.value = p.mapaUrl || '';
  fResumen.value = p.resumen || '';
  fFicha.value = p.fichaTecnica || '';
  fImagen.value = '';
  delete imgPreview.dataset.compressed;
  if (p.imagenUrl) {
    imgPreview.src = p.imagenUrl;
    imgPreview.style.display = 'block';
  } else {
    imgPreview.style.display = 'none';
  }
  formTitle.textContent = 'Editar propiedad';
  btnGuardar.textContent = 'Actualizar propiedad';
  btnCancelar.style.display = 'inline-flex';
  formMsg.textContent = '';
  propForm.scrollIntoView({ behavior: 'smooth' });
}

async function eliminarPropiedad(id) {
  if (!confirm('¿Seguro que quieres eliminar esta propiedad? Esta acción no se puede deshacer.')) return;
  try {
    await db.collection('propiedades').doc(id).delete();
  } catch (err) {
    console.error('Error al eliminar:', err);
    alert('No se pudo eliminar. Intenta de nuevo.');
  }
}
