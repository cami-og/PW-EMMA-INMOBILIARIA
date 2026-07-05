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

// Filtro básico de catálogo
const filtroTipo = document.getElementById('filtro-tipo');
const filtroOp = document.getElementById('filtro-operacion');
const filtroBuscar = document.getElementById('filtro-buscar');
const btnFiltrar = document.getElementById('btn-filtrar');
const cards = Array.from(document.querySelectorAll('#cards article.card'));

function aplicarFiltros() {
  const t = filtroTipo.value.trim();
  const o = filtroOp.value.trim();
  const q = filtroBuscar.value.trim().toLowerCase();
  cards.forEach(c => {
    const okT = !t || c.dataset.tipo === t;
    const okO = !o || c.dataset.operacion === o;
    const okQ = !q || c.dataset.tags.includes(q);
    c.style.display = (okT && okO && okQ) ? 'block' : 'none';
  });
}
btnFiltrar.addEventListener('click', aplicarFiltros);
filtroBuscar.addEventListener('input', aplicarFiltros);

// Modal de ficha técnica
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
function abrirFicha(id) {
  const tpl = document.getElementById(id);
  modalContent.innerHTML = tpl ? tpl.innerHTML : '<p>No hay información disponible.</p>';
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

