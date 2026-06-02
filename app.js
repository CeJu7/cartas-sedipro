/* ══════════════════════════════════════════════════════
   SEDIPRO UNT — Cartas Interactivas
   app.js
══════════════════════════════════════════════════════ */

/* ────────────────────────────────────────
   1. PARTÍCULAS DE FONDO
──────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx    = canvas.getContext('2d');
  let pts = [];

  const resize = () => {
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
    pts = Array.from({ length: 90 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - .5) * .38,
      vy: (Math.random() - .5) * .38,
      r:  Math.random() * 1.8 + .4,
      a:  Math.random() * .45 + .08,
      c:  Math.random() > .5 ? '167,139,250' : '96,165,250'
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mover y pintar puntos
    pts.forEach(p => {
      p.x = (p.x + p.vx + canvas.width)  % canvas.width;
      p.y = (p.y + p.vy + canvas.height) % canvas.height;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${p.a})`;
      ctx.fill();
    });

    // Líneas de conexión entre puntos cercanos
    pts.forEach((a, i) => {
      for (let j = i + 1; j < pts.length; j++) {
        const b  = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 95) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(167,139,250,${.055 * (1 - d / 95)})`;
          ctx.lineWidth   = .5;
          ctx.stroke();
        }
      }
    });

    requestAnimationFrame(draw);
  };

  resize();
  draw();
  window.addEventListener('resize', resize);
})();

/* ────────────────────────────────────────
   2. REFERENCIAS AL DOM
──────────────────────────────────────── */
const grid        = document.getElementById('cards-grid');
const totalEl     = document.getElementById('total-cartas');
const overlay     = document.getElementById('letter-overlay');
const backdrop    = document.getElementById('letter-backdrop');
const recipientEl = document.getElementById('letter-recipient-name');
const salutEl     = document.getElementById('letter-salutation');
const contentEl   = document.getElementById('letter-content');
const dateEl      = document.getElementById('letter-date');
const letterBody  = document.getElementById('letter-body');

// Fecha formateada una sola vez
const fechaHoy = new Date().toLocaleDateString('es-PE', {
  year: 'numeric', month: 'long', day: 'numeric'
});

/* ────────────────────────────────────────
   3. RENDER DE SOBRES
──────────────────────────────────────── */
/**
 * Crea y añade un sobre al grid.
 * @param {Object} carta  - Objeto con id, nombre, saludo, contenido
 * @param {number} index  - Posición en el array (para delay de animación)
 */
function renderSobre(carta, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'envelope-wrapper';
  wrapper.style.animationDelay = `${index * 0.065}s`;

  wrapper.innerHTML = `
    <div class="envelope"
         data-id="${carta.id}"
         role="button"
         tabindex="0"
         aria-label="Carta para ${carta.nombre}">
      <div class="envelope-flap"></div>
      <div class="envelope-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="white"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <span class="envelope-name">${carta.nombre}</span>
      <span class="envelope-hint">Toca para abrir</span>
      <div class="envelope-stripe"></div>
    </div>`;

  grid.appendChild(wrapper);

  const env = wrapper.querySelector('.envelope');

  const abrir = () => {
    if (env.classList.contains('opening')) return;
    env.classList.add('opening');
    setTimeout(() => openLetter(carta), 620);
  };

  env.addEventListener('click', abrir);
  env.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });
}

/* ────────────────────────────────────────
   4. ABRIR / CERRAR CARTA
──────────────────────────────────────── */
/**
 * Muestra el overlay con el contenido de la carta seleccionada.
 * @param {Object} carta
 */
function openLetter(carta) {
  recipientEl.textContent = carta.nombre;
  salutEl.textContent     = carta.saludo;
  dateEl.textContent      = fechaHoy;

  // Acepta contenido como array de párrafos o como string con \n\n
  const parrafos = Array.isArray(carta.contenido)
    ? carta.contenido
    : carta.contenido.split('\n\n').filter(p => p.trim());

  contentEl.innerHTML = parrafos
    .map(p => `<p>${p.trim()}</p>`)
    .join('');

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  letterBody.scrollTop = 0;

  // Atenúa el sobre que se abrió
  setTimeout(() => {
    document.querySelectorAll('.envelope.opening').forEach(e => {
      e.classList.remove('opening');
      e.style.opacity   = '.38';
      e.style.transform = 'scale(.94)';
    });
  }, 680);
}

/**
 * Cierra el overlay y restaura los sobres.
 */
function closeLetter() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    document.querySelectorAll('.envelope').forEach(e => {
      e.style.opacity = e.style.transform = '';
    });
  }, 420);
}

// Eventos para cerrar la carta
document.getElementById('btn-back').addEventListener('click', closeLetter);
backdrop.addEventListener('click', closeLetter);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeLetter();
});

/* ────────────────────────────────────────
   5. CARGA DESDE cartas.json
──────────────────────────────────────── */
fetch('cartas.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    return res.json();
  })
  .then(cartas => {
    grid.innerHTML = '';                     // elimina el spinner
    totalEl.textContent = cartas.length;
    cartas.forEach((carta, i) => renderSobre(carta, i));
  })
  .catch(err => {
    console.error('Error cargando cartas.json:', err);
    grid.innerHTML = `
      <div class="error-state">
        <p>⚠️ No se pudieron cargar las cartas.</p>
        <p>Asegúrate de que <strong>cartas.json</strong> esté en la misma
           carpeta que <strong>index.html</strong> y que estés sirviendo
           la página desde un servidor (no directamente como archivo).</p>
        <code>${err.message}</code>
      </div>`;
    totalEl.textContent = '0';
  });

/* ────────────────────────────────────────
   6. TRANSICIÓN BIENVENIDA → PRINCIPAL
──────────────────────────────────────── */
document.getElementById('btn-ver-cartas').addEventListener('click', () => {
  const welcome = document.getElementById('welcome-screen');
  const main    = document.getElementById('main-screen');

  welcome.classList.add('hidden');

  setTimeout(() => {
    welcome.style.display = 'none';
    main.classList.add('visible');
  }, 820);
});
