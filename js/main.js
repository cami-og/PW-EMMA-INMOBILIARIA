const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
navToggle?.addEventListener("click", () => document.body.classList.toggle("nav-open"));
navMenu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => document.body.classList.remove("nav-open")));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    const yOffset = -70;
    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  });
});

// Año dinámico
// (comentado para que aparezcan las fichas técnicas del catálogo)
// document.getElementById('anio').textContent = new Date().getFullYear();

// ============================================================
// CATÁLOGO DE PROPIEDADES (cargado desde Firebase Firestore)
// ============================================================
const filtroTipo = document.getElementById('filtro-tipo');
const filtroOp = document.getElementById('filtro-operacion');
const filtroBuscar = document.getElementById('filtro-buscar');
const btnFiltrar = document.getElementById('btn-filtrar');
const contenedorCards = document.getElementById('cards');

// Guarda los datos de cada propiedad por su id de Firestore,
// para poder mostrarlos en la ficha técnica sin volver a pedirlos.
const propiedadesCache = {};

// Imagen de respaldo cuando una propiedad todavía no tiene foto
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">' +
  '<rect width="100%" height="100%" fill="#eee"/>' +
  '<text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#999" text-anchor="middle" dy=".3em">Sin foto disponible</text>' +
  '</svg>'
);

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

// Construye una tarjeta (article.card) igual al diseño original, pero con datos dinámicos
function crearTarjeta(id, p) {
  const esRenta = p.operacion === 'renta';
  const article = document.createElement('article');
  article.className = 'card';
  article.dataset.tipo = p.tipo || '';
  article.dataset.operacion = p.operacion || '';
  article.dataset.id = id;
  article.dataset.tags = [p.titulo, p.colonia, p.ciudad, p.tipo, p.resumen]
    .filter(Boolean).join(' ').toLowerCase();

  article.innerHTML = `
    <div style="position:relative">
      <span class="label"${esRenta ? ' style="background:#2f7a67"' : ''}>${esRenta ? 'En renta' : 'En venta'}</span>
      <img src="${escapeHtml(p.imagenUrl || PLACEHOLDER_IMG)}" alt="${escapeHtml(p.titulo || 'Propiedad')}" loading="lazy" />
    </div>
    <div class="pad npadding">
      <h3 style="margin:.25rem 0">${escapeHtml(p.titulo || '')}</h3>
      <div class="price">${formatPrecio(p.precio, p.operacion)}</div>
      <p>${escapeHtml(p.resumen || '')}</p>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap">
        ${p.colonia ? `<span class="tag">${escapeHtml(p.colonia)}</span>` : ''}
        ${p.ciudad ? `<span class="tag">${escapeHtml(p.ciudad)}</span>` : ''}
        ${p.tipo ? `<span class="tag">${escapeHtml(capitalize(p.tipo))}</span>` : ''}
      </div>
      <div style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap">
        <button class="btn" data-ficha="${id}">📄 Ficha técnica</button>
        <a class="btn secondary" href="#formulario" data-interesa="${id}">📩 Me interesa</a>
      </div>
    </div>
  `;
  return article;
}

function renderPropiedades(snapshot) {
  contenedorCards.innerHTML = '';
  if (snapshot.empty) {
    contenedorCards.innerHTML = '<p>Aún no hay propiedades publicadas. Vuelve pronto.</p>';
    return;
  }
  snapshot.forEach(doc => {
    const p = doc.data();
    propiedadesCache[doc.id] = p;
    contenedorCards.appendChild(crearTarjeta(doc.id, p));
  });
}

// Carga inicial del catálogo desde Firestore
db.collection('propiedades').orderBy('fechaCreacion', 'desc').get()
  .then(renderPropiedades)
  .catch(err => {
    console.error('Error cargando propiedades:', err);
    contenedorCards.innerHTML = '<p>No se pudieron cargar las propiedades. Intenta más tarde.</p>';
  });

// Filtro básico de catálogo (siempre lee las tarjetas actuales del DOM,
// así funciona sin importar cuándo terminó de cargar Firestore)
function aplicarFiltros() {
  const t = filtroTipo.value.trim();
  const o = filtroOp.value.trim();
  const q = filtroBuscar.value.trim().toLowerCase();
  document.querySelectorAll('#cards article.card').forEach(c => {
    const okT = !t || c.dataset.tipo === t;
    const okO = !o || c.dataset.operacion === o;
    const okQ = !q || (c.dataset.tags || '').includes(q);
    c.style.display = (okT && okO && okQ) ? 'block' : 'none';
  });
}
btnFiltrar.addEventListener('click', aplicarFiltros);
filtroBuscar.addEventListener('input', aplicarFiltros);

