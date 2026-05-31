/* ============================================================
   login.js — SIFEX (funciones de UI del diseño nuevo)
   
   IMPORTANTE: Este archivo solo maneja la interfaz visual.
   La lógica de autenticación (microservicios puerto 9000/8003
   y admin fijo) sigue viviendo en loginJs.js, que se carga
   primero en el HTML.
   
   Funciones que agrega este archivo:
     · switchToPanel(targetId) — alterna entre login y registro
     · togglePass(inputId, btn) — muestra/oculta contraseña
   ============================================================ */


/* ──────────────────────────────────────────────────────────
   switchToPanel(targetId)
   ========================
   Cambia el panel visible con animación suave:
     1. Añade .card-login--saliendo → fade-out + scale-down
     2. Intercambia [hidden] entre paneles
     3. Quita la clase → fade-in
   ────────────────────────────────────────────────────────── */
function switchToPanel(targetId) {
  var card     = document.getElementById('card-login');
  var panels   = card.querySelectorAll('[id^="panel-"]');
  var DURATION = 220; /* ms — coincide con --t-base del CSS */

  card.classList.add('card-login--saliendo');

  setTimeout(function () {
    panels.forEach(function (panel) {
      panel.hidden = (panel.id !== targetId);
    });

    /* Fallback para navegadores sin soporte a CSS :has() */
    if (targetId === 'panel-registro') {
      card.classList.add('card-login--registro');
    } else {
      card.classList.remove('card-login--registro');
    }

    card.classList.remove('card-login--saliendo');

    /* Mover foco al primer campo del panel destino */
    setTimeout(function () {
      var firstField = document
        .getElementById(targetId)
        .querySelector('input, select, button');
      if (firstField) firstField.focus();
    }, 50);
  }, DURATION);
}


/* ──────────────────────────────────────────────────────────
   togglePass(inputId, btn)
   =========================
   Alterna visibilidad de un campo contraseña.
   Actualiza el ícono SVG y el aria-label del botón.
   ────────────────────────────────────────────────────────── */
function togglePass(inputId, btn) {
  var input   = document.getElementById(inputId);
  var eyeShow = btn.querySelector('.eye-show');
  var eyeHide = btn.querySelector('.eye-hide');

  if (input.type === 'password') {
    input.type = 'text';
    btn.setAttribute('aria-label', 'Ocultar contraseña');
    eyeShow.style.display = 'none';
    eyeHide.style.display = '';
  } else {
    input.type = 'password';
    btn.setAttribute('aria-label', 'Mostrar contraseña');
    eyeShow.style.display = '';
    eyeHide.style.display = 'none';
  }
}


/* ──────────────────────────────────────────────────────────
   showError / clearError
   =======================
   Helpers compartidos con registro.js.
   loginJs.js usa alert() para sus errores, así que estas
   funciones no entran en conflicto con la lógica original.
   ────────────────────────────────────────────────────────── */
function showError(spanId, message) {
  var el = document.getElementById(spanId);
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
}

function clearError(spanId) {
  var el = document.getElementById(spanId);
  if (!el) return;
  el.textContent = '';
  el.classList.remove('visible');
}


/* ──────────────────────────────────────────────────────────
   previewImagen(input)
   =====================
   Muestra la imagen seleccionada en el área de vista previa.
   Valida tamaño (≤ 2 MB) y formato (JPG/PNG/WEBP) antes
   de mostrarla. Si no pasa, limpia el input y avisa.
────────────────────────────────────────────────────────── */
function previewImagen(input) {
  var file        = input.files[0];
  var preview     = document.getElementById('foto-preview');
  var placeholder = document.getElementById('foto-placeholder');
  var quitar      = document.getElementById('foto-quitar');
  var uploadBox   = document.getElementById('foto-upload');
  var errSpan     = document.getElementById('err-reg-imagen');

  /* Limpiar error previo */
  if (errSpan) { errSpan.textContent = ''; errSpan.classList.remove('visible'); }

  if (!file) return;

  /* Validar formato */
  var allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    input.value = '';
    showError('err-reg-imagen', 'Formato no permitido. Usa JPG, PNG o WEBP.');
    return;
  }

  /* Validar tamaño (2 MB) */
  if (file.size > 2 * 1024 * 1024) {
    input.value = '';
    showError('err-reg-imagen', 'La imagen supera el límite de 2 MB.');
    return;
  }

  /* Mostrar vista previa */
  var reader = new FileReader();
  reader.onload = function (e) {
    preview.src           = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    quitar.style.display  = 'inline-flex';
    uploadBox.classList.add('foto-upload--has-img');
  };
  reader.readAsDataURL(file);
}


/* ──────────────────────────────────────────────────────────
   quitarImagen()
   ===============
   Resetea el campo de imagen y la vista previa.
────────────────────────────────────────────────────────── */
function quitarImagen() {
  var input       = document.getElementById('reg-imagen');
  var preview     = document.getElementById('foto-preview');
  var placeholder = document.getElementById('foto-placeholder');
  var quitar      = document.getElementById('foto-quitar');
  var uploadBox   = document.getElementById('foto-upload');

  input.value             = '';
  preview.src             = '';
  preview.style.display   = 'none';
  placeholder.style.display = 'flex';
  quitar.style.display    = 'none';
  uploadBox.classList.remove('foto-upload--has-img');
}