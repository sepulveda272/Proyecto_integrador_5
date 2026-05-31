/* ============================================================
   registro.js — SIFEX
   Lógica del panel CREAR CUENTA:
     · Selector de rol (Productor / Técnico / Funcionario ICA)
     · Evaluación de fortaleza de contraseña
     · Validación del formulario
     · Envío al microservicio correcto según rol seleccionado
   ============================================================ */


/* ── Endpoints por rol ──────────────────────────────────── */
const ENDPOINTS_REGISTRO = {
  PRODUCTOR:   'http://localhost:8003/productor/add',
  TECNICO:     'http://localhost:9000/tecnico/add',
  FUNCIONARIO: 'http://localhost:9000/funcionario/add'
};

/* Rol actualmente seleccionado */
var rolSeleccionado = null;


/* ──────────────────────────────────────────────────────────
   seleccionarRol(rol, btn)
────────────────────────────────────────────────────────── */
function seleccionarRol(rol, btn) {
  rolSeleccionado = rol;
  document.querySelectorAll('.rol-btn').forEach(function (b) {
    b.classList.remove('rol-btn--activo');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('rol-btn--activo');
  btn.setAttribute('aria-pressed', 'true');
  clearError('err-rol');
}


/* ──────────────────────────────────────────────────────────
   evaluarPassword(valor)
────────────────────────────────────────────────────────── */
function evaluarPassword(valor) {
  var criterios = {
    len:    valor.length >= 8,
    upper:  /[A-Z]/.test(valor),
    number: /[0-9]/.test(valor),
    symbol: /[!@#$%^&*()\-_=+\[\]{};:'",.<>\/?\\|`~]/.test(valor)
  };
  var score = Object.values(criterios).filter(Boolean).length;
  var nivel = score <= 1 ? 'bajo' : score <= 3 ? 'medio' : 'alto';
  return { criterios: criterios, score: score, nivel: nivel };
}


/* ──────────────────────────────────────────────────────────
   actualizarRequisito(id, cumplido)
────────────────────────────────────────────────────────── */
function actualizarRequisito(id, cumplido) {
  var el   = document.getElementById(id);
  var icon = el.querySelector('.req-icon');
  if (cumplido) {
    el.classList.add('pass-req--ok');
    icon.textContent = '✓';
  } else {
    el.classList.remove('pass-req--ok');
    icon.textContent = '○';
  }
}


/* ──────────────────────────────────────────────────────────
   actualizarMedidor(valor)
────────────────────────────────────────────────────────── */
function actualizarMedidor(valor) {
  var meter   = document.getElementById('pass-meter');
  var label   = document.getElementById('pass-meter-label');
  var desc    = document.getElementById('pass-meter-desc');
  var seg1    = document.getElementById('pm-seg-1');
  var seg2    = document.getElementById('pm-seg-2');
  var seg3    = document.getElementById('pm-seg-3');
  var reqList = document.getElementById('pass-req-list');

  if (!valor) {
    meter.style.display   = 'none';
    reqList.style.display = 'none';
    meter.removeAttribute('data-level');
    desc.textContent = '';
    [seg1, seg2, seg3].forEach(function (s) { s.removeAttribute('data-active'); });
    return;
  }

  var res = evaluarPassword(valor);
  meter.style.display   = 'block';
  reqList.style.display = 'block';
  meter.setAttribute('data-level', res.nivel);
  seg1.setAttribute('data-active', res.nivel);
  seg2.setAttribute('data-active', res.score >= 2 ? res.nivel : '');
  seg3.setAttribute('data-active', res.score === 4 ? res.nivel : '');

  var etiquetas = { bajo: 'Seguridad baja', medio: 'Seguridad media', alto: 'Seguridad alta' };
  label.textContent = etiquetas[res.nivel];
  label.setAttribute('data-level', res.nivel);
  desc.textContent  = 'Seguridad de la contraseña: ' + etiquetas[res.nivel] + '. ' + res.score + ' de 4 criterios cumplidos.';

  actualizarRequisito('req-len',    res.criterios.len);
  actualizarRequisito('req-upper',  res.criterios.upper);
  actualizarRequisito('req-number', res.criterios.number);
  actualizarRequisito('req-symbol', res.criterios.symbol);
}


/* ── Listener medidor en tiempo real ───────────────────── */
document.getElementById('reg-pass').addEventListener('input', function () {
  actualizarMedidor(this.value);
});

(function () {
  document.getElementById('pass-meter').style.display    = 'none';
  document.getElementById('pass-req-list').style.display = 'none';
})();


/* ──────────────────────────────────────────────────────────
   SUBMIT — Validación y envío al microservicio correcto
────────────────────────────────────────────────────────── */
document.getElementById('form-registro').addEventListener('submit', async function (e) {
  e.preventDefault();

  /* 1. Validar que se eligió un rol */
  if (!rolSeleccionado) {
    showError('err-rol', 'Selecciona el tipo de cuenta que deseas crear.');
    document.getElementById('rol-selector').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  /* 2. Validar campos */
  var tipoDoc      = document.getElementById('reg-tipo-doc');
  var numeroDoc    = document.getElementById('reg-numero-doc');
  var primerNombre = document.getElementById('reg-primer-nombre');
  var primerApe    = document.getElementById('reg-primer-apellido');
  var celular      = document.getElementById('reg-celular');
  var correo       = document.getElementById('reg-correo');
  var pass         = document.getElementById('reg-pass');
  var valid        = true;

  ['err-reg-tipo-doc','err-reg-numero-doc','err-reg-primer-nombre',
   'err-reg-primer-apellido','err-reg-celular','err-reg-correo','err-reg-pass'
  ].forEach(clearError);

  if (!tipoDoc.value) {
    showError('err-reg-tipo-doc', 'Selecciona el tipo de identificación.');
    valid = false;
  }
  if (!numeroDoc.value.trim() || !/^\d{6,15}$/.test(numeroDoc.value.trim())) {
    showError('err-reg-numero-doc', 'Ingresa un número de identificación válido (6-15 dígitos).');
    valid = false;
  }
  if (!primerNombre.value.trim()) {
    showError('err-reg-primer-nombre', 'Ingresa tu primer nombre.');
    valid = false;
  }
  if (!primerApe.value.trim()) {
    showError('err-reg-primer-apellido', 'Ingresa tu primer apellido.');
    valid = false;
  }
  if (!celular.value.trim() || !/^\d{7,15}$/.test(celular.value.trim())) {
    showError('err-reg-celular', 'Ingresa un número de celular válido (7-15 dígitos).');
    valid = false;
  }
  if (!correo.value.trim() || !correo.validity.valid) {
    showError('err-reg-correo', 'Ingresa un correo electrónico válido.');
    valid = false;
  }
  if (!pass.value) {
    showError('err-reg-pass', 'Ingresa una contraseña.');
    valid = false;
  } else if (evaluarPassword(pass.value).score < 2) {
    showError('err-reg-pass', 'La contraseña es demasiado débil. Agrega mayúsculas, números o símbolos.');
    valid = false;
  }

  if (!valid) return;

  /* 3. Construir FormData — los backends usan multer (multipart/form-data) */
  var formData = new FormData();
  formData.append('Tipo_identificacion',   tipoDoc.value);
  formData.append('Numero_identificacion', numeroDoc.value.trim());
  formData.append('Primer_nombre',         primerNombre.value.trim());
  formData.append('Segundo_nombre',        document.getElementById('reg-segundo-nombre').value.trim());
  formData.append('Primer_apellido',       primerApe.value.trim());
  formData.append('Segundo_apellido',      document.getElementById('reg-segundo-apellido').value.trim());
  formData.append('Celular',               celular.value.trim());
  formData.append('Correo',               correo.value.trim());
  formData.append('Password',              pass.value);

  /* Imagen de perfil — opcional, multer la procesa si está presente */
  var imagenInput = document.getElementById('reg-imagen');
  if (imagenInput && imagenInput.files && imagenInput.files[0]) {
    formData.append('Imagen', imagenInput.files[0]);
  }

  /* 4. Enviar al endpoint correcto según el rol */
  var btn      = this.querySelector('button[type="submit"]');
  var endpoint = ENDPOINTS_REGISTRO[rolSeleccionado];
  var rolLabel = { PRODUCTOR: 'productor', TECNICO: 'técnico oficial', FUNCIONARIO: 'funcionario ICA' }[rolSeleccionado];

  btn.disabled    = true;
  btn.textContent = 'Registrando…';

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      body:   formData  /* Sin Content-Type: multer lo detecta automáticamente */
    });

    var result = await response.json();

    if (response.ok && result.status === 'Success') {
      alert(
        '✅ Registro exitoso como ' + rolLabel + '.\n\n' +
        'Tu cuenta está en estado Inactivo hasta que un administrador la active.\n' +
        'Una vez activa, podrás iniciar sesión con tu correo y contraseña.'
      );
      /* Limpiar y volver al login */
      document.getElementById('form-registro').reset();
      actualizarMedidor('');
      quitarImagen();
      rolSeleccionado = null;
      document.querySelectorAll('.rol-btn').forEach(function (b) {
        b.classList.remove('rol-btn--activo');
        b.removeAttribute('aria-pressed');
      });
      switchToPanel('panel-login');

    } else {
      alert('❌ Error al registrar: ' + (result.message || 'Error desconocido.'));
    }

  } catch (error) {
    console.error('Error al registrar:', error);
    alert('❌ No se pudo conectar con el servidor. Verifica que los microservicios estén activos.');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Solicitar acceso';
  }
});