// Modal de ficha técnica (el contenido ahora sale de propiedadesCache, no de <template>)
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
function abrirFicha(id) {
  const p = propiedadesCache[id];
  if (!p) {
    modalContent.innerHTML = '<p>No hay información disponible.</p>';
    modal.showModal();
    return;
  }
  const items = (p.fichaTecnica || '')
    .split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => `<li>${escapeHtml(l)}</li>`).join('');
  modalContent.innerHTML = `
    <h3>${escapeHtml(p.titulo || '')} – Ficha técnica</h3>
    <ul>${items}</ul>
    ${p.mapaUrl ? `<p>Ubicación aproximada: <a href="${escapeHtml(p.mapaUrl)}" target="_blank" rel="noopener">Ver en el mapa</a></p>` : ''}
  `;
  modal.showModal();
}
function cerrarModal() { modal.close(); }
window.abrirFicha = abrirFicha; window.cerrarModal = cerrarModal;

// Prellenar propiedad en el formulario
function prellenar(nombre) {
  const input = document.getElementById('propiedad');
  if (input) { input.value = nombre; document.getElementById('formulario').scrollIntoView({ behavior: 'smooth' }); }
}
window.prellenar = prellenar;

// Delega los clics de "Ficha técnica" y "Me interesa" (los botones se crean dinámicamente)
contenedorCards.addEventListener('click', (e) => {
  const btnFicha = e.target.closest('[data-ficha]');
  if (btnFicha) { abrirFicha(btnFicha.dataset.ficha); return; }
  const btnInteresa = e.target.closest('[data-interesa]');
  if (btnInteresa) {
    const p = propiedadesCache[btnInteresa.dataset.interesa];
    prellenar(p ? p.titulo : '');
  }
});
// Inicializar Slick Carousel
$('.carousel').slick({
  centerMode: true,
  centerPadding: '60px',
  prevArrow: "<img src='img/atras.png' class='prev' alt='Anterior'>",
  nextArrow: "<img src='img/atras.png' class='next' alt='Siguiente'>",
  slidesToShow: 3,
  responsive: [
    {
      breakpoint: 1024, // laptops/tablets en horizontal
      settings: {
        arrows: true,
        centerMode: false,
        slidesToShow: 2
      }
    },
    {
      breakpoint: 768, // tablets en vertical
      settings: {
        arrows: false,
        centerMode: false,
        slidesToShow: 1
      }
    },
    {
      breakpoint: 480, // celulares chicos
      settings: {
        arrows: false,
        centerMode: false,
        slidesToShow: 1
      }
    }
  ]
});

// FAQ Accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const openItem = document.querySelector('.faq-item.open');
    if (openItem && openItem !== item) {
      openItem.classList.remove('open');
      openItem.querySelector('.faq-answer').style.maxHeight = null;
    }
    item.classList.toggle('open');
    const answer = item.querySelector('.faq-answer');
    if (item.classList.contains('open')) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
      answer.style.maxHeight = null;
    }
  });
});

// Inicializar EmailJS con tu Public Key
emailjs.init("wEMk-HCEZO7-5uuCM");

const form = document.getElementById("service_7eivika");
const estado = document.getElementById("estado");

form.addEventListener("submit", function(event) {
  event.preventDefault();
  estado.textContent = "Enviando...";

  emailjs.sendForm("service_7eivika", "template_n5he81t", this)
    .then(() => {
      estado.textContent = "✅ ¡Mensaje enviado con éxito!";
      form.reset();
    })
    .catch((err) => {
      console.error("Error:", err);
      estado.textContent = "❌ Ocurrió un error. Intenta de nuevo.";
    });
});
// End of main.js
/*
// Simular envío de formulario (puedes conectar con Formspree o backend)
const form = document.getElementById('form-contacto');
const estado = document.getElementById('estado');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  // Validación mínima
  if (!data.nombre || !data.email || !data.mensaje) {
    estado.textContent = 'Por favor completa los campos requeridos.';
    estado.style.color = '#b00020';
    return;
  }
  // Aquí podrías usar fetch hacia un servicio externo (Formspree):
  // fetch('https://formspree.io/f/XXXXX', {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(form)})
  //  .then(()=> { ... })
  estado.textContent = '¡Gracias! Tu mensaje fue enviado (simulado). Te contactaré pronto.';
  estado.style.color = '#2f7a67';
  form.reset();
});*/


